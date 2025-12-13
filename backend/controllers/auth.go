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

// ---------------- Register ----------------
type RegisterRequest struct {
	EnrollmentNumber string `json:"enrollment_number" binding:"required"`
	Email            string `json:"email" binding:"required,email"`
	Password         string `json:"password" binding:"required,min=6"`
	FullName         string `json:"full_name"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var master models.MasterStudent
	found := false

	// Try numeric enrollment
	if enNum, err := strconv.ParseInt(req.EnrollmentNumber, 10, 64); err == nil && enNum != 0 {
		if err := db.Where("enrollment_number = ?", enNum).First(&master).Error; err == nil {
			found = true
		}
	}

	// fallback to act_students
	if !found {
		var act models.ActStudent
		if err := db.Where("Enrollment_Number = ? OR Regn_no = ?", req.EnrollmentNumber, req.EnrollmentNumber).First(&act).Error; err == nil {
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

	// Check existing user
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

	fullName := req.FullName
	if fullName == "" && master.StudentName != "" {
		fullName = master.StudentName
	}

	user := models.User{
		Username:       req.EnrollmentNumber,
		Email:          req.Email,
		PasswordHash:   hashed,
		FullName:       fullName,
		RoleID:         5, // student
		Status:         "active",
		IsTempPassword: true, // force password change
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

// ---------------- Login ----------------
type LoginRequest struct {
	UsernameOrStudentID string `json:"username" binding:"required"` // username or student_id
	Password            string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var user models.User
	var err error

	// 1) Try username as-is
	err = db.Where("username = ?", req.UsernameOrStudentID).First(&user).Error
	if err != nil {
		// 2) fallback: student_id -> enrollment -> username
		// ONLY enrollment number (username)
		err = db.Where("username = ?", req.UsernameOrStudentID).First(&user).Error
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid enrollment number or password"})
			return
		}

	}

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	// Check password
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Create JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.UserID,
		"username": user.Username,
		"role_id":  user.RoleID,
		"exp":      time.Now().Add(time.Hour * time.Duration(config.JwtExpiresHours)).Unix(),
	})

	tokenStr, err := token.SignedString([]byte(config.JwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create token"})
		return
	}

	db.Model(&user).Update("last_login", time.Now())

	c.JSON(http.StatusOK, gin.H{
		"token":                 tokenStr,
		"expires_in_hours":      config.JwtExpiresHours,
		"force_password_change": user.IsTempPassword,
		"role_id":               user.RoleID,
	})
}

// ---------------- Change Password ----------------
type ChangePasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

func ChangePassword(c *gin.Context) {
	val, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var userID int64
	switch v := val.(type) {
	case int64:
		userID = v
	case float64:
		userID = int64(v)
	case int:
		userID = int64(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id type"})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashed, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not hash password"})
		return
	}

	db := config.DB
	if err := db.Model(&models.User{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"password_hash":    hashed,
		"is_temp_password": false,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password changed successfully"})
}
