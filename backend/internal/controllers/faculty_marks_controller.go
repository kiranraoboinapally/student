package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// ======================== FACULTY INTERNAL MARKS ========================

// FacultyAddInternalMarksRequest represents the request for adding internal marks
type FacultyAddInternalMarksRequest struct {
	Marks []struct {
		EnrollmentNumber int64   `json:"enrollment_number" binding:"required"`
		Semester         int     `json:"semester" binding:"required"`
		SubjectCode      string  `json:"subject_code" binding:"required"`
		MarkType         string  `json:"mark_type" binding:"required"` // MSE1, MSE2, Assignment, Practical
		MarksObtained    float64 `json:"marks_obtained" binding:"required"`
		MaxMarks         float64 `json:"max_marks"`
	} `json:"marks" binding:"required"`
}

// FacultyAddInternalMarks allows faculty to enter internal marks (saved as draft)
func FacultyAddInternalMarks(c *gin.Context) {
	var req FacultyAddInternalMarksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	facultyUserID := userID.(int64)

	facultyInstituteID, exists := c.Get("faculty_institute_id")
	if !exists {
		facultyInstituteID, exists = c.Get("institute_id")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "faculty institute not determined"})
			return
		}
	}
	instituteID := facultyInstituteID.(int)

	db := config.DB
	var records []models.InternalMark
	now := time.Now()

	// Get institute name for validation
	var instituteName string
	db.Table("institutes").Select("institute_name").Where("institute_id = ?", instituteID).Scan(&instituteName)

	for _, m := range req.Marks {
		// Verify student belongs to faculty's institute
		var studentInstitute string
		if err := db.Table("master_students").
			Select("institute_name").
			Where("enrollment_number = ?", m.EnrollmentNumber).
			Scan(&studentInstitute).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "student not found: " + strconv.FormatInt(m.EnrollmentNumber, 10)})
			return
		}

		if studentInstitute != instituteName {
			c.JSON(http.StatusForbidden, gin.H{"error": "student does not belong to your institute"})
			return
		}

		// Get subject name
		var subject models.SubjectMaster
		if err := db.Where("subject_code = ?", m.SubjectCode).First(&subject).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "subject not found: " + m.SubjectCode})
			return
		}

		maxMarks := m.MaxMarks
		if maxMarks == 0 {
			maxMarks = 100 // Default max marks
		}

		records = append(records, models.InternalMark{
			EnrollmentNumber: m.EnrollmentNumber,
			InstituteID:      instituteID,
			Semester:         m.Semester,
			SubjectCode:      m.SubjectCode,
			SubjectName:      subject.SubjectName,
			MarkType:         m.MarkType,
			MarksObtained:    m.MarksObtained,
			MaxMarks:         maxMarks,
			Status:           "draft", // Always starts as draft
			EnteredBy:        facultyUserID,
			CreatedAt:        now,
			UpdatedAt:        now,
		})
	}

	if err := db.Create(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save internal marks"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "internal marks saved as draft",
		"total_records": len(records),
		"status":        "draft",
	})
}

// FacultyUpdateInternalMarks allows faculty to update draft marks
func FacultyUpdateInternalMarks(c *gin.Context) {
	idStr := c.Param("id")
	markID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid mark ID"})
		return
	}

	userID, _ := c.Get("user_id")
	facultyUserID := userID.(int64)

	var req struct {
		MarksObtained float64 `json:"marks_obtained"`
		MaxMarks      float64 `json:"max_marks"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB

	// Verify the mark exists, belongs to this faculty, and is still in draft
	var mark models.InternalMark
	if err := db.Where("internal_mark_id = ? AND entered_by = ?", markID, facultyUserID).First(&mark).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "mark not found or not authorized"})
		return
	}

	if mark.Status != "draft" {
		c.JSON(http.StatusForbidden, gin.H{"error": "can only edit marks in draft status"})
		return
	}

	// Update
	updates := map[string]interface{}{
		"marks_obtained": req.MarksObtained,
		"updated_at":     time.Now(),
	}
	if req.MaxMarks > 0 {
		updates["max_marks"] = req.MaxMarks
	}

	if err := db.Model(&mark).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update marks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "marks updated successfully",
		"mark_id": markID,
	})
}

// FacultySubmitMarksRequest for submitting marks for approval
type FacultySubmitMarksRequest struct {
	MarkIDs []int64 `json:"mark_ids" binding:"required"`
}

// FacultySubmitMarks changes status from draft to submitted
func FacultySubmitMarks(c *gin.Context) {
	var req FacultySubmitMarksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.MarkIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no mark IDs provided"})
		return
	}

	userID, _ := c.Get("user_id")
	facultyUserID := userID.(int64)

	db := config.DB
	now := time.Now()

	// Update all draft marks belonging to this faculty to submitted
	result := db.Model(&models.InternalMark{}).
		Where("internal_mark_id IN ? AND entered_by = ? AND status = ?", req.MarkIDs, facultyUserID, "draft").
		Updates(map[string]interface{}{
			"status":       "submitted",
			"submitted_at": now,
			"updated_at":   now,
		})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to submit marks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "marks submitted for university approval",
		"submitted_count":  result.RowsAffected,
		"requested_count":  len(req.MarkIDs),
	})
}

// FacultyGetInternalMarks retrieves internal marks entered by the faculty
func FacultyGetInternalMarks(c *gin.Context) {
	userID, _ := c.Get("user_id")
	facultyUserID := userID.(int64)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	// Filters
	status := c.Query("status")       // draft, submitted, locked, published
	semester := c.Query("semester")
	subjectCode := c.Query("subject_code")

	db := config.DB
	query := db.Model(&models.InternalMark{}).Where("entered_by = ?", facultyUserID)

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if semester != "" {
		sem, _ := strconv.Atoi(semester)
		query = query.Where("semester = ?", sem)
	}
	if subjectCode != "" {
		query = query.Where("subject_code = ?", subjectCode)
	}

	var total int64
	query.Count(&total)

	var marks []models.InternalMark
	query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&marks)

	// Get status counts
	var statusCounts []struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	db.Model(&models.InternalMark{}).
		Select("status, COUNT(*) as count").
		Where("entered_by = ?", facultyUserID).
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
