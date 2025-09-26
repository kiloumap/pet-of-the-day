package commands

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"pet-of-the-day/internal/points/domain"
	"pet-of-the-day/internal/points/infrastructure"
	"pet-of-the-day/internal/shared/events"
)

func TestCreateScoreEventHandler_Handle(t *testing.T) {
	// Setup
	behaviorRepo := infrastructure.NewMockBehaviorRepository()
	scoreEventRepo := infrastructure.NewMockScoreEventRepository()
	petAccessChecker := infrastructure.NewMockPetAccessChecker()
	groupMembershipChecker := infrastructure.NewMockGroupMembershipChecker()
	eventBus := events.NewInMemoryBus()

	handler := NewCreateScoreEventHandler(
		behaviorRepo,
		scoreEventRepo,
		petAccessChecker,
		groupMembershipChecker,
		eventBus,
	)

	// Test data
	userID := uuid.New()
	petID := uuid.New()
	behaviorID := uuid.New()
	groupID := uuid.New()

	behavior := domain.Behavior{
		ID:                 behaviorID,
		Name:               "Test Behavior",
		Description:        "A test behavior",
		Category:           domain.BehaviorCategoryTraining,
		PointValue:         10,
		MinIntervalMinutes: 30,
		Species:            domain.SpeciesBoth,
		Icon:               "test",
		IsActive:           true,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	behaviorRepo.AddBehavior(behavior)

	t.Run("Successful creation", func(t *testing.T) {
		// Setup permissions
		petAccessChecker.SetAccess(userID, petID, true)
		groupMembershipChecker.SetMembership(userID, groupID, true)

		req := domain.CreateScoreEventRequest{
			PetID:      petID,
			BehaviorID: behaviorID,
			GroupID:    groupID,
			UserID:     userID,
			Comment:    "Good job!",
			ActionDate: time.Now(),
		}

		result, err := handler.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if result == nil {
			t.Fatal("Expected result, got nil")
		}
		if result.Points != 10 {
			t.Errorf("Expected points 10, got %d", result.Points)
		}
		if result.Comment != "Good job!" {
			t.Errorf("Expected comment 'Good job!', got %s", result.Comment)
		}
	})

	t.Run("Invalid request", func(t *testing.T) {
		req := domain.CreateScoreEventRequest{} // Invalid request

		_, err := handler.Handle(context.Background(), req)

		if err == nil {
			t.Error("Expected error for invalid request")
		}
	})

	t.Run("No pet access", func(t *testing.T) {
		petAccessChecker.SetAccess(userID, petID, false)

		req := domain.CreateScoreEventRequest{
			PetID:      petID,
			BehaviorID: behaviorID,
			GroupID:    groupID,
			UserID:     userID,
			ActionDate: time.Now(),
		}

		_, err := handler.Handle(context.Background(), req)

		if err == nil {
			t.Error("Expected error for no pet access")
		}
		if authErr, ok := err.(*AuthorizationError); !ok {
			t.Errorf("Expected AuthorizationError, got %T", err)
		} else if authErr.Message != "You don't have permission to record actions for this pet" {
			t.Errorf("Unexpected error message: %s", authErr.Message)
		}
	})

	t.Run("Not group member", func(t *testing.T) {
		petAccessChecker.SetAccess(userID, petID, true)
		groupMembershipChecker.SetMembership(userID, groupID, false)

		req := domain.CreateScoreEventRequest{
			PetID:      petID,
			BehaviorID: behaviorID,
			GroupID:    groupID,
			UserID:     userID,
			ActionDate: time.Now(),
		}

		_, err := handler.Handle(context.Background(), req)

		if err == nil {
			t.Error("Expected error for not being group member")
		}
		if authErr, ok := err.(*AuthorizationError); !ok {
			t.Errorf("Expected AuthorizationError, got %T", err)
		} else if authErr.Message != "You are not a member of this group" {
			t.Errorf("Unexpected error message: %s", authErr.Message)
		}
	})

	t.Run("Behavior not found", func(t *testing.T) {
		petAccessChecker.SetAccess(userID, petID, true)
		groupMembershipChecker.SetMembership(userID, groupID, true)

		invalidBehaviorID := uuid.New()
		req := domain.CreateScoreEventRequest{
			PetID:      petID,
			BehaviorID: invalidBehaviorID,
			GroupID:    groupID,
			UserID:     userID,
			ActionDate: time.Now(),
		}

		_, err := handler.Handle(context.Background(), req)

		if err == nil {
			t.Error("Expected error for behavior not found")
		}
		if notFoundErr, ok := err.(*NotFoundError); !ok {
			t.Errorf("Expected NotFoundError, got %T", err)
		} else if notFoundErr.Resource != "behavior" {
			t.Errorf("Expected resource 'behavior', got %s", notFoundErr.Resource)
		}
	})
}

func TestAuthorizationError(t *testing.T) {
	err := &AuthorizationError{Message: "Test message"}
	if err.Error() != "Test message" {
		t.Errorf("Expected 'Test message', got %s", err.Error())
	}
}

func TestNotFoundError(t *testing.T) {
	err := &NotFoundError{Resource: "test", ID: "123"}
	expected := "test not found: 123"
	if err.Error() != expected {
		t.Errorf("Expected '%s', got %s", expected, err.Error())
	}
}
