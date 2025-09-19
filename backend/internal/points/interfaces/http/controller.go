package http

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"pet-of-the-day/ent"
	"pet-of-the-day/ent/behavior"
	"pet-of-the-day/ent/group"
	"pet-of-the-day/ent/membership"
	"pet-of-the-day/ent/pet"
	"pet-of-the-day/ent/scoreevent"
	"pet-of-the-day/ent/user"
	"pet-of-the-day/internal/shared/auth"
	sharederrors "pet-of-the-day/internal/shared/errors"
)

type Controller struct {
	client *ent.Client
}

func NewController(client *ent.Client) *Controller {
	return &Controller{
		client: client,
	}
}

// GetBehaviors returns all behaviors, optionally filtered by species
func (c *Controller) GetBehaviors(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	species := r.URL.Query().Get("species")

	query := c.client.Behavior.Query().Where(behavior.IsGlobal(true))

	if species != "" && (species == "dog" || species == "cat") {
		query = query.Where(behavior.Or(
			behavior.SpeciesEQ(behavior.Species(species)),
			behavior.SpeciesEQ(behavior.Species("both")),
		))
	}

	behaviors, err := query.All(ctx)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to fetch behaviors", http.StatusInternalServerError)
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

	// Verify pet exists and user has access to it
	petEntity, err := c.client.Pet.Query().
		Where(pet.ID(petUUID)).
		WithOwner().
		WithCoOwners().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodePetNotFound, "Pet not found", http.StatusNotFound)
		} else {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to fetch pet", http.StatusInternalServerError)
		}
		return
	}

	// Check if user is owner or co-owner
	hasAccess := false
	if petEntity.Edges.Owner != nil && petEntity.Edges.Owner.ID == userUUID {
		hasAccess = true
	}
	if !hasAccess {
		for _, coOwner := range petEntity.Edges.CoOwners {
			if coOwner.ID == userUUID {
				hasAccess = true
				break
			}
		}
	}
	if !hasAccess {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, "You don't have permission to record actions for this pet", http.StatusForbidden)
		return
	}

	// Verify behavior exists
	behaviorEntity, err := c.client.Behavior.Get(ctx, behaviorUUID)
	if err != nil {
		if ent.IsNotFound(err) {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeValidationFailed, "Behavior not found", http.StatusNotFound)
		} else {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to fetch behavior", http.StatusInternalServerError)
		}
		return
	}

	// Verify group exists and user is a member
	_, err = c.client.Group.Query().
		Where(group.ID(groupUUID)).
		QueryMemberships().
		Where(membership.HasUserWith(user.ID(userUUID))).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, "You are not a member of this group", http.StatusForbidden)
		} else {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to verify group membership", http.StatusInternalServerError)
		}
		return
	}

	// Create score event
	scoreEventBuilder := c.client.ScoreEvent.Create().
		SetPetID(petUUID).
		SetBehaviorID(behaviorUUID).
		SetGroupID(groupUUID).
		SetRecordedByID(userUUID).
		SetPoints(behaviorEntity.Points).
		SetActionDate(actionDate)

	if req.Comment != nil && *req.Comment != "" {
		scoreEventBuilder = scoreEventBuilder.SetComment(*req.Comment)
	}

	scoreEvent, err := scoreEventBuilder.Save(ctx)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to create score event", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"id":          scoreEvent.ID.String(),
		"pet_id":      petUUID.String(),
		"behavior_id": behaviorUUID.String(),
		"group_id":    scoreEvent.GroupID.String(),
		"points":      scoreEvent.Points,
		"comment":     scoreEvent.Comment,
		"recorded_at": scoreEvent.RecordedAt.Format(time.RFC3339),
		"action_date": scoreEvent.ActionDate.Format("2006-01-02"),
		"recorded_by": userUUID.String(),
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

	// Get score events
	events, err := c.client.ScoreEvent.Query().
		Where(
			scoreevent.HasPetWith(pet.ID(petUUID)),
			scoreevent.GroupID(groupUUID),
		).
		WithBehavior().
		Order(ent.Desc(scoreevent.FieldActionDate), ent.Desc(scoreevent.FieldRecordedAt)).
		Limit(limit).
		All(ctx)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to fetch score events", http.StatusInternalServerError)
		return
	}

	// Calculate total points for this pet in this group
	totalPoints, err := c.client.ScoreEvent.Query().
		Where(
			scoreevent.HasPetWith(pet.ID(petUUID)),
			scoreevent.GroupID(groupUUID),
		).
		Aggregate(ent.Sum(scoreevent.FieldPoints)).
		Int(ctx)
	if err != nil {
		totalPoints = 0 // if no events found
	}

	// Format events for response
	var formattedEvents []map[string]interface{}
	for _, event := range events {
		formattedEvent := map[string]interface{}{
			"id":          event.ID.String(),
			"group_id":    event.GroupID.String(),
			"points":      event.Points,
			"comment":     event.Comment,
			"recorded_at": event.RecordedAt.Format(time.RFC3339),
			"action_date": event.ActionDate.Format("2006-01-02"),
		}

		if event.Edges.Pet != nil {
			formattedEvent["pet_id"] = event.Edges.Pet.ID.String()
		}
		if event.Edges.Behavior != nil {
			formattedEvent["behavior_id"] = event.Edges.Behavior.ID.String()
		}
		if event.Edges.RecordedBy != nil {
			formattedEvent["recorded_by"] = event.Edges.RecordedBy.ID.String()
		}

		if event.Edges.Behavior != nil {
			formattedEvent["behavior"] = map[string]interface{}{
				"id":          event.Edges.Behavior.ID.String(),
				"name":        event.Edges.Behavior.Name,
				"description": event.Edges.Behavior.Description,
				"category":    event.Edges.Behavior.Category,
				"points":      event.Edges.Behavior.Points,
			}
		}

		formattedEvents = append(formattedEvents, formattedEvent)
	}

	response := map[string]interface{}{
		"events":       formattedEvents,
		"total_points": totalPoints,
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

	// Calculate date range based on period
	now := time.Now()
	var startDate, endDate time.Time

	switch period {
	case "daily":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		endDate = startDate.Add(24 * time.Hour)
	case "weekly":
		// Start of week (Monday)
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday = 7
		}
		startDate = now.AddDate(0, 0, -(weekday-1))
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())
		endDate = startDate.Add(7 * 24 * time.Hour)
	default:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidInput, "Invalid period (daily or weekly)", http.StatusBadRequest)
		return
	}

	// Query to get leaderboard data
	type LeaderboardResult struct {
		PetID       uuid.UUID `json:"pet_id"`
		PetName     string    `json:"pet_name"`
		Species     string    `json:"species"`
		OwnerName   string    `json:"owner_name"`
		TotalPoints int       `json:"total_points"`
		ActionCount int       `json:"actions_count"`
	}

	// This is a complex query, we'll need to do it in steps
	// First, get all pets in the group and their score events in the period
	events, err := c.client.ScoreEvent.Query().
		Where(
			scoreevent.GroupID(groupUUID),
			scoreevent.ActionDateGTE(startDate),
			scoreevent.ActionDateLT(endDate),
		).
		WithPet(func(pq *ent.PetQuery) {
			pq.WithOwner()
		}).
		All(ctx)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to fetch leaderboard data", http.StatusInternalServerError)
		return
	}

	// Aggregate by pet
	petStats := make(map[uuid.UUID]LeaderboardResult)
	for _, event := range events {
		if event.Edges.Pet == nil {
			continue
		}

		petID := event.Edges.Pet.ID
		if stats, exists := petStats[petID]; exists {
			stats.TotalPoints += event.Points
			stats.ActionCount++
			petStats[petID] = stats
		} else {
			ownerName := "Unknown"
			if event.Edges.Pet.Edges.Owner != nil {
				ownerName = event.Edges.Pet.Edges.Owner.FirstName + " " + event.Edges.Pet.Edges.Owner.LastName
			}

			petStats[petID] = LeaderboardResult{
				PetID:       petID,
				PetName:     event.Edges.Pet.Name,
				Species:     event.Edges.Pet.Species,
				OwnerName:   ownerName,
				TotalPoints: event.Points,
				ActionCount: 1,
			}
		}
	}

	// Convert to slice and sort by points (descending)
	var leaderboard []map[string]interface{}
	for _, stats := range petStats {
		leaderboard = append(leaderboard, map[string]interface{}{
			"pet_id":       stats.PetID.String(),
			"pet_name":     stats.PetName,
			"species":      stats.Species,
			"owner_name":   stats.OwnerName,
			"total_points": stats.TotalPoints,
			"actions_count": stats.ActionCount,
		})
	}

	// Sort by total points (descending)
	for i := 0; i < len(leaderboard); i++ {
		for j := i + 1; j < len(leaderboard); j++ {
			if leaderboard[j]["total_points"].(int) > leaderboard[i]["total_points"].(int) {
				leaderboard[i], leaderboard[j] = leaderboard[j], leaderboard[i]
			}
		}
	}

	// Add rank
	for i, entry := range leaderboard {
		entry["rank"] = i + 1
	}

	response := map[string]interface{}{
		"daily":        leaderboard,
		"weekly":       leaderboard, // Same data for now, could be different queries
		"period_start": startDate.Format("2006-01-02"),
		"period_end":   endDate.Format("2006-01-02"),
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

	// Verify event exists and user has permission to delete it
	event, err := c.client.ScoreEvent.Query().
		Where(scoreevent.ID(eventUUID)).
		WithRecordedBy().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeValidationFailed, "Score event not found", http.StatusNotFound)
		} else {
			sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to fetch score event", http.StatusInternalServerError)
		}
		return
	}

	// Only the user who recorded the event can delete it
	if event.Edges.RecordedBy.ID != userUUID {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, "You can only delete your own score events", http.StatusForbidden)
		return
	}

	// Delete the event
	err = c.client.ScoreEvent.DeleteOne(event).Exec(ctx)
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Failed to delete score event", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
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
}