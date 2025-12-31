package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// GetSubjects returns all subjects with pagination
func GetSubjects(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	db := config.DB
	var subjects []models.SubjectMaster
	var total int64

	db.Model(&models.SubjectMaster{}).Count(&total)

	db.Limit(limit).Offset(offset).Find(&subjects)

	c.JSON(http.StatusOK, gin.H{
		"data": subjects,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
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
