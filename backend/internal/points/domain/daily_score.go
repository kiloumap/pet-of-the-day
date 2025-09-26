package domain

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// DailyScore represents a pet's accumulated points for a specific day in a specific group
type DailyScore struct {
	ID                  uuid.UUID
	PetID               uuid.UUID
	GroupID             uuid.UUID
	Date                time.Time
	TotalPoints         int
	PositiveBehaviors   int
	NegativeBehaviors   int
	BehaviorPointTotal  int
	LastActivityAt      *time.Time
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// NewDailyScore creates a new daily score entry for a pet in a group on a specific date
func NewDailyScore(petID, groupID uuid.UUID, date time.Time) (*DailyScore, error) {
	if petID == uuid.Nil {
		return nil, fmt.Errorf("pet ID is required")
	}

	if groupID == uuid.Nil {
		return nil, fmt.Errorf("group ID is required")
	}

	// Normalize date to start of day (remove time component)
	normalizedDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())

	now := time.Now()

	return &DailyScore{
		ID:                  uuid.New(),
		PetID:               petID,
		GroupID:             groupID,
		Date:                normalizedDate,
		TotalPoints:         0,
		PositiveBehaviors:   0,
		NegativeBehaviors:   0,
		BehaviorPointTotal:  0,
		LastActivityAt:      nil,
		CreatedAt:           now,
		UpdatedAt:           now,
	}, nil
}

// AddBehaviorLog updates the daily score with a new behavior log
func (ds *DailyScore) AddBehaviorLog(behaviorLog *BehaviorLog) error {
	if behaviorLog == nil {
		return fmt.Errorf("behavior log is required")
	}

	// Update point totals
	ds.BehaviorPointTotal += behaviorLog.PointsAwarded
	ds.TotalPoints += behaviorLog.PointsAwarded

	// Update behavior counts
	if behaviorLog.IsPositive() {
		ds.PositiveBehaviors++
	} else if behaviorLog.IsNegative() {
		ds.NegativeBehaviors++
	}

	// Update last activity time
	ds.LastActivityAt = &behaviorLog.LoggedAt
	ds.UpdatedAt = time.Now()

	return nil
}

// RemoveBehaviorLog updates the daily score by removing a behavior log's contribution
func (ds *DailyScore) RemoveBehaviorLog(behaviorLog *BehaviorLog) error {
	if behaviorLog == nil {
		return fmt.Errorf("behavior log is required")
	}

	// Update point totals
	ds.BehaviorPointTotal -= behaviorLog.PointsAwarded
	ds.TotalPoints -= behaviorLog.PointsAwarded

	// Update behavior counts
	if behaviorLog.IsPositive() {
		ds.PositiveBehaviors--
		if ds.PositiveBehaviors < 0 {
			ds.PositiveBehaviors = 0
		}
	} else if behaviorLog.IsNegative() {
		ds.NegativeBehaviors--
		if ds.NegativeBehaviors < 0 {
			ds.NegativeBehaviors = 0
		}
	}

	ds.UpdatedAt = time.Now()

	return nil
}

// IsWinningScore returns true if this score would win against another score
// Uses tie-breaking rules: higher points win, if tied then fewer negative behaviors win
func (ds *DailyScore) IsWinningScore(other *DailyScore) bool {
	if ds.TotalPoints > other.TotalPoints {
		return true
	}

	if ds.TotalPoints == other.TotalPoints {
		// Tie-breaking: fewer negative behaviors wins
		return ds.NegativeBehaviors < other.NegativeBehaviors
	}

	return false
}

// IsTiedWith returns true if this score is tied with another score
func (ds *DailyScore) IsTiedWith(other *DailyScore) bool {
	return ds.TotalPoints == other.TotalPoints && ds.NegativeBehaviors == other.NegativeBehaviors
}

// IsPositive returns true if the total score is positive
func (ds *DailyScore) IsPositive() bool {
	return ds.TotalPoints > 0
}

// HasActivity returns true if any behaviors have been logged
func (ds *DailyScore) HasActivity() bool {
	return ds.PositiveBehaviors > 0 || ds.NegativeBehaviors > 0
}

// GetNetBehaviorCount returns the net behavior count (positive - negative)
func (ds *DailyScore) GetNetBehaviorCount() int {
	return ds.PositiveBehaviors - ds.NegativeBehaviors
}

// DailyScoreBreakdown represents a detailed breakdown of how daily points were earned
type DailyScoreBreakdown struct {
	BehaviorID        uuid.UUID
	BehaviorName      string
	BehaviorCategory  BehaviorCategory
	Count             int
	PointsPerInstance int
	TotalPoints       int
}

// PetRanking represents a pet's ranking within a group for a specific time period
type PetRanking struct {
	PetID             uuid.UUID
	PetName           string
	OwnerName         string
	TotalPoints       int
	TodaysPoints      int
	Rank              int
	PositiveBehaviors int
	NegativeBehaviors int
	LastActivityAt    *time.Time
	IsTied            bool
}

// NewPetRanking creates a new pet ranking entry
func NewPetRanking(petID uuid.UUID, petName, ownerName string) *PetRanking {
	return &PetRanking{
		PetID:             petID,
		PetName:           petName,
		OwnerName:         ownerName,
		TotalPoints:       0,
		TodaysPoints:      0,
		Rank:              0,
		PositiveBehaviors: 0,
		NegativeBehaviors: 0,
		LastActivityAt:    nil,
		IsTied:            false,
	}
}

// UpdateFromDailyScore updates the ranking with data from a daily score
func (pr *PetRanking) UpdateFromDailyScore(dailyScore *DailyScore) {
	pr.TodaysPoints = dailyScore.TotalPoints
	pr.TotalPoints += dailyScore.TotalPoints
	pr.PositiveBehaviors += dailyScore.PositiveBehaviors
	pr.NegativeBehaviors += dailyScore.NegativeBehaviors

	if dailyScore.LastActivityAt != nil {
		if pr.LastActivityAt == nil || dailyScore.LastActivityAt.After(*pr.LastActivityAt) {
			pr.LastActivityAt = dailyScore.LastActivityAt
		}
	}
}

// SetRank sets the ranking position for this pet
func (pr *PetRanking) SetRank(rank int, isTied bool) {
	pr.Rank = rank
	pr.IsTied = isTied
}

// CompareForRanking compares two pet rankings using the standard rules
// Returns positive if pr should rank higher, negative if other should rank higher, 0 if tied
func (pr *PetRanking) CompareForRanking(other *PetRanking) int {
	// First compare total points
	if pr.TotalPoints > other.TotalPoints {
		return 1
	}
	if pr.TotalPoints < other.TotalPoints {
		return -1
	}

	// If points are tied, compare negative behavior count (fewer is better)
	if pr.NegativeBehaviors < other.NegativeBehaviors {
		return 1
	}
	if pr.NegativeBehaviors > other.NegativeBehaviors {
		return -1
	}

	// Perfect tie
	return 0
}

// PetOfTheDayWinner represents a pet who won "Pet of the Day" for a specific date
type PetOfTheDayWinner struct {
	ID               uuid.UUID
	GroupID          uuid.UUID
	PetID            uuid.UUID
	PetName          string
	OwnerName        string
	Date             time.Time
	FinalScore       int
	PositiveBehaviors int
	NegativeBehaviors int
	CreatedAt        time.Time
}

// NewPetOfTheDayWinner creates a new Pet of the Day winner record
func NewPetOfTheDayWinner(groupID, petID uuid.UUID, petName, ownerName string, date time.Time, finalScore, positiveBehaviors, negativeBehaviors int) *PetOfTheDayWinner {
	// Normalize date to start of day
	normalizedDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())

	return &PetOfTheDayWinner{
		ID:               uuid.New(),
		GroupID:          groupID,
		PetID:            petID,
		PetName:          petName,
		OwnerName:        ownerName,
		Date:             normalizedDate,
		FinalScore:       finalScore,
		PositiveBehaviors: positiveBehaviors,
		NegativeBehaviors: negativeBehaviors,
		CreatedAt:        time.Now(),
	}
}

// IsEligibleForWin returns true if this winner meets the criteria for Pet of the Day
// (positive score required)
func (potd *PetOfTheDayWinner) IsEligibleForWin() bool {
	return potd.FinalScore > 0
}

// DailyScoreFilter represents criteria for filtering daily scores
type DailyScoreFilter struct {
	PetID   *uuid.UUID
	GroupID *uuid.UUID
	Date    *time.Time
	DateFrom *time.Time
	DateTo   *time.Time
	MinPoints *int
	HasActivity *bool
	Limit   int
	Offset  int
}

// NewDailyScoreFilter creates a new filter with sensible defaults
func NewDailyScoreFilter() *DailyScoreFilter {
	return &DailyScoreFilter{
		Limit:  50,
		Offset: 0,
	}
}

// WithPet adds a pet ID filter
func (f *DailyScoreFilter) WithPet(petID uuid.UUID) *DailyScoreFilter {
	f.PetID = &petID
	return f
}

// WithGroup adds a group ID filter
func (f *DailyScoreFilter) WithGroup(groupID uuid.UUID) *DailyScoreFilter {
	f.GroupID = &groupID
	return f
}

// WithDate adds a specific date filter
func (f *DailyScoreFilter) WithDate(date time.Time) *DailyScoreFilter {
	f.Date = &date
	return f
}

// WithDateRange adds date range filter
func (f *DailyScoreFilter) WithDateRange(from, to time.Time) *DailyScoreFilter {
	f.DateFrom = &from
	f.DateTo = &to
	return f
}

// WithMinPoints adds minimum points filter
func (f *DailyScoreFilter) WithMinPoints(minPoints int) *DailyScoreFilter {
	f.MinPoints = &minPoints
	return f
}

// WithActivity adds activity filter
func (f *DailyScoreFilter) WithActivity(hasActivity bool) *DailyScoreFilter {
	f.HasActivity = &hasActivity
	return f
}

// WithPagination sets limit and offset
func (f *DailyScoreFilter) WithPagination(limit, offset int) *DailyScoreFilter {
	f.Limit = limit
	f.Offset = offset
	return f
}