package queries

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"pet-of-the-day/internal/points/domain"
	"pet-of-the-day/internal/points/infrastructure"
)

func TestGetPetScoreEventsHandler_Handle(t *testing.T) {
	// Setup
	scoreEventRepo := infrastructure.NewMockScoreEventRepository()
	handler := NewGetPetScoreEventsHandler(scoreEventRepo)

	// Test data
	petID := uuid.New()
	groupID := uuid.New()

	event1 := domain.ScoreEvent{
		ID:         uuid.New(),
		PetID:      petID,
		GroupID:    groupID,
		Points:     10,
		ActionDate: time.Now(),
	}
	event2 := domain.ScoreEvent{
		ID:         uuid.New(),
		PetID:      petID,
		GroupID:    groupID,
		Points:     5,
		ActionDate: time.Now().Add(-time.Hour),
	}
	// Different group - should not be included
	event3 := domain.ScoreEvent{
		ID:         uuid.New(),
		PetID:      petID,
		GroupID:    uuid.New(),
		Points:     20,
		ActionDate: time.Now(),
	}

	scoreEventRepo.Create(context.Background(), event1)
	scoreEventRepo.Create(context.Background(), event2)
	scoreEventRepo.Create(context.Background(), event3)

	t.Run("Get events with default limit", func(t *testing.T) {
		result, err := handler.Handle(context.Background(), petID, groupID, 0)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if result == nil {
			t.Fatal("Expected result, got nil")
		}
		if len(result.Events) != 2 {
			t.Errorf("Expected 2 events, got %d", len(result.Events))
		}
		if result.TotalPoints != 15 {
			t.Errorf("Expected total points 15, got %d", result.TotalPoints)
		}
	})

	t.Run("Get events with limit", func(t *testing.T) {
		result, err := handler.Handle(context.Background(), petID, groupID, 1)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if len(result.Events) != 1 {
			t.Errorf("Expected 1 event, got %d", len(result.Events))
		}
	})

	t.Run("Invalid limit gets defaulted", func(t *testing.T) {
		result, err := handler.Handle(context.Background(), petID, groupID, -1)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		// Should default to 50
		if len(result.Events) > 50 {
			t.Errorf("Expected limit to be applied")
		}
	})

	t.Run("Large limit gets capped", func(t *testing.T) {
		result, err := handler.Handle(context.Background(), petID, groupID, 300)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		// Should be capped to 50 (default)
		if len(result.Events) != 2 { // We only have 2 events
			t.Errorf("Expected 2 events, got %d", len(result.Events))
		}
	})
}