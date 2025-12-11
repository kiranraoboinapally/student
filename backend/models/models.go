package models

import "time"

// ---------------- User ----------------
type User struct {
	UserID               int64      `gorm:"column:user_id;primaryKey;autoIncrement" json:"user_id"`
	Username             string     `gorm:"column:username;uniqueIndex" json:"username"`
	Email                string     `gorm:"column:email;uniqueIndex" json:"email"`
	PasswordHash         string     `gorm:"column:password_hash" json:"-"`
	FullName             string     `gorm:"column:full_name" json:"full_name"`
	EmployeeID           *string    `gorm:"column:employee_id" json:"employee_id,omitempty"`
	Mobile               *string    `gorm:"column:mobile" json:"mobile,omitempty"`
	RoleID               int        `gorm:"column:role_id" json:"role_id"`
	InstituteID          *int       `gorm:"column:institute_id" json:"institute_id,omitempty"`
	Status               string     `gorm:"column:status" json:"status"`
	LastLogin            *time.Time `gorm:"column:last_login" json:"last_login,omitempty"`
	PasswordResetToken   *string    `gorm:"column:password_reset_token" json:"-"`
	PasswordResetExpires *time.Time `gorm:"column:password_reset_expires" json:"-"`
	FailedLoginAttempts  int        `gorm:"column:failed_login_attempts" json:"-"`
	LockedUntil          *time.Time `gorm:"column:locked_until" json:"-"`
	IsTempPassword       bool       `gorm:"column:is_temp_password" json:"is_temp_password"`
	CreatedAt            *time.Time `gorm:"column:created_at" json:"created_at,omitempty"`
	UpdatedAt            *time.Time `gorm:"column:updated_at" json:"updated_at,omitempty"`
}

func (User) TableName() string { return "users" }

// ---------------- MasterStudent ----------------
type MasterStudent struct {
	StudentID          int64      `gorm:"column:student_id;primaryKey;autoIncrement" json:"student_id"`
	EnrollmentNumber   int64      `gorm:"column:enrollment_number" json:"enrollment_number"`
	StudentName        string     `gorm:"column:student_name" json:"student_name"`
	FatherName         *string    `gorm:"column:father_name" json:"father_name,omitempty"`
	StudentEmailID     *string    `gorm:"column:student_email_id" json:"student_email_id,omitempty"`
	StudentPhoneNumber *string    `gorm:"column:student_phone_number" json:"student_phone_number,omitempty"`
	InstituteName      *string    `gorm:"column:institute_name" json:"institute_name,omitempty"`
	CourseName         *string    `gorm:"column:course_name" json:"course_name,omitempty"`
	StudentStatus      *string    `gorm:"column:student_status" json:"student_status,omitempty"`
	Session            *string    `gorm:"column:session" json:"session,omitempty"`
	Batch              *string    `gorm:"column:batch" json:"batch,omitempty"`
	ProgramPattern     *string    `gorm:"column:program_pattern" json:"program_pattern,omitempty"`
	ProgramDuration    *int       `gorm:"column:program_duration" json:"program_duration,omitempty"`
	CreatedAt          *time.Time `gorm:"column:created_at" json:"created_at,omitempty"`
	UpdatedAt          *time.Time `gorm:"column:updated_at" json:"updated_at,omitempty"`
}

func (MasterStudent) TableName() string { return "master_students" }

// ---------------- ActStudent ----------------
type ActStudent struct {
	RegnNo           *string `gorm:"column:Regn_no" json:"Regn_no,omitempty"`
	EnrollmentNumber *string `gorm:"column:Enrollment_Number" json:"Enrollment_Number,omitempty"`
	CourseName       *string `gorm:"column:Course_Name" json:"Course_Name,omitempty"`
	Duration         *int    `gorm:"column:Duration" json:"Duration,omitempty"`
	StreamName       *string `gorm:"column:Stream_Name" json:"Stream_Name,omitempty"`
	CandidateName    *string `gorm:"column:Candidate_Name" json:"Candidate_Name,omitempty"`
	SessionYear      *int    `gorm:"column:Session_Year" json:"Session_Year,omitempty"`
	SessionMonth     *string `gorm:"column:Session_Month" json:"Session_Month,omitempty"`
	EmailID          *string `gorm:"column:Email_ID" json:"Email_ID,omitempty"`
	ContactNumber    *string `gorm:"column:Contact_Number" json:"Contact_Number,omitempty"`
	StudyStatus      *string `gorm:"column:Study_Status" json:"Study_Status,omitempty"`
	YearSem          *string `gorm:"column:Year_Sem" json:"Year_Sem,omitempty"`
	MotherName       *string `gorm:"column:mother_name" json:"mother_name,omitempty"`
	FatherName       *string `gorm:"column:father_name" json:"father_name,omitempty"`
	CandidateAddress *string `gorm:"column:candidate_address" json:"candidate_address,omitempty"`
	CenterName       *string `gorm:"column:center_name" json:"center_name,omitempty"`
}

func (ActStudent) TableName() string { return "act_students" }
