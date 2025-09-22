package queries

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"pet-of-the-day/internal/points/domain"
	"pet-of-the-day/internal/points/infrastructure"
)

func TestGetGroupLeaderboardHandler_Handle(t *testing.T) {
	// Setup
	scoreEventRepo := infrastructure.NewMockScoreEventRepository()
	handler := NewGetGroupLeaderboardHandler(scoreEventRepo)

	// Test data
	groupID := uuid.New()
	pet1ID := uuid.New()
	pet2ID := uuid.New()

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 12, 0, 0, 0, now.Location())

	// Events for today
	event1 := domain.ScoreEvent{
		ID:         uuid.New(),
		PetID:      pet1ID,
		GroupID:    groupID,
		Points:     10,
		ActionDate: today,
	}
	event2 := domain.ScoreEvent{
		ID:         uuid.New(),
		PetID:      pet2ID,
		GroupID:    groupID,
		Points:     15,
		ActionDate: today,
	}
	// Event for yesterday - should not be included in daily
	event3 := domain.ScoreEvent{
		ID:         uuid.New(),
		PetID:      pet1ID,
		GroupID:    groupID,
		Points:     20,
		ActionDate: today.Add(-24 * time.Hour),
	}

	scoreEventRepo.Create(context.Background(), event1)
	scoreEventRepo.Create(context.Background(), event2)
	scoreEventRepo.Create(context.Background(), event3)

	t.Run("Valid daily leaderboard", func(t *testing.T) {
		req := domain.LeaderboardRequest{
			GroupID: groupID,
			Period:  domain.PeriodDaily,
		}

		result, err := handler.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if result == nil {
			t.Fatal("Expected result, got nil")
		}
		if len(result.Leaderboard) != 2 {
			t.Errorf("Expected 2 entries, got %d", len(result.Leaderboard))
		}

		// Should be sorted by points descending
		if result.Leaderboard[0].TotalPoints < result.Leaderboard[1].TotalPoints {
			t.Error("Leaderboard should be sorted by points descending")
		}

		// Check ranks are assigned
		if result.Leaderboard[0].Rank != 1 {
			t.Errorf("Expected rank 1, got %d", result.Leaderboard[0].Rank)
		}
		if result.Leaderboard[1].Rank != 2 {
			t.Errorf("Expected rank 2, got %d", result.Leaderboard[1].Rank)
		}
	})

	t.Run("Valid weekly leaderboard", func(t *testing.T) {
		req := domain.LeaderboardRequest{
			GroupID: groupID,
			Period:  domain.PeriodWeekly,
		}

		result, err := handler.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if result == nil {
			t.Fatal("Expected result, got nil")
		}

		// Weekly should include more events if yesterday's event is within the week
		if len(result.Leaderboard) == 0 {
			t.Error("Expected at least some entries in weekly leaderboard")
		}
	})

	t.Run("Invalid request", func(t *testing.T) {
		req := domain.LeaderboardRequest{
			GroupID: uuid.Nil, // Invalid
			Period:  domain.PeriodDaily,
		}

		_, err := handler.Handle(context.Background(), req)

		if err == nil {
			t.Error("Expected error for invalid request")
		}
	})

	t.Run("Invalid period", func(t *testing.T) {
		req := domain.LeaderboardRequest{
			GroupID: groupID,
			Period:  "invalid",
		}

		_, err := handler.Handle(context.Background(), req)

		if err == nil {
			t.Error("Expected error for invalid period")
		}
	})
}