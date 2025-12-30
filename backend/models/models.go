package models

import "time"

// ================= USERS =================
type User struct {
	UserID         int64      `gorm:"column:user_id;primaryKey;autoIncrement"`
	Username       string     `gorm:"column:username;uniqueIndex"`
	Email          string     `gorm:"column:email;uniqueIndex"`
	PasswordHash   string     `gorm:"column:password_hash" json:"-"`
	FullName       string     `gorm:"column:full_name"`
	EmployeeID     *string    `gorm:"column:employee_id"`
	Mobile         *string    `gorm:"column:mobile"`
	RoleID         int        `gorm:"column:role_id"`
	InstituteID    *int       `gorm:"column:institute_id"`
	Status         string     `gorm:"column:status"`
	LastLogin      *time.Time `gorm:"column:last_login"`
	IsTempPassword bool       `gorm:"column:is_temp_password" json:"-"`
	CreatedAt      *time.Time `gorm:"column:created_at"`
	UpdatedAt      *time.Time `gorm:"column:updated_at"`
}

func (User) TableName() string { return "users" }

// NEW: Faculty (for admin management)
type Faculty struct {
	FacultyID  int64  `gorm:"column:faculty_id;primaryKey;autoIncrement"`
	UserID     int64  `gorm:"column:user_id"`
	Department string `gorm:"column:department"`
	Position   string `gorm:"column:position"`
}

func (Faculty) TableName() string { return "faculty" }

// ================= INSTITUTES =================
type Institute struct {
	InstituteID   int       `gorm:"column:institute_id;primaryKey"`
	InstituteCode string    `gorm:"column:institute_code;uniqueIndex"`
	InstituteName string    `gorm:"column:institute_name"`
	InstituteType string    `gorm:"column:institute_type"`
	Address       *string   `gorm:"column:address"`
	City          *string   `gorm:"column:city"`
	State         *string   `gorm:"column:state"`
	Pincode       *string   `gorm:"column:pincode"`
	ContactPerson *string   `gorm:"column:contact_person"`
	ContactEmail  *string   `gorm:"column:contact_email"`
	ContactPhone  *string   `gorm:"column:contact_phone"`
	Status        string    `gorm:"column:status"`
	CreatedAt     time.Time `gorm:"column:created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at"`
}

func (Institute) TableName() string { return "institutes" }

// NEW: Course (for admin management)
type Course struct {
	CourseID    int    `gorm:"column:course_id;primaryKey"`
	Name        string `gorm:"column:name"`
	Duration    int    `gorm:"column:duration"`
	InstituteID int    `gorm:"column:institute_id"`
	Status      string `gorm:"column:status"`
}

func (Course) TableName() string { return "courses" }

// ================= MASTER STUDENTS =================
type MasterStudent struct {
	StudentID          int64      `gorm:"column:student_id;primaryKey"`
	EnrollmentNumber   int64      `gorm:"column:enrollment_number;uniqueIndex"`
	StudentName        string     `gorm:"column:student_name"`
	FatherName         *string    `gorm:"column:father_name"`
	StudentEmailID     *string    `gorm:"column:student_email_id"`
	StudentPhoneNumber *string    `gorm:"column:student_phone_number"`
	InstituteName      *string    `gorm:"column:institute_name"`
	CourseName         *string    `gorm:"column:course_name"`
	StudentStatus      *string    `gorm:"column:student_status"`
	Session            *string    `gorm:"column:session"`
	Batch              *string    `gorm:"column:batch"`
	ProgramPattern     *string    `gorm:"column:program_pattern"`
	ProgramDuration    *int       `gorm:"column:program_duration"`
	CreatedAt          *time.Time `gorm:"column:created_at"`
	UpdatedAt          *time.Time `gorm:"column:updated_at"`
}

func (MasterStudent) TableName() string { return "master_students" }

// ================= ACT STUDENTS =================
type ActStudent struct {
	RegnNo           *string `gorm:"column:Regn_no"`
	EnrollmentNumber *string `gorm:"column:Enrollment_Number"`
	CandidateName    *string `gorm:"column:Candidate_Name"`
	EmailID          *string `gorm:"column:Email_ID"`
	ContactNumber    *string `gorm:"column:Contact_Number"`
	CourseName       *string `gorm:"column:Course_Name"`
	StreamName       *string `gorm:"column:Stream_Name"`
	YearSem          *string `gorm:"column:Year_Sem"`
}

func (ActStudent) TableName() string { return "act_students" }

// ================= SUBJECTS =================
type SubjectMaster struct {
	SubjectID   int    `gorm:"column:subject_id;primaryKey"`
	SubjectCode string `gorm:"column:subject_code;uniqueIndex"`
	SubjectName string `gorm:"column:subject_name"`
	SubjectType string `gorm:"column:subject_type"`
	Credits     int    `gorm:"column:credits"`
	Semester    int    `gorm:"column:semester"`
	CourseName  string `gorm:"column:course_name"`
	IsActive    bool   `gorm:"column:is_active"`
}

func (SubjectMaster) TableName() string { return "subjects_master" }

// ================= GRADE MAPPING =================
type GradeMapping struct {
	ID           int     `gorm:"column:id;primaryKey"`
	MarksPercent string  `gorm:"column:subject_marks_percent"`
	Grade        string  `gorm:"column:grade"`
	GradePoints  string  `gorm:"column:grade_points"`
	Remarks      *string `gorm:"column:remarks"`
}

func (GradeMapping) TableName() string { return "grade_mapping" }

// ================= STUDENT MARKS =================
type StudentMark struct {
	MarkID           int64     `gorm:"column:mark_id;primaryKey"`
	EnrollmentNumber int64     `gorm:"column:enrollment_number"`
	Semester         int       `gorm:"column:semester"`
	SubjectCode      string    `gorm:"column:subject_code"`
	SubjectName      string    `gorm:"column:subject_name"`
	SubjectType      string    `gorm:"column:subject_type"`
	MarksObtained    float64   `gorm:"column:marks_obtained"` // FIXED: Added this
	Grade            *string   `gorm:"column:grade"`
	Status           string    `gorm:"column:status"`
	CreatedAt        time.Time `gorm:"column:created_at"`

	// 👇 READ-ONLY (Generated by DB)
	TotalMarks float64 `gorm:"column:total_marks_obtained;->"`
	Percentage float64 `gorm:"column:percentage;->"`
}

func (StudentMark) TableName() string { return "student_marks" }

// ================= SEMESTER RESULTS =================
type SemesterResult struct {
	ResultID         int64   `gorm:"column:result_id;primaryKey"`
	EnrollmentNumber int64   `gorm:"column:enrollment_number"`
	Semester         int     `gorm:"column:semester"`
	SGPA             float64 `gorm:"column:sgpa"`
	CGPA             float64 `gorm:"column:cgpa"`
	Percentage       float64 `gorm:"column:percentage"`
	ResultStatus     string  `gorm:"column:result_status"`
}

func (SemesterResult) TableName() string { return "semester_results" }

// ================= RESULT 2025 =================
type Result2025 struct {
	ResultID         int64   `gorm:"column:result_id;primaryKey"`
	InstituteName    string  `gorm:"column:institute_name"`
	EnrollmentNumber int64   `gorm:"column:enrollment_number"`
	Term             int     `gorm:"column:term"`
	Remark           *string `gorm:"column:remark"`
}

func (Result2025) TableName() string { return "result_2025" }

// ================= REGISTRATION FEES =================
type RegistrationFee struct {
	RegnFeeID          int64    `gorm:"column:regn_fee_id;primaryKey"`
	EnrollmentNumber   int64    `gorm:"column:enrollment_number"`
	InstituteName      *string  `gorm:"column:institute_name"`
	CourseName         *string  `gorm:"column:course_name"`
	Semester           *int     `gorm:"column:semester"`
	StudentName        *string  `gorm:"column:student_name"`
	FatherName         *string  `gorm:"column:father_name"`
	StudentEmailID     *string  `gorm:"column:student_email_id"`
	StudentPhoneNumber *string  `gorm:"column:student_phone_number"`
	FeeType            *string  `gorm:"column:fee_type"`
	FeeAmount          *float64 `gorm:"column:fee_amount"`
	TransactionNumber  *string  `gorm:"column:transaction_number"`
	TransactionDate    *string  `gorm:"column:transaction_date"`
	PaymentStatus      *string  `gorm:"column:payment_status"`
	CreatedAt          *string  `gorm:"column:created_at"`
}

func (RegistrationFee) TableName() string { return "registration_fees" }

// ================= EXAMINATION FEES =================
type ExaminationFee struct {
	ExamFeeID        int64    `gorm:"column:exam_fee_id;primaryKey"`
	EnrollmentNumber int64    `gorm:"column:enrollment_number"`
	FeeType          *string  `gorm:"column:fee_type"`
	FeeAmount        *float64 `gorm:"column:fee_amount"`
	TransactionNo    *string  `gorm:"column:transaction_number"`
	TransactionDate  *string  `gorm:"column:transaction_date"`
	PaymentStatus    *string  `gorm:"column:payment_status"`
	CreatedAt        *string  `gorm:"column:created_at"`
}

func (ExaminationFee) TableName() string { return "examination_fees" }

// ================= EXPECTED FEE COLLECTIONS =================
type ExpectedFee struct {
	ExpectedFeeID       int64   `gorm:"column:expected_fee_id;primaryKey"`
	EnrollmentNumber    int64   `gorm:"column:enrollment_number"`
	ExpectedExamFee     float64 `gorm:"column:expected_exam_fee"`
	ExpectedRegFee      float64 `gorm:"column:expected_registration_fee"`
	TotalExpected       float64 `gorm:"column:total_expected_fee"`
	ExamFeePaid         float64 `gorm:"column:exam_fee_paid"`
	RegistrationFeePaid float64 `gorm:"column:registration_fee_paid"`
	TotalPaid           float64 `gorm:"column:total_paid"`
	OverallStatus       string  `gorm:"column:overall_status"`
}

func (ExpectedFee) TableName() string { return "expected_fee_collections" }

// ================= FEE DUES =================
type FeeDue struct {
	FeeDueID  int    `gorm:"column:fee_due_id;primaryKey"`
	StudentID int    `gorm:"column:student_id"`
	FeeTypeID int    `gorm:"column:fee_type_id"`
	FeeHead   string `gorm:"column:fee_head"` // <--- ADD THIS
	// FeeType        string    `gorm:"column:fee_type"`
	DueDate        time.Time `gorm:"column:due_date"`
	OriginalAmount float64   `gorm:"column:original_amount"`
	AmountPaid     float64   `gorm:"column:amount_paid"`
	Status         string    `gorm:"column:status"`
	CreatedAt      time.Time `gorm:"column:created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at"`
}

func (FeeDue) TableName() string { return "fee_dues" }

// ================= STUDENT FEE PAYMENTS =================
type FeePayment struct {
	PaymentID     int       `gorm:"column:payment_id;primaryKey"`
	FeeDueID      int       `gorm:"column:fee_due_id"`
	StudentID     int       `gorm:"column:student_id"`
	PaidAmount    float64   `gorm:"column:paid_amount"`
	PaymentMethod string    `gorm:"column:payment_method"`
	PaymentNote   string    `gorm:"column:payment_note"`
	PaidAt        time.Time `gorm:"column:paid_at"`
}

func (FeePayment) TableName() string { return "fee_payments" }

// ================= PAYMENT RECONCILIATION =================
type PaymentReconciliation struct {
	ReconciliationID int        `gorm:"column:reconciliation_id;primaryKey"`
	PaymentID        int        `gorm:"column:payment_id"`
	BankDate         *time.Time `gorm:"column:bank_statement_date"`
	Reference        *string    `gorm:"column:bank_statement_reference"`
	ReconciledAmount *float64   `gorm:"column:reconciled_amount"`
	DifferenceAmount *float64   `gorm:"column:difference_amount"`
	Status           string     `gorm:"column:reconciliation_status"`
	ReconciledBy     *int       `gorm:"column:reconciled_by"`
	ReconciledAt     *time.Time `gorm:"column:reconciled_at"`
	Remarks          *string    `gorm:"column:remarks"`
	CreatedAt        time.Time  `gorm:"column:created_at"`
}

func (PaymentReconciliation) TableName() string { return "payment_reconciliation" }

// ================= FEE STRUCTURE =================
type FeeStructure struct {
	FeeStructureID int        `gorm:"column:fee_structure_id;primaryKey"`
	FeeTypeID      int        `gorm:"column:fee_type_id"`
	CourseName     *string    `gorm:"column:course_name"`
	Session        *string    `gorm:"column:session"`
	Batch          *string    `gorm:"column:batch"`
	ProgramPattern *string    `gorm:"column:program_pattern"`
	FeeAmount      float64    `gorm:"column:fee_amount"`
	EffectiveFrom  *time.Time `gorm:"column:effective_from"`
	EffectiveTo    *time.Time `gorm:"column:effective_to"`
	Status         string     `gorm:"column:status"`
}

func (FeeStructure) TableName() string { return "fee_structure" }

// ================= FEE PAYMENT DETAILS =================
type FeePaymentDetail struct {
	PaymentDetailID int     `gorm:"column:payment_detail_id;primaryKey"`
	PaymentID       int     `gorm:"column:payment_id"`
	StudentID       *int    `gorm:"column:student_id"`
	EnrollmentNo    *int64  `gorm:"column:enrollment_number"`
	StudentName     string  `gorm:"column:student_name"`
	FeeAmount       float64 `gorm:"column:fee_amount"`
	LateFee         float64 `gorm:"column:late_fee"`
	TotalAmount     float64 `gorm:"column:total_amount"`
	Status          string  `gorm:"column:status"`
}

func (FeePaymentDetail) TableName() string { return "fee_payment_details" }

// ================= MISCELLANEOUS FEES =================
type MiscellaneousFee struct {
	MiscFeeID        int64    `gorm:"column:misc_fee_id;primaryKey"`
	EnrollmentNumber int64    `gorm:"column:enrollment_number"`
	InstituteName    *string  `gorm:"column:institute_name"`
	CourseName       *string  `gorm:"column:course_name"`
	Semester         *int     `gorm:"column:semester"`
	StudentName      *string  `gorm:"column:student_name"`
	FatherName       *string  `gorm:"column:father_name"`
	StudentEmailID   *string  `gorm:"column:student_email_id"`
	StudentPhone     *string  `gorm:"column:student_phone_number"`
	FeeType          *string  `gorm:"column:fee_type"`
	FeeAmount        *float64 `gorm:"column:fee_amount"`
	TransactionNo    *string  `gorm:"column:transaction_number"`
	TransactionDate  *string  `gorm:"column:transaction_date"`
	PaymentStatus    *string  `gorm:"column:payment_status"`
	CreatedAt        *string  `gorm:"column:created_at"`
}

func (MiscellaneousFee) TableName() string { return "miscellaneous_fees" }

// ================= STUDENT FEE DATA =================
type StudentFeeData struct {
	FeeID         int64   `gorm:"column:fee_id;primaryKey"`
	EnrollmentNo  int64   `gorm:"column:enrollment_no"`
	ExamSessionID int     `gorm:"column:exam_session_id"`
	YearSem       *string `gorm:"column:year_sem"`
	Amount        float64 `gorm:"column:amount"`
	TxnNo         *string `gorm:"column:txn_no"`
}

func (StudentFeeData) TableName() string { return "student_fee_data" }

// ================= UPDATE TABLES =================
type MiscFeesUpdate struct {
	MiscFeeID        *int64  `gorm:"column:misc_fee_id"`
	EnrollmentNumber *int64  `gorm:"column:enrollment_number"`
	TransactionDate  *string `gorm:"column:transaction_date"`
}

func (MiscFeesUpdate) TableName() string { return "miscellaneous_fees_update" }

type RegistrationFeesUpdate struct {
	RegnFeeID        *int64  `gorm:"column:regn_fee_id"`
	EnrollmentNumber *int64  `gorm:"column:enrollment_number"`
	TransactionDate  *string `gorm:"column:transaction_date"`
}

func (RegistrationFeesUpdate) TableName() string { return "registration_fees_update" }

// ================= FEE DATA =================
type FeeData struct {
	ID               int64   `gorm:"column:id"`
	EnrollmentNumber int64   `gorm:"column:enrollment_number"`
	CourseName       *string `gorm:"column:course_name"`
	Amount           float64 `gorm:"column:amount"`
}

func (FeeData) TableName() string { return "fee_data" }

// ================= REAPPEAR STUDENTS =================
type ReappearStudent struct {
	ReappearID   int64   `gorm:"column:reappear_id;primaryKey"`
	EnrollmentNo int64   `gorm:"column:enrollment_no"`
	YearSem      *string `gorm:"column:year_sem"`
	Amount       float64 `gorm:"column:amount"`
	TxnNo        *string `gorm:"column:txn_no"`
}

func (ReappearStudent) TableName() string { return "reappear_students" }

// ================= STD SESSION =================
type StdSession struct {
	EnrollmentNumber *int64  `gorm:"column:enrollment_number"`
	StudentName      *string `gorm:"column:student_name"`
}

func (StdSession) TableName() string { return "std_session" }

// ================= STD DATA =================
type StdData struct {
	EnrollmentNumber *int64  `gorm:"column:enrollment_number"`
	CourseName       *string `gorm:"column:course_name"`
}

func (StdData) TableName() string { return "std_data" }

// ================= STUDENT ELIGIBLE 2025 =================
type StudentEligible2025 struct {
	EnrollmentNumber *int64 `gorm:"column:enrollment_number"`
	BatchEndYear     *int   `gorm:"column:batch_end_year"`
}

func (StudentEligible2025) TableName() string { return "student_eligible_2025" }

// ================= NEW: Notice (for notices) =================
type Notice struct {
	NoticeID  int64     `gorm:"column:notice_id;primaryKey"`
	Title     string    `gorm:"column:title"`
	Content   string    `gorm:"column:content"`
	CreatedBy int64     `gorm:"column:created_by"` // UserID of admin
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (Notice) TableName() string { return "notices" }

// ================= NEW: Leave Application (for student leaves) =================
type Leave struct {
	LeaveID   int64     `gorm:"column:leave_id;primaryKey"`
	StudentID int64     `gorm:"column:student_id"` // EnrollmentNumber
	Reason    string    `gorm:"column:reason"`
	StartDate time.Time `gorm:"column:start_date"`
	EndDate   time.Time `gorm:"column:end_date"`
	Status    string    `gorm:"column:status"` // pending, approved, rejected
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (Leave) TableName() string { return "leaves" }

// ================= NEW: Timetable (placeholder for student timetable) =================
type Timetable struct {
	ID       int64  `gorm:"column:timetable_id;primaryKey"`
	Semester int    `gorm:"column:semester"`
	Day      string `gorm:"column:day"`
	Subject  string `gorm:"column:subject"`
	Time     string `gorm:"column:time"`
}

func (Timetable) TableName() string { return "timetables" }
