package ws

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/knnedy/procstream/internal/metrics"
	"github.com/knnedy/procstream/internal/proc"
)

// Payload is the complete JSON object broadcast to every client on each tick.
// Embeds metrics.Snapshot so its fields appear inline in the JSON output.
type Payload struct {
	metrics.Snapshot
	Processes []proc.Entry `json:"processes"`
}

// initMessage is sent once to a client immediately after they connect.
// Contains static system info that never changes during a session.
type initMessage struct {
	Type       string              `json:"type"`
	SystemInfo *metrics.SystemInfo `json:"systemInfo"`
}

// client represents one connected browser tab
type client struct {
	conn *websocket.Conn
	// buffered channel — if the client is slow, up to 8 frames queue
	// before we start dropping rather than blocking the broadcast loop.
	send chan []byte
}

// Hub manages all active WebSocket connections and the metrics ticker.
type Hub struct {
	mu         sync.RWMutex
	clients    map[*client]struct{}
	interval   time.Duration
	systemInfo *metrics.SystemInfo
}

func NewHub(interval time.Duration) *Hub {
	sysInfo, err := metrics.CollectSystemInfo()
	if err != nil {
		log.Printf("system info collect error: %v", err)
		sysInfo = &metrics.SystemInfo{}
	}

	return &Hub{
		clients:    make(map[*client]struct{}),
		interval:   interval,
		systemInfo: sysInfo,
	}
}

// Run starts the metrics ticker
func (h *Hub) Run() {
	ticker := time.NewTicker(h.interval)
	defer ticker.Stop()

	for range ticker.C {
		snap, err := metrics.Collect()
		if err != nil {
			log.Printf("metrics collect error: %v", err)
			continue
		}

		processes, err := proc.List()
		if err != nil {
			log.Printf("proc list error: %v", err)
			continue
		}

		data, err := json.Marshal(Payload{Snapshot: *snap, Processes: processes})
		if err != nil {
			log.Printf("json marshal error: %v", err)
			continue
		}

		h.broadcast(data)
	}
}

func (h *Hub) broadcast(data []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for c := range h.clients {
		select {
		case c.send <- data:
		default:
			log.Printf("client send buffer full, dropping frame")
		}
	}
}

func (h *Hub) register(c *client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c] = struct{}{}
	log.Printf("client connected - total: %d", len(h.clients))
}

func (h *Hub) unregister(c *client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.clients[c]; ok {
		delete(h.clients, c)
		close(c.send)
		log.Printf("client disconnected - total: %d", len(h.clients))
	}
}

// ServeWS upgrades an HTTP request to a WebSocket connection
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		// required because frontend and backend share the same origin
		InsecureSkipVerify: true,
	})
	if err != nil {
		log.Printf("websocket accept error: %v", err)
		return
	}

	c := &client{
		conn: conn,
		send: make(chan []byte, 8),
	}

	h.register(c)
	defer h.unregister(c)

	// send system info immediately on connect before the first tick
	if err := h.sendSystemInfo(c); err != nil {
		log.Printf("system info send error: %v", err)
		return
	}

	go c.readPump()
	c.writePump()
}

// sendSystemInfo sends the static system info to a single client on connect.
func (h *Hub) sendSystemInfo(c *client) error {
	data, err := json.Marshal(initMessage{
		Type:       "init",
		SystemInfo: h.systemInfo,
	})
	if err != nil {
		return err
	}
	c.send <- data
	return nil
}

// writePump drains the send channel and writes frames to the connection.
func (c *client) writePump() {
	ctx := context.Background()
	for data := range c.send {
		if err := c.conn.Write(ctx, websocket.MessageText, data); err != nil {
			log.Printf("websocket write error: %v", err)
			return
		}
	}
}

// readPump detects client disconnection. When Read() errors, it closes
// the connection which unblocks writePump and triggers unregister.
func (c *client) readPump() {
	ctx := context.Background()
	defer c.conn.Close(websocket.StatusNormalClosure, "")
	for {
		if _, _, err := c.conn.Read(ctx); err != nil {
			return
		}
	}
}
