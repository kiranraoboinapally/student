package middleware

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/kiranraoboinapally/student/backend/internal/config"
)

// Role constants for clarity
const (
	RoleUniversityAdmin = 1
	RoleFaculty         = 2
	RoleInstituteAdmin  = 3
	RoleStudent         = 5
)

// AuthRoleMiddleware validates JWT and optionally checks if user has one of the allowed roles
func AuthRoleMiddleware(allowedRoles ...int) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			return
		}
		parts := strings.Split(header, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header"})
			return
		}
		tokenStr := parts[1]

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(config.JwtSecret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}
		if expRaw, ok := claims["exp"].(float64); ok {
			if time.Now().After(time.Unix(int64(expRaw), 0)) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token expired"})
				return
			}
		}

		var userID int64
		switch v := claims["user_id"].(type) {
		case float64:
			userID = int64(v)
		case int64:
			userID = v
		case int:
			userID = int64(v)
		default:
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid user_id in token"})
			return
		}

		username, _ := claims["username"].(string)

		c.Set("user_id", userID)
		if username != "" {
			c.Set("username", username)
		}

		if len(allowedRoles) == 0 {
			c.Next()
			return
		}

		var result struct {
			RoleID      int  `gorm:"column:role_id"`
			InstituteID *int `gorm:"column:institute_id"`
		}
		if err := config.DB.Table("users").Select("role_id, institute_id").Where("user_id = ?", userID).Scan(&result).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "could not fetch user role"})
			return
		}

		for _, r := range allowedRoles {
			if r == result.RoleID {
				c.Set("role_id", result.RoleID)
				if result.InstituteID != nil {
					c.Set("institute_id", *result.InstituteID)
				}
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden: insufficient role permissions"})
	}
}

// RequireRole is an alias for AuthRoleMiddleware for clarity
func RequireRole(allowedRoles ...int) gin.HandlerFunc {
	return AuthRoleMiddleware(allowedRoles...)
}

// RequireInstitute ensures user belongs to an institute and sets institute_id in context
func RequireInstitute() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		var user struct {
			InstituteID *int `gorm:"column:institute_id"`
		}
		if err := config.DB.Table("users").
			Select("institute_id").
			Where("user_id = ?", userID).
			Scan(&user).Error; err != nil || user.InstituteID == nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "user not linked to any institute"})
			return
		}

		c.Set("institute_id", *user.InstituteID)
		c.Next()
	}
}

// RequireApprovedFaculty ensures faculty account is approved before accessing routes
func RequireApprovedFaculty() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		var faculty struct {
			ApprovalStatus string `gorm:"column:approval_status"`
			InstituteID    int    `gorm:"column:institute_id"`
		}
		if err := config.DB.Table("faculty").
			Select("approval_status, institute_id").
			Where("user_id = ?", userID).
			Scan(&faculty).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "faculty record not found"})
			return
		}

		if faculty.ApprovalStatus != "approved" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "faculty account pending university approval"})
			return
		}

		// Set faculty's institute_id for use in controllers
		c.Set("faculty_institute_id", faculty.InstituteID)
		c.Next()
	}
}

// CollegeBelongsToUser ensures user can only access their own college data
func CollegeBelongsToUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		instituteID, exists := c.Get("institute_id")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "institute context required"})
			return
		}

		// If request has institute_id param, verify it matches user's institute
		requestedInstID := c.Param("institute_id")
		if requestedInstID != "" {
			reqID, err := strconv.Atoi(requestedInstID)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid institute_id parameter"})
				return
			}
			if reqID != instituteID.(int) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "access denied to this institute"})
				return
			}
		}

		// Also check query param
		queryInstID := c.Query("institute_id")
		if queryInstID != "" {
			reqID, err := strconv.Atoi(queryInstID)
			if err == nil && reqID != instituteID.(int) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "access denied to this institute"})
				return
			}
		}

		c.Next()
	}
}

