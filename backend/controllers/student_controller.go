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
HELPER: Resolve Current Semester (SAFE)
====================================
*/
func resolveCurrentSemester(enrollment int64) int {
	db := config.DB

	// 1️⃣ Try semester_results
	var sem models.SemesterResult
	if err := db.Where("enrollment_number = ?", enrollment).
		Order("semester desc").
		First(&sem).Error; err == nil {
		return sem.Semester
	}

	// 2️⃣ Fallback: MAX semester from student_marks
	var result struct {
		MaxSemester int `gorm:"column:max_semester"`
	}

	db.Table("student_marks").
		Select("COALESCE(MAX(semester), 0) AS max_semester").
		Where("enrollment_number = ?", enrollment).
		Scan(&result)

	return result.MaxSemester
}

/*
====================================
STUDENT PROFILE (SAFE)
====================================
*/
func GetStudentProfile(c *gin.Context) {
	db := config.DB

	userID := c.GetInt64("user_id")
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	enrollment, err := strconv.ParseInt(user.Username, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment number"})
		return
	}

	var master models.MasterStudent
	var act models.ActStudent

	db.Where("enrollment_number = ?", enrollment).First(&master)
	db.Where("Enrollment_Number = ?", enrollment).First(&act)

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
STUDENT DASHBOARD
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
FEES
====================================
*/

func GetStudentFeeSummary(c *gin.Context) {
	db := config.DB
	enrollment, _ := getStudentEnrollment(c)

	var expected models.ExpectedFee
	db.Where("enrollment_number = ?", enrollment).First(&expected)

	c.JSON(http.StatusOK, expected)
}

func GetStudentRegistrationFees(c *gin.Context) {
	db := config.DB
	enrollment, _ := getStudentEnrollment(c)

	var fees []models.RegistrationFee
	db.Where("enrollment_number = ?", enrollment).
		Order("transaction_date desc").
		Find(&fees)

	c.JSON(http.StatusOK, fees)
}

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
	enrollment, err := getStudentEnrollment(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment"})
		return
	}

	semester := resolveCurrentSemester(enrollment)
	c.JSON(http.StatusOK, gin.H{"current_semester": semester})
}

// ---- Current Subjects ----
func GetCurrentSemesterSubjects(c *gin.Context) {
	db := config.DB
	enrollment, err := getStudentEnrollment(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment"})
		return
	}

	semester := resolveCurrentSemester(enrollment)
	if semester == 0 {
		c.JSON(http.StatusOK, []models.SubjectMaster{})
		return
	}

	var subjects []models.SubjectMaster
	db.Where("semester = ?", semester).Find(&subjects)

	c.JSON(http.StatusOK, subjects)
}

// ---- Current Semester Marks (FIXED) ----
func GetCurrentSemesterMarks(c *gin.Context) {
	db := config.DB
	enrollment, err := getStudentEnrollment(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment"})
		return
	}

	semester := resolveCurrentSemester(enrollment)
	if semester == 0 {
		c.JSON(http.StatusOK, []models.StudentMark{})
		return
	}

	var marks []models.StudentMark
	if err := db.Where("enrollment_number = ? AND semester = ?", enrollment, semester).
		Find(&marks).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch marks"})
		return
	}

	c.JSON(http.StatusOK, marks)
}

// ---- Attendance ----
func GetStudentAttendance(c *gin.Context) {
	db := config.DB
	enrollment, err := getStudentEnrollment(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment"})
		return
	}

	semester := resolveCurrentSemester(enrollment)
	if semester == 0 {
		c.JSON(http.StatusOK, gin.H{"attendance": []interface{}{}})
		return
	}

	type AttendanceRecord struct {
		SubjectName     string `gorm:"column:subject_name"`
		TotalClasses    int    `gorm:"column:total_classes"`
		AttendedClasses int    `gorm:"column:attended_classes"`
	}

	var attendance []AttendanceRecord
	query := `
		SELECT
			sm.subject_name,
			COALESCE(COUNT(a.class_date), 0) AS total_classes,
			COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) AS attended_classes
		FROM subjects_master sm
		LEFT JOIN attendance a
			ON sm.subject_code = a.subject_code
			AND a.enrollment_number = ?
			AND a.semester = ?
		WHERE sm.semester = ?
		GROUP BY sm.subject_name
	`

	if err := db.Raw(query, enrollment, semester, semester).
		Scan(&attendance).Error; err != nil {

		c.JSON(http.StatusOK, gin.H{"attendance": []interface{}{}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"attendance": attendance})
}
