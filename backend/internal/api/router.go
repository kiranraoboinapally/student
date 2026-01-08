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

	// ================= ADMIN =================
	admin := api.Group("/admin")
	admin.Use(middleware.AuthRoleMiddleware(1))
	{
		// 🔹 DASHBOARD
		admin.GET("/stats", controllers.GetAdminStats)

		// 🔹 STUDENTS (FIXED: FILTERED + PAGINATED)
		// Supports:
		// ?page=&limit=&institute_id=&course_id=&search=
		admin.GET("/students", controllers.GetStudents)
		admin.GET("/institutes/:id/courses", controllers.GetCoursesByInstitute)
		// 🔹 USERS
		admin.POST("/users/create", controllers.CreateUserByAdmin)
		admin.GET("/users", controllers.GetAllUsers)

		// 🔹 REGISTRATIONS
		admin.GET("/pending-registrations", controllers.GetPendingRegistrations)
		admin.POST("/approve-registration", controllers.ApproveRegistration)

		// 🔹 FEES
		admin.GET("/fees/payments", controllers.GetAllFeePaymentHistory)
		admin.POST("/fees/verify", controllers.VerifyPayment)
		admin.POST("/fee-structure", controllers.CreateFeeStructure)
		admin.POST("/fees/due", controllers.CreateFeeDue)

		// 🔹 ATTENDANCE
		admin.POST("/attendance/upload", controllers.UploadAttendance)
		admin.GET("/attendance/summary", controllers.GetAttendanceSummary)

		// 🔹 MARKS
		admin.POST("/marks/upload", controllers.UploadStudentMarks)

		// ================= MASTER DATA =================

		// 🔹 INSTITUTES
		admin.GET("/institutes", controllers.GetInstitutes)
		admin.POST("/institutes", controllers.CreateInstitute)
		admin.PUT("/institutes/:id", controllers.UpdateInstitute)
		admin.DELETE("/institutes/:id", controllers.DeleteInstitute)

		// 🔹 COURSES
		admin.GET("/courses", controllers.GetCourses)
		admin.POST("/courses", controllers.CreateCourse)
		admin.PUT("/courses/:id", controllers.UpdateCourse)
		admin.DELETE("/courses/:id", controllers.DeleteCourse)

		// 🔹 OPTIONAL (RECOMMENDED FOR DRILL-DOWN)
		// admin.GET("/institutes/:id/courses", controllers.GetCoursesByInstitute)

		// 🔹 SUBJECTS
		admin.GET("/subjects", controllers.GetSubjects)
		admin.POST("/subjects", controllers.CreateSubject)
		admin.PUT("/subjects/:id", controllers.UpdateSubject)
		admin.DELETE("/subjects/:id", controllers.DeleteSubject)

		// 🔹 FACULTY
		admin.GET("/faculty", controllers.GetFaculties)
		admin.POST("/faculty", controllers.CreateFaculty)
		admin.PUT("/faculty/:id", controllers.UpdateFaculty)
		admin.DELETE("/faculty/:id", controllers.DeleteFaculty)

		// 🔹 NOTICES
		admin.GET("/notices", controllers.GetNotices)
		admin.POST("/notices", controllers.CreateNotice)
		admin.PUT("/notices/:id", controllers.UpdateNotice)
		admin.DELETE("/notices/:id", controllers.DeleteNotice)
	}

	// ================= STUDENT =================
	student := api.Group("/student")
	student.Use(middleware.AuthRoleMiddleware(5))
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
	}

	// ================= PROFILE =================
	profile := api.Group("/profile")
	profile.Use(middleware.AuthRoleMiddleware())
	{
		profile.GET("/me", controllers.GetMyProfile)
		profile.GET("/:id", controllers.GetStudentByID)
	}
}
