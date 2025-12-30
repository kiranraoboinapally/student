// main.go - FULLY UPDATED VERSION WITH ALL APIs

package main

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/kiranraoboinapally/student/backend/internal/api"
	"github.com/kiranraoboinapally/student/backend/internal/config"
	icontrollers "github.com/kiranraoboinapally/student/backend/internal/controllers"
)

func main() {
	_ = godotenv.Load()

	config.Init()

	// Initialize services
	// Razorpay init (will panic if env vars missing in dev)
	icontrollers.InitRazorpay()
	// Websocket hub
	icontrollers.InitNotifications()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Register API routes defined in internal/api
	api.RegisterAPIRoutes(r)

	// Admin websocket for notifications
	r.GET("/ws/admin", icontrollers.AdminWSHandler)

	// Start server
	r.Run()
}
