package http

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"pet-of-the-day/internal/points/application/commands"
	"pet-of-the-day/internal/points/application/queries"
	"pet-of-the-day/internal/points/domain"
	"pet-of-the-day/internal/shared/auth"
	sharederrors "pet-of-the-day/internal/shared/errors"
)

type Controller struct {
	getBehaviorsHandler        *queries.GetBehaviorsHandler
	createScoreEventHandler    *commands.CreateScoreEventHandler
	deleteScoreEventHandler    *commands.DeleteScoreEventHandler
	getPetScoreEventsHandler   *queries.GetPetScoreEventsHandler
	getGroupLeaderboardHandler *queries.GetGroupLeaderboardHandler
	getRecentActivitiesHandler *queries.GetRecentActivitiesHandler
}

func NewController(
	getBehaviorsHandler *queries.GetBehaviorsHandler,
	createScoreEventHandler *commands.CreateScoreEventHandler,
	deleteScoreEventHandler *commands.DeleteScoreEventHandler,
	getPetScoreEventsHandler *queries.GetPetScoreEventsHandler,
	getGroupLeaderboardHandler *queries.GetGroupLeaderboardHandler,
	getRecentActivitiesHandler *queries.GetRecentActivitiesHandler,
) *Controller {
	return &Controller{
		getBehaviorsHandler:        getBehaviorsHandler,
		createScoreEventHandler:    createScoreEventHandler,
		deleteScoreEventHandler:    deleteScoreEventHandler,
		getPetScoreEventsHandler:   getPetScoreEventsHandler,
		getGroupLeaderboardHandler: getGroupLeaderboardHandler,
		getRecentActivitiesHandler: getRecentActivitiesHandler,
	}
}

// GetBehaviors returns all behaviors, optionally filtered by species
func (c *Controller) GetBehaviors(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	species := r.URL.Query().Get("species")

	var behaviors []domain.Behavior
	var err error

	if species != "" {
		behaviors, err = c.getBehaviorsHandler.GetBySpecies(ctx, species)
	} else {
		behaviors, err = c.getBehaviorsHandler.GetAll(ctx)
	}

	if err != nil {
		_, ok := err.(*queries.InvalidSpeciesError)
		if ok {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidInput, err.Error(), http.StatusBadRequest)
		} else {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to fetch behaviors", http.StatusInternalServerError)
		}
		return
	}

	response := map[string]interface{}{
		"behaviors": behaviors,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// CreateScoreEvent creates a new score event
func (c *Controller) CreateScoreEvent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userUUID, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, "User not authenticated", http.StatusUnauthorized)
		return
	}

	var req struct {
		PetID      string    `json:"pet_id"`
		BehaviorID string    `json:"behavior_id"`
		GroupID    string    `json:"group_id"`
		Comment    *string   `json:"comment,omitempty"`
		ActionDate *string   `json:"action_date,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidInput, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.PetID == "" {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeMissingField, "Pet ID is required", http.StatusBadRequest)
		return
	}
	if req.BehaviorID == "" {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeMissingField, "Behavior ID is required", http.StatusBadRequest)
		return
	}
	if req.GroupID == "" {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeMissingField, "Group ID is required", http.StatusBadRequest)
		return
	}

	// Parse UUIDs
	petUUID, err := uuid.Parse(req.PetID)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid pet ID", http.StatusBadRequest)
		return
	}

	behaviorUUID, err := uuid.Parse(req.BehaviorID)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid behavior ID", http.StatusBadRequest)
		return
	}

	groupUUID, err := uuid.Parse(req.GroupID)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Parse action date if provided
	actionDate := time.Now()
	if req.ActionDate != nil && *req.ActionDate != "" {
		parsedDate, err := time.Parse("2006-01-02", *req.ActionDate)
		if err != nil {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid date format (YYYY-MM-DD)", http.StatusBadRequest)
			return
		}
		actionDate = parsedDate
	}

	// Build request for domain layer
	comment := ""
	if req.Comment != nil {
		comment = *req.Comment
	}

	createReq := domain.CreateScoreEventRequest{
		PetID:      petUUID,
		BehaviorID: behaviorUUID,
		GroupID:    groupUUID,
		UserID:     userUUID,
		Comment:    comment,
		ActionDate: actionDate,
	}

	// Create score event using application layer
	scoreEvent, err := c.createScoreEventHandler.Handle(ctx, createReq)
	if err != nil {
		// Handle different error types
		switch e := err.(type) {
		case *commands.AuthorizationError:
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, e.Error(), http.StatusForbidden)
		case *commands.NotFoundError:
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeValidationFailed, e.Error(), http.StatusNotFound)
		default:
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to create score event", http.StatusInternalServerError)
		}
		return
	}

	response := map[string]interface{}{
		"id":          scoreEvent.ID.String(),
		"pet_id":      scoreEvent.PetID.String(),
		"behavior_id": scoreEvent.BehaviorID.String(),
		"group_id":    scoreEvent.GroupID.String(),
		"points":      scoreEvent.Points,
		"comment":     scoreEvent.Comment,
		"recorded_at": scoreEvent.RecordedAt.Format(time.RFC3339),
		"action_date": scoreEvent.ActionDate.Format("2006-01-02"),
		"recorded_by": scoreEvent.RecordedByID.String(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// GetPetScoreEvents returns score events for a specific pet in a group
func (c *Controller) GetPetScoreEvents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	_, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, "User not authenticated", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	petID := vars["petId"]
	groupID := r.URL.Query().Get("group_id")

	if petID == "" {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeMissingField, "Pet ID is required", http.StatusBadRequest)
		return
	}
	if groupID == "" {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeMissingField, "Group ID is required", http.StatusBadRequest)
		return
	}

	petUUID, err := uuid.Parse(petID)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid pet ID", http.StatusBadRequest)
		return
	}

	groupUUID, err := uuid.Parse(groupID)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid group ID", http.StatusBadRequest)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 50 // default
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 200 {
			limit = parsedLimit
		}
	}

	// Use application layer to get pet score events
	result, err := c.getPetScoreEventsHandler.Handle(ctx, petUUID, groupUUID, limit)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to fetch score events", http.StatusInternalServerError)
		return
	}

	// Format events for response
	var formattedEvents []map[string]interface{}
	for _, event := range result.Events {
		formattedEvent := map[string]interface{}{
			"id":          event.ID.String(),
			"pet_id":      event.PetID.String(),
			"behavior_id": event.BehaviorID.String(),
			"group_id":    event.GroupID.String(),
			"points":      event.Points,
			"comment":     event.Comment,
			"recorded_at": event.RecordedAt.Format(time.RFC3339),
			"action_date": event.ActionDate.Format("2006-01-02"),
			"recorded_by": event.RecordedByID.String(),
		}
		formattedEvents = append(formattedEvents, formattedEvent)
	}

	response := map[string]interface{}{
		"events":       formattedEvents,
		"total_points": result.TotalPoints,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetGroupLeaderboard returns the leaderboard for a group
func (c *Controller) GetGroupLeaderboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	_, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, "User not authenticated", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	groupID := vars["groupId"]
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "daily"
	}

	if groupID == "" {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeMissingField, "Group ID is required", http.StatusBadRequest)
		return
	}

	groupUUID, err := uuid.Parse(groupID)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Build request for domain layer
	req := domain.LeaderboardRequest{
		GroupID: groupUUID,
		Period:  domain.Period(period),
	}

	// Use application layer to get leaderboard
	result, err := c.getGroupLeaderboardHandler.Handle(ctx, req)
	if err != nil {
		if err.Error() == "invalid period: "+period {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidInput, "Invalid period (daily or weekly)", http.StatusBadRequest)
		} else {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to fetch leaderboard data", http.StatusInternalServerError)
		}
		return
	}

	// Convert to response format
	var leaderboard []map[string]interface{}
	for _, entry := range result.Leaderboard {
		leaderboard = append(leaderboard, map[string]interface{}{
			"pet_id":        entry.PetID.String(),
			"pet_name":      entry.PetName,
			"species":       entry.Species,
			"owner_name":    entry.OwnerName,
			"total_points":  entry.TotalPoints,
			"actions_count": entry.ActionCount,
			"rank":          entry.Rank,
		})
	}

	response := map[string]interface{}{
		"daily":        leaderboard,
		"weekly":       leaderboard, // Same data for now, could be different queries
		"period_start": result.PeriodStart,
		"period_end":   result.PeriodEnd,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DeleteScoreEvent deletes a score event
func (c *Controller) DeleteScoreEvent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userUUID, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, "User not authenticated", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	eventID := vars["eventId"]

	if eventID == "" {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeMissingField, "Event ID is required", http.StatusBadRequest)
		return
	}

	eventUUID, err := uuid.Parse(eventID)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid event ID", http.StatusBadRequest)
		return
	}

	// Use application layer to delete score event
	err = c.deleteScoreEventHandler.Handle(ctx, userUUID, eventUUID)
	if err != nil {
		// Handle different error types
		switch e := err.(type) {
		case *commands.AuthorizationError:
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, e.Error(), http.StatusForbidden)
		case *commands.NotFoundError:
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeValidationFailed, e.Error(), http.StatusNotFound)
		default:
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to delete score event", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetRecentActivities returns recent activities for the authenticated user
func (c *Controller) GetRecentActivities(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userUUID, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, "User not authenticated", http.StatusUnauthorized)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 20 // default
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	// Use application layer to get recent activities
	activities, err := c.getRecentActivitiesHandler.Handle(ctx, userUUID, limit)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to fetch recent activities", http.StatusInternalServerError)
		return
	}

	// Format activities for response
	var formattedActivities []map[string]interface{}
	for _, activity := range activities {
		formattedActivity := map[string]interface{}{
			"id":            activity.ID.String(),
			"pet_id":        activity.PetID.String(),
			"pet_name":      activity.PetName,
			"behavior_id":   activity.BehaviorID.String(),
			"behavior_name": activity.BehaviorName,
			"group_id":      activity.GroupID.String(),
			"group_name":    activity.GroupName,
			"points":        activity.Points,
			"comment":       activity.Comment,
			"recorded_at":   activity.RecordedAt.Format(time.RFC3339),
			"action_date":   activity.ActionDate.Format("2006-01-02"),
			"recorded_by":   activity.RecordedBy.String(),
		}
		formattedActivities = append(formattedActivities, formattedActivity)
	}

	response := map[string]interface{}{
		"activities": formattedActivities,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// RegisterRoutes registers all points-related routes
func (c *Controller) RegisterRoutes(router *mux.Router, authMiddleware func(http.Handler) http.Handler) {
	// Behaviors routes (public for authenticated users)
	router.Handle("/behaviors", authMiddleware(http.HandlerFunc(c.GetBehaviors))).Methods("GET")

	// Score events routes
	router.Handle("/score-events", authMiddleware(http.HandlerFunc(c.CreateScoreEvent))).Methods("POST")
	router.Handle("/score-events/{eventId}", authMiddleware(http.HandlerFunc(c.DeleteScoreEvent))).Methods("DELETE")

	// Pet score events
	router.Handle("/pets/{petId}/score-events", authMiddleware(http.HandlerFunc(c.GetPetScoreEvents))).Methods("GET")

	// Group leaderboard
	router.Handle("/groups/{groupId}/leaderboard", authMiddleware(http.HandlerFunc(c.GetGroupLeaderboard))).Methods("GET")

	// Recent activities
	router.Handle("/activities/recent", authMiddleware(http.HandlerFunc(c.GetRecentActivities))).Methods("GET")
}