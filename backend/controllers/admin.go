package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kiranraoboinapally/student/backend/config"
	"github.com/kiranraoboinapally/student/backend/models"
	"github.com/kiranraoboinapally/student/backend/utils"
)

// ---------------- Admin User Creation ----------------
type AdminCreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name"`
	RoleID   int    `json:"role_id" binding:"required"`
}

func CreateUserByAdmin(c *gin.Context) {
	var req AdminCreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var existing models.User
	if err := db.Where("email = ?", req.Email).Or("username = ?", req.Username).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user with this email or username already exists"})
		return
	}

	var roleExists int64
	_ = db.Table("roles").Where("role_id = ?", req.RoleID).Count(&roleExists).Error
	if roleExists == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requested role_id does not exist"})
		return
	}

	hashed, _ := utils.HashPassword(req.Password)
	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashed,
		FullName:     req.FullName,
		RoleID:       req.RoleID,
		Status:       "active",
	}
	db.Create(&user)

	c.JSON(http.StatusCreated, gin.H{"message": "user created", "user_id": user.UserID, "role_id": user.RoleID})
}

// ---------------- Get Pending Registrations ----------------
func GetPendingRegistrations(c *gin.Context) {
	db := config.DB
	var users []models.User

	if err := db.Where("status = ? AND role_id = ?", "pending", 5).
		Order("created_at desc").
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch pending registrations"})
		return
	}

	safeUsers := make([]gin.H, len(users))
	for i, u := range users {
		safeUsers[i] = gin.H{
			"user_id":    u.UserID,
			"username":   u.Username,
			"email":      u.Email,
			"full_name":  u.FullName,
			"role_id":    u.RoleID,
			"status":     u.Status,
			"created_at": u.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{"pending_registrations": safeUsers})
}

// ---------------- Approve Registration ----------------
type ApproveRegistrationRequest struct {
	UserID int64  `json:"user_id" binding:"required"`
	Action string `json:"action" binding:"required"`
}

func ApproveRegistration(c *gin.Context) {
	var req ApproveRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Action != "approve" && req.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action must be 'approve' or 'reject'"})
		return
	}

	db := config.DB
	var user models.User
	if err := db.Where("user_id = ? AND status = ?", req.UserID, "pending").First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "pending registration not found"})
		return
	}

	newStatus := "active"
	if req.Action == "reject" {
		newStatus = "rejected"
	}

	if err := db.Model(&user).Update("status", newStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "registration " + req.Action + "d successfully",
		"user_id": user.UserID,
		"status":  newStatus,
	})
}
