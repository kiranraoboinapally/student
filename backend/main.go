// main.go - FINAL UPDATED VERSION

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

	// === CRITICAL: Initialize Razorpay client with keys from .env ===
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
		admin.POST("/users/create", controllers.CreateUserByAdmin)
		admin.GET("/pending-registrations", controllers.GetPendingRegistrations)
		admin.POST("/approve-registration", controllers.ApproveRegistration)

		admin.GET("/fees/payments", controllers.GetAllFeePaymentHistory)
		admin.POST("/marks/upload", controllers.UploadStudentMarks)
	}

	// ================= STUDENT ROUTES =================
	student := api.Group("/student")
	student.Use(middleware.AuthRoleMiddleware(5)) // Student only (role ID 5)
	{
		// Core Student Features
		student.GET("/profile", controllers.GetStudentProfile)
		student.GET("/dashboard", controllers.GetStudentDashboard)

		// Fees Management with Razorpay
		student.GET("/fees/summary", controllers.GetStudentFees)

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
	}

	// ================= COMMON PROFILE ROUTE =================
	profile := api.Group("/profile")
	profile.Use(middleware.AuthRoleMiddleware()) // Any authenticated user
	{
		profile.GET("/me", controllers.GetMyProfile)
	}

	// Start the server
	r.Run(":8080") // You can change the port if needed (e.g., os.Getenv("PORT"))
}
