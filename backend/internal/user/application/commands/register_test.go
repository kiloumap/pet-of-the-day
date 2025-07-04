package commands_test

import (
	"context"
	"github.com/stretchr/testify/assert"
	"os"
	"testing"

	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/shared/types"
	"pet-of-the-day/internal/user/application/commands"
	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

func init() {
	// Force test mode
	os.Setenv("GO_ENV", "test")
}

// Mock repository for testing
// @todo change local repo with in memory repo
type mockUserRepository struct {
	users       map[string]*domain.User
	emailExists map[string]bool
}

func newMockUserRepository() *mockUserRepository {
	return &mockUserRepository{
		users:       make(map[string]*domain.User),
		emailExists: make(map[string]bool), // #todo flag mock should be replaced by infrastructure mock @see add_test.go
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

func TestRegisterUserHandler_Success(t *testing.T) {
	repo := newMockUserRepository()
	eventBus := events.NewInMemoryBus()
	handler := commands.NewRegisterUserHandler(repo, eventBus)

	cmd := commands.RegisterUser{
		Email:     "test@example.com",
		Password:  "password123",
		FirstName: "John",
		LastName:  "Doe",
	}

	result, err := handler.Handle(context.Background(), cmd)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if result.UserID == uuid.Nil {
		t.Error("Expected valid user ID")
	}

	// Verify user was saved in repository
	user, err := repo.FindByID(context.Background(), result.UserID)
	if err != nil {
		t.Fatalf("User should be saved in repository, got error: %v", err)
	}

	if user.Email().String() != "test@example.com" {
		t.Errorf("Expected email test@example.com, got %s", user.Email().String())
	}
}

func TestRegisterUserHandler_EmailAlreadyExists(t *testing.T) {
	repo := newMockUserRepository()
	eventBus := events.NewInMemoryBus()
	handler := commands.NewRegisterUserHandler(repo, eventBus)

	// Pre-populate repository with existing email
	repo.emailExists["test@example.com"] = true

	cmd := commands.RegisterUser{
		Email:     "test@example.com",
		Password:  "password123",
		FirstName: "John",
		LastName:  "Doe",
	}

	result, err := handler.Handle(context.Background(), cmd)

	assert.ErrorIs(t, err, domain.ErrUserEmailAlreadyUsed)
	assert.Nil(t, result)
	assert.Equal(t, domain.ErrUserEmailAlreadyUsed, err)
}

func TestRegisterUserHandler_InvalidEmail(t *testing.T) {
	repo := newMockUserRepository()
	eventBus := events.NewInMemoryBus()
	handler := commands.NewRegisterUserHandler(repo, eventBus)

	cmd := commands.RegisterUser{
		Email:     "invalid-email",
		Password:  "password123",
		FirstName: "John",
		LastName:  "Doe",
	}

	result, err := handler.Handle(context.Background(), cmd)

	assert.ErrorIs(t, err, domain.ErrUserInvalidEmail)
	assert.Nil(t, result)
	assert.Equal(t, domain.ErrUserInvalidEmail, err)
}
