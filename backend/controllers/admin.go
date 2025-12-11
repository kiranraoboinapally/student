package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
	"github.com/kiranraoboinapally/student/backend/utils"
)

// ---------------- Student Onboarding ----------------
type AddStudentRequest struct {
	StudentName        string `json:"student_name" binding:"required"`
	FatherName         string `json:"father_name"`
	StudentEmailID     string `json:"student_email_id" binding:"required,email"`
	StudentPhoneNumber string `json:"student_phone_number"`
	InstituteName      string `json:"institute_name"`
	CourseName         string `json:"course_name"`
	Session            string `json:"session"`
	Batch              string `json:"batch"`
	ProgramPattern     string `json:"program_pattern"`
	ProgramDuration    int    `json:"program_duration"`
}

func AddStudent(c *gin.Context) {
	var req AddStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	student := models.MasterStudent{
		StudentName:        req.StudentName,
		FatherName:         &req.FatherName,
		StudentEmailID:     &req.StudentEmailID,
		StudentPhoneNumber: &req.StudentPhoneNumber,
		InstituteName:      &req.InstituteName,
		CourseName:         &req.CourseName,
		Session:            &req.Session,
		Batch:              &req.Batch,
		ProgramPattern:     &req.ProgramPattern,
		ProgramDuration:    &req.ProgramDuration,
	}

	if err := config.DB.Create(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add student"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Student added", "student_id": student.StudentID})
}

func GenerateEnrollment(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)

	var student models.MasterStudent
	if err := config.DB.First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	if student.EnrollmentNumber != 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Enrollment already generated"})
		return
	}

	var maxEnroll int64
	config.DB.Model(&models.MasterStudent{}).Select("COALESCE(MAX(enrollment_number), 20249999)").Scan(&maxEnroll)
	newEnroll := maxEnroll + 1

	config.DB.Model(&student).Update("enrollment_number", newEnroll)

	c.JSON(http.StatusOK, gin.H{"message": "Enrollment generated", "enrollment_number": newEnroll})
}

type ActivateLoginRequest struct {
	Dob string `json:"dob" binding:"required"` // "2006-01-02"
}

func ActivateStudentLogin(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var req ActivateLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var student models.MasterStudent
	if err := config.DB.First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	if student.EnrollmentNumber == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Generate enrollment first"})
		return
	}

	enrollStr := strconv.FormatInt(student.EnrollmentNumber, 10)
	var existing models.User
	if config.DB.Where("username = ?", enrollStr).First(&existing).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Login already activated"})
		return
	}

	dob, _ := time.Parse("2006-01-02", req.Dob)
	tempPass := dob.Format("02012006")
	hashed, _ := utils.HashPassword(tempPass)

	user := models.User{
		Username:       enrollStr,
		Email:          *student.StudentEmailID,
		PasswordHash:   hashed,
		FullName:       student.StudentName,
		RoleID:         5,
		Status:         "active",
		IsTempPassword: true,
	}

	config.DB.Create(&user)
	c.JSON(http.StatusOK, gin.H{"message": "Login activated", "enrollment": enrollStr, "temp_password": tempPass})
}

func ListStudents(c *gin.Context) {
	var students []models.MasterStudent
	config.DB.Find(&students)
	c.JSON(http.StatusOK, students)
}

// ---------------- Admin User Creation ----------------
type AdminCreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name"`
	RoleID   int    `json:"role_id" binding:"required"`
}

func CreateUserByAdmin(c *gin.Context) {
	var req AdminCreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var existing models.User
	if err := db.Where("email = ?", req.Email).Or("username = ?", req.Username).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user with this email or username already exists"})
		return
	}

	var roleExists int64
	_ = db.Table("roles").Where("role_id = ?", req.RoleID).Count(&roleExists).Error
	if roleExists == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requested role_id does not exist"})
		return
	}

	hashed, _ := utils.HashPassword(req.Password)
	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashed,
		FullName:     req.FullName,
		RoleID:       req.RoleID,
		Status:       "active",
	}
	db.Create(&user)

	c.JSON(http.StatusCreated, gin.H{"message": "user created", "user_id": user.UserID, "role_id": user.RoleID})
}
