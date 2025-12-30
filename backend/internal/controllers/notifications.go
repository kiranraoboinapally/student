package controllers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/kiranraoboinapally/student/backend/internal/config"
)

var notifHub *notificationHub

type notificationHub struct {
	clients    map[int64]*client
	register   chan *client
	unregister chan *client
	broadcast  chan []byte
	mu         sync.RWMutex
}

type client struct {
	userID int64
	conn   *websocket.Conn
	send   chan []byte
}

func InitNotifications() {
	notifHub = &notificationHub{
		clients:    make(map[int64]*client),
		register:   make(chan *client),
		unregister: make(chan *client),
		broadcast:  make(chan []byte, 256),
	}
	go notifHub.run()
}

func (h *notificationHub) run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			h.clients[c.userID] = c
			h.mu.Unlock()
		case c := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[c.userID]; ok {
				delete(h.clients, c.userID)
				close(c.send)
			}
			h.mu.Unlock()
		case msg := <-h.broadcast:
			h.mu.RLock()
			for _, cl := range h.clients {
				select {
				case cl.send <- msg:
				default:
				}
			}
			h.mu.RUnlock()
		}
	}
}

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func AdminWSHandler(c *gin.Context) {
	tokenStr := c.Query("token")
	if tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
		return
	}
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(config.JwtSecret), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
		return
	}
	var roleID int
	if v, ok := claims["role_id"].(float64); ok {
		roleID = int(v)
	}
	if roleID != 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: admin only"})
		return
	}
	var userID int64
	if v, ok := claims["user_id"].(float64); ok {
		userID = int64(v)
	}

	w := c.Writer
	r := c.Request
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("websocket upgrade error:", err)
		return
	}

	cl := &client{userID: userID, conn: conn, send: make(chan []byte, 256)}
	notifHub.register <- cl
	go cl.writer()
	cl.reader()
}

func (c *client) reader() {
	defer func() { notifHub.unregister <- c; c.conn.Close() }()
	c.conn.SetReadLimit(512)
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func (c *client) writer() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() { ticker.Stop(); c.conn.Close() }()
	for {
		select {
		case msg, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func SendAdminNotification(event string, payload interface{}) {
	if notifHub == nil {
		return
	}
	msg := map[string]interface{}{"event": event, "payload": payload, "ts": time.Now().Unix()}
	b, err := json.Marshal(msg)
	if err != nil {
		return
	}
	notifHub.broadcast <- b
}
