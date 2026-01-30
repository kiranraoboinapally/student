package controllers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// GetInstituteDashboardStats returns statistics for the logged-in institute admin
func GetInstituteDashboardStats(c *gin.Context) {
	// 1. Get UserID from context
	userID := c.MustGet("user_id").(int64)

	// 2. Find the User to get their InstituteID
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.InstituteID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is not linked to an institute"})
		return
	}
	instituteID := *user.InstituteID

	// 3. Get Institute Name to filter MasterStudents (since MasterStudent uses Name, not ID currently)
	var institute models.Institute
	if err := config.DB.First(&institute, instituteID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Institute not found"})
		return
	}

	// Normalize Institute Name for query
	instNameQuery := strings.TrimSpace(institute.InstituteName) // Ideally utilize LOWER() in DB if needed

	// 4. Calculate Stats
	var totalStudents int64
	var activeStudents int64
	var totalCourses int64
	var totalFaculty int64 // Approximation or if we have faculty-institute link

	db := config.DB

	// Count Total Students
	// Note: master_students usually stores the institute name string.
	// We need to be careful about matching.
	db.Model(&models.MasterStudent{}).Where("institute_name = ?", instNameQuery).Count(&totalStudents)

	// Count Active Students
	db.Model(&models.MasterStudent{}).Where("institute_name = ? AND student_status LIKE ?", instNameQuery, "%active%").Count(&activeStudents)

	// Count Courses (Distinct CourseName for this institute)
	db.Model(&models.MasterStudent{}).Where("institute_name = ?", instNameQuery).Distinct("course_name").Count(&totalCourses)

	// Count Faculty (Assuming Faculty table has InstituteID or link via User? Currently Faculty has nil.
	// Let's check User table for faculty in this InstituteID)
	db.Model(&models.User{}).Where("institute_id = ? AND role_id = 2", instituteID).Count(&totalFaculty)

	c.JSON(http.StatusOK, gin.H{
		"institute_name":  institute.InstituteName,
		"total_students":  totalStudents,
		"active_students": activeStudents,
		"total_courses":   totalCourses,
		"total_faculty":   totalFaculty,
	})
}

// GetInstituteStudents returns students for the institute
func GetInstituteStudents(c *gin.Context) {
	userID := c.MustGet("user_id").(int64)
	var user models.User
	config.DB.First(&user, userID)
	if user.InstituteID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No institute linked"})
		return
	}

	var institute models.Institute
	config.DB.First(&institute, *user.InstituteID)

	var students []models.MasterStudent
	// Fetch students
	config.DB.Where("institute_name = ?", institute.InstituteName).Limit(3000).Find(&students)

	c.JSON(http.StatusOK, gin.H{"data": students})
}

// GetInstituteCourses returns courses for the institute
func GetInstituteCourses(c *gin.Context) {
	userID := c.MustGet("user_id").(int64)
	var user models.User
	config.DB.First(&user, userID)
	if user.InstituteID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No institute linked"})
		return
	}

	var institute models.Institute
	config.DB.First(&institute, *user.InstituteID)

	var courses []struct {
		CourseName string `json:"course_name"`
		Count      int    `json:"student_count"`
	}

	// Group by course name and count students per course for this institute
	if err := config.DB.Model(&models.MasterStudent{}).
		Select("course_name, count(*) as count").
		Where("institute_name = ?", institute.InstituteName).
		Group("course_name").
		Scan(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch courses"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": courses})
}

// GetInstituteFaculty returns faculty for the institute
func GetInstituteFaculty(c *gin.Context) {
	userID := c.MustGet("user_id").(int64)
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.InstituteID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No institute linked"})
		return
	}

	var faculties []models.Faculty

	// Preload related User and Role, but only keep required fields in the response
	if err := config.DB.
		Preload("User").
		Preload("User.Role").
		Where("institute_id = ?", *user.InstituteID).
		Find(&faculties).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch faculty"})
		return
	}

	// Build response matching frontend field names
	var response []gin.H
	for _, f := range faculties {
		response = append(response, gin.H{
			"faculty_id":      f.FacultyID,
			"full_name":       f.User.FullName, // frontend expects full_name
			"username":        f.User.Username,
			"email":           f.User.Email,
			"mobile":          f.User.Mobile,
			"department":      f.Department, // frontend expects department
			"approval_status": f.ApprovalStatus,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}
