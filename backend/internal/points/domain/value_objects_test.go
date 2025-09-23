package domain

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestCreateScoreEventRequest_Validate(t *testing.T) {
	validReq := CreateScoreEventRequest{
		PetID:      uuid.New(),
		BehaviorID: uuid.New(),
		GroupID:    uuid.New(),
		UserID:     uuid.New(),
		Comment:    "Good behavior",
		ActionDate: time.Now(),
	}

	t.Run("Valid request", func(t *testing.T) {
		if err := validReq.Validate(); err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
	})

	t.Run("Missing pet ID", func(t *testing.T) {
		req := validReq
		req.PetID = uuid.Nil
		if err := req.Validate(); err == nil {
			t.Error("Expected error for missing pet ID")
		}
	})

	t.Run("Missing behavior ID", func(t *testing.T) {
		req := validReq
		req.BehaviorID = uuid.Nil
		if err := req.Validate(); err == nil {
			t.Error("Expected error for missing behavior ID")
		}
	})

	t.Run("Missing group ID", func(t *testing.T) {
		req := validReq
		req.GroupID = uuid.Nil
		if err := req.Validate(); err == nil {
			t.Error("Expected error for missing group ID")
		}
	})

	t.Run("Missing user ID", func(t *testing.T) {
		req := validReq
		req.UserID = uuid.Nil
		if err := req.Validate(); err == nil {
			t.Error("Expected error for missing user ID")
		}
	})

	t.Run("Missing action date", func(t *testing.T) {
		req := validReq
		req.ActionDate = time.Time{}
		if err := req.Validate(); err == nil {
			t.Error("Expected error for missing action date")
		}
	})
}

func TestLeaderboardRequest_Validate(t *testing.T) {
	validReq := LeaderboardRequest{
		GroupID: uuid.New(),
		Period:  PeriodDaily,
	}

	t.Run("Valid request", func(t *testing.T) {
		if err := validReq.Validate(); err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
	})

	t.Run("Missing group ID", func(t *testing.T) {
		req := validReq
		req.GroupID = uuid.Nil
		if err := req.Validate(); err == nil {
			t.Error("Expected error for missing group ID")
		}
	})

	t.Run("Invalid period", func(t *testing.T) {
		req := validReq
		req.Period = "invalid"
		if err := req.Validate(); err == nil {
			t.Error("Expected error for invalid period")
		}
	})
}

func TestLeaderboardRequest_GetDateRange(t *testing.T) {
	t.Run("Daily period", func(t *testing.T) {
		req := LeaderboardRequest{Period: PeriodDaily}
		start, end := req.GetDateRange()

		now := time.Now()
		expectedStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		expectedEnd := expectedStart.Add(24 * time.Hour)

		if start.Format("2006-01-02") != expectedStart.Format("2006-01-02") {
			t.Errorf("Expected start date %v, got %v", expectedStart, start)
		}
		if end.Format("2006-01-02") != expectedEnd.Format("2006-01-02") {
			t.Errorf("Expected end date %v, got %v", expectedEnd, end)
		}
	})

	t.Run("Weekly period", func(t *testing.T) {
		req := LeaderboardRequest{Period: PeriodWeekly}
		start, end := req.GetDateRange()

		// Start should be Monday of current week
		now := time.Now()
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday = 7
		}
		expectedStart := now.AddDate(0, 0, -(weekday - 1))
		expectedStart = time.Date(expectedStart.Year(), expectedStart.Month(), expectedStart.Day(), 0, 0, 0, 0, expectedStart.Location())
		expectedEnd := expectedStart.Add(7 * 24 * time.Hour)

		if start.Format("2006-01-02") != expectedStart.Format("2006-01-02") {
			t.Errorf("Expected start date %v, got %v", expectedStart, start)
		}
		if end.Format("2006-01-02") != expectedEnd.Format("2006-01-02") {
			t.Errorf("Expected end date %v, got %v", expectedEnd, end)
		}
	})
}
