// controllers/timetable_controller.go - COMPLETED

package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
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
		c.JSON(http.StatusOK, gin.H{"data": []models.Timetable{}})
		return
	}

	db := config.DB
	var timetable []models.Timetable

	// Assuming timetable is defined per semester (you can enhance with course filter later)
	if err := db.Where("semester = ?", semester).
		Order("day, time").
		Find(&timetable).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch timetable"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": timetable})
}
