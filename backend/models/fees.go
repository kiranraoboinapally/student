package models

import "time"

// ---------------- FEE DUES -------------------

type FeeDue struct {
	FeeDueID       int       `gorm:"column:fee_due_id;primaryKey;autoIncrement" json:"fee_due_id"`
	StudentID      int       `gorm:"column:student_id;index" json:"student_id"`
	FeeTypeID      int       `gorm:"column:fee_type_id" json:"fee_type_id"`
	FeeHead        string    `gorm:"column:fee_head" json:"fee_head"`
	DueDate        time.Time `gorm:"column:due_date" json:"due_date"`
	OriginalAmount float64   `gorm:"column:original_amount" json:"original_amount"`
	AmountPaid     float64   `gorm:"column:amount_paid" json:"amount_paid"`
	Status         string    `gorm:"column:status" json:"status"` // due|partial|paid|waived
	CreatedAt      time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (FeeDue) TableName() string { return "fee_dues" }

type FeePayment struct {
	PaymentID     int       `gorm:"column:payment_id;primaryKey;autoIncrement" json:"payment_id"`
	FeeDueID      int       `gorm:"column:fee_due_id;index" json:"fee_due_id"`
	StudentID     int       `gorm:"column:student_id;index" json:"student_id"`
	PaidAmount    float64   `gorm:"column:paid_amount" json:"paid_amount"`
	PaymentMethod string    `gorm:"column:payment_method" json:"payment_method"`
	PaymentNote   string    `gorm:"column:payment_note" json:"payment_note"`
	PaidAt        time.Time `gorm:"column:paid_at" json:"paid_at"`
}

func (FeePayment) TableName() string { return "fee_payments" }

// ---------------- REGISTRATION FEES -------------------

type RegistrationFee struct {
	RegnFeeID             int      `gorm:"column:regn_fee_id;primaryKey" json:"regn_fee_id"`
	EnrollmentNumber      int64    `gorm:"column:enrollment_number" json:"enrollment_number"`
	InstituteName         *string  `gorm:"column:institute_name" json:"institute_name"`
	CourseName            *string  `gorm:"column:course_name" json:"course_name"`
	Semester              *int     `gorm:"column:semester" json:"semester"`
	StudentName           *string  `gorm:"column:student_name" json:"student_name"`
	FatherName            *string  `gorm:"column:father_name" json:"father_name"`
	StudentEmailID        *string  `gorm:"column:student_email_id" json:"student_email_id"`
	StudentPhoneNumber    *string  `gorm:"column:student_phone_number" json:"student_phone_number"`
	StudentStatus         *string  `gorm:"column:student_status" json:"student_status"`
	Session               *string  `gorm:"column:session" json:"session"`
	Batch                 *string  `gorm:"column:batch" json:"batch"`
	ProgramPattern        *string  `gorm:"column:program_pattern" json:"program_pattern"`
	ProgramDuration       *int     `gorm:"column:program_duration" json:"program_duration"`
	FeeType               *string  `gorm:"column:fee_type" json:"fee_type"`
	FeeAmount             *float64 `gorm:"column:fee_amount" json:"fee_amount"`
	TransactionNumber     *string  `gorm:"column:transaction_number" json:"transaction_number"`
	TransactionDate       *string  `gorm:"column:transaction_date" json:"transaction_date"`
	MerchantTransactionID *string  `gorm:"column:merchant_transaction_id" json:"merchant_transaction_id"`
	PaymentGatewayRefID   *string  `gorm:"column:Payment_Gateway_Reference_Id" json:"payment_gateway_reference_id"`
	PaymentStatus         *string  `gorm:"column:payment_status" json:"payment_status"`
	CurrentSem            *int     `gorm:"column:current_sem" json:"current_sem"`
}

func (RegistrationFee) TableName() string { return "registration_fees" }

// ---------------- EXAMINATION FEES -------------------

type ExaminationFee struct {
	ExamFeeID          int      `gorm:"column:exam_fee_id;primaryKey" json:"exam_fee_id"`
	EnrollmentNumber   int64    `gorm:"column:enrollment_number" json:"enrollment_number"`
	InstituteName      *string  `gorm:"column:institute_name" json:"institute_name"`
	CourseName         *string  `gorm:"column:course_name" json:"course_name"`
	Semester           *int     `gorm:"column:semester" json:"semester"`
	StudentName        *string  `gorm:"column:student_name" json:"student_name"`
	FatherName         *string  `gorm:"column:father_name" json:"father_name"`
	StudentEmailID     *string  `gorm:"column:student_email_id" json:"student_email_id"`
	StudentPhoneNumber *string  `gorm:"column:student_phone_number" json:"student_phone_number"`
	FeeType            *string  `gorm:"column:fee_type" json:"fee_type"`
	FeeAmount          *float64 `gorm:"column:fee_amount" json:"fee_amount"`
	TransactionNumber  *string  `gorm:"column:transaction_number" json:"transaction_number"`
	TransactionDate    *string  `gorm:"column:transaction_date" json:"transaction_date"`
	ExamName           *string  `gorm:"column:exam_name" json:"exam_name"`
	PaymentStatus      *string  `gorm:"column:payment_status" json:"payment_status"`
}

func (ExaminationFee) TableName() string { return "examination_fees" }

// ---------------- EXPECTED FEES -------------------

type ExpectedFee struct {
	ExpectedFeeID       int     `gorm:"column:expected_fee_id;primaryKey" json:"expected_fee_id"`
	EnrollmentNumber    int64   `gorm:"column:enrollment_number" json:"enrollment_number"`
	StudentName         string  `gorm:"column:student_name" json:"student_name"`
	InstituteName       string  `gorm:"column:institute_name" json:"institute_name"`
	CourseName          string  `gorm:"column:course_name" json:"course_name"`
	Session             string  `gorm:"column:session" json:"session"`
	Batch               string  `gorm:"column:batch" json:"batch"`
	ExpectedExamFee     float64 `gorm:"column:expected_exam_fee" json:"expected_exam_fee"`
	ExpectedRegFee      float64 `gorm:"column:expected_registration_fee" json:"expected_registration_fee"`
	TotalExpected       float64 `gorm:"column:total_expected_fee" json:"total_expected_fee"`
	ExamFeePaid         float64 `gorm:"column:exam_fee_paid" json:"exam_fee_paid"`
	RegistrationFeePaid float64 `gorm:"column:registration_fee_paid" json:"registration_fee_paid"`
	TotalPaid           float64 `gorm:"column:total_paid" json:"total_paid"`
	OverallStatus       string  `gorm:"column:overall_status" json:"overall_status"`
}

func (ExpectedFee) TableName() string { return "expected_fee_collections" }
