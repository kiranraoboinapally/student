package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

// GetFaculty - List all faculty
func GetFaculty(c *gin.Context) {
	db := config.DB
	var faculty []models.Faculty
	db.Find(&faculty)
	c.JSON(http.StatusOK, gin.H{"data": faculty})
}

// CreateFaculty - Admin creates faculty user (assumes user already exists with role 3)
func CreateFaculty(c *gin.Context) {
	var faculty models.Faculty
	if err := c.ShouldBindJSON(&faculty); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB
	if err := db.Create(&faculty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create faculty record"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "faculty created", "data": faculty})
}

// UpdateFaculty
func UpdateFaculty(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var faculty models.Faculty
	db := config.DB
	if err := db.First(&faculty, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "faculty not found"})
		return
	}
	if err := c.ShouldBindJSON(&faculty); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&faculty)
	c.JSON(http.StatusOK, gin.H{"message": "faculty updated", "data": faculty})
}

// DeleteFaculty
func DeleteFaculty(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	db := config.DB
	if err := db.Delete(&models.Faculty{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete faculty"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "faculty deleted"})
}
