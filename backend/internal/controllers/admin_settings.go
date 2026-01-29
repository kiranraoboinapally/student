package controllers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// ======================== GRADING SYSTEM ========================

// GetGradingRules retrieves all grade mappings
func GetGradingRules(c *gin.Context) {
	db := config.DB
	var grades []models.GradeMapping

	if err := db.Order("grade_points DESC").Find(&grades).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch grading rules"})
		return
	}

	c.JSON(http.StatusOK, grades)
}

// CreateGradingRule creates a new grade mapping
func CreateGradingRule(c *gin.Context) {
	db := config.DB
	var input models.GradeMapping

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if input.MarksPercent == "" || input.Grade == "" || input.GradePoints == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "marks_percent, grade, and grade_points are required"})
		return
	}

	// Check for duplicate grade
	var existing models.GradeMapping
	if err := db.Where("grade = ?", input.Grade).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Grade already exists"})
		return
	}

	if err := db.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create grading rule"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// UpdateGradingRule updates an existing grade mapping
func UpdateGradingRule(c *gin.Context) {
	db := config.DB
	id := c.Param("id")

	var existing models.GradeMapping
	if err := db.First(&existing, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grading rule not found"})
		return
	}

	var input models.GradeMapping
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check for duplicate grade (excluding current record)
	if input.Grade != "" && input.Grade != existing.Grade {
		var duplicate models.GradeMapping
		if err := db.Where("grade = ? AND id != ?", input.Grade, id).First(&duplicate).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Grade already exists"})
			return
		}
	}

	// Update fields
	if input.MarksPercent != "" {
		existing.MarksPercent = input.MarksPercent
	}
	if input.Grade != "" {
		existing.Grade = input.Grade
	}
	if input.GradePoints != "" {
		existing.GradePoints = input.GradePoints
	}
	if input.Remarks != nil {
		existing.Remarks = input.Remarks
	}

	if err := db.Save(&existing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update grading rule"})
		return
	}

	c.JSON(http.StatusOK, existing)
}

// DeleteGradingRule deletes a grade mapping
func DeleteGradingRule(c *gin.Context) {
	db := config.DB
	id := c.Param("id")

	var grade models.GradeMapping
	if err := db.First(&grade, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grading rule not found"})
		return
	}

	if err := db.Delete(&grade).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete grading rule"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Grading rule deleted successfully"})
}

// ======================== ACADEMIC RULES ========================

// GetAcademicRules retrieves academic rules
func GetAcademicRules(c *gin.Context) {
	db := config.DB
	
	var rules struct {
		ID        int       `json:"id"`
		Rules     string    `json:"rules"`
		UpdatedAt time.Time `json:"updated_at"`
		UpdatedBy int       `json:"updated_by"`
	}

	// Get the first (and should be only) record
	err := db.Raw("SELECT id, rules, updated_at, updated_by FROM academic_rules ORDER BY id DESC LIMIT 1").Scan(&rules).Error
	
	if err == sql.ErrNoRows || rules.ID == 0 {
		c.JSON(http.StatusOK, gin.H{"rules": ""})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch academic rules"})
		return
	}

	c.JSON(http.StatusOK, rules)
}

// UpdateAcademicRules updates academic rules
func UpdateAcademicRules(c *gin.Context) {
	db := config.DB

	var input struct {
		Rules string `json:"rules" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		userID = 1 // Default admin user
	}

	// Check if record exists
	var count int64
	db.Raw("SELECT COUNT(*) FROM academic_rules").Scan(&count)

	if count == 0 {
		// Insert new record
		err := db.Exec("INSERT INTO academic_rules (rules, updated_by, updated_at) VALUES (?, ?, ?)",
			input.Rules, userID, time.Now()).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create academic rules"})
			return
		}
	} else {
		// Update existing record
		err := db.Exec("UPDATE academic_rules SET rules = ?, updated_by = ?, updated_at = ? WHERE id = (SELECT MIN(id) FROM academic_rules)",
			input.Rules, userID, time.Now()).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update academic rules"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Academic rules updated successfully", "rules": input.Rules})
}
