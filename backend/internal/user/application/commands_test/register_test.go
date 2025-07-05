package commands_test

import (
	"context"
	"github.com/stretchr/testify/assert"
	"os"
	"pet-of-the-day/internal/user/infrastructure"
	"testing"

	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/user/application/commands"
	"pet-of-the-day/internal/user/domain"
)

func init() {
	os.Setenv("GO_ENV", "test")
}

func TestRegisterUserHandler_Success(t *testing.T) {
	repo := infrastructure.NewMockUserRepository()
	eventBus := events.NewInMemoryBus()
	handler := commands.NewRegisterUserHandler(repo, eventBus)

	cmd := commands.RegisterUser{
		Email:     "test@example.com",
		Password:  "password123",
		FirstName: "John",
		LastName:  "Doe",
	}

	result, err := handler.Handle(context.Background(), cmd)

	assert.NoErrorf(t, err, "Expected no error, got %v", err)
	assert.NotNilf(t, result, "Expected valid ID, got nil")

	user, err := repo.FindByID(context.Background(), result.UserID)
	assert.NotNilf(t, user, "User should be saved in repository, got error: %v", err)
	assert.Equal(t, "test@example.com", user.Email().String())
	assert.Equal(t, "Doe", user.LastName())
	assert.Equal(t, "John", user.FirstName())
	assert.NotEqualf(t, "password123", user.PasswordHash(), "Password should be hashed")
}

func TestRegisterUserHandler_EmailAlreadyExists(t *testing.T) {
	repo := infrastructure.NewMockUserRepository()
	eventBus := events.NewInMemoryBus()
	handler := commands.NewRegisterUserHandler(repo, eventBus)

	cmd := commands.RegisterUser{
		Email:     "test@example.com",
		Password:  "password123",
		FirstName: "John",
		LastName:  "Doe",
	}

	handler.Handle(context.Background(), cmd)
	result, err := handler.Handle(context.Background(), cmd)

	assert.ErrorIs(t, err, domain.ErrUserEmailAlreadyUsed)
	assert.Nil(t, result)
	assert.Equal(t, domain.ErrUserEmailAlreadyUsed, err)
}

func TestRegisterUserHandler_InvalidEmail(t *testing.T) {
	repo := infrastructure.NewMockUserRepository()
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
