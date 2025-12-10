// main.go
package main

import (
	"time"

	"github.com/gin-contrib/cors" // << add this
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
		AllowOrigins:     []string{"http://localhost:5173"}, // your dev frontend origin
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	// ---------------------------------------------------------

	api := r.Group("/api")

	// Public auth routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
	}

	// Admin routes - require role 1 (Admin)
	admin := api.Group("/admin")
	admin.Use(middleware.AuthRoleMiddleware(1)) // only Admin (role_id = 1)
	{
		admin.POST("/create-user", controllers.CreateUserByAdmin)
		// add more admin routes here.
	}

	// Student-only routes - require role 5
	students := api.Group("/students")
	students.Use(middleware.AuthRoleMiddleware(5)) // only students allowed
	{
		students.GET("/me", controllers.GetMyProfile)
		students.GET("/fees", controllers.GetStudentFees)
		students.GET("/dashboard", controllers.GetStudentDashboard)
	}

	// General profile route - any logged-in user
	profile := api.Group("/profile")
	profile.Use(middleware.AuthRoleMiddleware()) // any authenticated user
	{
		profile.GET("/me", controllers.GetMyProfile)
	}

	r.Run(":" + config.ServerPort)
}
