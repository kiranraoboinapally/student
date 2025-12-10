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

	username, _ := c.Get("username") // may be string, may be absent
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

	enrollmentNum, err := strconv.ParseInt(enrollmentStr, 10, 64)
	if err != nil {
		// if username is not numeric, still try to find by matching strings in act_students
		// but for secure student-dashboard we require numeric enrollment
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment number stored for user"})
		return
	}

	// 4) Security check: ensure students cannot fetch other students' dashboards.
	//    If the caller is role_id = 5 (student) enforce that enrollment matches user's username.
	//    We already used user.Username; this prevents a student with a valid token trying to pass another id.
	if user.RoleID == 5 {
		// fetched enrollmentStr came from user.Username already, so OK.
		// nothing extra to check here (we won't accept any other query param).
	}

	// 5) fetch master_students
	var master models.MasterStudent
	_ = db.Where("enrollment_number = ?", enrollmentNum).First(&master).Error

	// 6) fetch act_students (may match Enrollment_Number or Regn_no)
	var act models.ActStudent
	_ = db.Where("Enrollment_Number = ? OR Regn_no = ?", enrollmentStr, enrollmentStr).First(&act).Error

	// 7) fetch registration fees
	var regFees []models.RegistrationFee
	db.Where("enrollment_number = ?", enrollmentNum).Order("created_at desc").Find(&regFees)

	// 8) fetch examination fees
	var examFees []models.ExaminationFee
	db.Where("enrollment_number = ?", enrollmentNum).Order("created_at desc").Find(&examFees)

	// 9) fetch expected fee summary (single row)
	var expFee models.ExpectedFee
	_ = db.Where("enrollment_number = ?", enrollmentNum).First(&expFee).Error

	// 10) aggregate response
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
