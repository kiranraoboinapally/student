package models

import "time"

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
