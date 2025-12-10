package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

func GetStudentFees(c *gin.Context) {
	userID := c.GetInt64("user_id")
	db := config.DB

	// 1. Get user → enrollment number
	var user models.User
	if err := db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	enStr := user.Username
	en, _ := strconv.ParseInt(enStr, 10, 64)

	// 2. Registration Fees
	var regFees []models.RegistrationFee
	db.Where("enrollment_number = ?", en).Find(&regFees)

	// 3. Examination Fees
	var examFees []models.ExaminationFee
	db.Where("enrollment_number = ?", en).Find(&examFees)

	// 4. Expected Fees
	var expFee models.ExpectedFee
	db.Where("enrollment_number = ?", en).First(&expFee)

	c.JSON(http.StatusOK, gin.H{
		"registration_fees": regFees,
		"examination_fees":  examFees,
		"expected_fees":     expFee,
	})
}
