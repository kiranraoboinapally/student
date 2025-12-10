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

// ---------------- PAY FEE -------------------

// PayFeeRequest JSON
type PayFeeRequest struct {
	FeeDueID      int     `json:"fee_due_id" binding:"required"`
	Amount        float64 `json:"amount" binding:"required,gt=0"`
	PaymentMethod string  `json:"payment_method" binding:"required"`
	PaymentNote   string  `json:"payment_note"`
}

// PayFee - POST /students/fees/pay
func PayFee(c *gin.Context) {
	// get authenticated user id set by middleware (AuthRoleMiddleware)
	userID := c.GetInt64("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return
	}

	var req PayFeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "details": err.Error()})
		return
	}

	db := config.DB

	// Start transaction
	tx := db.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db transaction start failed"})
		return
	}

	// Lock/select the fee due
	var feeDue models.FeeDue
	if err := tx.Clauses().Where("fee_due_id = ?", req.FeeDueID).First(&feeDue).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "fee due not found"})
		return
	}

	// ensure the fee belongs to the logged-in student
	if feeDue.StudentID != int(userID) {
		tx.Rollback()
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized for this fee"})
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
		// clamp to remaining
		payAmt = remaining
	}

	// create payment record
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record payment"})
		return
	}

	// update fee_due
	feeDue.AmountPaid += payAmt
	if feeDue.AmountPaid >= feeDue.OriginalAmount {
		feeDue.Status = "paid"
	} else {
		feeDue.Status = "partial"
	}
	if err := tx.Save(&feeDue).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update fee due"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "payment recorded",
		"fee_due_id":      feeDue.FeeDueID,
		"paid_amount":     payAmt,
		"new_amount_paid": feeDue.AmountPaid,
		"new_status":      feeDue.Status,
		"payment_id":      payment.PaymentID,
	})
}
