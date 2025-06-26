package types_test

import (
	"testing"

	"pet-of-the-day/internal/shared/types"
)

func TestNewEmail_ValidEmails(t *testing.T) {
	validEmails := []string{
		"test@example.com",
		"user.name@domain.co.uk",
		"user+tag@example.org",
		"123@test.com",
	}

	for _, emailStr := range validEmails {
		email, err := types.NewEmail(emailStr)
		if err != nil {
			t.Errorf("Expected valid email %s, got error: %v", emailStr, err)
		}
		if email.String() != emailStr {
			t.Errorf("Expected %s, got %s", emailStr, email.String())
		}
	}
}

func TestNewEmail_InvalidEmails(t *testing.T) {
	invalidEmails := []string{
		"",
		"invalid",
		"@example.com",
		"test@",
		"test.example.com",
		"test@.com",
		"test@com",
	}

	for _, emailStr := range invalidEmails {
		_, err := types.NewEmail(emailStr)
		if err == nil {
			t.Errorf("Expected error for invalid email %s, got none", emailStr)
		}
	}
}

func TestNewEmail_CaseInsensitiveAndTrimming(t *testing.T) {
	email, err := types.NewEmail("  TEST@EXAMPLE.COM  ")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	expected := "test@example.com"
	if email.String() != expected {
		t.Errorf("Expected %s, got %s", expected, email.String())
	}
}
