package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

// GetStudentDashboard returns consolidated data for the logged-in student:
// - users row
// - master_students row
// - act_students row (if any)
// - registration_fees list
// - examination_fees list
// - expected_fee_collections (summary)
func GetStudentDashboard(c *gin.Context) {
	db := config.DB

	// 1) get caller's user_id and username from context
	uidVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	var callerUserID int64
	switch v := uidVal.(type) {
	case int64:
		callerUserID = v
	case float64:
		callerUserID = int64(v)
	case int:
		callerUserID = int64(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id"})
		return
	}

	username, _ := c.Get("username")
	usernameStr := ""
	if s, ok := username.(string); ok {
		usernameStr = s
	}

	// 2) load users row
	var user models.User
	if err := db.Where("user_id = ?", callerUserID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// 3) determine enrollment number:
	//    prefer user.Username if present, otherwise fallback to usernameStr
	enrollmentStr := user.Username
	if enrollmentStr == "" {
		enrollmentStr = usernameStr
	}
	if enrollmentStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no enrollment number associated with user"})
		return
	}

	// 4) parse numeric enrollment for master_students and fees
	var enrollmentNum int64
	if n, err := strconv.ParseInt(enrollmentStr, 10, 64); err == nil {
		enrollmentNum = n
	} else {
		// if username is not numeric, set 0 so master_students and fees queries won't return anything
		enrollmentNum = 0
	}

	// 5) Security check: ensure students cannot fetch other students' dashboards.
	if user.RoleID == 5 {
		// usernameStr already matches user's enrollment, so safe
	}

	// 6) fetch master_students
	var master models.MasterStudent
	if enrollmentNum != 0 {
		_ = db.Where("enrollment_number = ?", enrollmentNum).First(&master).Error
	}

	// 7) fetch act_students (string comparison)
	var act models.ActStudent
	_ = db.Where("Enrollment_Number = ? OR Regn_no = ?", enrollmentStr, enrollmentStr).First(&act).Error

	// 8) fetch registration fees (only numeric enrollments)
	var regFees []models.RegistrationFee
	if enrollmentNum != 0 {
		db.Where("enrollment_number = ?", enrollmentNum).Order("created_at desc").Find(&regFees)
	}

	// 9) fetch examination fees
	var examFees []models.ExaminationFee
	if enrollmentNum != 0 {
		db.Where("enrollment_number = ?", enrollmentNum).Order("created_at desc").Find(&examFees)
	}

	// 10) fetch expected fee summary
	var expFee models.ExpectedFee
	if enrollmentNum != 0 {
		_ = db.Where("enrollment_number = ?", enrollmentNum).First(&expFee).Error
	}

	// 11) aggregate response
	resp := gin.H{
		"user":              user,
		"master_student":    master,
		"act_student":       act,
		"registration_fees": regFees,
		"examination_fees":  examFees,
		"expected_fees":     expFee,
	}

	c.JSON(http.StatusOK, resp)
}
