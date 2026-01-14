package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// ======================== DEPARTMENT CONTROLLER ========================

// GetDepartments returns all departments (optionally filtered by institute)
func GetDepartments(c *gin.Context) {
	db := config.DB
	instituteIDStr := c.Query("institute_id")
	activeOnly := c.DefaultQuery("active_only", "true")

	query := db.Model(&models.Department{})

	// Filter by institute if provided, otherwise get global departments too
	if instituteIDStr != "" {
		instituteID, _ := strconv.Atoi(instituteIDStr)
		query = query.Where("institute_id = ? OR institute_id IS NULL", instituteID)
	}

	if activeOnly == "true" {
		query = query.Where("is_active = ?", true)
	}

	var departments []models.Department
	query.Order("department_name ASC").Find(&departments)

	c.JSON(http.StatusOK, gin.H{
		"departments": departments,
		"total":       len(departments),
	})
}

// GetInstituteDepartments returns departments available for an institute
func GetInstituteDepartments(c *gin.Context) {
	instituteID, exists := c.Get("institute_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "institute context required"})
		return
	}

	instID := instituteID.(int)
	db := config.DB

	var departments []models.Department
	// Get both global departments (institute_id IS NULL) and institute-specific ones
	db.Where("(institute_id = ? OR institute_id IS NULL) AND is_active = ?", instID, true).
		Order("department_name ASC").
		Find(&departments)

	c.JSON(http.StatusOK, gin.H{
		"departments": departments,
		"total":       len(departments),
	})
}

// CreateDepartmentRequest for creating a new department
type CreateDepartmentRequest struct {
	DepartmentName string  `json:"department_name" binding:"required"`
	DepartmentCode string  `json:"department_code" binding:"required"`
	InstituteID    *int    `json:"institute_id"` // NULL for global departments
	Description    *string `json:"description"`
}

// CreateDepartment creates a new department
func CreateDepartment(c *gin.Context) {
	var req CreateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB

	// Check for duplicate department code
	var existingCount int64
	query := db.Model(&models.Department{}).Where("department_code = ?", req.DepartmentCode)
	if req.InstituteID != nil {
		query = query.Where("institute_id = ? OR institute_id IS NULL", *req.InstituteID)
	} else {
		query = query.Where("institute_id IS NULL")
	}
	query.Count(&existingCount)

	if existingCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "department code already exists"})
		return
	}

	department := models.Department{
		DepartmentName: req.DepartmentName,
		DepartmentCode: req.DepartmentCode,
		InstituteID:    req.InstituteID,
		Description:    req.Description,
		IsActive:       true,
	}

	if err := db.Create(&department).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create department"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "department created successfully",
		"department_id": department.DepartmentID,
	})
}

// UpdateDepartmentRequest for updating a department
type UpdateDepartmentRequest struct {
	DepartmentName string  `json:"department_name"`
	DepartmentCode string  `json:"department_code"`
	Description    *string `json:"description"`
	IsActive       *bool   `json:"is_active"`
}

// UpdateDepartment updates a department
func UpdateDepartment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid department id"})
		return
	}

	var req UpdateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB

	var department models.Department
	if err := db.First(&department, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "department not found"})
		return
	}

	updates := make(map[string]interface{})
	if req.DepartmentName != "" {
		updates["department_name"] = req.DepartmentName
	}
	if req.DepartmentCode != "" {
		updates["department_code"] = req.DepartmentCode
	}
	if req.Description != nil {
		updates["description"] = req.Description
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	if err := db.Model(&department).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update department"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "department updated successfully",
		"department": department,
	})
}

// DeleteDepartment soft deletes a department (sets is_active to false)
func DeleteDepartment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid department id"})
		return
	}

	db := config.DB

	result := db.Model(&models.Department{}).Where("department_id = ?", id).Update("is_active", false)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete department"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "department not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "department deleted successfully"})
}
