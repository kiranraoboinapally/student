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
func GetCourses(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	db := config.DB

	var total int64
	db.Model(&models.Course{}).Count(&total)

	var courses []models.Course
	db.Limit(limit).Offset(offset).Find(&courses)

	var result []gin.H
	for _, course := range courses {
		var studentCount int64
		var activeCount int64

		// These counts could be further optimized with a single query, but this is already better than before
		db.Model(&models.MasterStudent{}).
			Where("LOWER(course_name) = ?", strings.ToLower(course.Name)).
			Count(&studentCount)

		db.Model(&models.MasterStudent{}).
			Where("LOWER(course_name) = ? AND LOWER(student_status) = ?", strings.ToLower(course.Name), "active").
			Count(&activeCount)

		result = append(result, gin.H{
			"course_id":            course.CourseID,
			"name":                 course.Name,
			"duration_years":       course.Duration,
			"institute_id":         course.InstituteID,
			"status":               course.Status,
			"student_count":        studentCount,
			"active_student_count": activeCount,
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
	var course models.Course
	if err := c.ShouldBindJSON(&course); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB
	if err := db.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create course"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "course created", "data": course})
}

// UpdateCourse updates an existing course by its primary key
func UpdateCourse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var course models.Course
	db := config.DB
	if err := db.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "course not found"})
		return
	}
	if err := c.ShouldBindJSON(&course); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&course)
	c.JSON(http.StatusOK, gin.H{"message": "course updated", "data": course})
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
	if err := db.Delete(&models.Course{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete course"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "course deleted"})
}
