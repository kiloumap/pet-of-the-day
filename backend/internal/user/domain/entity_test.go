package domain_test

import (
	"testing"

	"pet-of-the-day/internal/shared/types"
	"pet-of-the-day/internal/user/domain"
)

func TestNewUser_Success(t *testing.T) {
	email, _ := types.NewEmail("test@example.com")

	user, err := domain.NewUser(email, "password123", "John", "Doe")

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if user.Email().String() != "test@example.com" {
		t.Errorf("Expected email test@example.com, got %s", user.Email().String())
	}

	if user.FirstName() != "John" {
		t.Errorf("Expected first name John, got %s", user.FirstName())
	}

	events := user.DomainEvents()
	if len(events) != 1 {
		t.Errorf("Expected 1 domain event, got %d", len(events))
	}

	if events[0].EventType() != domain.UserRegisteredEventType {
		t.Errorf("Expected UserRegistered event, got %s", events[0].EventType())
	}
}

func TestNewUser_InvalidPassword(t *testing.T) {
	email, _ := types.NewEmail("test@example.com")

	_, err := domain.NewUser(email, "", "John", "Doe")

	if err != domain.ErrInvalidPassword {
		t.Errorf("Expected ErrInvalidPassword, got %v", err)
	}
}

func TestNewUser_InvalidName(t *testing.T) {
	email, _ := types.NewEmail("test@example.com")

	_, err := domain.NewUser(email, "password123", "", "Doe")

	if err != domain.ErrInvalidName {
		t.Errorf("Expected ErrInvalidName, got %v", err)
	}
}

func TestUser_VerifyPassword(t *testing.T) {
	email, _ := types.NewEmail("test@example.com")
	user, _ := domain.NewUser(email, "password123", "John", "Doe")

	// Valid password
	err := user.VerifyPassword("password123")
	if err != nil {
		t.Errorf("Expected no error for valid password, got %v", err)
	}

	// Invalid password
	err = user.VerifyPassword("wrongpassword")
	if err == nil {
		t.Error("Expected error for invalid password")
	}
}

func TestUser_ChangePassword(t *testing.T) {
	email, _ := types.NewEmail("test@example.com")
	user, _ := domain.NewUser(email, "oldpassword", "John", "Doe")
	user.ClearEvents() // Clear registration event

	err := user.ChangePassword("oldpassword", "newpassword")

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify old password doesn't work
	if user.VerifyPassword("oldpassword") == nil {
		t.Error("Old password should not work after change")
	}

	// Verify new password works
	if err := user.VerifyPassword("newpassword"); err != nil {
		t.Error("New password should work after change")
	}

	// Check event was recorded
	events := user.DomainEvents()
	if len(events) != 1 || events[0].EventType() != domain.PasswordChangedEventType {
		t.Error("PasswordChanged event should be recorded")
	}
}
