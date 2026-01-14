package api

import (
	"github.com/gin-gonic/gin"

	controllers "github.com/kiranraoboinapally/student/backend/internal/controllers"
	middleware "github.com/kiranraoboinapally/student/backend/internal/middleware"
)

// RegisterAPIRoutes registers all API routes onto the provided gin Engine.
func RegisterAPIRoutes(r *gin.Engine) {
	api := r.Group("/api")

	// ================= AUTH =================
	auth := api.Group("/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
		auth.POST("/forgot-password", controllers.ForgotPassword)
		auth.POST("/reset-password", controllers.ResetPassword)
		auth.POST("/change-password", middleware.AuthRoleMiddleware(), controllers.ChangePassword)
	}

	// ================= UNIVERSITY ADMIN (Role 1) =================
	admin := api.Group("/admin")
	admin.Use(middleware.AuthRoleMiddleware(middleware.RoleUniversityAdmin))
	{
		// 🔹 DASHBOARD
		admin.GET("/stats", controllers.GetAdminStats)
		admin.GET("/pending-approval-counts", controllers.GetPendingApprovalCounts)

		// 🔹 APPROVALS (NEW)
		admin.GET("/pending-approvals", controllers.GetPendingApprovals)
		admin.POST("/approve-faculty", controllers.ApproveFaculty)
		admin.POST("/approve-course-stream", controllers.ApproveCourseStream)

		// 🔹 MARKS MANAGEMENT (Lock/Publish only - entry moved to Faculty)
		admin.GET("/internal-marks", controllers.GetAllInternalMarks)
		admin.POST("/marks/lock", controllers.LockMarks)
		admin.POST("/marks/publish", controllers.PublishResults)

		// 🔹 MASTER FEE TYPES (NEW)
		admin.GET("/fee-types", controllers.GetMasterFeeTypes)
		admin.POST("/fee-types", controllers.CreateMasterFeeType)

		// 🔹 USERS
		admin.POST("/users/create", controllers.CreateUserByAdmin)
		admin.GET("/users", controllers.GetAllUsers)

		// 🔹 REGISTRATIONS
		admin.GET("/pending-registrations", controllers.GetPendingRegistrations)
		admin.POST("/approve-registration", controllers.ApproveRegistration)

		// 🔹 FEES (Structure & Verification)
		admin.GET("/fees/payments", controllers.GetAllFeePaymentHistory)
		admin.POST("/fees/verify", controllers.VerifyPayment)
		admin.POST("/fee-structure", controllers.CreateFeeStructure)
		admin.POST("/fees/due", controllers.CreateFeeDue)

		// 🔹 ATTENDANCE (View summary only - marking moved to Faculty)
		admin.GET("/attendance/summary", controllers.GetAttendanceSummary)

		// 🔹 MASTER DATA - INSTITUTES
		admin.GET("/institutes", controllers.GetInstitutes)
		admin.POST("/institutes", controllers.CreateInstitute)
		admin.POST("/institutes/users", controllers.CreateInstituteUser)
		admin.PUT("/institutes/:id", controllers.UpdateInstitute)
		admin.DELETE("/institutes/:id", controllers.DeleteInstitute)
		admin.GET("/institutes/:id/courses", controllers.GetCoursesByInstitute)

		// 🔹 COURSES
		admin.GET("/courses", controllers.GetCourses)
		admin.POST("/courses", controllers.CreateCourse)
		admin.PUT("/courses/:id", controllers.UpdateCourse)
		admin.DELETE("/courses/:id", controllers.DeleteCourse)

		// 🔹 SUBJECTS
		admin.GET("/subjects", controllers.GetSubjects)
		admin.POST("/subjects", controllers.CreateSubject)
		admin.PUT("/subjects/:id", controllers.UpdateSubject)
		admin.DELETE("/subjects/:id", controllers.DeleteSubject)

		// 🔹 FACULTY (View/Manage from university level)
		admin.GET("/faculty", controllers.GetFaculties)
		admin.POST("/faculty", controllers.CreateFaculty)
		admin.PUT("/faculty/:id", controllers.UpdateFaculty)
		admin.DELETE("/faculty/:id", controllers.DeleteFaculty)

		// 🔹 STUDENTS (View only)
		admin.GET("/students", controllers.GetStudents)

		// 🔹 NOTICES
		admin.GET("/notices", controllers.GetNotices)
		admin.POST("/notices", controllers.CreateNotice)
		admin.PUT("/notices/:id", controllers.UpdateNotice)
		admin.DELETE("/notices/:id", controllers.DeleteNotice)

		// 🔹 DEPARTMENTS
		admin.GET("/departments", controllers.GetDepartments)
		admin.POST("/departments", controllers.CreateDepartment)
		admin.PUT("/departments/:id", controllers.UpdateDepartment)
		admin.DELETE("/departments/:id", controllers.DeleteDepartment)

		// 🔹 STUDENT REGISTRATION APPROVALS
		admin.GET("/pending-student-registrations", controllers.GetPendingStudentRegistrations)
		admin.POST("/approve-student", controllers.ApproveStudentRegistration)
		admin.POST("/approve-students-bulk", controllers.BulkApproveStudentRegistrations)
	}

	// ================= FACULTY (Role 2) =================
	faculty := api.Group("/faculty")
	faculty.Use(middleware.AuthRoleMiddleware(middleware.RoleFaculty))
	{
		// 🔹 ATTENDANCE (NEW - Faculty marks attendance)
		faculty.POST("/attendance/mark", controllers.FacultyMarkAttendance)
		faculty.GET("/attendance", controllers.FacultyGetAttendance)

		// 🔹 INTERNAL MARKS (NEW - Faculty enters marks)
		faculty.POST("/internal-marks", controllers.FacultyAddInternalMarks)
		faculty.PUT("/internal-marks/:id", controllers.FacultyUpdateInternalMarks)
		faculty.POST("/internal-marks/submit", controllers.FacultySubmitMarks)
		faculty.GET("/internal-marks", controllers.FacultyGetInternalMarks)

		// 🔹 STUDENTS (View students in their assigned courses)
		faculty.GET("/students", controllers.FacultyGetStudents)

		// 🔹 MY COURSES (Courses assigned to this faculty)
		faculty.GET("/my-courses", controllers.GetFacultyMyCourses)

		// 🔹 ASSIGNMENTS (Existing)
		faculty.POST("/assignments", controllers.CreateAssignment)
		faculty.GET("/assignments/course/:course_id", controllers.GetAssignmentsByCourse)
		faculty.GET("/assignments/:id/submissions", controllers.GetSubmissionsByAssignment)
		faculty.POST("/submissions/:id/grade", controllers.GradeSubmission)
	}

	// ================= INSTITUTE ADMIN (Role 3) =================
	institute := api.Group("/institute")
	institute.Use(
		middleware.AuthRoleMiddleware(middleware.RoleInstituteAdmin),
		middleware.RequireInstitute(),
		middleware.CollegeBelongsToUser(),
	)
	{
		// 🔹 DASHBOARD
		institute.GET("/dashboard/stats", controllers.GetInstituteDashboardStats)

		// 🔹 STUDENT MANAGEMENT (NEW)
		institute.POST("/students", controllers.InstituteAddStudent)
		institute.GET("/students", controllers.GetInstituteStudents)

		// 🔹 FACULTY MANAGEMENT (NEW - Creates pending approval)
		institute.POST("/faculty", controllers.InstituteAddFaculty)
		institute.GET("/faculty", controllers.GetInstituteFaculty)

		// 🔹 COURSE-STREAM REQUESTS (NEW)
		institute.POST("/request-course-stream", controllers.RequestCourseStream)
		institute.GET("/course-streams", controllers.GetInstituteCourseStreams)

		// 🔹 FEES (View only - collection)
		institute.GET("/fees", controllers.GetInstituteStudentFees)

		// 🔹 ATTENDANCE (View summary only)
		institute.GET("/attendance", controllers.GetInstituteAttendanceSummary)

		// 🔹 INTERNAL MARKS (View only)
		institute.GET("/internal-marks", controllers.GetInstituteInternalMarks)

		// 🔹 COURSES (View only)
		institute.GET("/courses", controllers.GetInstituteCourses)

		// 🔹 DEPARTMENTS (View for this institute)
		institute.GET("/departments", controllers.GetInstituteDepartments)

		// 🔹 FACULTY COURSE ASSIGNMENTS
		institute.POST("/faculty-assignments", controllers.AssignFacultyToCourse)
		institute.GET("/faculty/:id/assignments", controllers.GetFacultyAssignments)
		institute.DELETE("/faculty-assignments/:id", controllers.RemoveFacultyAssignment)
	}

	// ================= STUDENT (Role 5) =================
	student := api.Group("/student")
	student.Use(middleware.AuthRoleMiddleware(middleware.RoleStudent))
	{
		student.GET("/profile", controllers.GetStudentProfile)
		student.GET("/dashboard", controllers.GetStudentDashboard)

		student.GET("/fees/summary", controllers.GetStudentFeeSummary)
		student.GET("/fees", controllers.GetStudentFees)
		student.POST("/fees/request-payment", controllers.RequestPayment)
		student.POST("/fees/verify-payment", controllers.VerifyPaymentAndRecord)
		student.POST("/fees/pay", controllers.PayFee)

		student.GET("/semester/current", controllers.GetCurrentSemester)
		student.GET("/subjects/current", controllers.GetCurrentSemesterSubjects)
		student.GET("/marks/current", controllers.GetCurrentSemesterMarks)
		student.GET("/marks/all", controllers.GetAllMarks)

		student.GET("/attendance", controllers.GetStudentAttendance)
		student.GET("/results/semester", controllers.GetSemesterResults)

		student.GET("/notices", controllers.GetNotices)
		student.POST("/leaves/apply", controllers.ApplyLeave)
		student.GET("/leaves", controllers.GetStudentLeaves)
		student.GET("/timetable", controllers.GetTimetable)

		// Assignments
		student.GET("/assignments/course/:course_id", controllers.GetAssignmentsByCourse)
		student.POST("/assignments/:id/submit", controllers.SubmitAssignment)
	}

	// ================= PROFILE (Any authenticated user) =================
	profile := api.Group("/profile")
	profile.Use(middleware.AuthRoleMiddleware())
	{
		profile.GET("/me", controllers.GetMyProfile)
		profile.GET("/:id", controllers.GetStudentByID)
	}
}

