package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

func GetFaculties(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	db := config.DB
	var facs []models.Faculty
	var total int64

	db.Model(&models.Faculty{}).Count(&total)

	db.Limit(limit).Offset(offset).Find(&facs)

	c.JSON(http.StatusOK, gin.H{
		"data": facs,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

func CreateFaculty(c *gin.Context) {
	var f models.Faculty
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB
	if err := db.Create(&f).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create faculty"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "faculty created", "data": f})
}

func UpdateFaculty(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var f models.Faculty
	db := config.DB
	if err := db.First(&f, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "faculty not found"})
		return
	}
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&f)
	c.JSON(http.StatusOK, gin.H{"message": "faculty updated", "data": f})
}

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
