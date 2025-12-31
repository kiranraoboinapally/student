package models

import "time"

type User struct {
	UserID         int64      `gorm:"column:user_id;primaryKey;autoIncrement" json:"user_id"`
	Username       string     `gorm:"column:username;uniqueIndex" json:"username"`
	Email          string     `gorm:"column:email;uniqueIndex" json:"email"`
	PasswordHash   string     `gorm:"column:password_hash" json:"-"`
	FullName       string     `gorm:"column:full_name" json:"full_name"`
	EmployeeID     *string    `gorm:"column:employee_id" json:"employee_id"`
	Mobile         *string    `gorm:"column:mobile" json:"mobile"`
	RoleID         int        `gorm:"column:role_id" json:"role_id"`
	InstituteID    *int       `gorm:"column:institute_id" json:"institute_id"`
	Status         string     `gorm:"column:status" json:"status"`
	LastLogin      *time.Time `gorm:"column:last_login" json:"last_login"`
	IsTempPassword bool       `gorm:"column:is_temp_password" json:"-"`
	CreatedAt      *time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt      *time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (User) TableName() string { return "users" }

type Faculty struct {
	FacultyID  int64  `gorm:"column:faculty_id;primaryKey;autoIncrement" json:"faculty_id"`
	UserID     int64  `gorm:"column:user_id" json:"user_id"`
	Department string `gorm:"column:department" json:"department"`
	Position   string `gorm:"column:position" json:"position"`
}

func (Faculty) TableName() string { return "faculty" }

type Institute struct {
	InstituteID   int       `gorm:"column:institute_id;primaryKey" json:"institute_id"`
	InstituteCode string    `gorm:"column:institute_code;uniqueIndex" json:"code"`
	InstituteName string    `gorm:"column:institute_name" json:"name"`
	InstituteType string    `gorm:"column:institute_type" json:"type"`
	Address       *string   `gorm:"column:address" json:"address"`
	City          *string   `gorm:"column:city" json:"city"`
	State         *string   `gorm:"column:state" json:"state"`
	Pincode       *string   `gorm:"column:pincode" json:"pincode"`
	ContactPerson *string   `gorm:"column:contact_person" json:"contact_person"`
	ContactEmail  *string   `gorm:"column:contact_email" json:"email"`
	ContactPhone  *string   `gorm:"column:contact_phone" json:"contact_number"`
	Status        string    `gorm:"column:status" json:"status"`
	CreatedAt     time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (Institute) TableName() string { return "institutes" }

type Course struct {
	CourseID    int    `gorm:"column:course_id;primaryKey" json:"course_id"`
	Name        string `gorm:"column:name" json:"name"`
	Duration    int    `gorm:"column:duration" json:"duration_years"`
	InstituteID int    `gorm:"column:institute_id" json:"institute_id"`
	Status      string `gorm:"column:status" json:"status"`
}

func (Course) TableName() string { return "courses" }

type MasterStudent struct {
	StudentID          int64      `gorm:"column:student_id;primaryKey" json:"student_id"`
	EnrollmentNumber   int64      `gorm:"column:enrollment_number;uniqueIndex" json:"enrollment_number"`
	StudentName        string     `gorm:"column:student_name" json:"full_name"`
	FatherName         *string    `gorm:"column:father_name" json:"father_name"`
	StudentEmailID     *string    `gorm:"column:student_email_id" json:"email"`
	StudentPhoneNumber *string    `gorm:"column:student_phone_number" json:"phone"`
	InstituteName      *string    `gorm:"column:institute_name" json:"institute_name"`
	CourseName         *string    `gorm:"column:course_name" json:"course_name"`
	StudentStatus      *string    `gorm:"column:student_status" json:"status"`
	Session            *string    `gorm:"column:session" json:"session"`
	Batch              *string    `gorm:"column:batch" json:"batch"`
	ProgramPattern     *string    `gorm:"column:program_pattern" json:"program_pattern"`
	ProgramDuration    *int       `gorm:"column:program_duration" json:"duration_years"`
	CreatedAt          *time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt          *time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (MasterStudent) TableName() string { return "master_students" }

type ActStudent struct {
	RegnNo           *string `gorm:"column:Regn_no" json:"regn_no"`
	EnrollmentNumber *string `gorm:"column:Enrollment_Number" json:"enrollment_number"`
	CandidateName    *string `gorm:"column:Candidate_Name" json:"candidate_name"`
	EmailID          *string `gorm:"column:Email_ID" json:"email"`
	ContactNumber    *string `gorm:"column:Contact_Number" json:"contact_number"`
	CourseName       *string `gorm:"column:Course_Name" json:"course_name"`
	StreamName       *string `gorm:"column:Stream_Name" json:"stream_name"`
	YearSem          *string `gorm:"column:Year_Sem" json:"year_sem"`
}

func (ActStudent) TableName() string { return "act_students" }

type SubjectMaster struct {
	SubjectID   int    `gorm:"column:subject_id;primaryKey" json:"subject_id"`
	SubjectCode string `gorm:"column:subject_code;uniqueIndex" json:"code"`
	SubjectName string `gorm:"column:subject_name" json:"name"`
	SubjectType string `gorm:"column:subject_type" json:"type"`
	Credits     int    `gorm:"column:credits" json:"credits"`
	Semester    int    `gorm:"column:semester" json:"semester"`
	CourseName  string `gorm:"column:course_name" json:"course_name"`
	IsActive    bool   `gorm:"column:is_active" json:"is_active"`
}

func (SubjectMaster) TableName() string { return "subjects_master" }

type GradeMapping struct {
	ID           int     `gorm:"column:id;primaryKey" json:"id"`
	MarksPercent string  `gorm:"column:subject_marks_percent" json:"marks_percent"`
	Grade        string  `gorm:"column:grade" json:"grade"`
	GradePoints  string  `gorm:"column:grade_points" json:"grade_points"`
	Remarks      *string `gorm:"column:remarks" json:"remarks"`
}

func (GradeMapping) TableName() string { return "grade_mapping" }

type StudentMark struct {
	MarkID           int64     `gorm:"column:mark_id;primaryKey" json:"mark_id"`
	EnrollmentNumber int64     `gorm:"column:enrollment_number" json:"enrollment_number"`
	Semester         int       `gorm:"column:semester" json:"semester"`
	SubjectCode      string    `gorm:"column:subject_code" json:"subject_code"`
	SubjectName      string    `gorm:"column:subject_name" json:"subject_name"`
	SubjectType      string    `gorm:"column:subject_type" json:"subject_type"`
	MarksObtained    float64   `gorm:"column:marks_obtained" json:"marks_obtained"`
	Grade            *string   `gorm:"column:grade" json:"grade"`
	Status           string    `gorm:"column:status" json:"status"`
	CreatedAt        time.Time `gorm:"column:created_at" json:"created_at"`
	TotalMarks       float64   `gorm:"column:total_marks_obtained;->" json:"-"`
	Percentage       float64   `gorm:"column:percentage;->" json:"-"`
}

func (StudentMark) TableName() string { return "student_marks" }

type SemesterResult struct {
	ResultID         int64   `gorm:"column:result_id;primaryKey" json:"result_id"`
	EnrollmentNumber int64   `gorm:"column:enrollment_number" json:"enrollment_number"`
	Semester         int     `gorm:"column:semester" json:"semester"`
	SGPA             float64 `gorm:"column:sgpa" json:"sgpa"`
	CGPA             float64 `gorm:"column:cgpa" json:"cgpa"`
	Percentage       float64 `gorm:"column:percentage" json:"percentage"`
	ResultStatus     string  `gorm:"column:result_status" json:"result_status"`
}

func (SemesterResult) TableName() string { return "semester_results" }

type Result2025 struct {
	ResultID         int64   `gorm:"column:result_id;primaryKey" json:"result_id"`
	InstituteName    string  `gorm:"column:institute_name" json:"institute_name"`
	EnrollmentNumber int64   `gorm:"column:enrollment_number" json:"enrollment_number"`
	Term             int     `gorm:"column:term" json:"term"`
	Remark           *string `gorm:"column:remark" json:"remark"`
}

func (Result2025) TableName() string { return "result_2025" }

type RegistrationFee struct {
	RegnFeeID          int64    `gorm:"column:regn_fee_id;primaryKey" json:"id"`
	EnrollmentNumber   int64    `gorm:"column:enrollment_number" json:"student_id"`
	InstituteName      *string  `gorm:"column:institute_name" json:"institute_name"`
	CourseName         *string  `gorm:"column:course_name" json:"course_name"`
	Semester           *int     `gorm:"column:semester" json:"semester"`
	StudentName        *string  `gorm:"column:student_name" json:"student_name"`
	FatherName         *string  `gorm:"column:father_name" json:"father_name"`
	StudentEmailID     *string  `gorm:"column:student_email_id" json:"email"`
	StudentPhoneNumber *string  `gorm:"column:student_phone_number" json:"phone"`
	FeeType            *string  `gorm:"column:fee_type" json:"fee_type"`
	FeeAmount          *float64 `gorm:"column:fee_amount" json:"amount_paid"`
	TransactionNumber  *string  `gorm:"column:transaction_number" json:"transaction_number"`
	TransactionDate    *string  `gorm:"column:transaction_date" json:"payment_date"`
	PaymentStatus      *string  `gorm:"column:payment_status" json:"status"`
	CreatedAt          *string  `gorm:"column:created_at" json:"created_at"`
}

func (RegistrationFee) TableName() string { return "registration_fees" }

type ExaminationFee struct {
	ExamFeeID        int64    `gorm:"column:exam_fee_id;primaryKey" json:"id"`
	EnrollmentNumber int64    `gorm:"column:enrollment_number" json:"student_id"`
	FeeType          *string  `gorm:"column:fee_type" json:"fee_type"`
	FeeAmount        *float64 `gorm:"column:fee_amount" json:"amount_paid"`
	TransactionNo    *string  `gorm:"column:transaction_number" json:"transaction_number"`
	TransactionDate  *string  `gorm:"column:transaction_date" json:"payment_date"`
	PaymentStatus    *string  `gorm:"column:payment_status" json:"status"`
	CreatedAt        *string  `gorm:"column:created_at" json:"created_at"`
}

func (ExaminationFee) TableName() string { return "examination_fees" }

type ExpectedFee struct {
	ExpectedFeeID       int64   `gorm:"column:expected_fee_id;primaryKey" json:"id"`
	EnrollmentNumber    int64   `gorm:"column:enrollment_number" json:"student_id"`
	ExpectedExamFee     float64 `gorm:"column:expected_exam_fee" json:"expected_exam_fee"`
	ExpectedRegFee      float64 `gorm:"column:expected_registration_fee" json:"expected_reg_fee"`
	TotalExpected       float64 `gorm:"column:total_expected_fee" json:"total_expected"`
	ExamFeePaid         float64 `gorm:"column:exam_fee_paid" json:"exam_fee_paid"`
	RegistrationFeePaid float64 `gorm:"column:registration_fee_paid" json:"reg_fee_paid"`
	TotalPaid           float64 `gorm:"column:total_paid" json:"total_paid"`
	OverallStatus       string  `gorm:"column:overall_status" json:"overall_status"`
}

func (ExpectedFee) TableName() string { return "expected_fee_collections" }

type FeeDue struct {
	FeeDueID       int       `gorm:"column:fee_due_id;primaryKey" json:"fee_due_id"`
	StudentID      int       `gorm:"column:student_id" json:"student_id"`
	FeeTypeID      int       `gorm:"column:fee_type_id" json:"fee_type_id"`
	FeeHead        string    `gorm:"column:fee_head" json:"fee_head"`
	DueDate        time.Time `gorm:"column:due_date" json:"due_date"`
	OriginalAmount float64   `gorm:"column:original_amount" json:"original_amount"`
	AmountPaid     float64   `gorm:"column:amount_paid" json:"amount_paid"`
	Status         string    `gorm:"column:status" json:"status"`
	CreatedAt      time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (FeeDue) TableName() string { return "fee_dues" }

type FeePayment struct {
	PaymentID     int       `gorm:"column:payment_id;primaryKey" json:"payment_id"`
	FeeDueID      int       `gorm:"column:fee_due_id" json:"fee_due_id"`
	StudentID     int       `gorm:"column:student_id" json:"student_id"`
	PaidAmount    float64   `gorm:"column:paid_amount" json:"paid_amount"`
	PaymentMethod string    `gorm:"column:payment_method" json:"payment_method"`
	PaymentNote   string    `gorm:"column:payment_note" json:"payment_note"`
	PaidAt        time.Time `gorm:"column:paid_at" json:"paid_at"`
}

func (FeePayment) TableName() string { return "fee_payments" }

type PaymentReconciliation struct {
	ReconciliationID int        `gorm:"column:reconciliation_id;primaryKey" json:"reconciliation_id"`
	PaymentID        int        `gorm:"column:payment_id" json:"payment_id"`
	BankDate         *time.Time `gorm:"column:bank_statement_date" json:"bank_date"`
	Reference        *string    `gorm:"column:bank_statement_reference" json:"reference"`
	ReconciledAmount *float64   `gorm:"column:reconciled_amount" json:"reconciled_amount"`
	DifferenceAmount *float64   `gorm:"column:difference_amount" json:"difference_amount"`
	Status           string     `gorm:"column:reconciliation_status" json:"status"`
	ReconciledBy     *int       `gorm:"column:reconciled_by" json:"reconciled_by"`
	ReconciledAt     *time.Time `gorm:"column:reconciled_at" json:"reconciled_at"`
	Remarks          *string    `gorm:"column:remarks" json:"remarks"`
	CreatedAt        time.Time  `gorm:"column:created_at" json:"created_at"`
}

func (PaymentReconciliation) TableName() string { return "payment_reconciliation" }

type FeeStructure struct {
	FeeStructureID int        `gorm:"column:fee_structure_id;primaryKey" json:"fee_structure_id"`
	FeeTypeID      int        `gorm:"column:fee_type_id" json:"fee_type_id"`
	CourseName     *string    `gorm:"column:course_name" json:"course_name"`
	Session        *string    `gorm:"column:session" json:"session"`
	Batch          *string    `gorm:"column:batch" json:"batch"`
	ProgramPattern *string    `gorm:"column:program_pattern" json:"program_pattern"`
	FeeAmount      float64    `gorm:"column:fee_amount" json:"fee_amount"`
	EffectiveFrom  *time.Time `gorm:"column:effective_from" json:"effective_from"`
	EffectiveTo    *time.Time `gorm:"column:effective_to" json:"effective_to"`
	Status         string     `gorm:"column:status" json:"status"`
}

func (FeeStructure) TableName() string { return "fee_structure" }

type FeePaymentDetail struct {
	PaymentDetailID int     `gorm:"column:payment_detail_id;primaryKey" json:"payment_detail_id"`
	PaymentID       int     `gorm:"column:payment_id" json:"payment_id"`
	StudentID       *int    `gorm:"column:student_id" json:"student_id"`
	EnrollmentNo    *int64  `gorm:"column:enrollment_number" json:"enrollment_number"`
	StudentName     string  `gorm:"column:student_name" json:"student_name"`
	FeeAmount       float64 `gorm:"column:fee_amount" json:"fee_amount"`
	LateFee         float64 `gorm:"column:late_fee" json:"late_fee"`
	TotalAmount     float64 `gorm:"column:total_amount" json:"total_amount"`
	Status          string  `gorm:"column:status" json:"status"`
}

func (FeePaymentDetail) TableName() string { return "fee_payment_details" }

type MiscellaneousFee struct {
	MiscFeeID        int64    `gorm:"column:misc_fee_id;primaryKey" json:"id"`
	EnrollmentNumber int64    `gorm:"column:enrollment_number" json:"student_id"`
	InstituteName    *string  `gorm:"column:institute_name" json:"institute_name"`
	CourseName       *string  `gorm:"column:course_name" json:"course_name"`
	Semester         *int     `gorm:"column:semester" json:"semester"`
	StudentName      *string  `gorm:"column:student_name" json:"student_name"`
	FatherName       *string  `gorm:"column:father_name" json:"father_name"`
	StudentEmailID   *string  `gorm:"column:student_email_id" json:"email"`
	StudentPhone     *string  `gorm:"column:student_phone_number" json:"phone"`
	FeeType          *string  `gorm:"column:fee_type" json:"fee_type"`
	FeeAmount        *float64 `gorm:"column:fee_amount" json:"amount_paid"`
	TransactionNo    *string  `gorm:"column:transaction_number" json:"transaction_number"`
	TransactionDate  *string  `gorm:"column:transaction_date" json:"payment_date"`
	PaymentStatus    *string  `gorm:"column:payment_status" json:"status"`
	CreatedAt        *string  `gorm:"column:created_at" json:"created_at"`
}

func (MiscellaneousFee) TableName() string { return "miscellaneous_fees" }

type StudentFeeData struct {
	FeeID         int64   `gorm:"column:fee_id;primaryKey" json:"fee_id"`
	EnrollmentNo  int64   `gorm:"column:enrollment_no" json:"enrollment_number"`
	ExamSessionID int     `gorm:"column:exam_session_id" json:"exam_session_id"`
	YearSem       *string `gorm:"column:year_sem" json:"year_sem"`
	Amount        float64 `gorm:"column:amount" json:"amount"`
	TxnNo         *string `gorm:"column:txn_no" json:"txn_no"`
}

func (StudentFeeData) TableName() string { return "student_fee_data" }

type MiscFeesUpdate struct {
	MiscFeeID        *int64  `gorm:"column:misc_fee_id" json:"misc_fee_id"`
	EnrollmentNumber *int64  `gorm:"column:enrollment_number" json:"enrollment_number"`
	TransactionDate  *string `gorm:"column:transaction_date" json:"transaction_date"`
}

func (MiscFeesUpdate) TableName() string { return "miscellaneous_fees_update" }

type RegistrationFeesUpdate struct {
	RegnFeeID        *int64  `gorm:"column:regn_fee_id" json:"regn_fee_id"`
	EnrollmentNumber *int64  `gorm:"column:enrollment_number" json:"enrollment_number"`
	TransactionDate  *string `gorm:"column:transaction_date" json:"transaction_date"`
}

func (RegistrationFeesUpdate) TableName() string { return "registration_fees_update" }

type FeeData struct {
	ID               int64   `gorm:"column:id" json:"id"`
	EnrollmentNumber int64   `gorm:"column:enrollment_number" json:"enrollment_number"`
	CourseName       *string `gorm:"column:course_name" json:"course_name"`
	Amount           float64 `gorm:"column:amount" json:"amount"`
}

func (FeeData) TableName() string { return "fee_data" }

type ReappearStudent struct {
	ReappearID   int64   `gorm:"column:reappear_id;primaryKey" json:"reappear_id"`
	EnrollmentNo int64   `gorm:"column:enrollment_no" json:"enrollment_number"`
	YearSem      *string `gorm:"column:year_sem" json:"year_sem"`
	Amount       float64 `gorm:"column:amount" json:"amount"`
	TxnNo        *string `gorm:"column:txn_no" json:"txn_no"`
}

func (ReappearStudent) TableName() string { return "reappear_students" }

type StdSession struct {
	EnrollmentNumber *int64  `gorm:"column:enrollment_number" json:"enrollment_number"`
	StudentName      *string `gorm:"column:student_name" json:"student_name"`
}

func (StdSession) TableName() string { return "std_session" }

type StdData struct {
	EnrollmentNumber *int64  `gorm:"column:enrollment_number" json:"enrollment_number"`
	CourseName       *string `gorm:"column:course_name" json:"course_name"`
}

func (StdData) TableName() string { return "std_data" }

type StudentEligible2025 struct {
	EnrollmentNumber *int64 `gorm:"column:enrollment_number" json:"enrollment_number"`
	BatchEndYear     *int   `gorm:"column:batch_end_year" json:"batch_end_year"`
}

func (StudentEligible2025) TableName() string { return "student_eligible_2025" }

type Notice struct {
	NoticeID  int64     `gorm:"column:notice_id;primaryKey" json:"notice_id"`
	Title     string    `gorm:"column:title" json:"title"`
	Content   string    `gorm:"column:content" json:"description"`
	CreatedBy int64     `gorm:"column:created_by" json:"created_by"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

func (Notice) TableName() string { return "notices" }

type Leave struct {
	LeaveID   int64     `gorm:"column:leave_id;primaryKey" json:"leave_id"`
	StudentID int64     `gorm:"column:student_id" json:"student_id"`
	Reason    string    `gorm:"column:reason" json:"reason"`
	StartDate time.Time `gorm:"column:start_date" json:"start_date"`
	EndDate   time.Time `gorm:"column:end_date" json:"end_date"`
	Status    string    `gorm:"column:status" json:"status"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

func (Leave) TableName() string { return "leaves" }

type Timetable struct {
	ID       int64  `gorm:"column:timetable_id;primaryKey" json:"timetable_id"`
	Semester int    `gorm:"column:semester" json:"semester"`
	Day      string `gorm:"column:day" json:"day"`
	Subject  string `gorm:"column:subject" json:"subject"`
	Time     string `gorm:"column:time" json:"time"`
}

func (Timetable) TableName() string { return "timetables" }

type Attendance struct {
	AttendanceID     int64     `gorm:"column:attendance_id;primaryKey" json:"attendance_id"`
	EnrollmentNumber int64     `gorm:"column:enrollment_number" json:"enrollment_number"`
	Date             time.Time `gorm:"column:date" json:"date"`
	Present          bool      `gorm:"column:present" json:"present"`
	SubjectCode      *string   `gorm:"column:subject_code" json:"subject_code"`
	CreatedAt        time.Time `gorm:"column:created_at" json:"created_at"`
}

func (Attendance) TableName() string { return "attendance" }
