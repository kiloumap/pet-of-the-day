package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"

	"pet-of-the-day/internal/points/application/commands"
	"pet-of-the-day/internal/points/application/queries"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/errors"
)

// BehaviorController handles HTTP requests for behavior-related operations
type BehaviorController struct {
	// Query handlers
	getBehaviorsHandler      *queries.GetBehaviorsHandler
	getBehaviorLogsHandler   *queries.GetBehaviorLogsHandler
	getGroupRankingsHandler  *queries.GetGroupRankingsHandler
	getPetOfTheDayHandler    *queries.GetPetOfTheDayHandler
	getDailyScoreHandler     *queries.GetDailyScoreHandler

	// Command handlers
	createBehaviorLogHandler *commands.CreateBehaviorLogHandler
	updateBehaviorLogHandler *commands.UpdateBehaviorLogHandler
	deleteBehaviorLogHandler *commands.DeleteBehaviorLogHandler
}

// NewBehaviorController creates a new behavior controller
func NewBehaviorController(
	getBehaviorsHandler *queries.GetBehaviorsHandler,
	getBehaviorLogsHandler *queries.GetBehaviorLogsHandler,
	getGroupRankingsHandler *queries.GetGroupRankingsHandler,
	getPetOfTheDayHandler *queries.GetPetOfTheDayHandler,
	getDailyScoreHandler *queries.GetDailyScoreHandler,
	createBehaviorLogHandler *commands.CreateBehaviorLogHandler,
	updateBehaviorLogHandler *commands.UpdateBehaviorLogHandler,
	deleteBehaviorLogHandler *commands.DeleteBehaviorLogHandler,
) *BehaviorController {
	return &BehaviorController{
		getBehaviorsHandler:      getBehaviorsHandler,
		getBehaviorLogsHandler:   getBehaviorLogsHandler,
		getGroupRankingsHandler:  getGroupRankingsHandler,
		getPetOfTheDayHandler:    getPetOfTheDayHandler,
		getDailyScoreHandler:     getDailyScoreHandler,
		createBehaviorLogHandler: createBehaviorLogHandler,
		updateBehaviorLogHandler: updateBehaviorLogHandler,
		deleteBehaviorLogHandler: deleteBehaviorLogHandler,
	}
}

// RegisterRoutes registers all behavior-related HTTP routes
func (c *BehaviorController) RegisterRoutes(router *mux.Router) {
	// Public routes (authenticated users)
	api := router.PathPrefix("/api").Subrouter()
	api.Use(auth.RequireAuthentication)

	// Behavior catalog routes
	api.HandleFunc("/behaviors", c.getBehaviors).Methods("GET")

	// Behavior log routes
	api.HandleFunc("/behavior-logs", c.createBehaviorLog).Methods("POST")
	api.HandleFunc("/behavior-logs", c.getBehaviorLogs).Methods("GET")
	api.HandleFunc("/behavior-logs/{id}", c.updateBehaviorLog).Methods("PUT")
	api.HandleFunc("/behavior-logs/{id}", c.deleteBehaviorLog).Methods("DELETE")

	// Group ranking routes
	api.HandleFunc("/groups/{id}/rankings", c.getGroupRankings).Methods("GET")
	api.HandleFunc("/groups/{id}/pet-of-the-day", c.getPetOfTheDay).Methods("GET")

	// Pet scoring routes
	api.HandleFunc("/pets/{id}/daily-score", c.getDailyScore).Methods("GET")
}

// getBehaviors handles GET /api/behaviors
func (c *BehaviorController) getBehaviors(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	speciesParam := r.URL.Query().Get("species")
	categoryParam := r.URL.Query().Get("category")

	// Create query
	query := &queries.GetBehaviorsQuery{
		Species:  parseSpeciesParam(speciesParam),
		Category: parseCategoryParam(categoryParam),
	}

	// Execute query
	result, err := c.getBehaviorsHandler.Handle(r.Context(), query)
	if err != nil {
		errors.HandleHTTPError(w, err)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// createBehaviorLog handles POST /api/behavior-logs
func (c *BehaviorController) createBehaviorLog(w http.ResponseWriter, r *http.Request) {
	// Parse request body
	var req struct {
		PetID      uuid.UUID   `json:"pet_id"`
		BehaviorID uuid.UUID   `json:"behavior_id"`
		LoggedAt   *time.Time  `json:"logged_at,omitempty"`
		Notes      string      `json:"notes"`
		GroupIDs   []uuid.UUID `json:"group_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.HandleHTTPError(w, errors.NewValidationError("Invalid request body", err))
		return
	}

	// Get user ID from context
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		errors.HandleHTTPError(w, errors.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Create command
	cmd := &commands.CreateBehaviorLogCommand{
		PetID:      req.PetID,
		BehaviorID: req.BehaviorID,
		UserID:     userID,
		LoggedAt:   req.LoggedAt,
		Notes:      req.Notes,
		GroupIDs:   req.GroupIDs,
	}

	// Execute command
	result, err := c.createBehaviorLogHandler.Handle(r.Context(), cmd)
	if err != nil {
		errors.HandleHTTPError(w, err)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

// getBehaviorLogs handles GET /api/behavior-logs
func (c *BehaviorController) getBehaviorLogs(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	query := &queries.GetBehaviorLogsQuery{
		PetID:      parseUUIDParam(r.URL.Query().Get("pet_id")),
		BehaviorID: parseUUIDParam(r.URL.Query().Get("behavior_id")),
		GroupID:    parseUUIDParam(r.URL.Query().Get("group_id")),
		DateFrom:   parseTimeParam(r.URL.Query().Get("date_from")),
		DateTo:     parseTimeParam(r.URL.Query().Get("date_to")),
		Limit:      parseIntParam(r.URL.Query().Get("limit"), 50),
		Offset:     parseIntParam(r.URL.Query().Get("offset"), 0),
	}

	// Get user ID from context for authorization
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		errors.HandleHTTPError(w, errors.NewUnauthorizedError("User not authenticated"))
		return
	}
	query.UserID = userID

	// Execute query
	result, err := c.getBehaviorLogsHandler.Handle(r.Context(), query)
	if err != nil {
		errors.HandleHTTPError(w, err)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// updateBehaviorLog handles PUT /api/behavior-logs/{id}
func (c *BehaviorController) updateBehaviorLog(w http.ResponseWriter, r *http.Request) {
	// Parse path parameter
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		errors.HandleHTTPError(w, errors.NewValidationError("Invalid behavior log ID", err))
		return
	}

	// Parse request body
	var req struct {
		Notes    string      `json:"notes"`
		GroupIDs []uuid.UUID `json:"group_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.HandleHTTPError(w, errors.NewValidationError("Invalid request body", err))
		return
	}

	// Get user ID from context
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		errors.HandleHTTPError(w, errors.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Create command
	cmd := &commands.UpdateBehaviorLogCommand{
		ID:       id,
		UserID:   userID,
		Notes:    req.Notes,
		GroupIDs: req.GroupIDs,
	}

	// Execute command
	result, err := c.updateBehaviorLogHandler.Handle(r.Context(), cmd)
	if err != nil {
		errors.HandleHTTPError(w, err)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// deleteBehaviorLog handles DELETE /api/behavior-logs/{id}
func (c *BehaviorController) deleteBehaviorLog(w http.ResponseWriter, r *http.Request) {
	// Parse path parameter
	vars := mux.Vars(r)
	id, err := uuid.Parse(vars["id"])
	if err != nil {
		errors.HandleHTTPError(w, errors.NewValidationError("Invalid behavior log ID", err))
		return
	}

	// Get user ID from context
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		errors.HandleHTTPError(w, errors.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Create command
	cmd := &commands.DeleteBehaviorLogCommand{
		ID:     id,
		UserID: userID,
	}

	// Execute command
	err = c.deleteBehaviorLogHandler.Handle(r.Context(), cmd)
	if err != nil {
		errors.HandleHTTPError(w, err)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusNoContent)
}

// getGroupRankings handles GET /api/groups/{id}/rankings
func (c *BehaviorController) getGroupRankings(w http.ResponseWriter, r *http.Request) {
	// Parse path parameter
	vars := mux.Vars(r)
	groupID, err := uuid.Parse(vars["id"])
	if err != nil {
		errors.HandleHTTPError(w, errors.NewValidationError("Invalid group ID", err))
		return
	}

	// Parse query parameters
	dateParam := r.URL.Query().Get("date")
	var queryDate time.Time
	if dateParam != "" {
		queryDate, err = time.Parse("2006-01-02", dateParam)
		if err != nil {
			errors.HandleHTTPError(w, errors.NewValidationError("Invalid date format (expected YYYY-MM-DD)", err))
			return
		}
	} else {
		queryDate = time.Now().UTC()
	}

	// Get user ID from context for authorization
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		errors.HandleHTTPError(w, errors.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Create query
	query := &queries.GetGroupRankingsQuery{
		GroupID: groupID,
		Date:    queryDate,
		UserID:  userID,
	}

	// Execute query
	result, err := c.getGroupRankingsHandler.Handle(r.Context(), query)
	if err != nil {
		errors.HandleHTTPError(w, err)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// getPetOfTheDay handles GET /api/groups/{id}/pet-of-the-day
func (c *BehaviorController) getPetOfTheDay(w http.ResponseWriter, r *http.Request) {
	// Parse path parameter
	vars := mux.Vars(r)
	groupID, err := uuid.Parse(vars["id"])
	if err != nil {
		errors.HandleHTTPError(w, errors.NewValidationError("Invalid group ID", err))
		return
	}

	// Parse query parameters
	dateParam := r.URL.Query().Get("date")
	var queryDate time.Time
	if dateParam != "" {
		queryDate, err = time.Parse("2006-01-02", dateParam)
		if err != nil {
			errors.HandleHTTPError(w, errors.NewValidationError("Invalid date format (expected YYYY-MM-DD)", err))
			return
		}
	} else {
		// Default to yesterday (Pet of the Day is awarded for previous day)
		queryDate = time.Now().UTC().AddDate(0, 0, -1)
	}

	// Get user ID from context for authorization
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		errors.HandleHTTPError(w, errors.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Create query
	query := &queries.GetPetOfTheDayQuery{
		GroupID: groupID,
		Date:    queryDate,
		UserID:  userID,
	}

	// Execute query
	result, err := c.getPetOfTheDayHandler.Handle(r.Context(), query)
	if err != nil {
		errors.HandleHTTPError(w, err)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// getDailyScore handles GET /api/pets/{id}/daily-score
func (c *BehaviorController) getDailyScore(w http.ResponseWriter, r *http.Request) {
	// Parse path parameter
	vars := mux.Vars(r)
	petID, err := uuid.Parse(vars["id"])
	if err != nil {
		errors.HandleHTTPError(w, errors.NewValidationError("Invalid pet ID", err))
		return
	}

	// Parse query parameters
	groupIDParam := r.URL.Query().Get("group_id")
	if groupIDParam == "" {
		errors.HandleHTTPError(w, errors.NewValidationError("group_id parameter is required", nil))
		return
	}

	groupID, err := uuid.Parse(groupIDParam)
	if err != nil {
		errors.HandleHTTPError(w, errors.NewValidationError("Invalid group ID", err))
		return
	}

	dateParam := r.URL.Query().Get("date")
	var queryDate time.Time
	if dateParam != "" {
		queryDate, err = time.Parse("2006-01-02", dateParam)
		if err != nil {
			errors.HandleHTTPError(w, errors.NewValidationError("Invalid date format (expected YYYY-MM-DD)", err))
			return
		}
	} else {
		queryDate = time.Now().UTC()
	}

	// Get user ID from context for authorization
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		errors.HandleHTTPError(w, errors.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Create query
	query := &queries.GetDailyScoreQuery{
		PetID:   petID,
		GroupID: groupID,
		Date:    queryDate,
		UserID:  userID,
	}

	// Execute query
	result, err := c.getDailyScoreHandler.Handle(r.Context(), query)
	if err != nil {
		errors.HandleHTTPError(w, err)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// Helper functions for parameter parsing

func parseUUIDParam(param string) *uuid.UUID {
	if param == "" {
		return nil
	}
	if id, err := uuid.Parse(param); err == nil {
		return &id
	}
	return nil
}

func parseTimeParam(param string) *time.Time {
	if param == "" {
		return nil
	}
	if t, err := time.Parse("2006-01-02", param); err == nil {
		return &t
	}
	if t, err := time.Parse(time.RFC3339, param); err == nil {
		return &t
	}
	return nil
}

func parseIntParam(param string, defaultValue int) int {
	if param == "" {
		return defaultValue
	}
	if val, err := strconv.Atoi(param); err == nil && val > 0 {
		return val
	}
	return defaultValue
}

func parseSpeciesParam(param string) *string {
	if param == "" {
		return nil
	}
	return &param
}

func parseCategoryParam(param string) *string {
	if param == "" {
		return nil
	}
	return &param
}
