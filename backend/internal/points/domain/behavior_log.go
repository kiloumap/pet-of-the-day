package domain

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// BehaviorLog represents a record of when a specific behavior was logged for a pet
type BehaviorLog struct {
	ID             uuid.UUID
	PetID          uuid.UUID
	BehaviorID     uuid.UUID
	UserID         uuid.UUID
	PointsAwarded  int
	LoggedAt       time.Time
	CreatedAt      time.Time
	Notes          string
	GroupShares    []BehaviorLogGroupShare
}

// BehaviorLogGroupShare represents which groups can see this behavior log
type BehaviorLogGroupShare struct {
	ID            uuid.UUID
	BehaviorLogID uuid.UUID
	GroupID       uuid.UUID
	CreatedAt     time.Time
}

// NewBehaviorLog creates a new behavior log entry with validation
func NewBehaviorLog(petID, behaviorID, userID uuid.UUID, pointsAwarded int, loggedAt time.Time, notes string) (*BehaviorLog, error) {
	if petID == uuid.Nil {
		return nil, fmt.Errorf("pet ID is required")
	}

	if behaviorID == uuid.Nil {
		return nil, fmt.Errorf("behavior ID is required")
	}

	if userID == uuid.Nil {
		return nil, fmt.Errorf("user ID is required")
	}

	if err := validateLoggedAtTime(loggedAt); err != nil {
		return nil, err
	}

	if err := validateNotes(notes); err != nil {
		return nil, err
	}

	now := time.Now()

	return &BehaviorLog{
		ID:            uuid.New(),
		PetID:         petID,
		BehaviorID:    behaviorID,
		UserID:        userID,
		PointsAwarded: pointsAwarded,
		LoggedAt:      loggedAt,
		CreatedAt:     now,
		Notes:         notes,
		GroupShares:   make([]BehaviorLogGroupShare, 0),
	}, nil
}

// AddGroupShare adds a group share to this behavior log
func (bl *BehaviorLog) AddGroupShare(groupID uuid.UUID) error {
	if groupID == uuid.Nil {
		return fmt.Errorf("group ID is required")
	}

	// Check if group is already shared
	for _, share := range bl.GroupShares {
		if share.GroupID == groupID {
			return fmt.Errorf("behavior log is already shared with group %s", groupID)
		}
	}

	share := BehaviorLogGroupShare{
		ID:            uuid.New(),
		BehaviorLogID: bl.ID,
		GroupID:       groupID,
		CreatedAt:     time.Now(),
	}

	bl.GroupShares = append(bl.GroupShares, share)
	return nil
}

// RemoveGroupShare removes a group share from this behavior log
func (bl *BehaviorLog) RemoveGroupShare(groupID uuid.UUID) error {
	for i, share := range bl.GroupShares {
		if share.GroupID == groupID {
			bl.GroupShares = append(bl.GroupShares[:i], bl.GroupShares[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("group share not found for group %s", groupID)
}

// IsSharedWithGroup returns true if this behavior log is shared with the specified group
func (bl *BehaviorLog) IsSharedWithGroup(groupID uuid.UUID) bool {
	for _, share := range bl.GroupShares {
		if share.GroupID == groupID {
			return true
		}
	}
	return false
}

// GetSharedGroupIDs returns all group IDs this behavior log is shared with
func (bl *BehaviorLog) GetSharedGroupIDs() []uuid.UUID {
	groupIDs := make([]uuid.UUID, len(bl.GroupShares))
	for i, share := range bl.GroupShares {
		groupIDs[i] = share.GroupID
	}
	return groupIDs
}

// IsPositive returns true if this behavior log awards positive points
func (bl *BehaviorLog) IsPositive() bool {
	return bl.PointsAwarded > 0
}

// IsNegative returns true if this behavior log awards negative points
func (bl *BehaviorLog) IsNegative() bool {
	return bl.PointsAwarded < 0
}

// GetBehaviorCategory returns the category of behaviors this log should be grouped with for analysis
// This is a placeholder - in practice, this would be resolved through the Behavior entity
func (bl *BehaviorLog) GetPointContribution() int {
	return bl.PointsAwarded
}

// IsWithinLastHours checks if this behavior log was created within the last N hours
func (bl *BehaviorLog) IsWithinLastHours(hours int) bool {
	cutoff := time.Now().Add(-time.Duration(hours) * time.Hour)
	return bl.LoggedAt.After(cutoff)
}

// Validation functions

func validateLoggedAtTime(loggedAt time.Time) error {
	now := time.Now()

	// Cannot be in the future
	if loggedAt.After(now) {
		return fmt.Errorf("logged time cannot be in the future")
	}

	// Cannot be more than 24 hours in the past
	if loggedAt.Before(now.Add(-24 * time.Hour)) {
		return fmt.Errorf("logged time cannot be more than 24 hours in the past")
	}

	return nil
}

func validateNotes(notes string) error {
	if len(notes) > 500 {
		return fmt.Errorf("notes must be 500 characters or less")
	}
	return nil
}

// BehaviorLogFilter represents criteria for filtering behavior logs
type BehaviorLogFilter struct {
	PetID      *uuid.UUID
	BehaviorID *uuid.UUID
	GroupID    *uuid.UUID
	UserID     *uuid.UUID
	DateFrom   *time.Time
	DateTo     *time.Time
	Limit      int
	Offset     int
}

// NewBehaviorLogFilter creates a new filter with sensible defaults
func NewBehaviorLogFilter() *BehaviorLogFilter {
	return &BehaviorLogFilter{
		Limit:  50,
		Offset: 0,
	}
}

// WithPet adds a pet ID filter
func (f *BehaviorLogFilter) WithPet(petID uuid.UUID) *BehaviorLogFilter {
	f.PetID = &petID
	return f
}

// WithBehavior adds a behavior ID filter
func (f *BehaviorLogFilter) WithBehavior(behaviorID uuid.UUID) *BehaviorLogFilter {
	f.BehaviorID = &behaviorID
	return f
}

// WithGroup adds a group ID filter
func (f *BehaviorLogFilter) WithGroup(groupID uuid.UUID) *BehaviorLogFilter {
	f.GroupID = &groupID
	return f
}

// WithUser adds a user ID filter
func (f *BehaviorLogFilter) WithUser(userID uuid.UUID) *BehaviorLogFilter {
	f.UserID = &userID
	return f
}

// WithDateRange adds date range filter
func (f *BehaviorLogFilter) WithDateRange(from, to time.Time) *BehaviorLogFilter {
	f.DateFrom = &from
	f.DateTo = &to
	return f
}

// WithPagination sets limit and offset
func (f *BehaviorLogFilter) WithPagination(limit, offset int) *BehaviorLogFilter {
	f.Limit = limit
	f.Offset = offset
	return f
}