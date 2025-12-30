package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

// ApplyLeave (student)
func ApplyLeave(c *gin.Context) {
	var leave models.Leave
	if err := c.ShouldBindJSON(&leave); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	leave.StudentID = enrollment
	leave.Status = "pending"
	db := config.DB
	if err := db.Create(&leave).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to apply leave"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "leave applied", "data": leave})
}

// GetStudentLeaves (student)
func GetStudentLeaves(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := config.DB
	var leaves []models.Leave
	db.Where("student_id = ?", enrollment).Order("created_at desc").Find(&leaves)
	c.JSON(http.StatusOK, gin.H{"data": leaves})
}
