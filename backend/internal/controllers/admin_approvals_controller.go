package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// ======================== UNIVERSITY ADMIN APPROVALS ========================

// GetPendingApprovals returns all pending approvals (faculty, course-stream, marks)
func GetPendingApprovals(c *gin.Context) {
	db := config.DB

	// Get pending faculty approvals
	var pendingFaculty []struct {
		FacultyID     int64     `json:"faculty_id"`
		UserID        int64     `json:"user_id"`
		FullName      string    `json:"full_name"`
		Email         string    `json:"email"`
		Department    string    `json:"department"`
		Position      string    `json:"position"`
		InstituteID   int       `json:"institute_id"`
		InstituteName string    `json:"institute_name"`
		CreatedAt     time.Time `json:"created_at"`
	}
	db.Table("faculty").
		Select("faculty.faculty_id, faculty.user_id, users.full_name, users.email, faculty.department, faculty.position, faculty.institute_id, institutes.institute_name, users.created_at").
		Joins("JOIN users ON faculty.user_id = users.user_id").
		Joins("LEFT JOIN institutes ON faculty.institute_id = institutes.institute_id").
		Where("faculty.approval_status = ?", "pending").
		Scan(&pendingFaculty)

	// Get pending course-stream approvals
	var pendingCourseStreams []struct {
		ApprovalID     int64     `json:"approval_id"`
		InstituteID    int       `json:"institute_id"`
		InstituteName  string    `json:"institute_name"`
		CourseStreamID int       `json:"course_stream_id"`
		CourseName     string    `json:"course_name"`
		Stream         string    `json:"stream"`
		RequestedAt    time.Time `json:"requested_at"`
	}
	db.Table("college_course_approvals").
		Select("college_course_approvals.approval_id, college_course_approvals.institute_id, institutes.institute_name, college_course_approvals.course_stream_id, courses_streams.course_name, courses_streams.stream, college_course_approvals.requested_at").
		Joins("JOIN institutes ON college_course_approvals.institute_id = institutes.institute_id").
		Joins("JOIN courses_streams ON college_course_approvals.course_stream_id = courses_streams.id").
		Where("college_course_approvals.status = ?", "pending").
		Scan(&pendingCourseStreams)

	// Get submitted marks counts by institute
	var pendingMarks []struct {
		InstituteID   int    `json:"institute_id"`
		InstituteName string `json:"institute_name"`
		Semester      int    `json:"semester"`
		SubjectCode   string `json:"subject_code"`
		SubjectName   string `json:"subject_name"`
		Count         int64  `json:"count"`
	}
	db.Table("internal_marks").
		Select("internal_marks.institute_id, institutes.institute_name, internal_marks.semester, internal_marks.subject_code, internal_marks.subject_name, COUNT(*) as count").
		Joins("LEFT JOIN institutes ON internal_marks.institute_id = institutes.institute_id").
		Where("internal_marks.status = ?", "submitted").
		Group("internal_marks.institute_id, institutes.institute_name, internal_marks.semester, internal_marks.subject_code, internal_marks.subject_name").
		Scan(&pendingMarks)

	c.JSON(http.StatusOK, gin.H{
		"pending_faculty_approvals":     pendingFaculty,
		"pending_course_stream_requests": pendingCourseStreams,
		"pending_marks_submissions":     pendingMarks,
		"counts": gin.H{
			"faculty":       len(pendingFaculty),
			"course_stream": len(pendingCourseStreams),
			"marks_batches": len(pendingMarks),
		},
	})
}

// GetPendingApprovalCounts returns just the counts for dashboard badges
func GetPendingApprovalCounts(c *gin.Context) {
	db := config.DB

	var facultyCount, courseCount, marksCount int64
	db.Model(&models.Faculty{}).Where("approval_status = ?", "pending").Count(&facultyCount)
	db.Model(&models.CollegeCourseApproval{}).Where("status = ?", "pending").Count(&courseCount)
	db.Model(&models.InternalMark{}).Where("status = ?", "submitted").Count(&marksCount)

	c.JSON(http.StatusOK, gin.H{
		"pending_faculty_approvals": facultyCount,
		"pending_course_requests":   courseCount,
		"pending_marks_submissions": marksCount,
		"total_pending":             facultyCount + courseCount + marksCount,
	})
}

// ApproveFacultyRequest for approving/rejecting faculty accounts
type ApproveFacultyRequest struct {
	FacultyID int64  `json:"faculty_id" binding:"required"`
	Action    string `json:"action" binding:"required"` // approve, reject
	Remarks   string `json:"remarks"`
}

// ApproveFaculty approves or rejects a faculty account
func ApproveFaculty(c *gin.Context) {
	var req ApproveFacultyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Action != "approve" && req.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action must be 'approve' or 'reject'"})
		return
	}

	userID, _ := c.Get("user_id")
	adminUserID := userID.(int64)

	db := config.DB
	now := time.Now()

	newStatus := "approved"
	if req.Action == "reject" {
		newStatus = "rejected"
	}

	result := db.Model(&models.Faculty{}).
		Where("faculty_id = ? AND approval_status = ?", req.FacultyID, "pending").
		Updates(map[string]interface{}{
			"approval_status": newStatus,
			"approved_by":     adminUserID,
			"approved_at":     now,
		})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update faculty status"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "faculty not found or already processed"})
		return
	}

	// If approved, also activate the user account
	if newStatus == "approved" {
		var faculty models.Faculty
		db.Where("faculty_id = ?", req.FacultyID).First(&faculty)
		db.Model(&models.User{}).Where("user_id = ?", faculty.UserID).Update("status", "active")
	}

	SendAdminNotification("faculty_approval_status", gin.H{
		"faculty_id": req.FacultyID,
		"status":     newStatus,
	})

	c.JSON(http.StatusOK, gin.H{
		"message":    "faculty " + req.Action + "d successfully",
		"faculty_id": req.FacultyID,
		"status":     newStatus,
	})
}

// ApproveCourseStreamRequest for approving/rejecting course-stream requests
type ApproveCourseStreamRequest struct {
	ApprovalID int64  `json:"approval_id" binding:"required"`
	Action     string `json:"action" binding:"required"` // approve, reject
	Remarks    string `json:"remarks"`
}

// ApproveCourseStream approves or rejects a course-stream request
func ApproveCourseStream(c *gin.Context) {
	var req ApproveCourseStreamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Action != "approve" && req.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action must be 'approve' or 'reject'"})
		return
	}

	userID, _ := c.Get("user_id")
	adminUserID := userID.(int64)

	db := config.DB
	now := time.Now()

	newStatus := "approved"
	if req.Action == "reject" {
		newStatus = "rejected"
	}

	updates := map[string]interface{}{
		"status":      newStatus,
		"approved_by": adminUserID,
		"approved_at": now,
	}
	if req.Remarks != "" {
		updates["remarks"] = req.Remarks
	}

	result := db.Model(&models.CollegeCourseApproval{}).
		Where("approval_id = ? AND status = ?", req.ApprovalID, "pending").
		Updates(updates)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update course-stream request"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "request not found or already processed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "course-stream request " + req.Action + "d successfully",
		"approval_id": req.ApprovalID,
		"status":      newStatus,
	})
}

// ======================== MARKS LOCK & PUBLISH ========================

// LockMarksRequest for locking submitted marks
type LockMarksRequest struct {
	InstituteID *int    `json:"institute_id"`    // Optional: lock for specific institute
	Semester    *int    `json:"semester"`        // Optional: lock for specific semester
	SubjectCode string  `json:"subject_code"`    // Optional: lock for specific subject
	MarkIDs     []int64 `json:"mark_ids"`        // Optional: lock specific mark IDs
}

// LockMarks changes submitted marks to locked status
func LockMarks(c *gin.Context) {
	var req LockMarksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	adminUserID := userID.(int64)

	db := config.DB
	now := time.Now()

	query := db.Model(&models.InternalMark{}).Where("status = ?", "submitted")

	// Apply filters
	if len(req.MarkIDs) > 0 {
		query = query.Where("internal_mark_id IN ?", req.MarkIDs)
	} else {
		// Apply optional filters
		if req.InstituteID != nil {
			query = query.Where("institute_id = ?", *req.InstituteID)
		}
		if req.Semester != nil {
			query = query.Where("semester = ?", *req.Semester)
		}
		if req.SubjectCode != "" {
			query = query.Where("subject_code = ?", req.SubjectCode)
		}
	}

	result := query.Updates(map[string]interface{}{
		"status":     "locked",
		"locked_by":  adminUserID,
		"locked_at":  now,
		"updated_at": now,
	})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to lock marks"})
		return
	}

	SendAdminNotification("marks_locked", gin.H{
		"locked_count": result.RowsAffected,
		"locked_by":    adminUserID,
	})

	c.JSON(http.StatusOK, gin.H{
		"message":      "marks locked successfully",
		"locked_count": result.RowsAffected,
	})
}

// PublishResultsRequest for publishing locked marks
type PublishResultsRequest struct {
	InstituteID *int    `json:"institute_id"`
	Semester    *int    `json:"semester"`
	SubjectCode string  `json:"subject_code"`
	MarkIDs     []int64 `json:"mark_ids"`
}

// PublishResults changes locked marks to published (visible to students)
func PublishResults(c *gin.Context) {
	var req PublishResultsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	now := time.Now()

	query := db.Model(&models.InternalMark{}).Where("status = ?", "locked")

	if len(req.MarkIDs) > 0 {
		query = query.Where("internal_mark_id IN ?", req.MarkIDs)
	} else {
		if req.InstituteID != nil {
			query = query.Where("institute_id = ?", *req.InstituteID)
		}
		if req.Semester != nil {
			query = query.Where("semester = ?", *req.Semester)
		}
		if req.SubjectCode != "" {
			query = query.Where("subject_code = ?", req.SubjectCode)
		}
	}

	result := query.Updates(map[string]interface{}{
		"status":       "published",
		"published_at": now,
		"updated_at":   now,
	})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to publish results"})
		return
	}

	SendAdminNotification("results_published", gin.H{
		"published_count": result.RowsAffected,
	})

	c.JSON(http.StatusOK, gin.H{
		"message":         "results published successfully",
		"published_count": result.RowsAffected,
	})
}

// GetAllInternalMarks retrieves all internal marks for university admin
func GetAllInternalMarks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	// Filters
	status := c.Query("status")
	instituteID := c.Query("institute_id")
	semester := c.Query("semester")

	db := config.DB
	query := db.Model(&models.InternalMark{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if instituteID != "" {
		id, _ := strconv.Atoi(instituteID)
		query = query.Where("institute_id = ?", id)
	}
	if semester != "" {
		sem, _ := strconv.Atoi(semester)
		query = query.Where("semester = ?", sem)
	}

	var total int64
	query.Count(&total)

	var marks []models.InternalMark
	query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&marks)

	// Get aggregated status counts
	var statusCounts []struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	db.Model(&models.InternalMark{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&statusCounts)

	c.JSON(http.StatusOK, gin.H{
		"marks":         marks,
		"status_counts": statusCounts,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ======================== MASTER FEE TYPES ========================

// CreateMasterFeeTypeRequest for creating fee types
type CreateMasterFeeTypeRequest struct {
	FeeTypeName string  `json:"fee_type_name" binding:"required"`
	Description *string `json:"description"`
}

// CreateMasterFeeType creates a new master fee type
func CreateMasterFeeType(c *gin.Context) {
	var req CreateMasterFeeTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	adminUserID := userID.(int64)

	db := config.DB

	feeType := models.MasterFeeType{
		FeeTypeName: req.FeeTypeName,
		Description: req.Description,
		IsActive:    true,
		CreatedBy:   adminUserID,
		CreatedAt:   time.Now(),
	}

	if err := db.Create(&feeType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create fee type"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "fee type created successfully",
		"fee_type_id": feeType.FeeTypeID,
	})
}

// GetMasterFeeTypes returns all master fee types
func GetMasterFeeTypes(c *gin.Context) {
	db := config.DB

	var feeTypes []models.MasterFeeType
	db.Order("fee_type_name ASC").Find(&feeTypes)

	c.JSON(http.StatusOK, gin.H{
		"fee_types": feeTypes,
		"total":     len(feeTypes),
	})
}
