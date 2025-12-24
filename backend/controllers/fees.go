// controllers/fees.go - FINAL VERSION

package controllers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
	razorpay "github.com/razorpay/razorpay-go"
	utils "github.com/razorpay/razorpay-go/utils"
)

/* ======================= RAZORPAY ======================= */

var (
	RazorpayKeyID  string
	RazorpaySecret string
	rzpClient      *razorpay.Client
)

func InitRazorpay() {
	RazorpayKeyID = os.Getenv("RAZORPAY_KEY_ID")
	RazorpaySecret = os.Getenv("RAZORPAY_SECRET")
	if RazorpayKeyID == "" || RazorpaySecret == "" {
		panic("RAZORPAY_KEY_ID and RAZORPAY_SECRET env vars missing")
	}
	rzpClient = razorpay.NewClient(RazorpayKeyID, RazorpaySecret)
}

/* ======================= SHARED HELPER ======================= */

// Shared across fees.go and student_controller.go
func getStudentEnrollment(c *gin.Context) (int64, error) {
	uidVal, ok := c.Get("user_id")
	if !ok {
		return 0, fmt.Errorf("unauthorized")
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
		return 0, fmt.Errorf("invalid user id")
	}

	var user models.User
	if err := config.DB.Where("user_id = ?", userID).First(&user).Error; err != nil {
		return 0, err
	}

	return strconv.ParseInt(user.Username, 10, 64)
}

func ptrString(s string) *string { return &s }

/* ======================= STRUCTS ======================= */

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

type DueFeeRecord struct {
	FeeDueID       int64   `json:"fee_due_id"`
	FeeType        string  `json:"fee_type"`
	FeeHead        string  `json:"fee_head"`
	OriginalAmount float64 `json:"original_amount"`
	AmountPaid     float64 `json:"amount_paid"`
	DueDate        string  `json:"due_date"`
	Status         string  `json:"status"`
}

/* ======================= GET STUDENT FEES SUMMARY ======================= */

func GetStudentFees(c *gin.Context) {
	enrollment, err := getStudentEnrollment(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := config.DB

	// Pending Dues
	var expected models.ExpectedFee
	dueItems := []DueFeeRecord{}

	if err := db.Where("enrollment_number = ?", enrollment).First(&expected).Error; err == nil {
		addDue := func(feeType, feeHead string, expectedAmt, paidAmt float64) {
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

		addDue("Registration", "Registration Fee", expected.ExpectedRegFee, expected.RegistrationFeePaid)
		addDue("Examination", "Examination Fee", expected.ExpectedExamFee, expected.ExamFeePaid)
	}

	// Full Payment History
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

	// Registration Fees
	var regFees []models.RegistrationFee
	db.Where("enrollment_number = ?", enrollment).Order("created_at DESC").Find(&regFees)
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

	// Examination Fees
	var examFees []models.ExaminationFee
	db.Where("enrollment_number = ?", enrollment).Order("created_at DESC").Find(&examFees)
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

	// Miscellaneous Fees
	var miscFees []models.MiscellaneousFee
	db.Where("enrollment_number = ?", enrollment).Order("created_at DESC").Find(&miscFees)
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

	c.JSON(http.StatusOK, gin.H{
		"dues":    dueItems,
		"history": history,
	})
}

/* ======================= RAZORPAY FLOW ======================= */

func RequestPayment(c *gin.Context) {
	enrollment, err := getStudentEnrollment(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Amount  float64 `json:"amount" binding:"required,gt=0"`
		FeeHead string  `json:"fee_head" binding:"required"`
		FeeType string  `json:"fee_type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	config.DB.Where("username = ?", strconv.FormatInt(enrollment, 10)).First(&user)
	studentName := "Student " + strconv.FormatInt(enrollment, 10)
	if user.FullName != "" {
		studentName = user.FullName
	}

	order, err := rzpClient.Order.Create(map[string]interface{}{
		"amount":   int(req.Amount * 100),
		"currency": "INR",
		"receipt":  fmt.Sprintf("fee_%d_%d", enrollment, time.Now().Unix()),
		"notes": map[string]string{
			"enrollment": strconv.FormatInt(enrollment, 10),
			"fee_head":   req.FeeHead,
			"fee_type":   req.FeeType,
		},
	}, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"order_id":    order["id"],
		"key_id":      RazorpayKeyID,
		"amount":      req.Amount,
		"name":        "Your Institute Name",
		"description": fmt.Sprintf("%s - Enrollment %d", req.FeeHead, enrollment),
		"prefill": gin.H{
			"name":  studentName,
			"email": user.Email,
		},
		"notes": gin.H{
			"enrollment": enrollment,
			"fee_head":   req.FeeHead,
			"fee_type":   req.FeeType,
		},
	})
}

func VerifyPaymentAndRecord(c *gin.Context) {
	var payload struct {
		RazorpayOrderID   string  `json:"razorpay_order_id" binding:"required"`
		RazorpayPaymentID string  `json:"razorpay_payment_id" binding:"required"`
		RazorpaySignature string  `json:"razorpay_signature" binding:"required"`
		Amount            float64 `json:"amount" binding:"required"`
		FeeHead           string  `json:"fee_head" binding:"required"`
		FeeType           string  `json:"fee_type" binding:"required"`
		Enrollment        int64   `json:"enrollment"` // 🔥 FIXED
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !utils.VerifyPaymentSignature(map[string]interface{}{
		"razorpay_order_id":   payload.RazorpayOrderID,
		"razorpay_payment_id": payload.RazorpayPaymentID,
	}, payload.RazorpaySignature, RazorpaySecret) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment signature"})
		return
	}

	db := config.DB
	now := time.Now()
	dateStr := now.Format("2006-01-02")

	amountPtr := &payload.Amount
	txnNoPtr := &payload.RazorpayPaymentID
	datePtr := &dateStr
	statusPtr := ptrString("Paid")

	switch payload.FeeHead {
	case "Registration Fee":
		db.Create(&models.RegistrationFee{
			EnrollmentNumber:  payload.Enrollment,
			FeeType:           &payload.FeeType,
			FeeAmount:         amountPtr,
			TransactionNumber: txnNoPtr,
			TransactionDate:   datePtr,
			PaymentStatus:     statusPtr,
		})
	case "Examination Fee":
		db.Create(&models.ExaminationFee{
			EnrollmentNumber: payload.Enrollment,
			FeeType:          &payload.FeeType,
			FeeAmount:        amountPtr,
			TransactionNo:    txnNoPtr,
			TransactionDate:  datePtr,
			PaymentStatus:    statusPtr,
		})
	case "Miscellaneous Fee":
		db.Create(&models.MiscellaneousFee{
			EnrollmentNumber: payload.Enrollment,
			FeeType:          &payload.FeeType,
			FeeAmount:        amountPtr,
			TransactionNo:    txnNoPtr,
			TransactionDate:  datePtr,
			PaymentStatus:    statusPtr,
		})
	}

	var expected models.ExpectedFee
	if err := db.Where("enrollment_number = ?", payload.Enrollment).First(&expected).Error; err == nil {
		updates := map[string]interface{}{
			"total_paid": expected.TotalPaid + payload.Amount,
		}
		if payload.FeeHead == "Examination Fee" {
			updates["exam_fee_paid"] = expected.ExamFeePaid + payload.Amount
		} else if payload.FeeHead == "Registration Fee" {
			updates["registration_fee_paid"] = expected.RegistrationFeePaid + payload.Amount
		}
		db.Model(&expected).Updates(updates)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Payment recorded successfully",
		"payment_id": payload.RazorpayPaymentID,
	})
}

func PayFee(c *gin.Context) {
	c.JSON(http.StatusBadRequest, gin.H{
		"error": "Use /fees/request-payment and /fees/verify-payment for payments",
	})
}
