// main.go - FULLY UPDATED VERSION WITH ALL APIs

package main

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/controllers"
	"github.com/kiranraoboinapally/student/backend/middleware"
)

func main() {
	// Load environment variables from .env file (development only)
	_ = godotenv.Load()

	// Initialize database connection and other configs
	config.Init()

	// CRITICAL: Initialize Razorpay client with keys from .env
	controllers.InitRazorpay()

	r := gin.Default()

	// ---------- CORS Configuration ----------
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Change to your production domain later
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")

	// ================= AUTH ROUTES =================
	auth := api.Group("/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
		auth.POST("/forgot-password", controllers.ForgotPassword)
		auth.POST("/reset-password", controllers.ResetPassword)
		auth.POST(
			"/change-password",
			middleware.AuthRoleMiddleware(),
			controllers.ChangePassword,
		)
	}

	// ================= ADMIN ROUTES =================
	admin := api.Group("/admin")
	admin.Use(middleware.AuthRoleMiddleware(1)) // Admin only (role ID 1)
	{
		admin.GET("/students", controllers.GetStudents)

		admin.POST("/users/create", controllers.CreateUserByAdmin)
		admin.GET("/users", controllers.GetAllUsers)

		admin.GET("/pending-registrations", controllers.GetPendingRegistrations)
		admin.POST("/approve-registration", controllers.ApproveRegistration)

		admin.GET("/fees/payments", controllers.GetAllFeePaymentHistory)
		admin.POST("/marks/upload", controllers.UploadStudentMarks)

		// NEW: Institute Management
		admin.GET("/institutes", controllers.GetInstitutes)
		admin.POST("/institutes", controllers.CreateInstitute)
		admin.PUT("/institutes/:id", controllers.UpdateInstitute)
		admin.DELETE("/institutes/:id", controllers.DeleteInstitute)

		// NEW: Course Management
		admin.GET("/courses", controllers.GetCourses)
		admin.POST("/courses", controllers.CreateCourse)
		admin.PUT("/courses/:id", controllers.UpdateCourse)
		admin.DELETE("/courses/:id", controllers.DeleteCourse)

		// NEW: Subject Management
		admin.GET("/subjects", controllers.GetSubjects)
		admin.POST("/subjects", controllers.CreateSubject)
		admin.PUT("/subjects/:id", controllers.UpdateSubject)
		admin.DELETE("/subjects/:id", controllers.DeleteSubject)

		// NEW: Notice Management
		admin.GET("/notices", controllers.GetNotices)
		admin.POST("/notices", controllers.CreateNotice)
		admin.PUT("/notices/:id", controllers.UpdateNotice)
		admin.DELETE("/notices/:id", controllers.DeleteNotice)

		// NEW: Faculty Management (assuming faculty role ID 3)
		admin.GET("/faculty", controllers.GetFaculty)
		admin.POST("/faculty", controllers.CreateFaculty)
		admin.PUT("/faculty/:id", controllers.UpdateFaculty)
		admin.DELETE("/faculty/:id", controllers.DeleteFaculty)
	}

	// ================= STUDENT ROUTES =================
	student := api.Group("/student")
	student.Use(middleware.AuthRoleMiddleware(5)) // Student only (role ID 5)
	{
		// Core Student Features
		student.GET("/profile", controllers.GetStudentProfile)
		student.GET("/dashboard", controllers.GetStudentDashboard)

		// Fees Management with Razorpay
		student.GET("/fees/summary", controllers.GetStudentFeeSummary)
		student.GET("/fees", controllers.GetStudentFees) // Unified dues + payments

		// Razorpay Payment Flow
		student.POST("/fees/request-payment", controllers.RequestPayment)
		student.POST("/fees/verify-payment", controllers.VerifyPaymentAndRecord)

		// Legacy endpoint (guides to new flow)
		student.POST("/fees/pay", controllers.PayFee)

		// Backward compatibility endpoints
		student.GET("/fees/registration", controllers.GetStudentRegistrationFees)
		student.GET("/fees/examination", controllers.GetStudentExaminationFees)

		// Academic Features
		student.GET("/semester/current", controllers.GetCurrentSemester)
		student.GET("/subjects/current", controllers.GetCurrentSemesterSubjects)
		student.GET("/marks/current", controllers.GetCurrentSemesterMarks)
		student.GET("/attendance", controllers.GetStudentAttendance)

		// NEW: All Marks and Results
		student.GET("/marks/all", controllers.GetAllMarks)
		student.GET("/results/semester", controllers.GetSemesterResults)

		// NEW: Notices
		student.GET("/notices", controllers.GetNotices) // Students can view

		// NEW: Leave Application
		student.POST("/leaves/apply", controllers.ApplyLeave)
		student.GET("/leaves", controllers.GetStudentLeaves)

		// NEW: Timetable
		student.GET("/timetable", controllers.GetTimetable)
	}

	// ================= COMMON PROFILE ROUTE =================
	profile := api.Group("/profile")
	profile.Use(middleware.AuthRoleMiddleware()) // Any authenticated user
	{
		profile.GET("/me", controllers.GetMyProfile)
		profile.GET("/:id", controllers.GetStudentByID) // For admins or others to view student by ID
	}

	// Start the server
	r.Run(":8080") // You can change the port if needed (e.g., os.Getenv("PORT"))
}
