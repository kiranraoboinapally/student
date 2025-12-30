package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"

	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
	"github.com/kiranraoboinapally/student/backend/utils"
)

// ADMIN – STUDENT LIST (FROM EXISTING TABLES)

func GetStudents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	db := config.DB

	var students []models.MasterStudent
	var total int64

	db.Model(&models.MasterStudent{}).Count(&total)

	db.
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&students)

	c.JSON(http.StatusOK, gin.H{
		"data": students,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ADMIN – CREATE LOGIN ACCOUNT FOR STUDENT

type AdminCreateStudentUserRequest struct {
	EnrollmentNumber string `json:"enrollment_number" binding:"required"`
	Email            string `json:"email" binding:"required,email"`
	TempPassword     string `json:"temp_password" binding:"required,min=6"`
}

func CreateUserByAdmin(c *gin.Context) {
	var req AdminCreateStudentUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB

	// 1️⃣ Verify student exists
	var student models.MasterStudent
	if err := db.Where("enrollment_number = ?", req.EnrollmentNumber).
		First(&student).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student not found"})
		return
	}

	// 2️⃣ Check if user already exists
	var existing models.User
	if err := db.Where("username = ?", req.EnrollmentNumber).
		First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "login already exists"})
		return
	}

	// 3️⃣ Create user
	hashed, _ := utils.HashPassword(req.TempPassword)

	user := models.User{
		Username:       req.EnrollmentNumber,
		Email:          req.Email,
		FullName:       student.StudentName,
		PasswordHash:   hashed,
		RoleID:         5, // STUDENT
		Status:         "active",
		IsTempPassword: true,
		CreatedAt:      nil,
	}

	db.Create(&user)

	c.JSON(http.StatusCreated, gin.H{
		"message":  "student login created",
		"user_id":  user.UserID,
		"username": user.Username,
	})
}

// ADMIN – LIST ALL USERS (PAGINATED)

func GetAllUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	db := config.DB

	var users []models.User
	var total int64

	db.Model(&models.User{}).Count(&total)

	db.
		Select("user_id, username, email, full_name, role_id, status, created_at").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"data": users,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ADMIN – FEE PAYMENT HISTORY

func GetAllFeePaymentHistory(c *gin.Context) {
	db := config.DB
	enrollment := c.Query("enrollment_number")

	var payments []models.FeePaymentDetail
	query := db.Order("payment_id desc")

	if enrollment != "" {
		enNum, err := strconv.ParseInt(enrollment, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment number"})
			return
		}
		query = query.Where("enrollment_number = ?", enNum)
	}

	if err := query.Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch payments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_records": len(payments),
		"payments":      payments,
	})
}

// ADMIN – UPLOAD / UPDATE STUDENT MARKS (UPSERT)

type UploadMarksRequest struct {
	Marks []struct {
		EnrollmentNumber int64   `json:"enrollment_number" binding:"required"`
		SubjectCode      string  `json:"subject_code" binding:"required"`
		Semester         int     `json:"semester" binding:"required"`
		MarksObtained    float64 `json:"marks_obtained" binding:"required"`
		Grade            *string `json:"grade"`
		Status           string  `json:"status" binding:"required"` // internal/external
	} `json:"marks" binding:"required"`
}

func UploadStudentMarks(c *gin.Context) {
	var req UploadMarksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var records []models.StudentMark

	for _, m := range req.Marks {

		// ✅ DECLARE subject
		var subject models.SubjectMaster

		// ✅ FETCH subject details
		if err := db.Where("subject_code = ?", m.SubjectCode).
			First(&subject).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "subject not found: " + m.SubjectCode,
			})
			return
		}

		records = append(records, models.StudentMark{
			EnrollmentNumber: m.EnrollmentNumber,
			Semester:         m.Semester,
			SubjectCode:      m.SubjectCode,
			SubjectName:      subject.SubjectName, // ✅ now defined
			SubjectType:      subject.SubjectType, // ✅ now defined
			MarksObtained:    m.MarksObtained,     // FIXED: Added this
			Grade:            m.Grade,
			Status:           m.Status,
			CreatedAt:        time.Now(),
		})
	}

	err := db.Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "enrollment_number"},
			{Name: "semester"},
			{Name: "subject_code"},
		},
		DoUpdates: clause.AssignmentColumns(
			[]string{"marks_obtained", "grade", "status"}, // FIXED: Added marks_obtained
		),
	}).Create(&records).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "marks uploaded successfully",
		"total_records": len(records),
	})
}

// ================= ADMIN – PENDING REGISTRATIONS =================

// GET /api/admin/pending-registrations
func GetPendingRegistrations(c *gin.Context) {
	db := config.DB

	var users []models.User

	if err := db.
		Where("status = ? AND role_id = ?", "inactive", 5).
		Order("created_at DESC").
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch inactive registrations",
		})
		return
	}

	response := make([]gin.H, 0)
	for _, u := range users {
		response = append(response, gin.H{
			"user_id":    u.UserID,
			"username":   u.Username,
			"email":      u.Email,
			"full_name":  u.FullName,
			"status":     u.Status,
			"created_at": u.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"pending_registrations": response,
	})
}

// ================= ADMIN – APPROVE / REJECT REGISTRATION =================

// POST /api/admin/approve-registration
func ApproveRegistration(c *gin.Context) {
	var req struct {
		UserID int64  `json:"user_id" binding:"required"`
		Action string `json:"action" binding:"required"` // approve | reject
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Action != "approve" && req.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "action must be approve or reject",
		})
		return
	}

	newStatus := "active"
	if req.Action == "reject" {
		newStatus = "rejected"
	}

	db := config.DB
	if err := db.Model(&models.User{}).
		Where("user_id = ? AND status = ?", req.UserID, "inactive").
		Update("status", newStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to update user status",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "registration " + req.Action + "d successfully",
		"user_id": req.UserID,
		"status":  newStatus,
	})
}
