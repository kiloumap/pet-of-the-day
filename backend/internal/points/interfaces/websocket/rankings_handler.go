package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"pet-of-the-day/internal/points/application/queries"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/events"
)

// RankingsHandler handles WebSocket connections for real-time group rankings
type RankingsHandler struct {
	// Query handlers
	getGroupRankingsHandler *queries.GetGroupRankingsHandler
	getPetOfTheDayHandler   *queries.GetPetOfTheDayHandler

	// Event bus for listening to behavior events
	eventBus events.EventBus

	// Connection management
	connections map[string]*Connection // connection ID -> connection
	groups      map[uuid.UUID][]string // group ID -> connection IDs
	mu          sync.RWMutex

	// Configuration
	upgrader websocket.Upgrader
}

// Connection represents a WebSocket connection with metadata
type Connection struct {
	ID       string
	Conn     *websocket.Conn
	UserID   uuid.UUID
	GroupID  uuid.UUID
	LastPing time.Time
	Send     chan []byte
	Done     chan struct{}
}

// Message types for WebSocket communication
const (
	MessageTypeRankingsUpdate = "rankings_update"
	MessageTypePetOfTheDayUpdate = "pet_of_the_day_update"
	MessageTypeError = "error"
	MessageTypePing = "ping"
	MessageTypePong = "pong"
)

// WebSocket message structure
type WebSocketMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data,omitempty"`
	Error     string      `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// NewRankingsHandler creates a new WebSocket rankings handler
func NewRankingsHandler(
	getGroupRankingsHandler *queries.GetGroupRankingsHandler,
	getPetOfTheDayHandler *queries.GetPetOfTheDayHandler,
	eventBus events.EventBus,
) *RankingsHandler {
	handler := &RankingsHandler{
		getGroupRankingsHandler: getGroupRankingsHandler,
		getPetOfTheDayHandler:   getPetOfTheDayHandler,
		eventBus:                eventBus,
		connections:             make(map[string]*Connection),
		groups:                  make(map[uuid.UUID][]string),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// In production, implement proper origin checking
				return true
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	}

	// Subscribe to relevant events
	handler.subscribeToEvents()

	// Start cleanup routine
	go handler.cleanupRoutine()

	return handler
}

// HandleConnection handles a new WebSocket connection for group rankings
func (h *RankingsHandler) HandleConnection(w http.ResponseWriter, r *http.Request, groupID uuid.UUID) {
	// Get user ID from context
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	// Create connection object
	connID := generateConnectionID()
	connection := &Connection{
		ID:       connID,
		Conn:     conn,
		UserID:   userID,
		GroupID:  groupID,
		LastPing: time.Now(),
		Send:     make(chan []byte, 256),
		Done:     make(chan struct{}),
	}

	// Register connection
	h.registerConnection(connection)

	// Send initial rankings data
	go h.sendInitialData(connection)

	// Start connection handlers
	go h.readPump(connection)
	go h.writePump(connection)
}

// registerConnection adds a connection to the handler's tracking
func (h *RankingsHandler) registerConnection(conn *Connection) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Add to connections map
	h.connections[conn.ID] = conn

	// Add to group subscribers
	if _, exists := h.groups[conn.GroupID]; !exists {
		h.groups[conn.GroupID] = make([]string, 0)
	}
	h.groups[conn.GroupID] = append(h.groups[conn.GroupID], conn.ID)

	log.Printf("WebSocket connection registered: %s (user: %s, group: %s)",
		conn.ID, conn.UserID, conn.GroupID)
}

// unregisterConnection removes a connection from tracking
func (h *RankingsHandler) unregisterConnection(connID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	conn, exists := h.connections[connID]
	if !exists {
		return
	}

	// Remove from connections map
	delete(h.connections, connID)

	// Remove from group subscribers
	if groupConns, exists := h.groups[conn.GroupID]; exists {
		filtered := make([]string, 0, len(groupConns)-1)
		for _, id := range groupConns {
			if id != connID {
				filtered = append(filtered, id)
			}
		}
		if len(filtered) == 0 {
			delete(h.groups, conn.GroupID)
		} else {
			h.groups[conn.GroupID] = filtered
		}
	}

	// Close connection
	close(conn.Send)
	close(conn.Done)
	conn.Conn.Close()

	log.Printf("WebSocket connection unregistered: %s", connID)
}

// sendInitialData sends current rankings and Pet of the Day data to a new connection
func (h *RankingsHandler) sendInitialData(conn *Connection) {
	ctx := context.Background()

	// Send current rankings
	rankingsQuery := &queries.GetGroupRankingsQuery{
		GroupID: conn.GroupID,
		Date:    time.Now().UTC(),
		UserID:  conn.UserID,
	}

	rankings, err := h.getGroupRankingsHandler.Handle(ctx, rankingsQuery)
	if err == nil {
		h.sendMessage(conn, MessageTypeRankingsUpdate, rankings)
	}

	// Send current Pet of the Day
	potdQuery := &queries.GetPetOfTheDayQuery{
		GroupID: conn.GroupID,
		Date:    time.Now().UTC().AddDate(0, 0, -1), // Yesterday's winner
		UserID:  conn.UserID,
	}

	petOfTheDay, err := h.getPetOfTheDayHandler.Handle(ctx, potdQuery)
	if err == nil && petOfTheDay != nil {
		h.sendMessage(conn, MessageTypePetOfTheDayUpdate, petOfTheDay)
	}
}

// readPump handles incoming WebSocket messages from the client
func (h *RankingsHandler) readPump(conn *Connection) {
	defer func() {
		h.unregisterConnection(conn.ID)
	}()

	// Set read deadline and pong handler
	conn.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.Conn.SetPongHandler(func(string) error {
		conn.LastPing = time.Now()
		conn.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		select {
		case <-conn.Done:
			return
		default:
			var msg WebSocketMessage
			err := conn.Conn.ReadJSON(&msg)
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("WebSocket error: %v", err)
				}
				return
			}

			// Handle ping messages
			if msg.Type == MessageTypePing {
				h.sendMessage(conn, MessageTypePong, nil)
			}
		}
	}
}

// writePump handles outgoing WebSocket messages to the client
func (h *RankingsHandler) writePump(conn *Connection) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		conn.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-conn.Send:
			conn.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				conn.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := conn.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}

		case <-ticker.C:
			conn.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := conn.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}

		case <-conn.Done:
			return
		}
	}
}

// sendMessage sends a structured message to a specific connection
func (h *RankingsHandler) sendMessage(conn *Connection, msgType string, data interface{}) {
	message := WebSocketMessage{
		Type:      msgType,
		Data:      data,
		Timestamp: time.Now(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling WebSocket message: %v", err)
		return
	}

	select {
	case conn.Send <- messageBytes:
	case <-conn.Done:
	default:
		// Channel is full, connection is slow or dead
		h.unregisterConnection(conn.ID)
	}
}

// broadcastToGroup sends a message to all connections subscribed to a group
func (h *RankingsHandler) broadcastToGroup(groupID uuid.UUID, msgType string, data interface{}) {
	h.mu.RLock()
	connectionIDs, exists := h.groups[groupID]
	if !exists {
		h.mu.RUnlock()
		return
	}

	// Create a copy of connection IDs to avoid holding the read lock
	connIDs := make([]string, len(connectionIDs))
	copy(connIDs, connectionIDs)
	h.mu.RUnlock()

	// Send to each connection
	for _, connID := range connIDs {
		h.mu.RLock()
		conn, exists := h.connections[connID]
		h.mu.RUnlock()

		if exists {
			h.sendMessage(conn, msgType, data)
		}
	}
}

// subscribeToEvents sets up event listeners for behavior-related events
func (h *RankingsHandler) subscribeToEvents() {
	// Listen for behavior log events
	h.eventBus.Subscribe("behavior_log_created", h.handleBehaviorLogEvent)
	h.eventBus.Subscribe("behavior_log_updated", h.handleBehaviorLogEvent)
	h.eventBus.Subscribe("behavior_log_deleted", h.handleBehaviorLogEvent)

	// Listen for Pet of the Day events
	h.eventBus.Subscribe("pet_of_the_day_selected", h.handlePetOfTheDayEvent)
}

// handleBehaviorLogEvent handles behavior log events and broadcasts updated rankings
func (h *RankingsHandler) handleBehaviorLogEvent(eventData interface{}) {
	// Parse event data to extract group IDs
	data, ok := eventData.(map[string]interface{})
	if !ok {
		return
	}

	groupIDsInterface, exists := data["group_ids"]
	if !exists {
		return
	}

	groupIDs, ok := groupIDsInterface.([]uuid.UUID)
	if !ok {
		return
	}

	// Broadcast updated rankings to affected groups
	for _, groupID := range groupIDs {
		go h.broadcastUpdatedRankings(groupID)
	}
}

// handlePetOfTheDayEvent handles Pet of the Day selection events
func (h *RankingsHandler) handlePetOfTheDayEvent(eventData interface{}) {
	data, ok := eventData.(map[string]interface{})
	if !ok {
		return
	}

	groupIDInterface, exists := data["group_id"]
	if !exists {
		return
	}

	groupID, ok := groupIDInterface.(uuid.UUID)
	if !ok {
		return
	}

	// Broadcast Pet of the Day update
	go h.broadcastPetOfTheDayUpdate(groupID)
}

// broadcastUpdatedRankings fetches and broadcasts current rankings for a group
func (h *RankingsHandler) broadcastUpdatedRankings(groupID uuid.UUID) {
	ctx := context.Background()

	// Get a user ID from one of the connections (for authorization)
	h.mu.RLock()
	connectionIDs, exists := h.groups[groupID]
	if !exists || len(connectionIDs) == 0 {
		h.mu.RUnlock()
		return
	}
	
	firstConnID := connectionIDs[0]
	conn, exists := h.connections[firstConnID]
	if !exists {
		h.mu.RUnlock()
		return
	}
	userID := conn.UserID
	h.mu.RUnlock()

	// Fetch updated rankings
	query := &queries.GetGroupRankingsQuery{
		GroupID: groupID,
		Date:    time.Now().UTC(),
		UserID:  userID,
	}

	rankings, err := h.getGroupRankingsHandler.Handle(ctx, query)
	if err != nil {
		log.Printf("Error fetching rankings for broadcast: %v", err)
		return
	}

	// Broadcast to group
	h.broadcastToGroup(groupID, MessageTypeRankingsUpdate, rankings)
}

// broadcastPetOfTheDayUpdate fetches and broadcasts Pet of the Day update for a group
func (h *RankingsHandler) broadcastPetOfTheDayUpdate(groupID uuid.UUID) {
	ctx := context.Background()

	// Get a user ID from one of the connections (for authorization)
	h.mu.RLock()
	connectionIDs, exists := h.groups[groupID]
	if !exists || len(connectionIDs) == 0 {
		h.mu.RUnlock()
		return
	}
	
	firstConnID := connectionIDs[0]
	conn, exists := h.connections[firstConnID]
	if !exists {
		h.mu.RUnlock()
		return
	}
	userID := conn.UserID
	h.mu.RUnlock()

	// Fetch Pet of the Day
	query := &queries.GetPetOfTheDayQuery{
		GroupID: groupID,
		Date:    time.Now().UTC().AddDate(0, 0, -1), // Yesterday's winner
		UserID:  userID,
	}

	petOfTheDay, err := h.getPetOfTheDayHandler.Handle(ctx, query)
	if err != nil {
		log.Printf("Error fetching Pet of the Day for broadcast: %v", err)
		return
	}

	// Broadcast to group
	h.broadcastToGroup(groupID, MessageTypePetOfTheDayUpdate, petOfTheDay)
}

// cleanupRoutine periodically removes stale connections
func (h *RankingsHandler) cleanupRoutine() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			h.cleanupStaleConnections()
		}
	}
}

// cleanupStaleConnections removes connections that haven't pinged recently
func (h *RankingsHandler) cleanupStaleConnections() {
	now := time.Now()
	staleThreshold := 120 * time.Second

	h.mu.RLock()
	var staleConnections []string
	for connID, conn := range h.connections {
		if now.Sub(conn.LastPing) > staleThreshold {
			staleConnections = append(staleConnections, connID)
		}
	}
	h.mu.RUnlock()

	// Remove stale connections
	for _, connID := range staleConnections {
		h.unregisterConnection(connID)
	}

	if len(staleConnections) > 0 {
		log.Printf("Cleaned up %d stale WebSocket connections", len(staleConnections))
	}
}

// GetConnectionStats returns current connection statistics
func (h *RankingsHandler) GetConnectionStats() map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()

	stats := map[string]interface{}{
		"total_connections": len(h.connections),
		"groups_with_connections": len(h.groups),
		"connections_by_group": make(map[string]int),
	}

	for groupID, connIDs := range h.groups {
		stats["connections_by_group"].(map[string]int)[groupID.String()] = len(connIDs)
	}

	return stats
}

// generateConnectionID creates a unique connection identifier
func generateConnectionID() string {
	return fmt.Sprintf("conn_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])
}
