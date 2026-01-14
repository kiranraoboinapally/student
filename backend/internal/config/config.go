package config

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
	"github.com/kiranraoboinapally/student/backend/internal/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB
var JwtSecret string
var JwtExpiresHours int
var ServerPort string

func Init() {
	// load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading environment variables")
	}

	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASS")
	dbName := os.Getenv("DB_NAME")

	JwtSecret = os.Getenv("JWT_SECRET")
	if JwtSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}
	jh := os.Getenv("JWT_EXPIRES_HOURS")
	if jh == "" {
		JwtExpiresHours = 72
	} else {
		v, _ := strconv.Atoi(jh)
		JwtExpiresHours = v
	}

	ServerPort = os.Getenv("SERVER_PORT")
	if ServerPort == "" {
		ServerPort = "8080"
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&collation=utf8mb4_unicode_ci",
		dbUser, dbPass, dbHost, dbPort, dbName)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("failed to connect DB: %v", err)
	}

	DB = db

	// Auto-migrate tables for Faculty Management
	// Disable foreign key checks to avoid circular reference issues
	log.Println("Running auto-migration for tables...")
	DB.Exec("SET FOREIGN_KEY_CHECKS = 0")
	
	// Migrate Faculty table first
	if err := DB.AutoMigrate(&models.Faculty{}); err != nil {
		log.Printf("Warning: Faculty migration error: %v", err)
	}
	
	// Migrate Department table
	if err := DB.AutoMigrate(&models.Department{}); err != nil {
		log.Printf("Warning: Department migration error: %v", err)
	}
	
	// Migrate FacultyCourseAssignment table
	if err := DB.AutoMigrate(&models.FacultyCourseAssignment{}); err != nil {
		log.Printf("Warning: FacultyCourseAssignment migration error: %v", err)
	}
	
	DB.Exec("SET FOREIGN_KEY_CHECKS = 1")
	log.Println("Auto-migration completed")
}


