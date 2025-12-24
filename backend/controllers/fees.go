// controllers/fees.go - FINAL FULLY WORKING VERSION

package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

// Unified structure for paid history items
type UnifiedFeeRecord struct {
	ID              int64   `json:"id"`
	Type            string  `json:"fee_type"`
	Head            string  `json:"fee_head"`
	OriginalAmount  float64 `json:"original_amount"`
	AmountPaid      float64 `json:"amount_paid"`
	TransactionNo   string  `json:"transaction_number"`
	TransactionDate string  `json:"transaction_date"`
	Status          string  `json:"payment_status"`
	CreatedAt       string  `json:"created_at"`
}

// Structure for pending dues (from expected_fee_collections)
type DueFeeRecord struct {
	FeeDueID       int64   `json:"fee_due_id"`
	FeeType        string  `json:"fee_type"`
	FeeHead        string  `json:"fee_head"`
	OriginalAmount float64 `json:"original_amount"`
	AmountPaid     float64 `json:"amount_paid"`
	DueDate        string  `json:"due_date"`
	Status         string  `json:"status"`
}

// ---------------- GET STUDENT FEES SUMMARY (Dues + History) -------------------
func GetStudentFees(c *gin.Context) {
	db := config.DB

	// Get authenticated user
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

	// Fetch user to get enrollment number
	var user models.User
	if err := db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	enrollment, err := strconv.ParseInt(user.Username, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment format"})
		return
	}

	// ==================== 1. PENDING DUES FROM expected_fee_collections ====================
	var expected models.ExpectedFee
	dueItems := []DueFeeRecord{}

	if err := db.Where("enrollment_number = ?", enrollment).First(&expected).Error; err == nil {
		addDueIfPending := func(feeType, feeHead string, expectedAmt, paidAmt float64) {
			balance := expectedAmt - paidAmt
			if balance > 0 {
				dueItems = append(dueItems, DueFeeRecord{
					FeeDueID:       0,
					FeeType:        feeType,
					FeeHead:        feeHead,
					OriginalAmount: expectedAmt,
					AmountPaid:     paidAmt,
					DueDate:        time.Now().AddDate(0, 3, 0).Format("2006-01-02"),
					Status:         "Pending",
				})
			}
		}

		addDueIfPending("Examination", "Examination Fee", expected.ExpectedExamFee, expected.ExamFeePaid)
		addDueIfPending("Registration", "Registration Fee", expected.ExpectedRegFee, expected.RegistrationFeePaid)
	}

	// ==================== 2. PAYMENT HISTORY - SHOW ALL RECORDS (NO FILTER) ====================
	var history []UnifiedFeeRecord

	safederefString := func(s *string) string {
		if s != nil {
			return *s
		}
		return ""
	}
	safederefFloat := func(f *float64) float64 {
		if f != nil {
			return *f
		}
		return 0.0
	}

	// Registration Fees - ALL records
	var regFees []models.RegistrationFee
	db.Where("enrollment_number = ?", enrollment).
		Order("created_at DESC").
		Find(&regFees)

	for _, f := range regFees {
		amount := safederefFloat(f.FeeAmount)
		txnDate := safederefString(f.TransactionDate)
		if txnDate == "" && f.CreatedAt != nil {
			txnDate = *f.CreatedAt
		}

		history = append(history, UnifiedFeeRecord{
			ID:              f.RegnFeeID,
			Type:            safederefString(f.FeeType),
			Head:            "Registration Fee",
			OriginalAmount:  amount,
			AmountPaid:      amount,
			TransactionNo:   safederefString(f.TransactionNumber),
			TransactionDate: txnDate,
			Status:          safederefString(f.PaymentStatus),
			CreatedAt:       safederefString(f.CreatedAt),
		})
	}

	// Examination Fees - ALL records
	var examFees []models.ExaminationFee
	db.Where("enrollment_number = ?", enrollment).
		Order("created_at DESC").
		Find(&examFees)

	for _, f := range examFees {
		amount := safederefFloat(f.FeeAmount)
		txnDate := safederefString(f.TransactionDate)
		if txnDate == "" {
			txnDate = time.Now().Format("2006-01-02")
		}

		history = append(history, UnifiedFeeRecord{
			ID:              f.ExamFeeID,
			Type:            safederefString(f.FeeType),
			Head:            "Examination Fee",
			OriginalAmount:  amount,
			AmountPaid:      amount,
			TransactionNo:   safederefString(f.TransactionNo),
			TransactionDate: txnDate,
			Status:          safederefString(f.PaymentStatus),
			CreatedAt:       txnDate,
		})
	}

	// Miscellaneous Fees - ALL records
	var miscFees []models.MiscellaneousFee
	db.Where("enrollment_number = ?", enrollment).
		Order("created_at DESC").
		Find(&miscFees)

	for _, f := range miscFees {
		amount := safederefFloat(f.FeeAmount)
		txnDate := safederefString(f.TransactionDate)
		if txnDate == "" {
			txnDate = time.Now().Format("2006-01-02")
		}

		history = append(history, UnifiedFeeRecord{
			ID:              f.MiscFeeID,
			Type:            safederefString(f.FeeType),
			Head:            "Miscellaneous Fee",
			OriginalAmount:  amount,
			AmountPaid:      amount,
			TransactionNo:   safederefString(f.TransactionNo),
			TransactionDate: txnDate,
			Status:          safederefString(f.PaymentStatus),
			CreatedAt:       txnDate,
		})
	}

	// ==================== FINAL RESPONSE ====================
	c.JSON(http.StatusOK, gin.H{
		"dues":    dueItems,
		"history": history,
	})
}

// PayFee placeholder (keep or implement later)
func PayFee(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Online payment not enabled yet"})
}
