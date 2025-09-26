package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// Hub maintains the set of active clients and broadcasts messages to the clients.
type Hub struct {
	// Registered clients by group ID
	clients map[string]map[*Client]bool

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Inbound messages from the clients.
	broadcast chan *Message

	// Mutex for thread-safe access to clients map
	mu sync.RWMutex

	// Channel to stop the hub
	stop chan struct{}
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan []byte

	// Client's group ID (for targeted broadcasts)
	groupID string

	// Client's user ID
	userID string
}

// Message represents a WebSocket message
type Message struct {
	Type    string      `json:"type"`
	GroupID string      `json:"group_id,omitempty"`
	Data    interface{} `json:"data"`
}

// RankingUpdateMessage represents a ranking update message
type RankingUpdateMessage struct {
	GroupID   string             `json:"group_id"`
	Rankings  []PetRankingUpdate `json:"rankings"`
	Timestamp int64              `json:"timestamp"`
}

// PetRankingUpdate represents a pet's ranking information
type PetRankingUpdate struct {
	PetID               string `json:"pet_id"`
	PetName             string `json:"pet_name"`
	OwnerName           string `json:"owner_name"`
	Position            int    `json:"position"`
	TotalPoints         int    `json:"total_points"`
	NegativeBehaviors   int    `json:"negative_behaviors"`
	LastBehaviorLoggedAt *int64 `json:"last_behavior_logged_at,omitempty"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from any origin during development
		// In production, this should be more restrictive
		return true
	},
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message),
		stop:       make(chan struct{}),
	}
}

// Run starts the hub and handles client registration/unregistration and message broadcasting
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.clients[client.groupID] == nil {
				h.clients[client.groupID] = make(map[*Client]bool)
			}
			h.clients[client.groupID][client] = true
			h.mu.Unlock()

			log.Printf("Client %s registered for group %s", client.userID, client.groupID)

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.groupID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.send)

					// Clean up empty group
					if len(clients) == 0 {
						delete(h.clients, client.groupID)
					}
				}
			}
			h.mu.Unlock()

			log.Printf("Client %s unregistered from group %s", client.userID, client.groupID)

		case message := <-h.broadcast:
			h.mu.RLock()
			clients := h.clients[message.GroupID]
			h.mu.RUnlock()

			if clients != nil {
				messageBytes, err := json.Marshal(message)
				if err != nil {
					log.Printf("Error marshaling message: %v", err)
					continue
				}

				for client := range clients {
					select {
					case client.send <- messageBytes:
					default:
						// Client's send channel is full, close it
						h.mu.Lock()
						delete(clients, client)
						close(client.send)
						if len(clients) == 0 {
							delete(h.clients, message.GroupID)
						}
						h.mu.Unlock()
					}
				}

				log.Printf("Broadcasted %s message to %d clients in group %s",
					message.Type, len(clients), message.GroupID)
			}

		case <-h.stop:
			// Close all client connections
			h.mu.Lock()
			for groupID, clients := range h.clients {
				for client := range clients {
					close(client.send)
					client.conn.Close()
				}
				delete(h.clients, groupID)
			}
			h.mu.Unlock()
			return
		}
	}
}

// Stop gracefully shuts down the hub
func (h *Hub) Stop() {
	close(h.stop)
}

// BroadcastRankingUpdate sends a ranking update to all clients in a group
func (h *Hub) BroadcastRankingUpdate(groupID string, rankings []PetRankingUpdate, timestamp int64) {
	message := &Message{
		Type:    "ranking_update",
		GroupID: groupID,
		Data: RankingUpdateMessage{
			GroupID:   groupID,
			Rankings:  rankings,
			Timestamp: timestamp,
		},
	}

	select {
	case h.broadcast <- message:
	default:
		log.Printf("Failed to send ranking update for group %s: broadcast channel full", groupID)
	}
}

// BroadcastPetOfTheDayUpdate sends pet of the day announcement
func (h *Hub) BroadcastPetOfTheDayUpdate(groupID string, data interface{}) {
	message := &Message{
		Type:    "pet_of_the_day_update",
		GroupID: groupID,
		Data:    data,
	}

	select {
	case h.broadcast <- message:
	default:
		log.Printf("Failed to send pet of the day update for group %s: broadcast channel full", groupID)
	}
}