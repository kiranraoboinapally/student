package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
)

// ======================== FEE MANAGEMENT ADVANCED ========================

// GetActiveCoursesByInstitute retrieves unique courses for an institute (only active students)
func GetActiveCoursesByInstitute(c *gin.Context) {
	db := config.DB
	instituteID := c.Query("institute_id")

	if instituteID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "institute_id is required"})
		return
	}

	var courses []struct {
		CourseName string `json:"course_name"`
		Count      int64  `json:"student_count"`
	}

	db.Raw(`
		SELECT course_name, COUNT(*) as student_count
		FROM master_students
		WHERE institute_id = ? AND LOWER(student_status) = 'active'
		GROUP BY course_name
		ORDER BY course_name
	`, instituteID).Scan(&courses)

	c.JSON(http.StatusOK, courses)
}

// CreateFeesForActiveStudents creates fee records for active students
func CreateFeesForActiveStudents(c *gin.Context) {
	db := config.DB

	var input struct {
		InstituteID             int     `json:"institute_id" binding:"required"`
		CourseName              string  `json:"course_name" binding:"required"`
		FeeType                 string  `json:"fee_type" binding:"required"` // examination, registration, miscellaneous
		ExpectedExamFee         float64 `json:"expected_exam_fee"`
		ExpectedRegistrationFee float64 `json:"expected_registration_fee"`
		ExpectedMiscFee         float64 `json:"expected_misc_fee"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get all active students for this institute and course
	var studentEnrollments []int64
	db.Raw(`
		SELECT enrollment_number 
		FROM master_students 
		WHERE institute_id = ? 
		AND course_name = ? 
		AND LOWER(student_status) = 'active'
	`, input.InstituteID, input.CourseName).Scan(&studentEnrollments)

	if len(studentEnrollments) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active students found for this institute and course"})
		return
	}

	// Update or insert expected_fee_collections for each student
	updatedCount := 0
	for _, enrollment := range studentEnrollments {
		// Check if record exists
		var existingID int
		db.Raw("SELECT expected_fee_id FROM expected_fee_collections WHERE enrollment_number = ?", enrollment).Scan(&existingID)

		if existingID > 0 {
			// Update existing record
			updateQuery := `
				UPDATE expected_fee_collections 
				SET expected_exam_fee = ?,
					expected_registration_fee = ?,
					expected_misc_fee = ?,
					total_expected_fee = ? + ? + ?,
					updated_at = NOW()
				WHERE enrollment_number = ?
			`
			db.Exec(updateQuery,
				input.ExpectedExamFee,
				input.ExpectedRegistrationFee,
				input.ExpectedMiscFee,
				input.ExpectedExamFee,
				input.ExpectedRegistrationFee,
				input.ExpectedMiscFee,
				enrollment,
			)
		} else {
			// Insert new record - get student details first
			var student struct {
				StudentName   string
				InstituteName string
				Batch         string
				Session       string
			}
			db.Raw(`
				SELECT student_name, institute_name, batch, session
				FROM master_students
				WHERE enrollment_number = ?
			`, enrollment).Scan(&student)

			insertQuery := `
				INSERT INTO expected_fee_collections 
				(enrollment_number, student_name, institute_id, institute_name, course_name, 
				batch, session, expected_exam_fee, expected_registration_fee, expected_misc_fee, 
				total_expected_fee, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
			`
			db.Exec(insertQuery,
				enrollment,
				student.StudentName,
				input.InstituteID,
				student.InstituteName,
				input.CourseName,
				student.Batch,
				student.Session,
				input.ExpectedExamFee,
				input.ExpectedRegistrationFee,
				input.ExpectedMiscFee,
				input.ExpectedExamFee+input.ExpectedRegistrationFee+input.ExpectedMiscFee,
			)
		}
		updatedCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Fees created successfully for active students",
		"students_count": updatedCount,
		"enrollments":    studentEnrollments,
	})
}
