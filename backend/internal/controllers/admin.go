package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"

	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
	"github.com/kiranraoboinapally/student/backend/internal/utils"
)

// ADMIN - AGGREGATED STATS FOR DASHBOARD
func GetAdminStats(c *gin.Context) {
	db := config.DB

	var totalInstitutes int64
	db.Model(&models.Institute{}).Count(&totalInstitutes)

	var totalStudents int64
	db.Model(&models.MasterStudent{}).Count(&totalStudents)

	// students per institute
	type InstCount struct {
		InstituteName string `json:"institute_name"`
		Count         int64  `json:"count"`
	}
	var studentsPerInstitute []InstCount
	db.Model(&models.MasterStudent{}).
		Select("COALESCE(institute_name,'') as institute_name, COUNT(*) as count").
		Group("institute_name").
		Scan(&studentsPerInstitute)

	// branches per institute (distinct course_name)
	type BranchCount struct {
		InstituteName string `json:"institute_name"`
		Branches      int64  `json:"branches"`
	}
	var branchesPerInstitute []BranchCount
	db.Raw(`SELECT COALESCE(institute_name,'') AS institute_name, COUNT(DISTINCT course_name) AS branches FROM master_students GROUP BY institute_name`).Scan(&branchesPerInstitute)

	// fees: sum of paid amounts across registration, exam, misc
	var regPaid, examPaid, miscPaid float64
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM registration_fees WHERE payment_status = ?", "Paid").Scan(&regPaid)
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM examination_fees WHERE payment_status = ?", "Paid").Scan(&examPaid)
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM miscellaneous_fees WHERE payment_status = ?", "Paid").Scan(&miscPaid)
	totalFeesPaid := regPaid + examPaid + miscPaid

	// expected vs paid (pending amount)
	var totalExpected, totalPaid float64
	db.Raw("SELECT COALESCE(SUM(total_expected_fee),0) FROM expected_fee_collections").Scan(&totalExpected)
	db.Raw("SELECT COALESCE(SUM(total_paid),0) FROM expected_fee_collections").Scan(&totalPaid)
	totalPending := totalExpected - totalPaid

	// passed out students (student_status contains pass)
	var passedCount int64
	db.Model(&models.MasterStudent{}).Where("student_status LIKE ?", "%pass%").Count(&passedCount)

	// students per branch
	type BranchStudents struct {
		CourseName string `json:"course_name"`
		Count      int64  `json:"count"`
	}
	var studentsPerBranch []BranchStudents
	db.Model(&models.MasterStudent{}).
		Select("COALESCE(course_name,'') as course_name, COUNT(*) as count").
		Group("course_name").
		Order("count desc").
		Scan(&studentsPerBranch)

	c.JSON(http.StatusOK, gin.H{
		"total_institutes":       totalInstitutes,
		"total_students":         totalStudents,
		"students_per_institute": studentsPerInstitute,
		"branches_per_institute": branchesPerInstitute,
		"total_fees_paid":        totalFeesPaid,
		"total_expected_fees":    totalExpected,
		"total_pending_fees":     totalPending,
		"passed_students_count":  passedCount,
		"students_per_branch":    studentsPerBranch,
	})
}

// ADMIN – STUDENT LIST (FROM EXISTING TABLES)

func GetStudents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	db := config.DB

	var students []models.MasterStudent
	var total int64

	db.Model(&models.MasterStudent{}).Count(&total)

	db.
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&students)

	c.JSON(http.StatusOK, gin.H{
		"data": students,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ADMIN – CREATE LOGIN ACCOUNT FOR STUDENT

type AdminCreateStudentUserRequest struct {
	EnrollmentNumber string `json:"enrollment_number" binding:"required"`
	Email            string `json:"email" binding:"required,email"`
	TempPassword     string `json:"temp_password" binding:"required,min=6"`
}

func CreateUserByAdmin(c *gin.Context) {
	var req AdminCreateStudentUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB

	// 1️⃣ Verify student exists
	var student models.MasterStudent
	if err := db.Where("enrollment_number = ?", req.EnrollmentNumber).
		First(&student).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student not found"})
		return
	}

	// 2️⃣ Check if user already exists
	var existing models.User
	if err := db.Where("username = ?", req.EnrollmentNumber).
		First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "login already exists"})
		return
	}

	// 3️⃣ Create user
	hashed, _ := utils.HashPassword(req.TempPassword)

	user := models.User{
		Username:       req.EnrollmentNumber,
		Email:          req.Email,
		FullName:       student.StudentName,
		PasswordHash:   hashed,
		RoleID:         5, // STUDENT
		Status:         "active",
		IsTempPassword: true,
		CreatedAt:      nil,
	}

	db.Create(&user)

	c.JSON(http.StatusCreated, gin.H{
		"message":  "student login created",
		"user_id":  user.UserID,
		"username": user.Username,
	})
}

// ADMIN – LIST ALL USERS (PAGINATED)

func GetAllUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	db := config.DB

	var users []models.User
	var total int64

	db.Model(&models.User{}).Count(&total)

	db.
		Select("user_id, username, email, full_name, role_id, status, created_at").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"data": users,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ADMIN – FEE PAYMENT HISTORY

func GetAllFeePaymentHistory(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	db := config.DB
	enrollment := c.Query("enrollment_number")

	var payments []models.FeePaymentDetail
	query := db.Model(&models.FeePaymentDetail{}).Order("payment_id desc")

	if enrollment != "" {
		enNum, err := strconv.ParseInt(enrollment, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment number"})
			return
		}
		query = query.Where("enrollment_number = ?", enNum)
	}

	var total int64
	query.Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch payments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_records": total,
		"payments":      payments,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ADMIN – UPLOAD / UPDATE STUDENT MARKS (UPSERT)

type UploadMarksRequest struct {
	Marks []struct {
		EnrollmentNumber int64   `json:"enrollment_number" binding:"required"`
		SubjectCode      string  `json:"subject_code" binding:"required"`
		Semester         int     `json:"semester" binding:"required"`
		MarksObtained    float64 `json:"marks_obtained" binding:"required"`
		Grade            *string `json:"grade"`
		Status           string  `json:"status" binding:"required"` // internal/external
	} `json:"marks" binding:"required"`
}

func UploadStudentMarks(c *gin.Context) {
	var req UploadMarksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var records []models.StudentMark

	for _, m := range req.Marks {

		// ✅ DECLARE subject
		var subject models.SubjectMaster

		// ✅ FETCH subject details
		if err := db.Where("subject_code = ?", m.SubjectCode).
			First(&subject).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "subject not found: " + m.SubjectCode,
			})
			return
		}

		records = append(records, models.StudentMark{
			EnrollmentNumber: m.EnrollmentNumber,
			Semester:         m.Semester,
			SubjectCode:      m.SubjectCode,
			SubjectName:      subject.SubjectName, // ✅ now defined
			SubjectType:      subject.SubjectType, // ✅ now defined
			MarksObtained:    m.MarksObtained,     // FIXED: Added this
			Grade:            m.Grade,
			Status:           m.Status,
			CreatedAt:        time.Now(),
		})
	}

	err := db.Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "enrollment_number"},
			{Name: "semester"},
			{Name: "subject_code"},
		},
		DoUpdates: clause.AssignmentColumns(
			[]string{"marks_obtained", "grade", "status"}, // FIXED: Added marks_obtained
		),
	}).Create(&records).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Notify connected admins in real-time
	SendAdminNotification("marks_uploaded", gin.H{
		"total_records": len(records),
		"summary":       "Marks uploaded/updated",
	})

	c.JSON(http.StatusOK, gin.H{
		"message":       "marks uploaded successfully",
		"total_records": len(records),
	})
}

// ================= ADMIN – PENDING REGISTRATIONS =================

// GET /api/admin/pending-registrations
func GetPendingRegistrations(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	db := config.DB

	var users []models.User
	var total int64

	query := db.Model(&models.User{}).Where("status = ? AND role_id = ?", "inactive", 5)
	query.Count(&total)

	if err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch inactive registrations",
		})
		return
	}

	response := make([]gin.H, 0)
	for _, u := range users {
		response = append(response, gin.H{
			"user_id":    u.UserID,
			"username":   u.Username,
			"email":      u.Email,
			"full_name":  u.FullName,
			"status":     u.Status,
			"created_at": u.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"pending_registrations": response,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ================= ADMIN – APPROVE / REJECT REGISTRATION =================

// POST /api/admin/approve-registration
func ApproveRegistration(c *gin.Context) {
	var req struct {
		UserID int64  `json:"user_id" binding:"required"`
		Action string `json:"action" binding:"required"` // approve | reject
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Action != "approve" && req.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "action must be approve or reject",
		})
		return
	}

	newStatus := "active"
	if req.Action == "reject" {
		newStatus = "rejected"
	}

	db := config.DB
	if err := db.Model(&models.User{}).
		Where("user_id = ? AND status = ?", req.UserID, "inactive").
		Update("status", newStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to update user status",
		})
		return
	}

	// Notify admins about approve/reject action
	SendAdminNotification("registration_status_changed", gin.H{
		"user_id": req.UserID,
		"status":  newStatus,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "registration " + req.Action + "d successfully",
		"user_id": req.UserID,
		"status":  newStatus,
	})
}

// GET /api/admin/institutes/:id/detail
func GetInstituteDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid institute id"})
		return
	}

	db := config.DB
	var inst models.Institute
	if err := db.Where("institute_id = ?", id).First(&inst).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "institute not found"})
		return
	}

	instName := inst.InstituteName

	// total students
	var totalStudents int64
	db.Model(&models.MasterStudent{}).Where("institute_name = ?", instName).Count(&totalStudents)

	// students per branch/course
	type BranchCount struct {
		CourseName string `json:"course_name"`
		Count      int64  `json:"count"`
	}
	var branches []BranchCount
	db.Model(&models.MasterStudent{}).
		Select("COALESCE(course_name,'') as course_name, COUNT(*) as count").
		Where("institute_name = ?", instName).
		Group("course_name").
		Scan(&branches)

	// fees paid & pending for this institute
	var regPaid, examPaid, miscPaid float64
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM registration_fees WHERE payment_status = ? AND enrollment_number IN (SELECT enrollment_number FROM master_students WHERE institute_name = ?)", "Paid", instName).Scan(&regPaid)
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM examination_fees WHERE payment_status = ? AND enrollment_number IN (SELECT enrollment_number FROM master_students WHERE institute_name = ?)", "Paid", instName).Scan(&examPaid)
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM miscellaneous_fees WHERE payment_status = ? AND enrollment_number IN (SELECT enrollment_number FROM master_students WHERE institute_name = ?)", "Paid", instName).Scan(&miscPaid)
	totalPaid := regPaid + examPaid + miscPaid

	// pending via expected_fee_collections
	var totalExpected, totalPaidExp float64
	db.Raw("SELECT COALESCE(SUM(total_expected_fee),0) FROM expected_fee_collections WHERE enrollment_number IN (SELECT enrollment_number FROM master_students WHERE institute_name = ?)", instName).Scan(&totalExpected)
	db.Raw("SELECT COALESCE(SUM(total_paid),0) FROM expected_fee_collections WHERE enrollment_number IN (SELECT enrollment_number FROM master_students WHERE institute_name = ?)", instName).Scan(&totalPaidExp)
	pending := totalExpected - totalPaidExp

	c.JSON(http.StatusOK, gin.H{
		"institute":      inst,
		"total_students": totalStudents,
		"branches":       branches,
		"fees_paid":      totalPaid,
		"expected_fees":  totalExpected,
		"pending_fees":   pending,
	})
}

// POST /api/admin/fee-structure
func CreateFeeStructure(c *gin.Context) {
	var payload struct {
		CourseName     *string `json:"course_name"`
		Session        *string `json:"session"`
		Batch          *string `json:"batch"`
		ProgramPattern *string `json:"program_pattern"`
		FeeAmount      float64 `json:"fee_amount" binding:"required"`
		EffectiveFrom  *string `json:"effective_from"`
		EffectiveTo    *string `json:"effective_to"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fs := models.FeeStructure{
		CourseName:     payload.CourseName,
		Session:        payload.Session,
		Batch:          payload.Batch,
		ProgramPattern: payload.ProgramPattern,
		FeeAmount:      payload.FeeAmount,
		Status:         "active",
	}
	db := config.DB
	if err := db.Create(&fs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create fee structure"})
		return
	}

	SendAdminNotification("fee_structure_created", gin.H{"id": fs.FeeStructureID, "fee_amount": fs.FeeAmount})

	c.JSON(http.StatusCreated, gin.H{"message": "fee structure created", "id": fs.FeeStructureID})
}

// POST /api/admin/fees/due
func CreateFeeDue(c *gin.Context) {
	var payload struct {
		EnrollmentNumber int64   `json:"enrollment_number" binding:"required"`
		FeeHead          string  `json:"fee_head" binding:"required"`
		OriginalAmount   float64 `json:"original_amount" binding:"required"`
		DueDate          string  `json:"due_date"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fd := models.FeeDue{
		StudentID:      int(payload.EnrollmentNumber),
		FeeHead:        payload.FeeHead,
		OriginalAmount: payload.OriginalAmount,
		AmountPaid:     0,
		Status:         "Pending",
		CreatedAt:      time.Now(),
	}
	db := config.DB
	if err := db.Create(&fd).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create fee due"})
		return
	}

	SendAdminNotification("fee_due_created", gin.H{"fee_due_id": fd.FeeDueID, "enrollment": payload.EnrollmentNumber})

	c.JSON(http.StatusCreated, gin.H{"message": "fee due created", "fee_due_id": fd.FeeDueID})
}

// POST /api/admin/attendance/upload
func UploadAttendance(c *gin.Context) {
	var payload struct {
		Records []struct {
			EnrollmentNumber int64  `json:"enrollment_number" binding:"required"`
			Date             string `json:"date" binding:"required"`
			Present          bool   `json:"present"`
			SubjectCode      string `json:"subject_code"`
		} `json:"records" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var records []models.Attendance
	for _, r := range payload.Records {
		parsed, _ := time.Parse("2006-01-02", r.Date)
		var sc *string
		if r.SubjectCode != "" {
			sc = &r.SubjectCode
		}
		records = append(records, models.Attendance{
			EnrollmentNumber: r.EnrollmentNumber,
			Date:             parsed,
			Present:          r.Present,
			SubjectCode:      sc,
			CreatedAt:        time.Now(),
		})
	}

	if err := db.Create(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save attendance"})
		return
	}

	SendAdminNotification("attendance_uploaded", gin.H{"count": len(records)})

	c.JSON(http.StatusOK, gin.H{"message": "attendance uploaded", "count": len(records)})
}

// GET /api/admin/attendance/summary
func GetAttendanceSummary(c *gin.Context) {
	instituteID := c.Query("institute_id")
	instituteName := c.Query("institute_name")

	db := config.DB

	var where string
	var args []interface{}
	if instituteName != "" {
		where = "institute_name = ?"
		args = append(args, instituteName)
	} else if instituteID != "" {
		where = "institute_id = ?"
		args = append(args, instituteID)
	}

	// total attendance records, present, absent
	var total, present int64
	if where != "" {
		db.Table("attendance").Joins("JOIN master_students ON attendance.enrollment_number = master_students.enrollment_number").Where(where, args...).Count(&total)
		db.Table("attendance").Joins("JOIN master_students ON attendance.enrollment_number = master_students.enrollment_number").Where(where+" AND attendance.present = ?", append(args, true)...).Count(&present)
	} else {
		db.Model(&models.Attendance{}).Count(&total)
		db.Model(&models.Attendance{}).Where("present = ?", true).Count(&present)
	}

	absent := total - present
	var percent float64
	if total > 0 {
		percent = (float64(present) / float64(total)) * 100
	}

	c.JSON(http.StatusOK, gin.H{"total_records": total, "present": present, "absent": absent, "attendance_percent": percent})
}
