package controllers

import (
	"net/http"
	"strconv"
	"strings"

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

	// Count total institutes for pagination
	db.Model(&models.Institute{}).Count(&total)

	// Fetch institutes with pagination
	db.Limit(limit).Offset(offset).Find(&institutes)

	// Get all master_students counts grouped by institute_name
	type Stats struct {
		InstituteName  string
		TotalStudents  int64
		ActiveStudents int64
		TotalCourses   int64
	}

	var stats []Stats
	db.Model(&models.MasterStudent{}).
		Select("LOWER(TRIM(institute_name)) AS institute_name, COUNT(*) AS total_students, COUNT(DISTINCT course_name) AS total_courses, COUNT(CASE WHEN student_status LIKE '%active%' THEN 1 END) AS active_students").
		Where("institute_name IS NOT NULL").
		Group("LOWER(TRIM(institute_name))").
		Scan(&stats)

	// Map for fast lookup
	statsMap := make(map[string]Stats)
	for _, s := range stats {
		statsMap[s.InstituteName] = s
	}

	// Attach stats to institutes
	type InstituteWithStats struct {
		models.Institute
		TotalStudents  int64 `json:"total_students"`
		ActiveStudents int64 `json:"active_students"`
		TotalCourses   int64 `json:"total_courses"`
	}

	var result []InstituteWithStats
	for _, inst := range institutes {
		key := strings.ToLower(strings.TrimSpace(inst.InstituteName))
		s, ok := statsMap[key]
		if !ok {
			s = Stats{} // default 0 if not found
		}
		result = append(result, InstituteWithStats{
			Institute:      inst,
			TotalStudents:  s.TotalStudents,
			ActiveStudents: s.ActiveStudents,
			TotalCourses:   s.TotalCourses,
		})
	}

	// Return response
	c.JSON(http.StatusOK, gin.H{
		"data": result,
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
