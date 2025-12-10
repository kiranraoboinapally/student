package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/kiranraoboinapally/student/backend/config"
)

// AuthRoleMiddleware verifies JWT and (optionally) enforces allowed role IDs.
// - If no allowedRoles are provided, it only authenticates the token.
// - If allowedRoles provided, it also checks user's role_id from users table.
func AuthRoleMiddleware(allowedRoles ...int) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1) Get Authorization header
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

		// 2) Parse token
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(config.JwtSecret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		// 3) Extract claims safely
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}
		// expiry check
		if expRaw, ok := claims["exp"].(float64); ok {
			if time.Now().After(time.Unix(int64(expRaw), 0)) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token expired"})
				return
			}
		}

		// 4) user_id and username safe extraction
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

		username, _ := claims["username"].(string) // username optional

		// set base context values
		c.Set("user_id", userID)
		if username != "" {
			c.Set("username", username)
		}

		// 5) If no role checks required, continue
		if len(allowedRoles) == 0 {
			c.Next()
			return
		}

		// 6) Otherwise fetch user's role from DB and authorize
		var result struct {
			RoleID int `gorm:"column:role_id"`
		}
		if err := config.DB.Table("users").Select("role_id").Where("user_id = ?", userID).Scan(&result).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "could not fetch user role"})
			return
		}

		// check if user's roleID is allowed
		for _, r := range allowedRoles {
			if r == result.RoleID {
				// also set role in context for handlers
				c.Set("role_id", result.RoleID)
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden: insufficient role permissions"})
	}
}
