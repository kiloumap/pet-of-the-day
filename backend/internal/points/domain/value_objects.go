package domain

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// CreateScoreEventRequest represents the data needed to create a score event
type CreateScoreEventRequest struct {
	PetID      uuid.UUID
	BehaviorID uuid.UUID
	GroupID    uuid.UUID
	UserID     uuid.UUID
	Comment    string
	ActionDate time.Time
}

// Validate ensures the request is valid
func (r CreateScoreEventRequest) Validate() error {
	if r.PetID == uuid.Nil {
		return fmt.Errorf("pet ID is required")
	}
	if r.BehaviorID == uuid.Nil {
		return fmt.Errorf("behavior ID is required")
	}
	if r.GroupID == uuid.Nil {
		return fmt.Errorf("group ID is required")
	}
	if r.UserID == uuid.Nil {
		return fmt.Errorf("user ID is required")
	}
	if r.ActionDate.IsZero() {
		return fmt.Errorf("action date is required")
	}
	return nil
}

// LeaderboardRequest represents the data needed to get a leaderboard
type LeaderboardRequest struct {
	GroupID uuid.UUID
	Period  Period
}

// Validate ensures the request is valid
func (r LeaderboardRequest) Validate() error {
	if r.GroupID == uuid.Nil {
		return fmt.Errorf("group ID is required")
	}
	if !IsValidPeriod(string(r.Period)) {
		return fmt.Errorf("invalid period: %s", r.Period)
	}
	return nil
}

// GetDateRange returns the start and end dates for the period
func (r LeaderboardRequest) GetDateRange() (time.Time, time.Time) {
	now := time.Now()
	var startDate, endDate time.Time

	switch r.Period {
	case PeriodDaily:
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		endDate = startDate.Add(24 * time.Hour)
	case PeriodWeekly:
		// Start of week (Monday)
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday = 7
		}
		startDate = now.AddDate(0, 0, -(weekday-1))
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())
		endDate = startDate.Add(7 * 24 * time.Hour)
	}

	return startDate, endDate
}