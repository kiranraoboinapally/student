package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

// GetInstitutes
func GetInstitutes(c *gin.Context) {
	db := config.DB
	var institutes []models.Institute
	db.Find(&institutes)
	c.JSON(http.StatusOK, gin.H{"data": institutes})
}

// CreateInstitute
func CreateInstitute(c *gin.Context) {
	var institute models.Institute
	if err := c.ShouldBindJSON(&institute); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB
	if err := db.Create(&institute).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create institute"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "institute created", "data": institute})
}

// UpdateInstitute
func UpdateInstitute(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var institute models.Institute
	db := config.DB
	if err := db.First(&institute, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "institute not found"})
		return
	}
	if err := c.ShouldBindJSON(&institute); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&institute)
	c.JSON(http.StatusOK, gin.H{"message": "institute updated", "data": institute})
}

// DeleteInstitute
func DeleteInstitute(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	db := config.DB
	if err := db.Delete(&models.Institute{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete institute"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "institute deleted"})
}
