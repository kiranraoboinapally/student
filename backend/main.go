package main

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/controllers"
	"github.com/kiranraoboinapally/student/backend/middleware"
)

func main() {
	config.Init()

	r := gin.Default()

	// ---------- CORS ----------
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	// --------------------------

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

	// ================= ADMIN ROUTES (RESTORED to original structure) =================
	admin := api.Group("/admin")
	admin.Use(middleware.AuthRoleMiddleware(1)) // Admin role
	{
		// ---- Registration ----
		admin.POST("/users/create", controllers.CreateUserByAdmin)
		admin.GET("/pending-registrations", controllers.GetPendingRegistrations)
		admin.POST("/approve-registration", controllers.ApproveRegistration)

		// NEW: Fee Payment History (Based on your previous setup)
		admin.GET("/fees/payments", controllers.GetAllFeePaymentHistory)

		// NEW: Marks Upload (Based on your previous setup)
		admin.POST("/marks/upload", controllers.UploadStudentMarks)

		// NOTE: Removed GetAdminDashboard, GetAllStudents, CreateFeeDue, and RecordAttendance
		// to resolve the 'undefined' errors.
	}

	// ================= STUDENT ROUTES (FIXED) =================
	student := api.Group("/student")
	student.Use(middleware.AuthRoleMiddleware(5)) // Student role
	{
		// ---- Core ----
		student.GET("/profile", controllers.GetStudentProfile)
		student.GET("/dashboard", controllers.GetStudentDashboard)

		// ---- Fees ----
		// *** THIS LINE IS THE FIX FOR HISTORY ***
		student.GET("/fees/summary", controllers.GetStudentFees)
		// *** THIS LINE IS THE FIX FOR PAYMENT ***
		student.POST("/fees/pay", controllers.PayFee)

		// Original, non-unified fee endpoints (keep for compatibility if needed)
		student.GET("/fees/registration", controllers.GetStudentRegistrationFees)
		student.GET("/fees/examination", controllers.GetStudentExaminationFees)

		// ---- Academics ----
		student.GET("/semester/current", controllers.GetCurrentSemester)
		student.GET("/subjects/current", controllers.GetCurrentSemesterSubjects)
		student.GET("/marks/current", controllers.GetCurrentSemesterMarks)
		student.GET("/attendance", controllers.GetStudentAttendance)
	}

	// ================= PROFILE (COMMON) =================
	profile := api.Group("/profile")
	profile.Use(middleware.AuthRoleMiddleware())
	{
		profile.GET("/me", controllers.GetMyProfile)
	}

	r.Run()
}
