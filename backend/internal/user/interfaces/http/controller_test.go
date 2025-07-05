package http_test

import (
	"bytes"
	"context"
	"encoding/json"
	"github.com/stretchr/testify/assert"
	"net/http"
	"net/http/httptest"
	"testing"

	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/shared/types"
	"pet-of-the-day/internal/user/application/commands"
	"pet-of-the-day/internal/user/application/queries"
	"pet-of-the-day/internal/user/domain"
	userhttp "pet-of-the-day/internal/user/interfaces/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// Use the same mock repository as in command tests
type mockUserRepository struct {
	users       map[string]*domain.User
	emailExists map[string]bool
}

func newMockUserRepository() *mockUserRepository {
	return &mockUserRepository{
		users:       make(map[string]*domain.User),
		emailExists: make(map[string]bool),
	}
}

func (m *mockUserRepository) Save(ctx context.Context, user *domain.User) error {
	m.users[user.ID().String()] = user
	m.emailExists[user.Email().String()] = true
	return nil
}

func (m *mockUserRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	if user, exists := m.users[id.String()]; exists {
		return user, nil
	}
	return nil, domain.ErrUserNotFound
}

func (m *mockUserRepository) FindByEmail(ctx context.Context, email types.Email) (*domain.User, error) {
	for _, user := range m.users {
		if user.Email().String() == email.String() {
			return user, nil
		}
	}
	return nil, domain.ErrUserNotFound
}

func (m *mockUserRepository) ExistsByEmail(ctx context.Context, email types.Email) (bool, error) {
	return m.emailExists[email.String()], nil
}

func setupTestServer() (*httptest.Server, *mockUserRepository) {
	repo := newMockUserRepository()
	eventBus := events.NewInMemoryBus()
	jwtService := auth.NewJWTService("test-secret", "test-app")
	authMiddleware := auth.JWTMiddleware(jwtService)

	registerHandler := commands.NewRegisterUserHandler(repo, eventBus)
	loginHandler := commands.NewLoginUserHandler(repo, eventBus)
	getUserHandler := queries.NewGetUserByIDHandler(repo)

	controller := userhttp.NewController(
		registerHandler,
		loginHandler,
		getUserHandler,
		jwtService,
	)

	router := mux.NewRouter()
	api := router.PathPrefix("/api").Subrouter()
	controller.RegisterRoutes(api, authMiddleware)

	return httptest.NewServer(router), repo
}

func TestRegisterEndpoint_Success(t *testing.T) {
	server, _ := setupTestServer()
	defer server.Close()

	payload := map[string]string{
		"email":      "test@example.com",
		"password":   "password123",
		"first_name": "John",
		"last_name":  "Doe",
	}

	jsonPayload, _ := json.Marshal(payload)
	resp, err := http.Post(server.URL+"/api/auth/register", "application/json", bytes.NewBuffer(jsonPayload))
	assert.NoError(t, err)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(t, response, "user_id")
	assert.Contains(t, response, "token")
}

func TestRegisterEndpoint_InvalidEmail(t *testing.T) {
	server, _ := setupTestServer()
	defer server.Close()

	payload := map[string]string{
		"email":      "invalid-email",
		"password":   "password123",
		"first_name": "John",
		"last_name":  "Doe",
	}

	jsonPayload, _ := json.Marshal(payload)
	resp, err := http.Post(server.URL+"/api/auth/register", "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	defer resp.Body.Close()

	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestLoginEndpoint_Success(t *testing.T) {
	server, repo := setupTestServer()
	defer server.Close()

	// Pre-create a user
	email, _ := types.NewEmail("test@example.com")
	user, _ := domain.NewUser(email, "password123", "John", "Doe")
	repo.Save(context.Background(), user)

	payload := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	}

	jsonPayload, _ := json.Marshal(payload)
	resp, err := http.Post(server.URL+"/api/auth/login", "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	if response["user_id"] == nil {
		t.Error("Expected user_id in response")
	}

	if response["token"] == nil {
		t.Error("Expected token in response")
	}
}
