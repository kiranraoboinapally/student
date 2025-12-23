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

// ---------------- Get Pending Registrations ----------------
func GetPendingRegistrations(c *gin.Context) {
	db := config.DB
	var users []models.User

	if err := db.Where("status = ? AND role_id = ?", "pending", 5).
		Order("created_at desc").
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch pending registrations"})
		return
	}

	safeUsers := make([]gin.H, len(users))
	for i, u := range users {
		safeUsers[i] = gin.H{
			"user_id":    u.UserID,
			"username":   u.Username,
			"email":      u.Email,
			"full_name":  u.FullName,
			"role_id":    u.RoleID,
			"status":     u.Status,
			"created_at": u.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{"pending_registrations": safeUsers})
}

// ---------------- Approve Registration ----------------
type ApproveRegistrationRequest struct {
	UserID int64  `json:"user_id" binding:"required"`
	Action string `json:"action" binding:"required"`
}

func ApproveRegistration(c *gin.Context) {
	var req ApproveRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Action != "approve" && req.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action must be 'approve' or 'reject'"})
		return
	}

	db := config.DB
	var user models.User
	if err := db.Where("user_id = ? AND status = ?", req.UserID, "pending").First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "pending registration not found"})
		return
	}

	newStatus := "active"
	if req.Action == "reject" {
		newStatus = "rejected"
	}

	if err := db.Model(&user).Update("status", newStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "registration " + req.Action + "d successfully",
		"user_id": user.UserID,
		"status":  newStatus,
	})
}

// ---------------- GET ALL FEE PAYMENT HISTORY ----------------
func GetAllFeePaymentHistory(c *gin.Context) {
	db := config.DB
	enrollment := c.Query("enrollment_number")

	var payments []models.FeePaymentDetail
	query := db.Order("paid_at desc, payment_id desc")

	if enrollment != "" {
		enNum, err := strconv.ParseInt(enrollment, 10, 64)
		if err == nil {
			query = query.Where("enrollment_no = ?", enNum)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid enrollment number format"})
			return
		}
	}

	if err := query.Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_records": len(payments),
		"payments":      payments,
	})
}

// ---------------- UPLOAD STUDENT MARKS ----------------
type UploadMarksRequest struct {
	Marks []struct {
		EnrollmentNumber int64   `json:"enrollment_number" binding:"required"`
		SubjectCode      string  `json:"subject_code" binding:"required"`
		Semester         int     `json:"semester" binding:"required"`
		MarksObtained    float64 `json:"marks_obtained" binding:"required"`
		Grade            *string `json:"grade"`
		MarksType        string  `json:"marks_type" binding:"required"`
	} `json:"marks" binding:"required,dive"`
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
		// The Grade field in models.StudentMark is likely a *string.
		// m.Grade is already a *string in this request, so we can pass it directly.

		record := models.StudentMark{
			EnrollmentNumber: m.EnrollmentNumber,
			Semester:         m.Semester,
			SubjectCode:      m.SubjectCode,
			TotalMarks:       m.MarksObtained,
			Grade:            m.Grade, // Correctly passes a *string
			Status:           m.MarksType,
			CreatedAt:        time.Now(),
		}
		records = append(records, record)
	}

	// Bulk insert or update (UPSERT)
	err := db.Clauses(clause.OnConflict{
		// Unique keys to identify a conflict: Enrollment, Semester, SubjectCode
		Columns: []clause.Column{{Name: "enrollment_number"}, {Name: "semester"}, {Name: "subject_code"}},
		// Columns to update when a conflict occurs (MUST be database column names)
		DoUpdates: clause.AssignmentColumns([]string{"total_marks_obtained", "grade", "status"}),
	}).Create(&records).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload marks: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Marks uploaded successfully",
		"total_records": len(records),
	})
}
