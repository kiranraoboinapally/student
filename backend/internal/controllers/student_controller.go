package controllers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
)

// resolveCurrentSemester (copied from legacy) - helper
func resolveCurrentSemester(enrollment int64) interface{} {
	db := config.DB

	var sem models.SemesterResult
	if err := db.Where("enrollment_number = ?", enrollment).
		Order("semester desc").
		First(&sem).Error; err == nil {
		return sem.Semester
	}

	var result struct {
		MaxSemester int `gorm:"column:max_semester"`
	}
	db.Table("student_marks").
		Select("COALESCE(MAX(semester), 0) AS max_semester").
		Where("enrollment_number = ?", enrollment).
		Scan(&result)

	return result.MaxSemester
}

func GetStudentProfile(c *gin.Context) {
	db := config.DB

	userID := c.GetInt64("user_id")
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	enrollment, err := getStudentEnrollment(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
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

func GetStudentDashboard(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := config.DB

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

func GetStudentFeeSummary(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := config.DB

	var expected models.ExpectedFee
	db.Where("enrollment_number = ?", enrollment).First(&expected)

	c.JSON(http.StatusOK, expected)
}

func GetStudentRegistrationFees(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := config.DB

	var fees []models.RegistrationFee
	db.Where("enrollment_number = ?", enrollment).
		Order("transaction_date desc").
		Find(&fees)

	c.JSON(http.StatusOK, fees)
}

func GetStudentExaminationFees(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := config.DB

	var fees []models.ExaminationFee
	db.Where("enrollment_number = ?", enrollment).
		Order("transaction_date desc").
		Find(&fees)

	c.JSON(http.StatusOK, fees)
}

func GetCurrentSemester(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	semester := resolveCurrentSemester(enrollment)
	c.JSON(http.StatusOK, gin.H{"current_semester": semester})
}

func GetCurrentSemesterSubjects(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := config.DB

	semester := resolveCurrentSemester(enrollment)
	if semester == nil || semester == 0 {
		c.JSON(http.StatusOK, []models.SubjectMaster{})
		return
	}

	var subjects []models.SubjectMaster
	db.Where("semester = ?", semester).Find(&subjects)

	c.JSON(http.StatusOK, subjects)
}

func GetCurrentSemesterMarks(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := config.DB

	semester := resolveCurrentSemester(enrollment)
	if semester == nil || semester == 0 {
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
func GetStudentAttendance(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	semesterRaw := resolveCurrentSemester(enrollment)
	var semInt int
	switch s := semesterRaw.(type) {
	case int:
		semInt = s
	case int64:
		semInt = int(s)
	case float64:
		semInt = int(s)
	default:
		c.JSON(http.StatusOK, gin.H{"attendance": []interface{}{}})
		return
	}

	if semInt == 0 {
		c.JSON(http.StatusOK, gin.H{"attendance": []interface{}{}})
		return
	}

	type AttendanceRecord struct {
		SubjectName     string `gorm:"column:subject_name" json:"subject_name"`
		TotalClasses    int    `gorm:"column:total_classes" json:"total_classes"`
		AttendedClasses int    `gorm:"column:attended_classes" json:"attended_classes"`
	}

	var attendance []AttendanceRecord

	query := `
    SELECT
        sm.subject_name,
        COALESCE(COUNT(a.date), 0) AS total_classes,
        COALESCE(SUM(CASE WHEN a.present = TRUE THEN 1 ELSE 0 END), 0) AS attended_classes
    FROM subjects_master sm
    LEFT JOIN attendance a
        ON sm.subject_code = a.subject_code
        AND a.enrollment_number = ?
    WHERE sm.semester = ?
    GROUP BY sm.subject_name
    `

	db := config.DB
	if err := db.Raw(query, enrollment, semInt).Scan(&attendance).Error; err != nil {
		log.Println("Error fetching attendance:", err)
		c.JSON(http.StatusOK, gin.H{"attendance": []interface{}{}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"attendance": attendance})
}

func GetAllMarks(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := config.DB

	var marks []models.StudentMark
	db.Where("enrollment_number = ?", enrollment).Order("semester asc").Find(&marks)

	c.JSON(http.StatusOK, marks)
}

func GetSemesterResults(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := config.DB

	var results []models.SemesterResult
	db.Where("enrollment_number = ?", enrollment).Order("semester asc").Find(&results)

	c.JSON(http.StatusOK, results)
}
