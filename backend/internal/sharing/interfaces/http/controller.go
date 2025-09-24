package http

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"

	"pet-of-the-day/internal/sharing/application/commands"
	"pet-of-the-day/internal/sharing/application/queries"
	"pet-of-the-day/internal/sharing/domain"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/errors"
)

// SharingController handles HTTP requests for resource sharing
type SharingController struct {
	createShareHandler       *commands.CreateShareHandler
	updateShareHandler       *commands.UpdateShareHandler
	revokeShareHandler       *commands.RevokeShareHandler
	getUserSharesHandler     *queries.GetUserSharesHandler
	getResourceSharesHandler *queries.GetResourceSharesHandler
	checkAccessHandler       *queries.CheckAccessHandler
}

// NewSharingController creates a new controller
func NewSharingController(
	createShareHandler *commands.CreateShareHandler,
	updateShareHandler *commands.UpdateShareHandler,
	revokeShareHandler *commands.RevokeShareHandler,
	getUserSharesHandler *queries.GetUserSharesHandler,
	getResourceSharesHandler *queries.GetResourceSharesHandler,
	checkAccessHandler *queries.CheckAccessHandler,
) *SharingController {
	return &SharingController{
		createShareHandler:       createShareHandler,
		updateShareHandler:       updateShareHandler,
		revokeShareHandler:       revokeShareHandler,
		getUserSharesHandler:     getUserSharesHandler,
		getResourceSharesHandler: getResourceSharesHandler,
		checkAccessHandler:       checkAccessHandler,
	}
}

// RegisterRoutes sets up HTTP routes
func (c *SharingController) RegisterRoutes(router *mux.Router, authMiddleware func(http.Handler) http.Handler) {
	// All sharing routes require authentication
	protected := router.NewRoute().Subrouter()
	protected.Use(authMiddleware)

	// Share management
	protected.HandleFunc("/shares", c.CreateShare).Methods(http.MethodPost)
	protected.HandleFunc("/shares/{shareID}", c.UpdateShare).Methods(http.MethodPut)
	protected.HandleFunc("/shares/{shareID}/revoke", c.RevokeShare).Methods(http.MethodPost)

	// Share queries
	protected.HandleFunc("/shares/user", c.GetUserShares).Methods(http.MethodGet)
	protected.HandleFunc("/shares/resource/{resourceID}", c.GetResourceShares).Methods(http.MethodGet)
	protected.HandleFunc("/shares/access/{resourceID}", c.CheckAccess).Methods(http.MethodGet)
}

// CreateShare creates a new share
func (c *SharingController) CreateShare(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var cmd commands.CreateShareCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	cmd.OwnerID = userID // Set from authenticated context

	result, err := c.createShareHandler.Handle(r.Context(), &cmd)
	if err != nil {
		c.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

// UpdateShare updates an existing share
func (c *SharingController) UpdateShare(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	shareID, err := uuid.Parse(vars["shareID"])
	if err != nil {
		http.Error(w, "Invalid share ID", http.StatusBadRequest)
		return
	}

	var cmd commands.UpdateShareCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	cmd.ShareID = shareID
	cmd.RequestorID = userID

	result, err := c.updateShareHandler.Handle(r.Context(), &cmd)
	if err != nil {
		c.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// RevokeShare revokes a share
func (c *SharingController) RevokeShare(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	shareID, err := uuid.Parse(vars["shareID"])
	if err != nil {
		http.Error(w, "Invalid share ID", http.StatusBadRequest)
		return
	}

	var cmd commands.RevokeShareCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		// Allow empty body for revoke
		cmd = commands.RevokeShareCommand{}
	}

	cmd.ShareID = shareID
	cmd.RequestorID = userID

	result, err := c.revokeShareHandler.Handle(r.Context(), &cmd)
	if err != nil {
		c.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// GetUserShares gets all shares for the current user
func (c *SharingController) GetUserShares(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse pagination parameters
	limit := 20 // Default limit
	offset := 0 // Default offset

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := parseIntParam(l, 1, 100); err == nil {
			limit = parsed
		}
	}

	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := parseIntParam(o, 0, 10000); err == nil {
			offset = parsed
		}
	}

	page := 1
	if offset > 0 && limit > 0 {
		page = (offset / limit) + 1
	}

	query := queries.GetUserSharesQuery{
		UserID:     userID,
		ActiveOnly: true,
		Page:       page,
		PageSize:   limit,
	}

	result, err := c.getUserSharesHandler.Handle(r.Context(), &query)
	if err != nil {
		c.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// GetResourceShares gets all shares for a specific resource
func (c *SharingController) GetResourceShares(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	resourceID, err := uuid.Parse(vars["resourceID"])
	if err != nil {
		http.Error(w, "Invalid resource ID", http.StatusBadRequest)
		return
	}

	query := queries.GetResourceSharesQuery{
		ResourceID:  resourceID,
		RequestorID: userID,
		ActiveOnly:  true,
	}

	result, err := c.getResourceSharesHandler.Handle(r.Context(), &query)
	if err != nil {
		c.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// CheckAccess checks if the current user has access to a resource
func (c *SharingController) CheckAccess(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	resourceID, err := uuid.Parse(vars["resourceID"])
	if err != nil {
		http.Error(w, "Invalid resource ID", http.StatusBadRequest)
		return
	}

	// Get required permission and resource type from query parameters
	permission := r.URL.Query().Get("permission")
	if permission == "" {
		permission = "read" // Default to read permission
	}

	resourceType := r.URL.Query().Get("resource_type")
	if resourceType == "" {
		resourceType = "notebook" // Default to notebook
	}

	query := queries.CheckAccessQuery{
		ResourceID:         resourceID,
		ResourceType:       resourceType,
		UserID:            userID,
		RequiredPermission: domain.SharePermission(permission),
	}

	result, err := c.checkAccessHandler.Handle(r.Context(), &query)
	if err != nil {
		c.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// Helper functions

func parseIntParam(value string, min, max int) (int, error) {
	if value == "" {
		return 0, nil
	}

	var parsed int
	if err := json.Unmarshal([]byte(value), &parsed); err != nil {
		return 0, err
	}

	if parsed < min || parsed > max {
		return 0, errors.APIError{
			Code:    errors.ErrCodeInvalidInput,
			Message: "value out of range",
		}
	}

	return parsed, nil
}

func (c *SharingController) handleError(w http.ResponseWriter, err error) {
	switch err {
	case domain.ErrShareNotFound:
		errors.WriteErrorResponse(w, errors.ErrCodeUserNotFound, err.Error(), http.StatusNotFound)
	case domain.ErrInvalidPermission:
		errors.WriteErrorResponse(w, errors.ErrCodeInvalidInput, err.Error(), http.StatusBadRequest)
	case domain.ErrAccessDenied:
		errors.WriteErrorResponse(w, errors.ErrCodeUnauthorized, err.Error(), http.StatusForbidden)
	default:
		errors.WriteErrorResponse(w, errors.ErrCodeInternalServer, "Internal server error", http.StatusInternalServerError)
	}
}