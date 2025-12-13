package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

/*
====================================
HELPER: Get Enrollment Number
====================================
*/
func getStudentEnrollment(c *gin.Context) (int64, error) {
	db := config.DB
	userID := c.GetInt64("user_id")

	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		return 0, err
	}

	return strconv.ParseInt(user.Username, 10, 64)
}

/*
====================================
STUDENT PROFILE (SAFE)
====================================
*/
func GetStudentProfile(c *gin.Context) {
	db := config.DB

	// ---- get user ----
	userID := c.GetInt64("user_id")
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	// ---- enrollment ----
	enrollment, err := strconv.ParseInt(user.Username, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment number"})
		return
	}

	// ---- student data ----
	var master models.MasterStudent
	var act models.ActStudent

	db.Where("enrollment_number = ?", enrollment).First(&master)
	db.Where("Enrollment_Number = ?", enrollment).First(&act)

	// ---- SAFE RESPONSE (NO PASSWORD HASH) ----
	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"user_id":   user.UserID,
			"username":  user.Username,
			"email":     user.Email,
			"full_name": user.FullName,
			"role_id":   user.RoleID,
			"status":    user.Status,
		},
		"master_student": master,
		"act_student":    act,
	})
}

/*
====================================
STUDENT DASHBOARD (SUMMARY ONLY)
====================================
*/
func GetStudentDashboard(c *gin.Context) {
	db := config.DB
	enrollment, _ := getStudentEnrollment(c)

	var expected models.ExpectedFee
	db.Where("enrollment_number = ?", enrollment).First(&expected)

	var latestResult models.SemesterResult
	db.Where("enrollment_number = ?", enrollment).
		Order("semester desc").
		First(&latestResult)

	c.JSON(http.StatusOK, gin.H{
		"fee_summary": gin.H{
			"total_expected": expected.TotalExpected,
			"total_paid":     expected.TotalPaid,
			"total_due":      expected.TotalExpected - expected.TotalPaid,
			"status":         expected.OverallStatus,
		},
		"latest_result": latestResult,
	})
}

/*
====================================
FEES (NO DUPLICATES)
====================================
*/

// ---- Fee Summary ----
func GetStudentFeeSummary(c *gin.Context) {
	db := config.DB
	enrollment, _ := getStudentEnrollment(c)

	var expected models.ExpectedFee
	db.Where("enrollment_number = ?", enrollment).First(&expected)

	c.JSON(http.StatusOK, expected)
}

// ---- Registration Fees ----
func GetStudentRegistrationFees(c *gin.Context) {
	db := config.DB
	enrollment, _ := getStudentEnrollment(c)

	var fees []models.RegistrationFee
	db.Where("enrollment_number = ?", enrollment).
		Order("transaction_date desc").
		Find(&fees)

	c.JSON(http.StatusOK, fees)
}

// ---- Examination Fees ----
func GetStudentExaminationFees(c *gin.Context) {
	db := config.DB
	enrollment, _ := getStudentEnrollment(c)

	var fees []models.ExaminationFee
	db.Where("enrollment_number = ?", enrollment).
		Order("transaction_date desc").
		Find(&fees)

	c.JSON(http.StatusOK, fees)
}

/*
====================================
ACADEMICS
====================================
*/

// ---- Current Semester ----
func GetCurrentSemester(c *gin.Context) {
	db := config.DB
	enrollment, _ := getStudentEnrollment(c)

	var result models.SemesterResult
	db.Where("enrollment_number = ?", enrollment).
		Order("semester desc").
		First(&result)

	c.JSON(http.StatusOK, gin.H{
		"current_semester": result.Semester,
	})
}

// ---- Current Subjects ----
func GetCurrentSemesterSubjects(c *gin.Context) {
	db := config.DB
	enrollment, _ := getStudentEnrollment(c)

	var sem models.SemesterResult
	db.Where("enrollment_number = ?", enrollment).
		Order("semester desc").
		First(&sem)

	var subjects []models.SubjectMaster
	db.Where("semester = ?", sem.Semester).
		Find(&subjects)

	c.JSON(http.StatusOK, subjects)
}

// ---- Current Semester Marks ----
func GetCurrentSemesterMarks(c *gin.Context) {
	db := config.DB
	enrollment, _ := getStudentEnrollment(c)

	var sem models.SemesterResult
	db.Where("enrollment_number = ?", enrollment).
		Order("semester desc").
		First(&sem)

	var marks []models.StudentMark
	db.Where("enrollment_number = ? AND semester = ?", enrollment, sem.Semester).
		Find(&marks)

	c.JSON(http.StatusOK, marks)
}
