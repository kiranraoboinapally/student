package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// ======================== FACULTY COURSE ASSIGNMENT CONTROLLER ========================

// AssignFacultyToCourseRequest for assigning faculty to courses
type AssignFacultyToCourseRequest struct {
	FacultyID      int64   `json:"faculty_id" binding:"required"`
	CourseStreamID int     `json:"course_stream_id" binding:"required"`
	Semester       *int    `json:"semester"`
	SubjectCode    *string `json:"subject_code"`
	AcademicYear   *string `json:"academic_year"`
}

// AssignFacultyToCourse assigns a faculty member to a course
func AssignFacultyToCourse(c *gin.Context) {
	var req AssignFacultyToCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instituteID, exists := c.Get("institute_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "institute context required"})
		return
	}
	instID := instituteID.(int)

	userID, _ := c.Get("user_id")
	assignedBy := userID.(int64)

	db := config.DB

	// Verify faculty belongs to this institute
	var faculty models.Faculty
	if err := db.Where("faculty_id = ? AND institute_id = ?", req.FacultyID, instID).First(&faculty).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "faculty not found in this institute"})
		return
	}

	// Verify course stream exists
	var courseStream models.CourseStream
	if err := db.Where("id = ?", req.CourseStreamID).First(&courseStream).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "course stream not found"})
		return
	}

	// Check if assignment already exists
	var existingCount int64
	query := db.Model(&models.FacultyCourseAssignment{}).
		Where("faculty_id = ? AND course_stream_id = ?", req.FacultyID, req.CourseStreamID)
	
	if req.Semester != nil {
		query = query.Where("semester = ?", *req.Semester)
	}
	if req.SubjectCode != nil {
		query = query.Where("subject_code = ?", *req.SubjectCode)
	}
	if req.AcademicYear != nil {
		query = query.Where("academic_year = ?", *req.AcademicYear)
	}
	query.Count(&existingCount)

	if existingCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "faculty is already assigned to this course"})
		return
	}

	assignment := models.FacultyCourseAssignment{
		FacultyID:      req.FacultyID,
		CourseStreamID: req.CourseStreamID,
		Semester:       req.Semester,
		SubjectCode:    req.SubjectCode,
		AcademicYear:   req.AcademicYear,
		IsActive:       true,
		AssignedAt:     time.Now(),
		AssignedBy:     &assignedBy,
	}

	if err := db.Create(&assignment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create assignment"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "faculty assigned to course successfully",
		"assignment_id": assignment.AssignmentID,
		"course_name":   courseStream.CourseName,
		"stream":        courseStream.Stream,
	})
}

// GetFacultyAssignments returns all course assignments for a faculty member
func GetFacultyAssignments(c *gin.Context) {
	facultyIDStr := c.Param("id")
	facultyID, err := strconv.ParseInt(facultyIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid faculty id"})
		return
	}

	instituteID, exists := c.Get("institute_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "institute context required"})
		return
	}
	instID := instituteID.(int)

	db := config.DB

	// Verify faculty belongs to this institute
	var faculty models.Faculty
	if err := db.Where("faculty_id = ? AND institute_id = ?", facultyID, instID).First(&faculty).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "faculty not found in this institute"})
		return
	}

	var assignments []struct {
		AssignmentID   int64     `json:"assignment_id"`
		CourseStreamID int       `json:"course_stream_id"`
		CourseName     string    `json:"course_name"`
		Stream         string    `json:"stream"`
		Semester       *int      `json:"semester"`
		SubjectCode    *string   `json:"subject_code"`
		AcademicYear   *string   `json:"academic_year"`
		IsActive       bool      `json:"is_active"`
		AssignedAt     time.Time `json:"assigned_at"`
	}

	db.Table("faculty_course_assignments").
		Select("faculty_course_assignments.assignment_id, faculty_course_assignments.course_stream_id, courses_streams.course_name, courses_streams.stream, faculty_course_assignments.semester, faculty_course_assignments.subject_code, faculty_course_assignments.academic_year, faculty_course_assignments.is_active, faculty_course_assignments.assigned_at").
		Joins("JOIN courses_streams ON faculty_course_assignments.course_stream_id = courses_streams.id").
		Where("faculty_course_assignments.faculty_id = ?", facultyID).
		Order("faculty_course_assignments.assigned_at DESC").
		Scan(&assignments)

	c.JSON(http.StatusOK, gin.H{
		"faculty_id":  facultyID,
		"assignments": assignments,
		"total":       len(assignments),
	})
}

// RemoveFacultyAssignment removes a faculty course assignment (soft delete)
func RemoveFacultyAssignment(c *gin.Context) {
	assignmentIDStr := c.Param("id")
	assignmentID, err := strconv.ParseInt(assignmentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}

	instituteID, exists := c.Get("institute_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "institute context required"})
		return
	}
	instID := instituteID.(int)

	db := config.DB

	// Verify assignment belongs to faculty from this institute
	var assignment models.FacultyCourseAssignment
	if err := db.Preload("Faculty").Where("assignment_id = ?", assignmentID).First(&assignment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "assignment not found"})
		return
	}

	if assignment.Faculty.InstituteID != instID {
		c.JSON(http.StatusForbidden, gin.H{"error": "assignment belongs to another institute"})
		return
	}

	// Soft delete by setting is_active to false
	if err := db.Model(&assignment).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove assignment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "assignment removed successfully"})
}

// GetFacultyMyCourses returns courses assigned to the logged-in faculty
func GetFacultyMyCourses(c *gin.Context) {
	userID := c.MustGet("user_id").(int64)

	db := config.DB

	// Get faculty record
	var faculty models.Faculty
	if err := db.Where("user_id = ?", userID).First(&faculty).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "faculty record not found"})
		return
	}

	var courses []struct {
		AssignmentID   int64   `json:"assignment_id"`
		CourseStreamID int     `json:"course_stream_id"`
		CourseName     string  `json:"course_name"`
		Stream         string  `json:"stream"`
		Semester       *int    `json:"semester"`
		SubjectCode    *string `json:"subject_code"`
		AcademicYear   *string `json:"academic_year"`
	}

	db.Table("faculty_course_assignments").
		Select("faculty_course_assignments.assignment_id, faculty_course_assignments.course_stream_id, courses_streams.course_name, courses_streams.stream, faculty_course_assignments.semester, faculty_course_assignments.subject_code, faculty_course_assignments.academic_year").
		Joins("JOIN courses_streams ON faculty_course_assignments.course_stream_id = courses_streams.id").
		Where("faculty_course_assignments.faculty_id = ? AND faculty_course_assignments.is_active = ?", faculty.FacultyID, true).
		Order("courses_streams.course_name ASC").
		Scan(&courses)

	// If no course_stream assignments, use faculty's department field (which stores course_name)
	if len(courses) == 0 && faculty.Department != "" && faculty.Department != "General" {
		// Return the department as a course
		courses = []struct {
			AssignmentID   int64   `json:"assignment_id"`
			CourseStreamID int     `json:"course_stream_id"`
			CourseName     string  `json:"course_name"`
			Stream         string  `json:"stream"`
			Semester       *int    `json:"semester"`
			SubjectCode    *string `json:"subject_code"`
			AcademicYear   *string `json:"academic_year"`
		}{
			{
				AssignmentID:   0,
				CourseStreamID: 0,
				CourseName:     faculty.Department,
				Stream:         "Assigned via Institute",
			},
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"faculty_id": faculty.FacultyID,
		"courses":    courses,
		"total":      len(courses),
	})
}

// GetCourseAssignedFaculty returns all faculty assigned to a specific course
func GetCourseAssignedFaculty(c *gin.Context) {
	courseStreamIDStr := c.Param("course_id")
	courseStreamID, err := strconv.Atoi(courseStreamIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid course id"})
		return
	}

	db := config.DB

	var faculty []struct {
		FacultyID    int64   `json:"faculty_id"`
		UserID       int64   `json:"user_id"`
		FullName     string  `json:"full_name"`
		Email        string  `json:"email"`
		Department   string  `json:"department"`
		Position     string  `json:"position"`
		Semester     *int    `json:"semester"`
		SubjectCode  *string `json:"subject_code"`
		AcademicYear *string `json:"academic_year"`
	}

	db.Table("faculty_course_assignments").
		Select("faculty.faculty_id, faculty.user_id, users.full_name, users.email, faculty.department, faculty.position, faculty_course_assignments.semester, faculty_course_assignments.subject_code, faculty_course_assignments.academic_year").
		Joins("JOIN faculty ON faculty_course_assignments.faculty_id = faculty.faculty_id").
		Joins("JOIN users ON faculty.user_id = users.user_id").
		Where("faculty_course_assignments.course_stream_id = ? AND faculty_course_assignments.is_active = ?", courseStreamID, true).
		Scan(&faculty)

	c.JSON(http.StatusOK, gin.H{
		"course_stream_id": courseStreamID,
		"faculty":          faculty,
		"total":            len(faculty),
	})
}
