package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

// GetMyProfile returns the logged-in user's profile + associated student records
func GetMyProfile(c *gin.Context) {
	userIDVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user id missing in context"})
		return
	}
	userID := userIDVal.(int64)
	db := config.DB

	var user models.User
	if err := db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var master models.MasterStudent
	// try numeric username -> enrollment conversion, else try raw string
	if en, err := strconv.ParseInt(user.Username, 10, 64); err == nil {
		_ = db.Where("enrollment_number = ?", en).First(&master).Error
	} else {
		// fallback try direct match (rare)
		_ = db.Where("enrollment_number = ?", user.Username).First(&master).Error
	}

	var act models.ActStudent
	enrollment := user.Username
	_ = db.Where("Enrollment_Number = ? OR Regn_no = ?", enrollment, enrollment).First(&act).Error

	c.JSON(http.StatusOK, gin.H{
		"user":           user,
		"master_student": master,
		"act_student":    act,
	})
}

// GetStudentByID returns student info by master_students.student_id
func GetStudentByID(c *gin.Context) {
	id := c.Param("id")
	db := config.DB

	var master models.MasterStudent
	if err := db.Where("student_id = ?", id).First(&master).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}

	var act models.ActStudent
	enrollment := strconv.FormatInt(master.EnrollmentNumber, 10)
	_ = db.Where("Enrollment_Number = ? OR Regn_no = ?", enrollment, enrollment).First(&act).Error

	c.JSON(http.StatusOK, gin.H{
		"master_student": master,
		"act_student":    act,
	})
}
