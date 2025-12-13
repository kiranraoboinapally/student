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
