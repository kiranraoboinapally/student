package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
	"github.com/kiranraoboinapally/student/backend/internal/utils"
)

// ======================== INSTITUTE STUDENT MANAGEMENT ========================

// InstituteAddStudentRequest for adding new students
type InstituteAddStudentRequest struct {
	EnrollmentNumber int64   `json:"enrollment_number" binding:"required"` // University format roll number
	StudentName      string  `json:"student_name" binding:"required"`
	FatherName       *string `json:"father_name"`
	Email            *string `json:"email"`
	Phone            *string `json:"phone"`
	CourseName       *string `json:"course_name"`
	Session          *string `json:"session"`
	Batch            *string `json:"batch"`
	ProgramPattern   *string `json:"program_pattern"`
	ProgramDuration  *int    `json:"program_duration"`
}

// InstituteAddStudent allows institute admin to add a new student
func InstituteAddStudent(c *gin.Context) {
	var req InstituteAddStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instituteID, _ := c.Get("institute_id")
	instID := instituteID.(int)

	db := config.DB

	// Get institute name
	var instituteName string
	if err := db.Table("institutes").Select("institute_name").Where("institute_id = ?", instID).Scan(&instituteName).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get institute info"})
		return
	}

	// Check if enrollment number already exists
	var existingCount int64
	db.Model(&models.MasterStudent{}).Where("enrollment_number = ?", req.EnrollmentNumber).Count(&existingCount)
	if existingCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "enrollment number already exists"})
		return
	}

	now := time.Now()
	student := models.MasterStudent{
		EnrollmentNumber: req.EnrollmentNumber,
		StudentName:      req.StudentName,
		FatherName:       req.FatherName,
		StudentEmailID:   req.Email,
		StudentPhoneNumber: req.Phone,
		InstituteName:    &instituteName,
		CourseName:       req.CourseName,
		StudentStatus:    stringPtr("active"),
		Session:          req.Session,
		Batch:            req.Batch,
		ProgramPattern:   req.ProgramPattern,
		ProgramDuration:  req.ProgramDuration,
		CreatedAt:        &now,
		UpdatedAt:        &now,
	}

	if err := db.Create(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create student"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":           "student added successfully",
		"student_id":        student.StudentID,
		"enrollment_number": student.EnrollmentNumber,
	})
}

// ======================== INSTITUTE FACULTY MANAGEMENT ========================

// InstituteAddFacultyRequest for adding new faculty (pending university approval)
type InstituteAddFacultyRequest struct {
	Username     string `json:"username" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	FullName     string `json:"full_name" binding:"required"`
	Department   string `json:"department" binding:"required"`
	Position     string `json:"position" binding:"required"`
	TempPassword string `json:"temp_password" binding:"required,min=6"`
}

// InstituteAddFaculty allows institute admin to add faculty (pending university approval)
func InstituteAddFaculty(c *gin.Context) {
	var req InstituteAddFacultyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instituteID, _ := c.Get("institute_id")
	instID := instituteID.(int)

	db := config.DB

	// Check if username exists
	var existingCount int64
	db.Model(&models.User{}).Where("username = ? OR email = ?", req.Username, req.Email).Count(&existingCount)
	if existingCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username or email already exists"})
		return
	}

	// Create user with inactive status (will be activated on approval)
	hashed, _ := utils.HashPassword(req.TempPassword)
	user := models.User{
		Username:       req.Username,
		Email:          req.Email,
		FullName:       req.FullName,
		PasswordHash:   hashed,
		RoleID:         2, // Faculty role
		InstituteID:    &instID,
		Status:         "inactive", // Inactive until approved
		IsTempPassword: true,
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user account"})
		return
	}

	// Create faculty record with pending approval
	faculty := models.Faculty{
		UserID:         user.UserID,
		Department:     req.Department,
		Position:       req.Position,
		InstituteID:    instID,
		ApprovalStatus: "pending", // Pending university approval
	}

	if err := db.Create(&faculty).Error; err != nil {
		// Rollback user creation
		db.Delete(&user)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create faculty record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":         "faculty added, pending university approval",
		"faculty_id":      faculty.FacultyID,
		"user_id":         user.UserID,
		"approval_status": "pending",
	})
}

// ======================== INSTITUTE COURSE-STREAM REQUESTS ========================

// RequestCourseStreamRequest for requesting to offer a course-stream
type RequestCourseStreamRequest struct {
	CourseStreamID int    `json:"course_stream_id" binding:"required"`
	Remarks        string `json:"remarks"`
}

// RequestCourseStream allows institute to request offering a new course-stream
func RequestCourseStream(c *gin.Context) {
	var req RequestCourseStreamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instituteID, _ := c.Get("institute_id")
	instID := instituteID.(int)

	userID, _ := c.Get("user_id")
	requestedBy := userID.(int64)

	db := config.DB

	// Check if course-stream exists
	var courseStream models.CourseStream
	if err := db.Where("id = ?", req.CourseStreamID).First(&courseStream).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "course-stream not found"})
		return
	}

	// Check if already requested or approved
	var existingCount int64
	db.Model(&models.CollegeCourseApproval{}).
		Where("institute_id = ? AND course_stream_id = ? AND status IN ?", instID, req.CourseStreamID, []string{"pending", "approved"}).
		Count(&existingCount)
	if existingCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "course-stream already requested or approved"})
		return
	}

	remarks := (*string)(nil)
	if req.Remarks != "" {
		remarks = &req.Remarks
	}

	approval := models.CollegeCourseApproval{
		InstituteID:    instID,
		CourseStreamID: req.CourseStreamID,
		Status:         "pending",
		RequestedAt:    time.Now(),
		RequestedBy:    requestedBy,
		Remarks:        remarks,
	}

	if err := db.Create(&approval).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "course-stream request submitted, pending university approval",
		"approval_id":   approval.ApprovalID,
		"course_name":   courseStream.CourseName,
		"stream":        courseStream.Stream,
	})
}

// GetInstituteCourseStreams returns course-streams for the institute
func GetInstituteCourseStreams(c *gin.Context) {
	instituteID, _ := c.Get("institute_id")
	instID := instituteID.(int)

	db := config.DB

	// Get approved course-streams
	var approvals []struct {
		ApprovalID   int64     `json:"approval_id"`
		CourseName   string    `json:"course_name"`
		Stream       string    `json:"stream"`
		Status       string    `json:"status"`
		RequestedAt  time.Time `json:"requested_at"`
		ApprovedAt   *time.Time `json:"approved_at"`
	}
	db.Table("college_course_approvals").
		Select("college_course_approvals.approval_id, courses_streams.course_name, courses_streams.stream, college_course_approvals.status, college_course_approvals.requested_at, college_course_approvals.approved_at").
		Joins("JOIN courses_streams ON college_course_approvals.course_stream_id = courses_streams.id").
		Where("college_course_approvals.institute_id = ?", instID).
		Order("college_course_approvals.requested_at DESC").
		Scan(&approvals)

	c.JSON(http.StatusOK, gin.H{
		"course_streams": approvals,
		"total":          len(approvals),
	})
}

// GetInstituteStudentFees returns fee information for institute students
func GetInstituteStudentFees(c *gin.Context) {
	instituteID, _ := c.Get("institute_id")
	instID := instituteID.(int)

	db := config.DB

	// Get institute name
	var instituteName string
	db.Table("institutes").Select("institute_name").Where("institute_id = ?", instID).Scan(&instituteName)

	// Get fee data for institute students
	var fees []struct {
		EnrollmentNumber int64   `json:"enrollment_number"`
		StudentName      string  `json:"student_name"`
		FeeType          string  `json:"fee_type"`
		FeeAmount        float64 `json:"fee_amount"`
		PaymentStatus    string  `json:"payment_status"`
	}

	// Get from registration_fees
	db.Table("registration_fees").
		Select("enrollment_number, student_name, fee_type, fee_amount, payment_status").
		Where("institute_name = ?", instituteName).
		Scan(&fees)

	c.JSON(http.StatusOK, gin.H{
		"fees":  fees,
		"total": len(fees),
	})
}

// GetInstituteAttendanceSummary returns attendance summary for institute
func GetInstituteAttendanceSummary(c *gin.Context) {
	instituteID, _ := c.Get("institute_id")
	instID := instituteID.(int)

	db := config.DB

	var total, present int64
	db.Model(&models.Attendance{}).Where("institute_id = ?", instID).Count(&total)
	db.Model(&models.Attendance{}).Where("institute_id = ? AND present = ?", instID, true).Count(&present)

	absent := total - present
	percent := 0.0
	if total > 0 {
		percent = (float64(present) / float64(total)) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"total_records":      total,
		"present":            present,
		"absent":             absent,
		"attendance_percent": percent,
	})
}

// GetInstituteInternalMarks returns internal marks for institute
func GetInstituteInternalMarks(c *gin.Context) {
	instituteID, _ := c.Get("institute_id")
	instID := instituteID.(int)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	status := c.Query("status")

	db := config.DB
	query := db.Model(&models.InternalMark{}).Where("institute_id = ?", instID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var marks []models.InternalMark
	query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&marks)

	c.JSON(http.StatusOK, gin.H{
		"marks": marks,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}
