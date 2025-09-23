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

func TestDeleteScoreEventHandler_Handle(t *testing.T) {
	// Setup
	scoreEventRepo := infrastructure.NewMockScoreEventRepository()
	scoreEventOwnerChecker := infrastructure.NewMockScoreEventOwnerChecker()
	eventBus := events.NewInMemoryBus()

	handler := NewDeleteScoreEventHandler(
		scoreEventRepo,
		scoreEventOwnerChecker,
		eventBus,
	)

	// Test data
	userID := uuid.New()
	eventID := uuid.New()

	scoreEvent := domain.ScoreEvent{
		ID:           eventID,
		PetID:        uuid.New(),
		BehaviorID:   uuid.New(),
		GroupID:      uuid.New(),
		RecordedByID: userID,
		Points:       10,
		Comment:      "Test event",
		ActionDate:   time.Now(),
		RecordedAt:   time.Now(),
	}

	t.Run("Successful deletion", func(t *testing.T) {
		// Add event to repo
		_, err := scoreEventRepo.Create(context.Background(), scoreEvent)
		if err != nil {
			t.Fatalf("Failed to create test event: %v", err)
		}

		// Setup permissions
		scoreEventOwnerChecker.SetOwnership(userID, eventID, true)

		err = handler.Handle(context.Background(), userID, eventID)

		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}

		// Verify event was deleted
		deletedEvent, err := scoreEventRepo.GetByID(context.Background(), eventID)
		if err != nil {
			t.Errorf("Unexpected error checking deletion: %v", err)
		}
		if deletedEvent != nil {
			t.Error("Expected event to be deleted")
		}
	})

	t.Run("Not owner", func(t *testing.T) {
		// Add event to repo
		_, err := scoreEventRepo.Create(context.Background(), scoreEvent)
		if err != nil {
			t.Fatalf("Failed to create test event: %v", err)
		}

		// Setup permissions (not owner)
		scoreEventOwnerChecker.SetOwnership(userID, eventID, false)

		err = handler.Handle(context.Background(), userID, eventID)

		if err == nil {
			t.Error("Expected error for not being owner")
		}
		if authErr, ok := err.(*AuthorizationError); !ok {
			t.Errorf("Expected AuthorizationError, got %T", err)
		} else if authErr.Message != "You can only delete your own score events" {
			t.Errorf("Unexpected error message: %s", authErr.Message)
		}
	})

	t.Run("Event not found", func(t *testing.T) {
		nonExistentID := uuid.New()
		scoreEventOwnerChecker.SetOwnership(userID, nonExistentID, true)

		err := handler.Handle(context.Background(), userID, nonExistentID)

		if err == nil {
			t.Error("Expected error for event not found")
		}
		if notFoundErr, ok := err.(*NotFoundError); !ok {
			t.Errorf("Expected NotFoundError, got %T", err)
		} else if notFoundErr.Resource != "score event" {
			t.Errorf("Expected resource 'score event', got %s", notFoundErr.Resource)
		}
	})
}
