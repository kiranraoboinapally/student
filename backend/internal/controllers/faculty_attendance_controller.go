package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// ======================== FACULTY ATTENDANCE ========================

// FacultyMarkAttendanceRequest represents the request body for marking attendance
type FacultyMarkAttendanceRequest struct {
	Records []struct {
		EnrollmentNumber int64  `json:"enrollment_number" binding:"required"`
		Date             string `json:"date" binding:"required"` // Format: YYYY-MM-DD
		Present          bool   `json:"present"`
		SubjectCode      string `json:"subject_code"`
	} `json:"records" binding:"required"`
}

// FacultyMarkAttendance allows faculty to mark attendance for students
func FacultyMarkAttendance(c *gin.Context) {
	var req FacultyMarkAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	facultyUserID := userID.(int64)

	// Get faculty's institute from context (set by RequireApprovedFaculty middleware)
	facultyInstituteID, exists := c.Get("faculty_institute_id")
	if !exists {
		// Fallback to institute_id from context
		facultyInstituteID, exists = c.Get("institute_id")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "faculty institute not determined"})
			return
		}
	}
	instituteID := facultyInstituteID.(int)

	db := config.DB
	var records []models.Attendance

	for _, r := range req.Records {
		// Verify student belongs to faculty's institute
		var studentInstitute string
		if err := db.Table("master_students").
			Select("institute_name").
			Where("enrollment_number = ?", r.EnrollmentNumber).
			Scan(&studentInstitute).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "student not found: " + strconv.FormatInt(r.EnrollmentNumber, 10)})
			return
		}

		// Verify institute match
		var instituteName string
		db.Table("institutes").Select("institute_name").Where("institute_id = ?", instituteID).Scan(&instituteName)
		if studentInstitute != instituteName {
			c.JSON(http.StatusForbidden, gin.H{"error": "student does not belong to your institute"})
			return
		}

		parsed, err := time.Parse("2006-01-02", r.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
			return
		}

		sc := (*string)(nil)
		if r.SubjectCode != "" {
			sc = &r.SubjectCode
		}

		records = append(records, models.Attendance{
			EnrollmentNumber: r.EnrollmentNumber,
			Date:             parsed,
			Present:          r.Present,
			SubjectCode:      sc,
			MarkedBy:         facultyUserID,
			InstituteID:      instituteID,
			CreatedAt:        time.Now(),
		})
	}

	if err := db.Create(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save attendance"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "attendance marked successfully",
		"count":   len(records),
	})
}

// FacultyGetAttendance retrieves attendance records marked by the faculty
func FacultyGetAttendance(c *gin.Context) {
	userID, _ := c.Get("user_id")
	facultyUserID := userID.(int64)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	// Filters
	subjectCode := c.Query("subject_code")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	db := config.DB
	query := db.Model(&models.Attendance{}).Where("marked_by = ?", facultyUserID)

	if subjectCode != "" {
		query = query.Where("subject_code = ?", subjectCode)
	}
	if dateFrom != "" {
		query = query.Where("date >= ?", dateFrom)
	}
	if dateTo != "" {
		query = query.Where("date <= ?", dateTo)
	}

	var total int64
	query.Count(&total)

	var records []models.Attendance
	query.Order("date DESC").Limit(limit).Offset(offset).Find(&records)

	c.JSON(http.StatusOK, gin.H{
		"attendance": records,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// FacultyGetStudents returns students that faculty can access (from their institute)
func FacultyGetStudents(c *gin.Context) {
	facultyInstituteID, exists := c.Get("faculty_institute_id")
	if !exists {
		facultyInstituteID, exists = c.Get("institute_id")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "institute context required"})
			return
		}
	}
	instituteID := facultyInstituteID.(int)

	db := config.DB

	// Get institute name
	var instituteName string
	db.Table("institutes").Select("institute_name").Where("institute_id = ?", instituteID).Scan(&instituteName)

	// Get students from this institute
	var students []models.MasterStudent
	db.Where("institute_name = ?", instituteName).
		Order("student_name ASC").
		Find(&students)

	c.JSON(http.StatusOK, gin.H{
		"students": students,
		"total":    len(students),
	})
}
