package domain

import (
	"time"

	"github.com/google/uuid"
)

// ScoreEvent represents a recorded instance of a behavior being performed (legacy system)
type ScoreEvent struct {
	ID           uuid.UUID
	PetID        uuid.UUID
	BehaviorID   uuid.UUID
	GroupID      uuid.UUID
	RecordedByID uuid.UUID
	Points       int
	Comment      string
	ActionDate   time.Time
	RecordedAt   time.Time
}

// LeaderboardEntry represents a pet's position in a group leaderboard (legacy system)
type LeaderboardEntry struct {
	PetID       uuid.UUID
	PetName     string
	Species     string
	OwnerName   string
	TotalPoints int
	ActionCount int
	Rank        int
}

// ActivityItem represents an activity in the user's feed with full context (legacy system)
type ActivityItem struct {
	ID           uuid.UUID
	PetID        uuid.UUID
	PetName      string
	BehaviorID   uuid.UUID
	BehaviorName string
	GroupID      uuid.UUID
	GroupName    string
	Points       int
	Comment      string
	RecordedAt   time.Time
	ActionDate   time.Time
	RecordedBy   uuid.UUID
}

// Period represents a time period for leaderboards
type Period string

const (
	PeriodDaily  Period = "daily"
	PeriodWeekly Period = "weekly"
)

// IsValidSpecies checks if a species string is valid
func IsValidSpecies(s string) bool {
	return s == string(SpeciesDog) || s == string(SpeciesCat) || s == string(SpeciesBoth)
}

// IsValidPeriod checks if a period string is valid
func IsValidPeriod(p string) bool {
	return p == string(PeriodDaily) || p == string(PeriodWeekly)
}
