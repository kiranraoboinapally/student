package controllers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
	"github.com/kiranraoboinapally/student/backend/utils"
)

// ---------------- Add Student ----------------
type AddStudentRequest struct {
	StudentName        string `json:"student_name" binding:"required"`
	FatherName         string `json:"father_name"`
	StudentEmailID     string `json:"student_email_id" binding:"omitempty,email"`
	StudentPhoneNumber string `json:"student_phone_number"`
	InstituteName      string `json:"institute_name"`
	CourseName         string `json:"course_name"`
	Session            string `json:"session"`
	Batch              string `json:"batch"`
	ProgramPattern     string `json:"program_pattern"`
	ProgramDuration    int    `json:"program_duration"`
	EnrollmentNumber   int64  `json:"enrollment_number"` // allow optional if you already have it
}

func AddStudent(c *gin.Context) {
	var req AddStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	student := models.MasterStudent{
		StudentName:        req.StudentName,
		StudentEmailID:     nil,
		StudentPhoneNumber: nil,
		InstituteName:      &req.InstituteName,
		CourseName:         &req.CourseName,
		Session:            &req.Session,
		Batch:              &req.Batch,
		ProgramPattern:     &req.ProgramPattern,
		ProgramDuration:    &req.ProgramDuration,
	}

	// optional fields - only set if provided
	if req.FatherName != "" {
		student.FatherName = &req.FatherName
	}
	if req.StudentEmailID != "" {
		student.StudentEmailID = &req.StudentEmailID
	}
	if req.StudentPhoneNumber != "" {
		student.StudentPhoneNumber = &req.StudentPhoneNumber
	}
	if req.EnrollmentNumber != 0 {
		student.EnrollmentNumber = req.EnrollmentNumber
	}

	if err := config.DB.Create(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add student", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Student added", "student_id": student.StudentID})
}

// ---------------- Activate Student Login (safe) ----------------
type ActivateLoginRequest struct {
	Dob string `json:"dob" binding:"required"` // expects YYYY-MM-DD
}

func ActivateStudentLogin(c *gin.Context) {
	// parse id param
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid student id"})
		return
	}

	var req ActivateLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// validate DOB format
	if len(req.Dob) != 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "DOB must be in YYYY-MM-DD format"})
		return
	}
	dob, err := time.Parse("2006-01-02", req.Dob)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid DOB format; use YYYY-MM-DD"})
		return
	}

	db := config.DB

	// load student
	var student models.MasterStudent
	if err := db.First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}

	// enrollment must exist (you said you already have enrollment)
	if student.EnrollmentNumber == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "enrollment number missing; cannot activate login"})
		return
	}
	enrollStr := strconv.FormatInt(student.EnrollmentNumber, 10)

	// check if user with same username already exists
	var existingUser models.User
	if db.Where("username = ?", enrollStr).First(&existingUser).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "login already activated for this enrollment"})
		return
	}

	// prepare temp password as ddmmyyyy
	tempPass := dob.Format("02012006") // ddmmyyyy
	hashed, err := utils.HashPassword(tempPass)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not hash password"})
		return
	}

	// safely collect email and mobile (avoid nil deref)
	email := ""
	if student.StudentEmailID != nil && *student.StudentEmailID != "" {
		email = *student.StudentEmailID
	}
	phone := ""
	if student.StudentPhoneNumber != nil && *student.StudentPhoneNumber != "" {
		phone = *student.StudentPhoneNumber
	}
	fullName := student.StudentName

	// If email exists but another user already has it, avoid duplicate unique constraint error.
	// Here we clear email to avoid unique constraint failure (you can change policy if you want)
	if email != "" {
		var byEmail models.User
		if db.Where("email = ?", email).First(&byEmail).Error == nil {
			email = ""
		}
	}

	// build user record
	user := models.User{
		Username:       enrollStr,
		Email:          email,
		PasswordHash:   hashed,
		FullName:       fullName,
		RoleID:         5, // student role
		Status:         "active",
		IsTempPassword: true,
	}

	// set mobile pointer if available
	if phone != "" {
		user.Mobile = &phone
	}

	// create user
	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Login activated",
		"enrollment":    enrollStr,
		"temp_password": tempPass, // in prod send via email instead
		"user_id":       user.UserID,
	})
}

// ---------------- List Students (paginated) ----------------
//
// Query params:
//
//	page (int, default 1)           => page number starting at 1
//	page_size (int, default 25)     => number of items per page (max 200)
//	q (string, optional)            => search across student_name and enrollment_number
//
// Response:
//
//	{
//	  "data": [...],
//	  "meta": { "page":1, "page_size":25, "total":1000, "total_pages":40 }
//	}
func ListStudents(c *gin.Context) {
	db := config.DB

	// parse pagination params
	page := 1
	if pStr := c.Query("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil && p > 0 {
			page = p
		}
	}
	pageSize := 25
	if psStr := c.Query("page_size"); psStr != "" {
		if ps, err := strconv.Atoi(psStr); err == nil && ps > 0 {
			pageSize = ps
		}
	}
	// clamp page_size
	if pageSize > 200 {
		pageSize = 200
	}

	// optional search query
	q := strings.TrimSpace(c.Query("q"))

	var total int64
	base := db.Model(&models.MasterStudent{})

	if q != "" {
		// if q is numeric, also match enrollment_number
		if en, err := strconv.ParseInt(q, 10, 64); err == nil {
			base = base.Where("enrollment_number = ? OR student_name LIKE ?", en, "%"+q+"%")
		} else {
			base = base.Where("student_name LIKE ?", "%"+q+"%")
		}
	}

	// count total
	if err := base.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count students", "details": err.Error()})
		return
	}

	// if no records, return empty quickly
	if total == 0 {
		c.JSON(http.StatusOK, gin.H{
			"data": []models.MasterStudent{},
			"meta": gin.H{
				"page":        page,
				"page_size":   pageSize,
				"total":       total,
				"total_pages": 0,
			},
		})
		return
	}

	// fetch desired page: select only required columns to reduce load
	offset := (page - 1) * pageSize
	var students []models.MasterStudent
	if err := base.Select("student_id, enrollment_number, student_name, father_name, student_email_id, student_phone_number, institute_name, course_name, session, batch, program_pattern, program_duration, created_at").
		Order("student_id desc").
		Offset(offset).
		Limit(pageSize).
		Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch students", "details": err.Error()})
		return
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, gin.H{
		"data": students,
		"meta": gin.H{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}
