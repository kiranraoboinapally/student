package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// CreateAssignment allows a faculty member to create an assignment
func CreateAssignment(c *gin.Context) {
	var input struct {
		CourseID    int    `json:"course_id" binding:"required"`
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		DueDate     string `json:"due_date" binding:"required"` // Format: YYYY-MM-DD
		FilePath    string `json:"file_path"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse DueDate
	dueDate, err := time.Parse("2006-01-02", input.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	// Get Faculty ID from context (set by middleware)
	// Assuming faculty_id is stored in context, or we use user_id to find faculty_id
	// For now, let's assume userID is sufficient or we fetch facultyID
	userID := c.MustGet("user_id").(int64)
	
	// Verify user is faculty (middleware should have checked role, but good to get FacultyID)
	var faculty models.Faculty
	if err := config.DB.Where("user_id = ?", userID).First(&faculty).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "User is not a faculty member"})
		return
	}

	assignment := models.Assignment{
		CourseID:    input.CourseID,
		FacultyID:   faculty.FacultyID,
		Title:       input.Title,
		Description: input.Description,
		DueDate:     dueDate,
		FilePath:    &input.FilePath,
		CreatedAt:   time.Now(),
	}

	if err := config.DB.Create(&assignment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create assignment"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Assignment created", "data": assignment})
}

// GetAssignmentsByCourse returns assignments for a specific course
func GetAssignmentsByCourse(c *gin.Context) {
	courseID := c.Param("course_id")
	
	var assignments []models.Assignment
	if err := config.DB.Where("course_id = ?", courseID).Find(&assignments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assignments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": assignments})
}

// SubmitAssignment allows a student to submit an assignment
func SubmitAssignment(c *gin.Context) {
	assignmentIDStr := c.Param("id")
	assignmentID, _ := strconv.ParseInt(assignmentIDStr, 10, 64)

	var input struct {
		FilePath string `json:"file_path" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("user_id").(int64)

	// Check if assignment exists (and maybe if due date has passed)
	var assignment models.Assignment
	if err := config.DB.First(&assignment, assignmentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assignment not found"})
		return
	}

	if time.Now().After(assignment.DueDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Submission deadline has passed"})
		return
	}

	submission := models.Submission{
		AssignmentID: assignmentID,
		StudentID:    userID, // Assuming StudentID maps to UserID for now, or we lookup Student table
		FilePath:     input.FilePath,
		SubmittedAt:  time.Now(),
	}

	if err := config.DB.Create(&submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit assignment"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Assignment submitted successfully"})
}

// GetSubmissionsByAssignment allows faculty to view submissions
func GetSubmissionsByAssignment(c *gin.Context) {
	assignmentID := c.Param("id")

	var submissions []models.Submission
	if err := config.DB.Where("assignment_id = ?", assignmentID).Find(&submissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch submissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": submissions})
}

// GradeSubmission allows faculty to grade a submission
func GradeSubmission(c *gin.Context) {
	submissionID := c.Param("id")

	var input struct {
		Grade    string `json:"grade" binding:"required"`
		Feedback string `json:"feedback"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var submission models.Submission
	if err := config.DB.First(&submission, submissionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Submission not found"})
		return
	}

	submission.Grade = &input.Grade
	submission.Feedback = &input.Feedback

	if err := config.DB.Save(&submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update grade"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Submission graded successfully"})
}
