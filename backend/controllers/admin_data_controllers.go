package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
)

// =======================================================
// ADMIN FEE CREATION (Registration & Examination)
// =======================================================

type CreateFeeRequest struct {
	EnrollmentNumber int64   `json:"enrollment_number" binding:"required"`
	FeeType          string  `json:"fee_type" binding:"required,oneof=REGISTRATION EXAMINATION"`
	FeeAmount        float64 `json:"fee_amount" binding:"required,gt=0"`
	Semester         int     `json:"semester" binding:"required"`
}

// Helper to fetch student details for fee creation
func getStudentDetailsForFee(enrollmentNumber int64) (*models.MasterStudent, error) {
	db := config.DB
	var master models.MasterStudent
	if err := db.Where("enrollment_number = ?", enrollmentNumber).First(&master).Error; err != nil {
		return nil, fmt.Errorf("student with enrollment number %d not found in master records", enrollmentNumber)
	}
	return &master, nil
}

// Controller to create a new fee record
func CreateFee(c *gin.Context) {
	var req CreateFeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	master, err := getStudentDetailsForFee(req.EnrollmentNumber)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	db := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			db.Rollback()
		}
	}()

	if req.FeeType == "REGISTRATION" {
		fee := models.RegistrationFee{
			EnrollmentNumber: req.EnrollmentNumber,
			InstituteName:    master.InstituteName,
			CourseName:       master.CourseName,
			Semester:         &req.Semester,
			StudentName:      &master.StudentName,
			FeeType:          &req.FeeType,
			FeeAmount:        &req.FeeAmount,
			PaymentStatus:    ptrString("PENDING"),
			CreatedAt:        ptrString(time.Now().Format("2006-01-02 15:04:05")),
		}
		if err := db.Create(&fee).Error; err != nil {
			db.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create registration fee record"})
			return
		}
	} else if req.FeeType == "EXAMINATION" {
		fee := models.ExaminationFee{
			EnrollmentNumber: req.EnrollmentNumber,
			FeeType:          &req.FeeType,
			FeeAmount:        &req.FeeAmount,
			PaymentStatus:    ptrString("PENDING"),
			CreatedAt:        ptrString(time.Now().Format("2006-01-02 15:04:05")),
		}
		if err := db.Create(&fee).Error; err != nil {
			db.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create examination fee record"})
			return
		}
	}

	feeDue := models.FeeDue{
		StudentID:      int(master.StudentID),
		FeeTypeID:      0, // Set correct FeeTypeID if available
		FeeHead:        req.FeeType + " FEE",
		DueDate:        time.Now().AddDate(0, 0, 30), // 30 days from now
		OriginalAmount: req.FeeAmount,
		AmountPaid:     0,
		Status:         "DUE",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := db.Create(&feeDue).Error; err != nil {
		db.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create fee due record"})
		return
	}

	db.Commit()
	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("%s fee of %.2f created successfully for %d", req.FeeType, req.FeeAmount, req.EnrollmentNumber)})
}

// =======================================================
// ADMIN ATTENDANCE RECORDING
// =======================================================

type AttendanceRecord struct {
	AttendanceID     int64     `gorm:"column:attendance_id;primaryKey;autoIncrement"`
	EnrollmentNumber int64     `gorm:"column:enrollment_number"`
	SubjectCode      string    `gorm:"column:subject_code"`
	ClassDate        time.Time `gorm:"column:class_date"`
	Status           string    `gorm:"column:status"`
}

func (AttendanceRecord) TableName() string { return "attendance" }

type AttendanceEntry struct {
	EnrollmentNumber int64  `json:"enrollment_number" binding:"required"`
	Status           string `json:"status" binding:"required,oneof=present absent"`
}

type RecordAttendanceRequest struct {
	SubjectCode string            `json:"subject_code" binding:"required"`
	ClassDate   time.Time         `json:"class_date" binding:"required"`
	Attendance  []AttendanceEntry `json:"attendance" binding:"required,min=1"`
}

func RecordAttendance(c *gin.Context) {
	var req RecordAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			db.Rollback()
		}
	}()

	var records []AttendanceRecord
	for _, entry := range req.Attendance {
		records = append(records, AttendanceRecord{
			EnrollmentNumber: entry.EnrollmentNumber,
			SubjectCode:      req.SubjectCode,
			ClassDate:        req.ClassDate,
			Status:           entry.Status,
		})
	}

	if err := db.CreateInBatches(&records, 100).Error; err != nil {
		db.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record attendance"})
		return
	}

	db.Commit()
	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Attendance recorded for %d students for subject %s on %s", len(records), req.SubjectCode, req.ClassDate.Format("2006-01-02"))})
}

// =======================================================
// ADMIN MARKS UPLOAD
// =======================================================

type UploadMarkEntry struct {
	EnrollmentNumber int64   `json:"enrollment_number" binding:"required"`
	MarksObtained    float64 `json:"marks_obtained" binding:"required"`
	Grade            string  `json:"grade"`
}

type UploadMarksRequest struct {
	SubjectCode string            `json:"subject_code" binding:"required"`
	Semester    int               `json:"semester" binding:"required"`
	MarksType   string            `json:"marks_type" binding:"required"` // e.g., "Internal", "External", "Sessional"
	Marks       []UploadMarkEntry `json:"marks" binding:"required,min=1"`
}

func UploadStudentMarks(c *gin.Context) {
	var req UploadMarksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			db.Rollback()
		}
	}()

	var marksRecords []models.StudentMark
	for _, entry := range req.Marks {
		marksRecords = append(marksRecords, models.StudentMark{
			EnrollmentNumber: entry.EnrollmentNumber,
			Semester:         req.Semester,
			SubjectCode:      req.SubjectCode,
			TotalMarks:       entry.MarksObtained,
			Grade:            &entry.Grade,
			Status:           req.MarksType, // using Status field for MarksType
			CreatedAt:        time.Now(),
		})
	}

	if err := db.CreateInBatches(&marksRecords, 100).Error; err != nil {
		db.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload student marks"})
		return
	}

	db.Commit()
	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Marks uploaded for %d students for subject %s (Semester %d)", len(marksRecords), req.SubjectCode, req.Semester)})
}

// =======================================================
// Helper Functions
// =======================================================

func ptrString(s string) *string {
	return &s
}
