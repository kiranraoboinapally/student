package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

func GetInstitutes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	db := config.DB
	var institutes []models.Institute
	var total int64

	db.Model(&models.Institute{}).Count(&total)

	db.Limit(limit).Offset(offset).Find(&institutes)

	c.JSON(http.StatusOK, gin.H{
		"data": institutes,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

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
