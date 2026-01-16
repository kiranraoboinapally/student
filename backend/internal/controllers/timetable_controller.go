package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// GetTimetable (student view - based on current semester)
func GetTimetable(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	semester := resolveCurrentSemester(enrollment)
	if semester == nil || semester == 0 {
		c.JSON(http.StatusOK, gin.H{"data": []gin.H{}})
		return
	}

	db := config.DB
	var timetable []models.Timetable

	if err := db.Where("semester = ?", semester).
		Order("day, time").
		Find(&timetable).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch timetable"})
		return
	}

	// Transform the data to match frontend expectations
	var response []gin.H
	for _, slot := range timetable {
		response = append(response, gin.H{
			"day":          slot.Day,
			"time_slot":    slot.Time,
			"subject_name": slot.Subject,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}
