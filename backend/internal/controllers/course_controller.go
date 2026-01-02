package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// CourseWithCounts represents a course with student counts
type CourseWithCounts struct {
	Name               string `json:"name"`
	StudentCount       int    `json:"student_count"`
	ActiveStudentCount int    `json:"active_student_count"`
	ProgramDuration    int    `json:"program_duration,omitempty"` // optional
}

// GetCourses returns all courses with pagination and student counts
// GetCourses returns all course-stream combinations with pagination and student counts
func GetCourses(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	db := config.DB

	// Count total rows in courses_streams
	var total int64
	db.Model(&models.CourseStream{}).Count(&total)

	// Fetch course-stream records
	var courseStreams []models.CourseStream
	db.Limit(limit).Offset(offset).Find(&courseStreams)

	// Prepare result
	var result []gin.H
	for _, cs := range courseStreams {
		var studentCount int64
		var activeCount int64

		// 🔍 Count students by course_name + stream (case-insensitive)
		// Adjust column names if your master_students uses different names
		db.Model(&models.MasterStudent{}).
			Where("LOWER(course_name) = ? AND LOWER(stream) = ?",
				strings.ToLower(cs.CourseName),
				strings.ToLower(cs.Stream)).
			Count(&studentCount)

		db.Model(&models.MasterStudent{}).
			Where("LOWER(course_name) = ? AND LOWER(stream) = ? AND LOWER(student_status) = ?",
				strings.ToLower(cs.CourseName),
				strings.ToLower(cs.Stream),
				"active").
			Count(&activeCount)

		// ✅ Build response using actual DB fields
		result = append(result, gin.H{
			"id":                   cs.ID,
			"course_name":          cs.CourseName,
			"stream":               cs.Stream,
			"created_at":           cs.CreatedAt,
			"student_count":        studentCount,
			"active_student_count": activeCount,
			// Optional: combine for display
			"full_name": cs.CourseName + " - " + cs.Stream,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// CreateCourse creates a new course
func CreateCourse(c *gin.Context) {
	var input struct {
		CourseName string `json:"course_name" binding:"required"`
		Stream     string `json:"stream" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	courseStream := models.CourseStream{
		CourseName: input.CourseName,
		Stream:     input.Stream,
	}

	db := config.DB
	if err := db.Create(&courseStream).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create course stream"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "course stream created",
		"data":    courseStream,
	})
}

// UpdateCourse updates an existing course by its primary key
func UpdateCourse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var cs models.CourseStream
	db := config.DB
	if err := db.First(&cs, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "course stream not found"})
		return
	}

	var input struct {
		CourseName string `json:"course_name"`
		Stream     string `json:"stream"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Only update provided fields
	if input.CourseName != "" {
		cs.CourseName = input.CourseName
	}
	if input.Stream != "" {
		cs.Stream = input.Stream
	}

	if err := db.Save(&cs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update course stream"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "course stream updated",
		"data":    cs,
	})
}

// DeleteCourse deletes a course by its primary key
func DeleteCourse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	db := config.DB
	if err := db.Delete(&models.CourseStream{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete course stream"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "course stream deleted"})
}
