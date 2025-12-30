package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// GetSubjects
func GetSubjects(c *gin.Context) {
	db := config.DB
	var subjects []models.SubjectMaster
	db.Find(&subjects)
	c.JSON(http.StatusOK, gin.H{"data": subjects})
}

// CreateSubject
func CreateSubject(c *gin.Context) {
	var subject models.SubjectMaster
	if err := c.ShouldBindJSON(&subject); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB
	if err := db.Create(&subject).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create subject"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "subject created", "data": subject})
}

// UpdateSubject
func UpdateSubject(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var subject models.SubjectMaster
	db := config.DB
	if err := db.First(&subject, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
		return
	}
	if err := c.ShouldBindJSON(&subject); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&subject)
	c.JSON(http.StatusOK, gin.H{"message": "subject updated", "data": subject})
}

// DeleteSubject
func DeleteSubject(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	db := config.DB
	if err := db.Delete(&models.SubjectMaster{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete subject"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "subject deleted"})
}
