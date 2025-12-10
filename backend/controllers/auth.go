package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
	"github.com/kiranraoboinapally/student/backend/utils"
)

type RegisterRequest struct {
	EnrollmentNumber string `json:"enrollment_number" binding:"required"`
	Email            string `json:"email" binding:"required,email"`
	Password         string `json:"password" binding:"required,min=6"`
	FullName         string `json:"full_name"` // optional; will try to take from student record
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// verify student exists in master_students or act_students by enrollment / Regn_no
	var master models.MasterStudent
	enrollmentNumInt, _ := strconv.ParseInt(req.EnrollmentNumber, 10, 64)
	db := config.DB

	found := false
	if enrollmentNumInt != 0 {
		if err := db.Where("enrollment_number = ?", enrollmentNumInt).First(&master).Error; err == nil {
			found = true
		}
	}
	// fallback: check act_students.Regn_no column
	if !found {
		var act models.ActStudent
		if err := db.Where("Enrollment_Number = ? OR Regn_no = ?", req.EnrollmentNumber, req.EnrollmentNumber).First(&act).Error; err == nil {
			// map some data into master-like fields for user creation:
			if act.CandidateName != nil {
				master.StudentName = *act.CandidateName
			}
			if act.EmailID != nil {
				master.StudentEmailID = act.EmailID
			}
			found = true
		}
	}

	if !found {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student not found for given enrollment/registration number"})
		return
	}

	// check if a user with that email or username exists
	var existing models.User
	if err := db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user with this email already exists"})
		return
	}

	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not hash password"})
		return
	}

	username := req.EnrollmentNumber // you can choose another convention
	fullName := req.FullName
	if fullName == "" && master.StudentName != "" {
		fullName = master.StudentName
	}
	user := models.User{
		Username:     username,
		Email:        req.Email,
		PasswordHash: hashed,
		FullName:     fullName,
		RoleID:       5, // assume 3 = student (adjust to your roles table)
		Status:       "active",
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "registration successful",
		"username": user.Username,
		"user_id":  user.UserID,
	})
}

type LoginRequest struct {
	StudentID int64  `json:"student_id" binding:"required"` // you asked login by student_id
	Password  string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	db := config.DB
	// We assume students registering used username = enrollment_number.
	// But user wants login by student_id: we can find master_students.student_id -> enrollment -> username
	var master models.MasterStudent
	if err := db.Where("student_id = ?", req.StudentID).First(&master).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "student record not found"})
		return
	}

	// find user by email or enrollment number as username
	// username we stored earlier is enrollment_number string
	if master.EnrollmentNumber == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no enrollment number for this student"})
		return
	}
	username := strconv.FormatInt(master.EnrollmentNumber, 10)
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user account not found. please register first"})
		return
	}

	// check password
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// create JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.UserID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * time.Duration(config.JwtExpiresHours)).Unix(),
	})
	tokenStr, err := token.SignedString([]byte(config.JwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create token"})
		return
	}

	// update last_login
	now := time.Now()
	db.Model(&user).Update("last_login", now)

	c.JSON(http.StatusOK, gin.H{
		"token":            tokenStr,
		"expires_in_hours": config.JwtExpiresHours,
	})
}
