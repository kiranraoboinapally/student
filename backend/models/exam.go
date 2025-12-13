package models

import "time"

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
	TotalMarks       float64   `gorm:"column:total_marks_obtained"`
	Percentage       float64   `gorm:"column:percentage"`
	Grade            *string   `gorm:"column:grade"`
	Status           string    `gorm:"column:status"`
	CreatedAt        time.Time `gorm:"column:created_at"`
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
