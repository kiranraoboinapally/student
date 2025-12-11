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
