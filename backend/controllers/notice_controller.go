package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

// GetNotices (for admin and student)
func GetNotices(c *gin.Context) {
	db := config.DB
	var notices []models.Notice
	db.Order("created_at desc").Find(&notices)
	c.JSON(http.StatusOK, gin.H{"data": notices})
}

// CreateNotice (admin only)
func CreateNotice(c *gin.Context) {
	var notice models.Notice
	if err := c.ShouldBindJSON(&notice); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	notice.CreatedBy = c.GetInt64("user_id")
	db := config.DB
	if err := db.Create(&notice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create notice"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "notice created", "data": notice})
}

// UpdateNotice (admin only)
func UpdateNotice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var notice models.Notice
	db := config.DB
	if err := db.First(&notice, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "notice not found"})
		return
	}
	if err := c.ShouldBindJSON(&notice); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&notice)
	c.JSON(http.StatusOK, gin.H{"message": "notice updated", "data": notice})
}

// DeleteNotice (admin only)
func DeleteNotice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	db := config.DB
	if err := db.Delete(&models.Notice{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete notice"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "notice deleted"})
}
