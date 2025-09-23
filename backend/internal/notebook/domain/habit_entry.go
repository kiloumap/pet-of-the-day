package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrSeverityOutOfRange     = errors.New("severity must be between 1 and 5")
	ErrBehaviorPatternRequired = errors.New("behavior_pattern is required for habit entries")
)

// HabitEntry represents specialized habit entry data
type HabitEntry struct {
	id              uuid.UUID
	entryID         uuid.UUID
	behaviorPattern string // Required
	triggers        string
	frequency       string
	location        string
	severity        int    // 1-5 range, required
	createdAt       time.Time
	updatedAt       time.Time
}

// NewHabitEntry creates a new habit entry
func NewHabitEntry(
	entryID uuid.UUID,
	behaviorPattern string,
	triggers string,
	frequency string,
	location string,
	severity int,
) (*HabitEntry, error) {
	if err := validateHabitData(behaviorPattern, severity); err != nil {
		return nil, err
	}

	now := time.Now()
	return &HabitEntry{
		id:              uuid.New(),
		entryID:         entryID,
		behaviorPattern: behaviorPattern,
		triggers:        triggers,
		frequency:       frequency,
		location:        location,
		severity:        severity,
		createdAt:       now,
		updatedAt:       now,
	}, nil
}

// Update updates the habit entry data
func (h *HabitEntry) Update(
	behaviorPattern string,
	triggers string,
	frequency string,
	location string,
	severity int,
) error {
	if err := validateHabitData(behaviorPattern, severity); err != nil {
		return err
	}

	h.behaviorPattern = behaviorPattern
	h.triggers = triggers
	h.frequency = frequency
	h.location = location
	h.severity = severity
	h.updatedAt = time.Now()
	return nil
}

// Getters
func (h *HabitEntry) ID() uuid.UUID {
	return h.id
}

func (h *HabitEntry) EntryID() uuid.UUID {
	return h.entryID
}

func (h *HabitEntry) BehaviorPattern() string {
	return h.behaviorPattern
}

func (h *HabitEntry) Triggers() string {
	return h.triggers
}

func (h *HabitEntry) Frequency() string {
	return h.frequency
}

func (h *HabitEntry) Location() string {
	return h.location
}

func (h *HabitEntry) Severity() int {
	return h.severity
}

func (h *HabitEntry) CreatedAt() time.Time {
	return h.createdAt
}

func (h *HabitEntry) UpdatedAt() time.Time {
	return h.updatedAt
}

// validateHabitData validates habit-specific fields
func validateHabitData(behaviorPattern string, severity int) error {
	if behaviorPattern == "" {
		return ErrBehaviorPatternRequired
	}

	if severity < 1 || severity > 5 {
		return ErrSeverityOutOfRange
	}

	return nil
}