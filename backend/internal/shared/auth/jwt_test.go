package auth

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestJWTService_GenerateAndValidateToken(t *testing.T) {
	jwtService := NewJWTService("test-secret-key", "test-issuer")
	userID := uuid.New()

	// Generate token
	token, err := jwtService.GenerateToken(userID)
	if err != nil {
		t.Fatalf("Expected no error generating token, got %v", err)
	}

	if token == "" {
		t.Error("Expected non-empty token")
	}

	// Validate token
	claims, err := jwtService.ValidateToken(token)
	if err != nil {
		t.Fatalf("Expected no error validating token, got %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("Expected user ID %s, got %s", userID, claims.UserID)
	}

	if claims.Issuer != "test-issuer" {
		t.Errorf("Expected issuer 'test-issuer', got %s", claims.Issuer)
	}

	// Check expiration is in the future
	if claims.ExpiresAt.Time.Before(time.Now()) {
		t.Error("Token should not be expired immediately after generation")
	}
}

func TestJWTService_ValidateInvalidToken(t *testing.T) {
	jwtService := NewJWTService("test-secret-key", "test-issuer")

	invalidTokens := []string{
		"invalid.token.format",
		"",
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
	}

	for _, token := range invalidTokens {
		_, err := jwtService.ValidateToken(token)
		if err == nil {
			t.Errorf("Expected error for invalid token %s, got none", token)
		}
	}
}

func TestJWTService_ValidateTokenWithWrongSecret(t *testing.T) {
	// Generate token with one secret
	jwtService1 := NewJWTService("secret-1", "test-issuer")
	userID := uuid.New()
	token, _ := jwtService1.GenerateToken(userID)

	// Try to validate with different secret
	jwtService2 := NewJWTService("secret-2", "test-issuer")
	_, err := jwtService2.ValidateToken(token)

	if err == nil {
		t.Error("Expected error when validating token with wrong secret")
	}
}
