package middleware

// import (
// 	"net/http"

// 	"github.com/gin-gonic/gin"
// 	"github.com/kiranraoboinapally/student/backend/config"
// )

// // RoleMiddleware checks if the logged-in user has one of the allowed roles.
// // Example usage:
// // admin.Use(AuthMiddleware(), RoleMiddleware(1))   // only role 1 allowed (Admin)
// // admin.Use(AuthMiddleware(), RoleMiddleware(1,2)) // role 1 or 2 allowed
// func RoleMiddleware(allowedRoles ...int) gin.HandlerFunc {
// 	return func(c *gin.Context) {

// 		// user_id is set by AuthMiddleware
// 		uidVal, ok := c.Get("user_id")
// 		if !ok {
// 			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
// 			return
// 		}

// 		var uid int64
// 		switch v := uidVal.(type) {
// 		case int64:
// 			uid = v
// 		case float64: // in rare cases number comes from JSON float
// 			uid = int64(v)
// 		case int:
// 			uid = int64(v)
// 		default:
// 			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid user id"})
// 			return
// 		}

// 		// fetch user role from database
// 		var result struct {
// 			RoleID int `gorm:"column:role_id"`
// 		}

// 		if err := config.DB.Table("users").
// 			Select("role_id").
// 			Where("user_id = ?", uid).
// 			Scan(&result).Error; err != nil {

// 			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "could not fetch role"})
// 			return
// 		}

// 		// Check if user role is allowed
// 		for _, role := range allowedRoles {
// 			if role == result.RoleID {
// 				c.Next()
// 				return
// 			}
// 		}

// 		// Not allowed
// 		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden: insufficient role permissions"})
// 	}
// }
