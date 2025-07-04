package http

import (
	"encoding/json"
	"net/http"

	"pet-of-the-day/internal/shared/auth"
	sharederrors "pet-of-the-day/internal/shared/errors"
	"pet-of-the-day/internal/user/application/commands"
	"pet-of-the-day/internal/user/application/queries"
	"pet-of-the-day/internal/user/domain"

	"github.com/gorilla/mux"
)

type Controller struct {
	registerHandler *commands.RegisterUserHandler
	loginHandler    *commands.LoginUserHandler
	getUserHandler  *queries.GetUserByIDHandler
	jwtService      auth.JWTService
}

func NewController(
	registerHandler *commands.RegisterUserHandler,
	loginHandler *commands.LoginUserHandler,
	getUserHandler *queries.GetUserByIDHandler,
	jwtService auth.JWTService,
) *Controller {
	return &Controller{
		registerHandler: registerHandler,
		loginHandler:    loginHandler,
		getUserHandler:  getUserHandler,
		jwtService:      jwtService,
	}
}

func (c *Controller) RegisterRoutes(router *mux.Router, authMiddleware func(http.Handler) http.Handler) {
	// Public routes
	router.HandleFunc("/auth/register", c.Register).Methods(http.MethodPost)
	router.HandleFunc("/auth/login", c.Login).Methods(http.MethodPost)

	// Protected routes
	protected := router.NewRoute().Subrouter()
	protected.Use(authMiddleware)
	protected.HandleFunc("/users/me", c.GetCurrentUser).Methods(http.MethodGet)
}

func (c *Controller) Register(w http.ResponseWriter, r *http.Request) {
	var cmd commands.RegisterUser
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, sharederrors.ErrInvalidRequestBody.Error(), http.StatusBadRequest)
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
	json.NewEncoder(w).Encode(response)
}

func (c *Controller) Login(w http.ResponseWriter, r *http.Request) {
	var cmd commands.LoginUser
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
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
	json.NewEncoder(w).Encode(response)
}

func (c *Controller) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	query := queries.GetUserByID{UserID: userID}
	userView, err := c.getUserHandler.Handle(r.Context(), query)
	if err != nil {
		c.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userView)
}

func (c *Controller) handleError(w http.ResponseWriter, err error) {
	switch err {
	case domain.ErrUserNotFound:
		http.Error(w, "User not found", http.StatusNotFound)
	case domain.ErrUserEmailAlreadyUsed:
		http.Error(w, "Email already in use", http.StatusConflict)
	case domain.ErrUserInvalidPassword:
		http.Error(w, "Invalid password", http.StatusUnauthorized)
	case domain.ErrUserInvalidEmail:
		http.Error(w, "Invalid email format", http.StatusBadRequest)
	case domain.ErrUserInvalidName:
		http.Error(w, "Invalid name", http.StatusBadRequest)
	default:
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}
