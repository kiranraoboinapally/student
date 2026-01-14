-- Migration: Faculty Management System
-- Description: Add departments, faculty-course assignments, and approval workflow enhancements

-- ============================================
-- 1. DEPARTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) NOT NULL,
    institute_id INT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_code (department_code, institute_id),
    FOREIGN KEY (institute_id) REFERENCES institutes(institute_id) ON DELETE SET NULL
);

-- ============================================
-- 2. FACULTY COURSE ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS faculty_course_assignments (
    assignment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    faculty_id BIGINT NOT NULL,
    course_stream_id INT NOT NULL,
    semester INT NULL,
    subject_code VARCHAR(20) NULL,
    academic_year VARCHAR(20) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE,
    FOREIGN KEY (course_stream_id) REFERENCES courses_streams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_faculty_course (faculty_id, course_stream_id, semester, subject_code, academic_year)
);

-- ============================================
-- 3. ADD DEPARTMENT_ID TO FACULTY TABLE
-- ============================================
-- Check if column exists before adding (MySQL syntax)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'faculty' 
               AND COLUMN_NAME = 'department_id');

SET @query := IF(@exist = 0, 
    'ALTER TABLE faculty ADD COLUMN department_id INT NULL, ADD FOREIGN KEY (department_id) REFERENCES departments(department_id)',
    'SELECT 1');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. INSERT DEFAULT GLOBAL DEPARTMENTS
-- ============================================
INSERT IGNORE INTO departments (department_name, department_code, institute_id, description, is_active) VALUES
('Computer Science & Engineering', 'CSE', NULL, 'Department of Computer Science and Engineering', TRUE),
('Electronics & Communication Engineering', 'ECE', NULL, 'Department of Electronics and Communication', TRUE),
('Mechanical Engineering', 'ME', NULL, 'Department of Mechanical Engineering', TRUE),
('Civil Engineering', 'CE', NULL, 'Department of Civil Engineering', TRUE),
('Electrical Engineering', 'EE', NULL, 'Department of Electrical Engineering', TRUE),
('Information Technology', 'IT', NULL, 'Department of Information Technology', TRUE),
('Mathematics', 'MATH', NULL, 'Department of Mathematics', TRUE),
('Physics', 'PHY', NULL, 'Department of Physics', TRUE),
('Chemistry', 'CHEM', NULL, 'Department of Chemistry', TRUE),
('Management Studies', 'MBA', NULL, 'Department of Management Studies', TRUE),
('Humanities', 'HUM', NULL, 'Department of Humanities and Social Sciences', TRUE),
('Biotechnology', 'BT', NULL, 'Department of Biotechnology', TRUE);

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_faculty_dept ON faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_faculty ON faculty_course_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_course ON faculty_course_assignments(course_stream_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_active ON faculty_course_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_users_status_role ON users(status, role_id);

-- ============================================
-- 6. VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Faculty with full details including department and institute
CREATE OR REPLACE VIEW v_faculty_details AS
SELECT 
    f.faculty_id,
    f.user_id,
    u.username,
    u.email,
    u.full_name,
    f.position,
    f.institute_id,
    i.institute_name,
    f.department_id,
    d.department_name,
    d.department_code,
    f.approval_status,
    f.approved_at,
    u.status as user_status,
    u.created_at
FROM faculty f
JOIN users u ON f.user_id = u.user_id
LEFT JOIN institutes i ON f.institute_id = i.institute_id
LEFT JOIN departments d ON f.department_id = d.department_id;

-- View: Faculty course assignments with course details
CREATE OR REPLACE VIEW v_faculty_courses AS
SELECT 
    fca.assignment_id,
    fca.faculty_id,
    u.full_name as faculty_name,
    fca.course_stream_id,
    cs.course_name,
    cs.stream,
    fca.semester,
    fca.subject_code,
    fca.academic_year,
    fca.is_active,
    f.institute_id,
    i.institute_name
FROM faculty_course_assignments fca
JOIN faculty f ON fca.faculty_id = f.faculty_id
JOIN users u ON f.user_id = u.user_id
JOIN courses_streams cs ON fca.course_stream_id = cs.id
LEFT JOIN institutes i ON f.institute_id = i.institute_id;

-- View: Pending approvals summary
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT 
    'faculty' as type,
    f.faculty_id as id,
    u.full_name as name,
    i.institute_name,
    u.created_at as requested_at
FROM faculty f
JOIN users u ON f.user_id = u.user_id
LEFT JOIN institutes i ON f.institute_id = i.institute_id
WHERE f.approval_status = 'pending'
UNION ALL
SELECT 
    'student' as type,
    u.user_id as id,
    u.full_name as name,
    NULL as institute_name,
    u.created_at as requested_at
FROM users u
WHERE u.role_id = 5 AND u.status = 'inactive';
