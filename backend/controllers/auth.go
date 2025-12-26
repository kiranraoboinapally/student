package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
	"github.com/kiranraoboinapally/student/backend/utils"
)

// ================= REGISTER =================

type RegisterRequest struct {
	EnrollmentNumber string `json:"enrollment_number" binding:"required"`
	Email            string `json:"email" binding:"required,email"`
	Password         string `json:"password" binding:"required,min=6"`
	FullName         string `json:"full_name"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var master models.MasterStudent

	// Validate enrollment number
	enNum, err := strconv.ParseInt(req.EnrollmentNumber, 10, 64)
	if err != nil || enNum == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment number"})
		return
	}

	if err := db.Where("enrollment_number = ?", enNum).First(&master).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student not found"})
		return
	}

	// Check if user already exists
	var existing models.User
	if err := db.Where("username = ? OR email = ?", req.EnrollmentNumber, req.Email).
		First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user already exists"})
		return
	}

	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "password hashing failed"})
		return
	}

	fullName := req.FullName
	if fullName == "" {
		fullName = master.StudentName
	}

	user := models.User{
		Username:       req.EnrollmentNumber,
		Email:          req.Email,
		PasswordHash:   hashed,
		FullName:       fullName,
		RoleID:         5,          // student
		Status:         "inactive", // admin approval required
		IsTempPassword: false,      // student sets own password
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "registration successful, awaiting admin approval",
	})
}

// ================= LOGIN =================

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var user models.User

	if err := db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if user.Status != "active" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "account pending admin approval",
		})
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.UserID,
		"username": user.Username,
		"role_id":  user.RoleID,
		"exp":      time.Now().Add(time.Hour * time.Duration(config.JwtExpiresHours)).Unix(),
	})

	tokenStr, err := token.SignedString([]byte(config.JwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token creation failed"})
		return
	}

	db.Model(&user).Update("last_login", time.Now())

	c.JSON(http.StatusOK, gin.H{
		"token":                 tokenStr,
		"expires_in_hours":      config.JwtExpiresHours,
		"force_password_change": user.IsTempPassword,
		"role_id":               user.RoleID,
	})
}

// ================= CHANGE PASSWORD =================

type ChangePasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

func ChangePassword(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID := int64(userIDVal.(float64))

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashed, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "password hashing failed"})
		return
	}

	if err := config.DB.Model(&models.User{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"password_hash":    hashed,
			"is_temp_password": false,
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "password update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password changed successfully"})
}

// ================= FORGOT PASSWORD =================

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var user models.User

	if err := db.Where("email = ? AND status = 'active'", req.Email).
		First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "if email exists, reset link will be sent"})
		return
	}

	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)

	expiresAt := time.Now().Add(1 * time.Hour)

	db.Exec("UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ?", user.UserID)

	db.Table("password_reset_tokens").Create(map[string]interface{}{
		"user_id":    user.UserID,
		"email":      req.Email,
		"token":      token,
		"expires_at": expiresAt,
		"used":       false,
	})

	// ⚠️ DEV ONLY – send via email in production
	c.JSON(http.StatusOK, gin.H{
		"message": "if email exists, reset link will be sent",
		"token":   token,
	})
}

// ================= RESET PASSWORD =================

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

func ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var reset struct {
		ID        int
		UserID    int64
		ExpiresAt time.Time
		Used      bool
	}

	if err := db.Table("password_reset_tokens").
		Where("token = ? AND used = FALSE", req.Token).
		First(&reset).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired token"})
		return
	}

	if time.Now().After(reset.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token expired"})
		return
	}

	hashed, _ := utils.HashPassword(req.NewPassword)

	tx := db.Begin()
	tx.Model(&models.User{}).
		Where("user_id = ?", reset.UserID).
		Update("password_hash", hashed)

	tx.Table("password_reset_tokens").
		Where("id = ?", reset.ID).
		Update("used", true)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "password reset successful"})
}
