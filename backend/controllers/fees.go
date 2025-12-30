// controllers/fees.go - FULLY UPDATED & FIXED VERSION (COMPLETED TRUNCATED PART)

package controllers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
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

/* ======================= HELPERS ======================= */

// getStudentEnrollment is the base helper, kept for clarity.
func getStudentEnrollment(c *gin.Context) (int64, error) {
	uidVal, ok := c.Get("user_id")
	if !ok {
		return 0, fmt.Errorf("unauthorized")
	}

	var userID int64
	switch v := uidVal.(type) {
	case int64:
		userID = v
	case int:
		userID = int64(v)
	case float64:
		userID = int64(v)
	default:
		return 0, fmt.Errorf("invalid user id")
	}

	var user models.User
	if err := config.DB.Where("user_id = ?", userID).First(&user).Error; err != nil {
		return 0, err
	}

	// Assuming username is the enrollment number (string representation of int64)
	return strconv.ParseInt(user.Username, 10, 64)
}

// getEnrollmentOrError is the simplified helper, centralizing auth/setup without
// redundantly returning the global DB instance.
func getEnrollmentOrError(c *gin.Context) (int64, error) {
	enrollment, err := getStudentEnrollment(c)
	if err != nil {
		return 0, err
	}
	return enrollment, nil
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

/* ======================= GET STUDENT FEES ======================= */

func GetStudentFees(c *gin.Context) {
	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := config.DB // Use DB directly

	/* ---------- DUES ---------- */
	var expected models.ExpectedFee
	dues := []DueFeeRecord{}

	if err := db.Where("enrollment_number = ?", enrollment).First(&expected).Error; err == nil {
		if bal := expected.ExpectedRegFee - expected.RegistrationFeePaid; bal > 0 {
			dues = append(dues, DueFeeRecord{
				FeeType:        "Registration",
				FeeHead:        "Registration Fee",
				OriginalAmount: expected.ExpectedRegFee,
				AmountPaid:     expected.RegistrationFeePaid,
				DueDate:        time.Now().AddDate(0, 3, 0).Format("2006-01-02"),
				Status:         "Pending",
			})
		}
		if bal := expected.ExpectedExamFee - expected.ExamFeePaid; bal > 0 {
			dues = append(dues, DueFeeRecord{
				FeeType:        "Examination",
				FeeHead:        "Examination Fee",
				OriginalAmount: expected.ExpectedExamFee,
				AmountPaid:     expected.ExamFeePaid,
				DueDate:        time.Now().AddDate(0, 3, 0).Format("2006-01-02"),
				Status:         "Pending",
			})
		}
	}

	/* ---------- PAYMENTS ---------- */ // FIXED: Completed truncated part
	payments := []UnifiedFeeRecord{}

	var registration []models.RegistrationFee
	if err := db.Where("enrollment_number = ?", enrollment).Order("transaction_date desc").Find(&registration).Error; err == nil {
		for _, r := range registration {
			createdAtStr := ""
			if r.CreatedAt != nil {
				createdAtStr = *r.CreatedAt
			}
			payments = append(payments, UnifiedFeeRecord{
				ID:              r.RegnFeeID,
				Type:            "Registration",
				Head:            "Registration Fee",
				OriginalAmount:  safeFloat(r.FeeAmount),
				AmountPaid:      safeFloat(r.FeeAmount),
				TransactionNo:   safeString(r.TransactionNumber),
				TransactionDate: safeString(r.TransactionDate),
				Status:          safeString(r.PaymentStatus),
				CreatedAt:       createdAtStr,
			})
		}
	}

	var examination []models.ExaminationFee
	if err := db.Where("enrollment_number = ?", enrollment).Order("transaction_date desc").Find(&examination).Error; err == nil {
		for _, e := range examination {
			createdAtStr := ""
			if e.CreatedAt != nil {
				createdAtStr = *e.CreatedAt
			}
			payments = append(payments, UnifiedFeeRecord{
				ID:              e.ExamFeeID,
				Type:            "Examination",
				Head:            "Examination Fee",
				OriginalAmount:  safeFloat(e.FeeAmount),
				AmountPaid:      safeFloat(e.FeeAmount),
				TransactionNo:   safeString(e.TransactionNo),
				TransactionDate: safeString(e.TransactionDate),
				Status:          safeString(e.PaymentStatus),
				CreatedAt:       createdAtStr,
			})
		}
	}

	var miscellaneous []models.MiscellaneousFee
	if err := db.Where("enrollment_number = ?", enrollment).Order("transaction_date desc").Find(&miscellaneous).Error; err == nil {
		for _, m := range miscellaneous {
			createdAtStr := ""
			if m.CreatedAt != nil {
				createdAtStr = *m.CreatedAt
			}
			payments = append(payments, UnifiedFeeRecord{
				ID:              m.MiscFeeID,
				Type:            "Miscellaneous",
				Head:            "Miscellaneous Fee",
				OriginalAmount:  safeFloat(m.FeeAmount),
				AmountPaid:      safeFloat(m.FeeAmount),
				TransactionNo:   safeString(m.TransactionNo),
				TransactionDate: safeString(m.TransactionDate),
				Status:          safeString(m.PaymentStatus),
				CreatedAt:       createdAtStr,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"dues":     dues,
		"payments": payments,
	})
}

// Safe helpers
func safeString(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}

func safeFloat(ptr *float64) float64 {
	if ptr == nil {
		return 0
	}
	return *ptr
}

/* ======================= REQUEST PAYMENT ======================= */

type RequestPaymentRequest struct {
	Amount  float64 `json:"amount" binding:"required,gt=0"`
	FeeHead string  `json:"fee_head" binding:"required"` // Registration Fee, Examination Fee, etc.
	FeeType string  `json:"fee_type" binding:"required"` // Regular, Late, etc.
}

func RequestPayment(c *gin.Context) {
	var req RequestPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	enrollment, err := getEnrollmentOrError(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := config.DB
	var user models.User
	if err := db.Where("username = ?", strconv.FormatInt(enrollment, 10)).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var master models.MasterStudent
	instituteName := "Your Institute" // Default
	studentName := user.FullName
	contact := ""
	if err := db.Where("enrollment_number = ?", enrollment).First(&master).Error; err == nil {
		if master.InstituteName != nil && strings.TrimSpace(*master.InstituteName) != "" {
			instituteName = strings.TrimSpace(*master.InstituteName)
		}
		if master.StudentPhoneNumber != nil {
			contact = *master.StudentPhoneNumber
		}
		studentName = master.StudentName
	}

	// Create Razorpay order
	order, err := rzpClient.Order.Create(map[string]interface{}{
		"amount":   int(req.Amount * 100),
		"currency": "INR",
		"receipt":  fmt.Sprintf("fee_%d_%d", enrollment, time.Now().Unix()),
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
		"name":        instituteName,
		"description": req.FeeHead,
		"prefill": gin.H{
			"name":    studentName,
			"email":   user.Email,
			"contact": contact,
		},
	})
}

/* ======================= VERIFY PAYMENT - SUPPORTS PARTIAL PAYMENTS ======================= */

func VerifyPaymentAndRecord(c *gin.Context) {
	var payload struct {
		RazorpayOrderID   string  `json:"razorpay_order_id" binding:"required"`
		RazorpayPaymentID string  `json:"razorpay_payment_id" binding:"required"`
		RazorpaySignature string  `json:"razorpay_signature" binding:"required"`
		Amount            float64 `json:"amount" binding:"required,gt=0"`
		FeeHead           string  `json:"fee_head" binding:"required"`
		FeeType           string  `json:"fee_type" binding:"required"`
		Enrollment        int64   `json:"enrollment" binding:"required"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !utils.VerifyPaymentSignature(map[string]interface{}{
		"razorpay_order_id":   payload.RazorpayOrderID,
		"razorpay_payment_id": payload.RazorpayPaymentID,
	}, payload.RazorpaySignature, RazorpaySecret) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		return
	}

	db := config.DB
	now := time.Now().Format("2006-01-02")
	status := ptrString("Paid")

	// Record payment in respective table
	switch payload.FeeHead {
	case "Registration Fee":
		db.Create(&models.RegistrationFee{
			EnrollmentNumber:  payload.Enrollment,
			FeeType:           &payload.FeeType,
			FeeAmount:         &payload.Amount,
			TransactionNumber: &payload.RazorpayPaymentID,
			TransactionDate:   &now,
			PaymentStatus:     status,
		})
	case "Examination Fee":
		db.Create(&models.ExaminationFee{
			EnrollmentNumber: payload.Enrollment,
			FeeType:          &payload.FeeType,
			FeeAmount:        &payload.Amount,
			TransactionNo:    &payload.RazorpayPaymentID,
			TransactionDate:  &now,
			PaymentStatus:    status,
		})
	case "Miscellaneous Fee":
		db.Create(&models.MiscellaneousFee{
			EnrollmentNumber: payload.Enrollment,
			FeeType:          &payload.FeeType,
			FeeAmount:        &payload.Amount,
			TransactionNo:    &payload.RazorpayPaymentID,
			TransactionDate:  &now,
			PaymentStatus:    status,
		})
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid fee head"})
		return
	}

	// UPDATE ExpectedFee FOR PARTIAL PAYMENTS - THIS IS THE KEY FIX
	var expected models.ExpectedFee
	if err := db.Where("enrollment_number = ?", payload.Enrollment).First(&expected).Error; err == nil {
		updates := map[string]interface{}{
			"total_paid": expected.TotalPaid + payload.Amount,
		}

		if payload.FeeHead == "Registration Fee" {
			updates["registration_fee_paid"] = expected.RegistrationFeePaid + payload.Amount
		} else if payload.FeeHead == "Examination Fee" {
			updates["exam_fee_paid"] = expected.ExamFeePaid + payload.Amount
		}

		db.Model(&expected).Updates(updates)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Payment verified and recorded",
		"payment_id": payload.RazorpayPaymentID,
	})
}

/* ======================= BLOCK DIRECT PAY ======================= */

func PayFee(c *gin.Context) {
	c.JSON(http.StatusBadRequest, gin.H{
		"error": "Use /fees/request-payment and /fees/verify-payment",
	})
}
