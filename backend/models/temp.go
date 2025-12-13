package models

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
