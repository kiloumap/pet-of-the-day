package http

import (
	"encoding/json"
	"log"
	"net/http"
	"pet-of-the-day/internal/shared/auth"
	sharederrors "pet-of-the-day/internal/shared/errors"
	"pet-of-the-day/internal/user/application/commands"
	"pet-of-the-day/internal/user/application/queries"
	"pet-of-the-day/internal/user/domain"

	"github.com/gorilla/mux"
	"github.com/google/uuid"
)

type Controller struct {
	registerHandler            *commands.RegisterUserHandler
	loginHandler               *commands.LoginUserHandler
	getUserHandler             *queries.GetUserByIDHandler
	grantCoOwnershipHandler    *commands.GrantCoOwnershipHandler
	acceptCoOwnershipHandler   *commands.AcceptCoOwnershipHandler
	rejectCoOwnershipHandler   *commands.RejectCoOwnershipHandler
	revokeCoOwnershipHandler   *commands.RevokeCoOwnershipHandler
	getCoOwnershipRequestsHandler *queries.GetCoOwnershipRequestsHandler
	getPetCoOwnersHandler      *queries.GetPetCoOwnersHandler
	getCoOwnershipRequestHandler *queries.GetCoOwnershipRequestHandler
	jwtService                 auth.JWTService
}

func NewController(
	registerHandler *commands.RegisterUserHandler,
	loginHandler *commands.LoginUserHandler,
	getUserHandler *queries.GetUserByIDHandler,
	grantCoOwnershipHandler *commands.GrantCoOwnershipHandler,
	acceptCoOwnershipHandler *commands.AcceptCoOwnershipHandler,
	rejectCoOwnershipHandler *commands.RejectCoOwnershipHandler,
	revokeCoOwnershipHandler *commands.RevokeCoOwnershipHandler,
	getCoOwnershipRequestsHandler *queries.GetCoOwnershipRequestsHandler,
	getPetCoOwnersHandler *queries.GetPetCoOwnersHandler,
	getCoOwnershipRequestHandler *queries.GetCoOwnershipRequestHandler,
	jwtService auth.JWTService,
) *Controller {
	return &Controller{
		registerHandler:            registerHandler,
		loginHandler:               loginHandler,
		getUserHandler:             getUserHandler,
		grantCoOwnershipHandler:    grantCoOwnershipHandler,
		acceptCoOwnershipHandler:   acceptCoOwnershipHandler,
		rejectCoOwnershipHandler:   rejectCoOwnershipHandler,
		revokeCoOwnershipHandler:   revokeCoOwnershipHandler,
		getCoOwnershipRequestsHandler: getCoOwnershipRequestsHandler,
		getPetCoOwnersHandler:      getPetCoOwnersHandler,
		getCoOwnershipRequestHandler: getCoOwnershipRequestHandler,
		jwtService:                 jwtService,
	}
}

func (c *Controller) RegisterRoutes(router *mux.Router, authMiddleware func(http.Handler) http.Handler) {
	// Public routes
	router.HandleFunc("/auth/register", c.Register).Methods(http.MethodPost, http.MethodOptions)
	router.HandleFunc("/auth/login", c.Login).Methods(http.MethodPost, http.MethodOptions)

	// Protected routes
	protected := router.NewRoute().Subrouter()
	protected.Use(authMiddleware)
	protected.HandleFunc("/users/me", c.GetCurrentUser).Methods(http.MethodGet, http.MethodOptions)

	// Co-ownership routes
	protected.HandleFunc("/coownerships/grant", c.GrantCoOwnership).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/coownerships/{requestID}/accept", c.AcceptCoOwnership).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/coownerships/{requestID}/reject", c.RejectCoOwnership).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/coownerships/{requestID}/revoke", c.RevokeCoOwnership).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/coownerships/requests", c.GetCoOwnershipRequests).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/coownerships/{requestID}", c.GetCoOwnershipRequest).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/pets/{petID}/coowners", c.GetPetCoOwners).Methods(http.MethodGet, http.MethodOptions)
}

func (c *Controller) Register(w http.ResponseWriter, r *http.Request) {
	var cmd commands.RegisterUser
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		http.Error(w, sharederrors.ErrInvalidRequestBody.Error(), http.StatusBadRequest)
		return
	}

	// Validate required fields
	var validationErrors []sharederrors.ValidationError
	if cmd.Email == "" {
		validationErrors = append(validationErrors, sharederrors.NewRequiredFieldError("email"))
	}
	if cmd.Password == "" {
		validationErrors = append(validationErrors, sharederrors.NewRequiredFieldError("password"))
	}
	if cmd.FirstName == "" {
		validationErrors = append(validationErrors, sharederrors.NewRequiredFieldError("first_name"))
	}
	if cmd.LastName == "" {
		validationErrors = append(validationErrors, sharederrors.NewRequiredFieldError("last_name"))
	}

	if len(validationErrors) > 0 {
		sharederrors.WriteValidationErrorResponse(w, validationErrors)
		return
	}

	result, err := c.registerHandler.Handle(r.Context(), cmd)

	if err != nil {
		c.handleError(w, err)
		return
	}

	token, err := c.jwtService.GenerateToken(result.UserID)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"user_id": result.UserID,
		"token":   token,
		"user": map[string]interface{}{
			"id":         result.User.ID(),
			"email":      result.User.Email().String(),
			"first_name": result.User.FirstName(),
			"last_name":  result.User.LastName(),
			"created_at": result.User.CreatedAt(),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

func (c *Controller) Login(w http.ResponseWriter, r *http.Request) {
	var cmd commands.LoginUser
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	var validationErrors []sharederrors.ValidationError
	if cmd.Email == "" {
		validationErrors = append(validationErrors, sharederrors.NewRequiredFieldError("email"))
	}
	if cmd.Password == "" {
		validationErrors = append(validationErrors, sharederrors.NewRequiredFieldError("password"))
	}

	if len(validationErrors) > 0 {
		sharederrors.WriteValidationErrorResponse(w, validationErrors)
		return
	}

	result, err := c.loginHandler.Handle(r.Context(), cmd)
	if err != nil {
		c.handleError(w, err)
		return
	}

	token, err := c.jwtService.GenerateToken(result.UserID)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"user_id": result.UserID,
		"token":   token,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

func (c *Controller) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		log.Printf("User ID not found in context: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := queries.GetUserByID{UserID: userID}
	userView, err := c.getUserHandler.Handle(r.Context(), query)
	if err != nil {
		c.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(userView); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
		return
	}
}

func (c *Controller) handleError(w http.ResponseWriter, err error) {
	switch err {
	case domain.ErrUserNotFound:
		apiErr := sharederrors.NewUserNotFoundError()
		sharederrors.WriteErrorResponse(w, apiErr.Code, apiErr.Message, http.StatusNotFound)
	case domain.ErrUserEmailAlreadyUsed:
		apiErr := sharederrors.NewEmailAlreadyExistsError()
		sharederrors.WriteFieldErrorResponse(w, apiErr.Code, apiErr.Message, apiErr.Field, http.StatusConflict)
	case domain.ErrUserInvalidPassword:
		apiErr := sharederrors.NewInvalidCredentialsError()
		sharederrors.WriteErrorResponse(w, apiErr.Code, apiErr.Message, http.StatusUnauthorized)
	case domain.ErrUserInvalidEmail:
		sharederrors.WriteFieldErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid email format", "email", http.StatusBadRequest)
	case domain.ErrUserInvalidName:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidInput, "Invalid name", http.StatusBadRequest)
	default:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Internal server error", http.StatusInternalServerError)
	}
}

// Co-ownership handlers

func (c *Controller) GrantCoOwnership(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var cmd commands.GrantCoOwnershipCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	cmd.OwnerID = userID // Set from context

	result, err := c.grantCoOwnershipHandler.Handle(r.Context(), cmd)
	if err != nil {
		c.handleCoOwnershipError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

func (c *Controller) AcceptCoOwnership(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	requestID, err := uuid.Parse(vars["requestID"])
	if err != nil {
		http.Error(w, "Invalid request ID", http.StatusBadRequest)
		return
	}

	cmd := commands.AcceptCoOwnershipCommand{
		RequestID: requestID,
		UserID:    userID,
	}

	result, err := c.acceptCoOwnershipHandler.Handle(r.Context(), cmd)
	if err != nil {
		c.handleCoOwnershipError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (c *Controller) RejectCoOwnership(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	requestID, err := uuid.Parse(vars["requestID"])
	if err != nil {
		http.Error(w, "Invalid request ID", http.StatusBadRequest)
		return
	}

	cmd := commands.RejectCoOwnershipCommand{
		RequestID: requestID,
		UserID:    userID,
	}

	result, err := c.rejectCoOwnershipHandler.Handle(r.Context(), cmd)
	if err != nil {
		c.handleCoOwnershipError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (c *Controller) RevokeCoOwnership(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	requestID, err := uuid.Parse(vars["requestID"])
	if err != nil {
		http.Error(w, "Invalid request ID", http.StatusBadRequest)
		return
	}

	cmd := commands.RevokeCoOwnershipCommand{
		RequestID: requestID,
		UserID:    userID,
	}

	result, err := c.revokeCoOwnershipHandler.Handle(r.Context(), cmd)
	if err != nil {
		c.handleCoOwnershipError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (c *Controller) GetCoOwnershipRequests(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := queries.GetCoOwnershipRequestsQuery{UserID: userID}

	result, err := c.getCoOwnershipRequestsHandler.Handle(r.Context(), query)
	if err != nil {
		c.handleCoOwnershipError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (c *Controller) GetCoOwnershipRequest(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	requestID, err := uuid.Parse(vars["requestID"])
	if err != nil {
		http.Error(w, "Invalid request ID", http.StatusBadRequest)
		return
	}

	query := queries.GetCoOwnershipRequestQuery{
		RequestID: requestID,
		UserID:    userID,
	}

	result, err := c.getCoOwnershipRequestHandler.Handle(r.Context(), query)
	if err != nil {
		c.handleCoOwnershipError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (c *Controller) GetPetCoOwners(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	petID, err := uuid.Parse(vars["petID"])
	if err != nil {
		http.Error(w, "Invalid pet ID", http.StatusBadRequest)
		return
	}

	query := queries.GetPetCoOwnersQuery{PetID: petID}

	result, err := c.getPetCoOwnersHandler.Handle(r.Context(), query)
	if err != nil {
		c.handleCoOwnershipError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (c *Controller) handleCoOwnershipError(w http.ResponseWriter, err error) {
	switch err {
	case domain.ErrInvalidPetID, domain.ErrInvalidUserID, domain.ErrInvalidCoOwnerID:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidInput, err.Error(), http.StatusBadRequest)
	case domain.ErrCannotCoOwnSelf:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidInput, err.Error(), http.StatusBadRequest)
	case domain.ErrUserAlreadyCoOwner:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidInput, err.Error(), http.StatusConflict)
	case domain.ErrCoOwnershipNotFound:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUserNotFound, err.Error(), http.StatusNotFound)
	case domain.ErrCoOwnershipNotPending:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidInput, err.Error(), http.StatusBadRequest)
	case domain.ErrNotAuthorized:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeUnauthorized, err.Error(), http.StatusForbidden)
	default:
		c.handleError(w, err)
	}
}
