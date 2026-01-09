package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/kiranraoboinapally/student/backend/internal/config"
)

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
			RoleID int `gorm:"column:role_id"`
		}
		if err := config.DB.Table("users").Select("role_id").Where("user_id = ?", userID).Scan(&result).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "could not fetch user role"})
			return
		}

		for _, r := range allowedRoles {
			if r == result.RoleID {
				c.Set("role_id", result.RoleID)
				c.Next()
				return
			}
		}

		// Allow Institute Admin (3) if it wasn't explicitly forbidden (assuming logic intent)
		// Actually best to just rely on allowedRoles passing in 3.
		// But if we want to add special logic for role 3:
		if result.RoleID == 3 {
			// Check if we want to allow role 3 for specific routes even if not in allowedRoles?
			// The user requirement implies we should just use allowedRoles properly in router.go.
			// Let's stick to the standard logic but ensure we pass 3 in router.
			// However, the previous plan mentioned modifying this file.
			// Let's just ensure no logic blocks ID 3.
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden: insufficient role permissions"})
	}
}
