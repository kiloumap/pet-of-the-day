package domain_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"pet-of-the-day/internal/shared/types"
	"pet-of-the-day/internal/user/domain"
)

func TestNewUser_Success(t *testing.T) {
	email, _ := types.NewEmail("test@example.com")
	user, err := domain.NewUser(email, "password123", "John", "Doe")

	assert.NoErrorf(t, err, "Expected no error, got %v", err)
	assert.Equal(t, "test@example.com", user.Email().String())
	assert.Equal(t, "Doe", user.LastName())
	assert.Equal(t, "John", user.FirstName())
	assert.NotEqualf(t, "password123", user.PasswordHash(), "Password should be hashed")

	events := user.DomainEvents()

	assert.Lenf(t, events, 1, "Expected 1 event, got %d", len(events))
	assert.Equal(t, domain.UserRegisteredEventType, events[0].EventType())
}

func TestNewUser_InvalidPassword(t *testing.T) {
	email, _ := types.NewEmail("test@example.com")
	_, err := domain.NewUser(email, "", "John", "Doe")
	assert.ErrorIs(t, err, domain.ErrUserInvalidPassword)
}

func TestNewUser_InvalidName(t *testing.T) {
	email, _ := types.NewEmail("test@example.com")
	_, err := domain.NewUser(email, "password123", "", "Doe")
	assert.ErrorIs(t, err, domain.ErrUserInvalidName)
}

func TestUser_VerifyPassword_Success(t *testing.T) {
	email, _ := types.NewEmail("test@example.com")
	user, _ := domain.NewUser(email, "password123", "John", "Doe")

	err := user.VerifyPassword("password123")
	assert.NoErrorf(t, err, "Expected no error for valid password, got %v", err)
}

func TestUser_VerifyPassword_Failure(t *testing.T) {
	email, _ := types.NewEmail("test@example.com")
	user, _ := domain.NewUser(email, "password123", "John", "Doe")

	err := user.VerifyPassword("qdwwqdqw")
	assert.Errorf(t, err, "Expected error for invalid password, got %v", err)
}

func TestUser_ChangePassword(t *testing.T) {
	oldPwd := "oldpassword"
	newPwd := "newpassword"

	email, _ := types.NewEmail("test@example.com")
	user, _ := domain.NewUser(email, oldPwd, "John", "Doe")

	user.ClearEvents()
	err := user.ChangePassword(oldPwd, newPwd)
	assert.NoErrorf(t, err, "Expected no error, got %v", err)

	err = user.VerifyPassword(oldPwd)
	assert.Errorf(t, err, "Expected error for invalid password, got %v", err)

	err = user.VerifyPassword(newPwd)
	assert.NoErrorf(t, err, "Expected no error for valid password, got %v", err)

	events := user.DomainEvents()
	assert.Lenf(t, events, 1, "Expected 1 event, got %d", len(events))
	assert.Equal(t, domain.PasswordChangedEventType, events[0].EventType())
}
