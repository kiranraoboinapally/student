package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

// ---------------- GET STUDENT FEES -------------------

func GetStudentFees(c *gin.Context) {
	db := config.DB

	// --- get user_id ---
	uidVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var userID int64
	switch v := uidVal.(type) {
	case int64:
		userID = v
	case float64:
		userID = int64(v)
	case int:
		userID = int64(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id"})
		return
	}

	// --- load user ---
	var user models.User
	if err := db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	enrollmentStr := user.Username
	if enrollmentStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no enrollment number"})
		return
	}

	enrollmentNum, err := strconv.ParseInt(enrollmentStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment number"})
		return
	}

	// --- registration fees ---
	var regFees []models.RegistrationFee
	db.Where("enrollment_number = ?", enrollmentNum).
		Find(&regFees)

	// --- examination fees ---
	var examFees []models.ExaminationFee
	db.Where("enrollment_number = ?", enrollmentNum).
		Find(&examFees)

	// --- expected fees ---
	var expFee models.ExpectedFee
	db.Where("enrollment_number = ?", enrollmentNum).
		First(&expFee)

	c.JSON(http.StatusOK, gin.H{
		"registration_fees": regFees,
		"examination_fees":  examFees,
		"expected_fees":     expFee,
	})
}

// ---------------- PAY FEE -------------------

type PayFeeRequest struct {
	FeeDueID      int     `json:"fee_due_id" binding:"required"`
	Amount        float64 `json:"amount" binding:"required,gt=0"`
	PaymentMethod string  `json:"payment_method" binding:"required"`
	PaymentNote   string  `json:"payment_note"`
}

func PayFee(c *gin.Context) {
	db := config.DB

	uidVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return
	}

	var userID int64
	switch v := uidVal.(type) {
	case int64:
		userID = v
	case float64:
		userID = int64(v)
	case int:
		userID = int64(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id"})
		return
	}

	var req PayFeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "transaction failed"})
		return
	}

	var feeDue models.FeeDue
	if err := tx.Where("fee_due_id = ?", req.FeeDueID).
		First(&feeDue).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "fee due not found"})
		return
	}

	if feeDue.StudentID != int(userID) {
		tx.Rollback()
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	remaining := feeDue.OriginalAmount - feeDue.AmountPaid
	if remaining <= 0 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "already paid"})
		return
	}

	payAmt := req.Amount
	if payAmt > remaining {
		payAmt = remaining
	}

	payment := models.FeePayment{
		FeeDueID:      feeDue.FeeDueID,
		StudentID:     int(userID),
		PaidAmount:    payAmt,
		PaymentMethod: req.PaymentMethod,
		PaymentNote:   req.PaymentNote,
		PaidAt:        time.Now(),
	}

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "payment failed"})
		return
	}

	feeDue.AmountPaid += payAmt
	if feeDue.AmountPaid >= feeDue.OriginalAmount {
		feeDue.Status = "paid"
	} else {
		feeDue.Status = "partial"
	}

	if err := tx.Save(&feeDue).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":     "payment successful",
		"payment_id":  payment.PaymentID,
		"paid_amount": payAmt,
		"status":      feeDue.Status,
	})
}
