package controllers

import (
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"

	"github.com/kiranraoboinapally/student/backend/internal/config"
	"github.com/kiranraoboinapally/student/backend/internal/models"
	"github.com/kiranraoboinapally/student/backend/internal/utils"
)

// ======================== ADMIN DASHBOARD STATS ========================
func GetAdminStats(c *gin.Context) {
	db := config.DB

	var (
		totalInstitutes             int64
		totalStudents               int64
		totalActiveStudents         int64
		totalCourses                int64
		passedCount                 int64
		regPaid, examPaid, miscPaid float64
		totalExpected, totalPaidExp float64
	)

	// Total Institutes
	db.Model(&models.Institute{}).Count(&totalInstitutes)

	// Total Students
	db.Model(&models.MasterStudent{}).Count(&totalStudents)

	// Active Students
	db.Model(&models.MasterStudent{}).
		Where("student_status = ?", "active").
		Count(&totalActiveStudents)

	// Unique Courses
	db.Raw(`
		SELECT COUNT(DISTINCT course_name)
		FROM master_students
		WHERE course_name IS NOT NULL AND course_name != ''
	`).Scan(&totalCourses)

	// Passed/Graduated Students
	db.Model(&models.MasterStudent{}).
		Where("LOWER(student_status) IN (?)", []string{"passed", "completed", "graduated", "passed out"}).
		Count(&passedCount)

	// Fees Paid
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM registration_fees WHERE payment_status = ?", "Paid").Scan(&regPaid)
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM examination_fees WHERE payment_status = ?", "Paid").Scan(&examPaid)
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM miscellaneous_fees WHERE payment_status = ?", "Paid").Scan(&miscPaid)
	totalFeesPaid := regPaid + examPaid + miscPaid

	// Expected vs Pending Fees
	db.Raw("SELECT COALESCE(SUM(total_expected_fee),0) FROM expected_fee_collections").Scan(&totalExpected)
	db.Raw("SELECT COALESCE(SUM(total_paid),0) FROM expected_fee_collections").Scan(&totalPaidExp)
	totalPending := totalExpected - totalPaidExp

	c.JSON(http.StatusOK, gin.H{
		"total_institutes":      totalInstitutes,
		"total_students":        totalStudents,
		"total_active_students": totalActiveStudents,
		"total_courses":         totalCourses,
		"passed_students_count": passedCount,
		"total_fees_paid":       totalFeesPaid,
		"total_expected_fees":   totalExpected,
		"total_pending_fees":    totalPending,
	})
}

func GetStudents(c *gin.Context) {
	db := config.DB

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	// Filters
	instituteIDStr := c.Query("institute_id")
	courseName := strings.TrimSpace(c.Query("course_id")) // now treated as course_name
	search := strings.TrimSpace(c.Query("search"))

	query := db.Model(&models.MasterStudent{})

	// 1. Institute filter: lookup institute_name from institute_id
	if instituteIDStr != "" {
		if instituteID, err := strconv.ParseInt(instituteIDStr, 10, 64); err == nil && instituteID > 0 {
			var instituteName string
			err := db.Table("institutes").
				Select("institute_name").
				Where("institute_id = ?", instituteID).
				Scan(&instituteName).Error

			if err != nil || instituteName == "" {
				// Invalid institute → return empty result early
				c.JSON(http.StatusOK, gin.H{
					"students": []models.MasterStudent{},
					"pagination": gin.H{
						"page":        page,
						"limit":       limit,
						"total":       0,
						"total_pages": 0,
					},
				})
				return
			}

			query = query.Where("institute_name = ?", instituteName)
		}
	}

	// 2. Course filter: now it's course_name (string), not course_id
	if courseName != "" {
		// URL-decode the course name (since spaces become +)
		decodedCourseName, _ := url.QueryUnescape(courseName)
		query = query.Where("course_name = ?", decodedCourseName)
	}

	// 3. Search filter
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where(`
			LOWER(student_name) LIKE ? OR
			LOWER(student_email_id) LIKE ? OR
			LOWER(CAST(enrollment_number AS CHAR)) LIKE ?
		`, like, like, like)
	}

	// Count total
	var total int64
	query.Count(&total)

	// Fetch students
	var students []models.MasterStudent = []models.MasterStudent{} // ← initialize to avoid nil → null

	query.
		Order("student_name ASC").
		Limit(limit).
		Offset(offset).
		Find(&students)

	c.JSON(http.StatusOK, gin.H{
		"students": students, // now always [] if empty, never null
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}
func GetCoursesByInstitute(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "institute_id required"})
		return
	}

	instituteID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || instituteID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid institute_id"})
		return
	}

	db := config.DB

	type CourseSummary struct {
		Name           string  `json:"name"`
		StudentCount   int64   `json:"student_count"`
		ProgramPattern *string `json:"program_pattern,omitempty"`
		DurationYears  *int    `json:"duration_years,omitempty"`
	}

	// First: Get the institute_name from institutes table using institute_id
	var instituteName string
	err = db.Table("institutes").
		Select("institute_name").
		Where("institute_id = ?", instituteID).
		Scan(&instituteName).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "institute not found or DB error"})
		return
	}

	if instituteName == "" {
		// Institute exists but name is empty? Or not found
		c.JSON(http.StatusOK, gin.H{"courses": []CourseSummary{}})
		return
	}

	// Now query master_students using the string institute_name
	var courses []CourseSummary = []CourseSummary{}

	err = db.Table("master_students").
		Select(`
			course_name AS name,
			COUNT(*) AS student_count,
			MAX(program_pattern) AS program_pattern,
			MAX(program_duration) AS duration_years
		`).
		Where("institute_name = ? AND course_name IS NOT NULL AND TRIM(course_name) != ''", instituteName).
		Group("course_name").
		Order("course_name ASC").
		Scan(&courses).Error

	if err != nil {
		// Log this in production! But for now, just return empty
		fmt.Printf("Error scanning courses for institute %d (%s): %v\n", instituteID, instituteName, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch courses"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"courses": courses, // Will be [] if no courses
	})
}

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
	var student models.MasterStudent

	if err := db.Where("enrollment_number = ?", req.EnrollmentNumber).First(&student).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student not found"})
		return
	}

	var existing models.User
	if db.Where("username = ?", req.EnrollmentNumber).First(&existing).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "login already exists"})
		return
	}

	hashed, _ := utils.HashPassword(req.TempPassword)
	user := models.User{
		Username:       req.EnrollmentNumber,
		Email:          req.Email,
		FullName:       student.StudentName,
		PasswordHash:   hashed,
		RoleID:         5, // Student
		Status:         "active",
		IsTempPassword: true,
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "student login created",
		"user_id":  user.UserID,
		"username": user.Username,
	})
}

// ======================== INSTITUTE USER CREATION ========================
type AdminCreateInstituteUserRequest struct {
	InstituteID  int    `json:"institute_id" binding:"required"`
	Username     string `json:"username" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	FullName     string `json:"full_name" binding:"required"`
	RoleID       int    `json:"role_id" binding:"required"` // 3=Institute Admin, 2=Faculty
	TempPassword string `json:"temp_password" binding:"required,min=6"`
}

func CreateInstituteUser(c *gin.Context) {
	var req AdminCreateInstituteUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate Role (Only allow Institute Admin or Faculty for now)
	if req.RoleID != 3 && req.RoleID != 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Use 3 for Institute Admin, 2 for Faculty."})
		return
	}

	db := config.DB
	
	// Check Institute Exists
	var institute models.Institute
	if err := db.First(&institute, req.InstituteID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Institute not found"})
		return
	}

	// Check Username Exists
	var existing models.User
	if db.Where("username = ?", req.Username).First(&existing).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
		return
	}

	hashed, _ := utils.HashPassword(req.TempPassword)
	user := models.User{
		Username:       req.Username,
		Email:          req.Email,
		FullName:       req.FullName,
		PasswordHash:   hashed,
		RoleID:         req.RoleID,
		InstituteID:    &req.InstituteID,
		Status:         "active",
		IsTempPassword: true,
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Institute user created successfully",
		"user_id":  user.UserID,
		"username": user.Username,
		"role_id":  user.RoleID,
		"institute": institute.InstituteName,
	})
}

func GetAllUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	db := config.DB
	var users []models.User
	var total int64

	db.Model(&models.User{}).Count(&total)
	db.Select("user_id, username, email, full_name, role_id, status, created_at").
		Order("created_at DESC").
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

// ======================== FEE PAYMENT HISTORY ========================
type UnifiedPayment struct {
	PaymentID       int64    `json:"payment_id"`
	EnrollmentNo    *int64   `json:"enrollment_number"`
	StudentName     *string  `json:"student_name"`
	FeeAmount       *float64 `json:"fee_amount"`
	TransactionNo   *string  `json:"transaction_number"`
	TransactionDate *string  `json:"transaction_date"`
	Status          *string  `json:"status"`
	DisplayStatus   string   `json:"display_status"`
	Source          string   `json:"source"`
	InstituteName   *string  `json:"institute_name"`
	CourseName      *string  `json:"course_name"`
	ProgramPattern  *string  `json:"program_pattern"`
}

func GetAllFeePaymentHistory(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	db := config.DB

	// Filters
	enrollmentFilter := c.Query("enrollment_number")
	instituteFilter := strings.TrimSpace(c.Query("institute_name"))
	statusFilter := strings.TrimSpace(c.Query("status"))
	sourceFilter := strings.TrimSpace(c.Query("source"))

	var enNum int64
	hasEnrollmentFilter := enrollmentFilter != ""
	if hasEnrollmentFilter {
		val, err := strconv.ParseInt(enrollmentFilter, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment number"})
			return
		}
		enNum = val
	}

	mapDisplayStatus := func(s *string) string {
		if s == nil {
			return "unknown"
		}
		v := strings.ToLower(strings.TrimSpace(*s))
		switch {
		case strings.Contains(v, "success") || strings.Contains(v, "verified"):
			return "verified"
		case strings.Contains(v, "paid"):
			return "needs_verification"
		case strings.Contains(v, "pending"):
			return "pending"
		case strings.Contains(v, "failed") || strings.Contains(v, "error"):
			return "failed"
		default:
			return v
		}
	}

	var results []UnifiedPayment

	fetchFrom := func(table, idCol, nameCol, amountCol, txnCol, dateCol, statusCol, source string) error {
		if sourceFilter != "" && sourceFilter != source {
			return nil
		}

		rows, err := db.Table(table).
			Select(idCol + " AS payment_id, enrollment_number, " + nameCol + " AS student_name, " +
				amountCol + " AS fee_amount, " + txnCol + " AS transaction_number, " +
				dateCol + " AS transaction_date, " + statusCol + " AS status").
			Rows()
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var up UnifiedPayment
			if err := rows.Scan(&up.PaymentID, &up.EnrollmentNo, &up.StudentName, &up.FeeAmount,
				&up.TransactionNo, &up.TransactionDate, &up.Status); err != nil {
				continue
			}

			up.Source = source
			up.DisplayStatus = mapDisplayStatus(up.Status)

			if statusFilter != "" && strings.ToLower(statusFilter) != up.DisplayStatus {
				continue
			}
			if hasEnrollmentFilter && (up.EnrollmentNo == nil || *up.EnrollmentNo != enNum) {
				continue
			}

			results = append(results, up)
		}
		return nil
	}

	tables := []struct {
		table, idCol, nameCol, amountCol, txnCol, dateCol, statusCol, source string
	}{
		{"registration_fees", "regn_fee_id", "student_name", "COALESCE(fee_amount,0)", "transaction_number", "transaction_date", "payment_status", "registration"},
		{"examination_fees", "exam_fee_id", "student_name", "COALESCE(fee_amount,0)", "transaction_number", "transaction_date", "payment_status", "examination"},
		{"miscellaneous_fees", "misc_fee_id", "student_name", "COALESCE(fee_amount,0)", "transaction_number", "transaction_date", "payment_status", "miscellaneous"},
	}

	for _, t := range tables {
		if err := fetchFrom(t.table, t.idCol, t.nameCol, t.amountCol, t.txnCol, t.dateCol, t.statusCol, t.source); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch payments"})
			return
		}
	}

	// Enrich with master student data
	if len(results) > 0 {
		enrollSet := make(map[int64]struct{})
		for _, r := range results {
			if r.EnrollmentNo != nil {
				enrollSet[*r.EnrollmentNo] = struct{}{}
			}
		}

		if len(enrollSet) > 0 {
			ids := make([]int64, 0, len(enrollSet))
			for id := range enrollSet {
				ids = append(ids, id)
			}

			var masters []models.MasterStudent
			db.Where("enrollment_number IN ?", ids).Find(&masters)

			masterMap := make(map[int64]models.MasterStudent)
			for _, m := range masters {
				masterMap[m.EnrollmentNumber] = m
			}

			for i := range results {
				if results[i].EnrollmentNo != nil {
					if m, ok := masterMap[*results[i].EnrollmentNo]; ok {
						results[i].InstituteName = m.InstituteName
						results[i].CourseName = m.CourseName
						results[i].ProgramPattern = m.ProgramPattern
					}
				}
			}
		}
	}

	// Institute filter
	if instituteFilter != "" {
		needle := strings.ToLower(strings.TrimSpace(instituteFilter))
		filtered := results[:0]
		for _, r := range results {
			if r.InstituteName != nil && (strings.Contains(strings.ToLower(*r.InstituteName), needle)) {
				filtered = append(filtered, r)
			}
		}
		results = filtered
	}

	// Sort by date descending
	sort.SliceStable(results, func(i, j int) bool {
		di := parseDateString(results[i].TransactionDate)
		dj := parseDateString(results[j].TransactionDate)
		if !di.IsZero() && !dj.IsZero() {
			return di.After(dj)
		}
		si := ""
		if results[i].TransactionDate != nil {
			si = *results[i].TransactionDate
		}
		sj := ""
		if results[j].TransactionDate != nil {
			sj = *results[j].TransactionDate
		}
		return si > sj
	})

	// Pagination
	total := int(len(results))
	start := offset
	if start > total {
		start = total
	}
	end := start + limit
	if end > total {
		end = total
	}

	c.JSON(http.StatusOK, gin.H{
		"total_records": total,
		"payments":      results[start:end],
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int(limit) - 1) / int(limit),
		},
	})
}

func VerifyPayment(c *gin.Context) {
	var req struct {
		PaymentID int64  `json:"payment_id" binding:"required"`
		Source    string `json:"source" binding:"required"`
		Action    string `json:"action" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Action != "verify" && req.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action must be 'verify' or 'reject'"})
		return
	}

	newStatus := "Verified"
	if req.Action == "reject" {
		newStatus = "Rejected"
	}

	var table, idCol string
	switch req.Source {
	case "registration":
		table, idCol = "registration_fees", "regn_fee_id"
	case "examination":
		table, idCol = "examination_fees", "exam_fee_id"
	case "miscellaneous":
		table, idCol = "miscellaneous_fees", "misc_fee_id"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid source"})
		return
	}

	db := config.DB
	if err := db.Table(table).Where(idCol+" = ?", req.PaymentID).
		Update("payment_status", newStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update payment status"})
		return
	}

	SendAdminNotification("payment_status_updated", gin.H{
		"payment_id": req.PaymentID,
		"source":     req.Source,
		"status":     newStatus,
	})

	c.JSON(http.StatusOK, gin.H{
		"message":    "payment status updated",
		"payment_id": req.PaymentID,
		"status":     newStatus,
	})
}

func parseDateString(s *string) time.Time {
	if s == nil || strings.TrimSpace(*s) == "" {
		return time.Time{}
	}
	layouts := []string{
		"2006-01-02 15:04:05",
		"2006-01-02",
		time.RFC3339,
		"2006-01-02 15:04",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, strings.TrimSpace(*s)); err == nil {
			return t
		}
	}
	return time.Time{}
}

// ======================== MARKS UPLOAD ========================
type UploadMarksRequest struct {
	Marks []struct {
		EnrollmentNumber int64   `json:"enrollment_number" binding:"required"`
		SubjectCode      string  `json:"subject_code" binding:"required"`
		Semester         int     `json:"semester" binding:"required"`
		MarksObtained    float64 `json:"marks_obtained" binding:"required"`
		Grade            *string `json:"grade"`
		Status           string  `json:"status" binding:"required"`
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
		var subject models.SubjectMaster
		if err := db.Where("subject_code = ?", m.SubjectCode).First(&subject).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "subject not found: " + m.SubjectCode})
			return
		}

		records = append(records, models.StudentMark{
			EnrollmentNumber: m.EnrollmentNumber,
			Semester:         m.Semester,
			SubjectCode:      m.SubjectCode,
			SubjectName:      subject.SubjectName,
			SubjectType:      subject.SubjectType,
			MarksObtained:    m.MarksObtained,
			Grade:            m.Grade,
			Status:           m.Status,
			CreatedAt:        time.Now(),
		})
	}

	if err := db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "enrollment_number"}, {Name: "semester"}, {Name: "subject_code"}},
		DoUpdates: clause.AssignmentColumns([]string{"marks_obtained", "grade", "status"}),
	}).Create(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	SendAdminNotification("marks_uploaded", gin.H{
		"total_records": len(records),
		"summary":       "Marks uploaded/updated successfully",
	})

	c.JSON(http.StatusOK, gin.H{
		"message":       "marks uploaded successfully",
		"total_records": len(records),
	})
}

// ======================== PENDING REGISTRATIONS ========================
func GetPendingRegistrations(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	db := config.DB
	var users []models.User
	var total int64

	query := db.Model(&models.User{}).Where("status = ? AND role_id = ?", "inactive", 5)
	query.Count(&total)

	if err := query.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch pending registrations"})
		return
	}

	response := make([]gin.H, len(users))
	for i, u := range users {
		response[i] = gin.H{
			"user_id":    u.UserID,
			"username":   u.Username,
			"email":      u.Email,
			"full_name":  u.FullName,
			"status":     u.Status,
			"created_at": u.CreatedAt,
		}
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

func ApproveRegistration(c *gin.Context) {
	var req struct {
		UserID int64  `json:"user_id" binding:"required"`
		Action string `json:"action" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Action != "approve" && req.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action must be 'approve' or 'reject'"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
		return
	}

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

// ======================== INSTITUTE DETAILS ========================
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

	// Total students
	var totalStudents int64
	db.Model(&models.MasterStudent{}).Where("institute_name = ?", instName).Count(&totalStudents)

	// Students per course/branch
	type BranchCount struct {
		CourseName string `json:"course_name"`
		Count      int64  `json:"count"`
	}
	var branches []BranchCount
	db.Model(&models.MasterStudent{}).
		Select("COALESCE(course_name,'Unknown') as course_name, COUNT(*) as count").
		Where("institute_name = ?", instName).
		Group("course_name").
		Scan(&branches)

	// Fees paid
	var regPaid, examPaid, miscPaid float64
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM registration_fees WHERE payment_status = ? AND enrollment_number IN (SELECT enrollment_number FROM master_students WHERE institute_name = ?)", "Paid", instName).Scan(&regPaid)
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM examination_fees WHERE payment_status = ? AND enrollment_number IN (SELECT enrollment_number FROM master_students WHERE institute_name = ?)", "Paid", instName).Scan(&examPaid)
	db.Raw("SELECT COALESCE(SUM(fee_amount),0) FROM miscellaneous_fees WHERE payment_status = ? AND enrollment_number IN (SELECT enrollment_number FROM master_students WHERE institute_name = ?)", "Paid", instName).Scan(&miscPaid)
	totalPaid := regPaid + examPaid + miscPaid

	// Expected & pending
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

// ======================== FEE STRUCTURE & DUE ========================
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

	SendAdminNotification("fee_structure_created", gin.H{
		"id":         fs.FeeStructureID,
		"fee_amount": fs.FeeAmount,
	})

	c.JSON(http.StatusCreated, gin.H{
		"message": "fee structure created",
		"id":      fs.FeeStructureID,
	})
}

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

	SendAdminNotification("fee_due_created", gin.H{
		"fee_due_id": fd.FeeDueID,
		"enrollment": payload.EnrollmentNumber,
	})

	c.JSON(http.StatusCreated, gin.H{
		"message":    "fee due created",
		"fee_due_id": fd.FeeDueID,
	})
}

// ======================== ATTENDANCE ========================
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
		parsed, err := time.Parse("2006-01-02", r.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format"})
			return
		}

		sc := (*string)(nil)
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

	SendAdminNotification("attendance_uploaded", gin.H{
		"count": len(records),
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "attendance uploaded",
		"count":   len(records),
	})
}

func GetAttendanceSummary(c *gin.Context) {
	instituteID := c.Query("institute_id")
	instituteName := c.Query("institute_name")

	db := config.DB
	var where string
	var args []interface{}

	if instituteName != "" {
		where = "master_students.institute_name = ?"
		args = append(args, instituteName)
	} else if instituteID != "" {
		id, _ := strconv.Atoi(instituteID)
		where = "master_students.institute_id = ?"
		args = append(args, id)
	}

	var total, present int64
	queryBase := db.Table("attendance").
		Joins("JOIN master_students ON attendance.enrollment_number = master_students.enrollment_number")

	if where != "" {
		queryBase = queryBase.Where(where, args...)
	}

	queryBase.Count(&total)
	queryBase.Where("attendance.present = ?", true).Count(&present)

	absent := total - present
	percent := 0.0
	if total > 0 {
		percent = (float64(present) / float64(total)) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"total_records":      total,
		"present":            present,
		"absent":             absent,
		"attendance_percent": percent,
	})
}
