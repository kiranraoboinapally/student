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

	// ---------- CORS: allow frontend to call backend ----------
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // your frontend origin
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	// ---------------------------------------------------------

	api := r.Group("/api")

	// ---------------- Auth Routes ----------------
	auth := api.Group("/auth")
	{
		auth.POST("/register", controllers.Register) // from second version
		auth.POST("/login", controllers.Login)
		auth.POST("/change-password", middleware.AuthRoleMiddleware(5), controllers.ChangePassword) // from first version
	}

	// ---------------- Admin Routes ----------------
	admin := api.Group("/admin")
	admin.Use(middleware.AuthRoleMiddleware(1)) // only Admin
	{
		// From first version
		admin.POST("/students/add", controllers.AddStudent)
		admin.PUT("/students/generate-enrollment/:id", controllers.GenerateEnrollment)
		admin.POST("/students/activate-login/:id", controllers.ActivateStudentLogin)
		admin.GET("/students", controllers.ListStudents)

		// Optional from second version
		admin.POST("/create-user", controllers.CreateUserByAdmin)
	}

	// ---------------- Student Routes ----------------
	students := api.Group("/students")
	students.Use(middleware.AuthRoleMiddleware(5)) // only students
	{
		students.GET("/dashboard", controllers.GetStudentDashboard)
		students.GET("/fees", controllers.GetStudentFees)
		students.POST("/fees/pay", controllers.PayFee)
		students.GET("/me", controllers.GetMyProfile)
	}

	// ---------------- Profile Routes ----------------
	profile := api.Group("/profile")
	profile.Use(middleware.AuthRoleMiddleware()) // any logged-in user
	{
		profile.GET("/me", controllers.GetMyProfile)
	}

	r.Run(":" + config.ServerPort)
}
