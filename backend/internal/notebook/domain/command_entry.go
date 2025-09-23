package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrCommandNameRequired    = errors.New("command_name is required for command entries")
	ErrInvalidSuccessRate     = errors.New("success_rate must be between 0 and 100")
	ErrLastPracticedInFuture  = errors.New("last_practiced cannot be in the future")
)

// CommandEntry represents specialized command entry data
type CommandEntry struct {
	id             uuid.UUID
	entryID        uuid.UUID
	commandName    string     // Required
	trainingStatus string
	successRate    *int       // Optional, 0-100 range
	trainingMethod string
	lastPracticed  *time.Time // Optional, cannot be in future
	createdAt      time.Time
	updatedAt      time.Time
}

// NewCommandEntry creates a new command entry
func NewCommandEntry(
	entryID uuid.UUID,
	commandName string,
	trainingStatus string,
	successRate *int,
	trainingMethod string,
	lastPracticed *time.Time,
) (*CommandEntry, error) {
	if err := validateCommandData(commandName, successRate, lastPracticed); err != nil {
		return nil, err
	}

	now := time.Now()
	return &CommandEntry{
		id:             uuid.New(),
		entryID:        entryID,
		commandName:    commandName,
		trainingStatus: trainingStatus,
		successRate:    successRate,
		trainingMethod: trainingMethod,
		lastPracticed:  lastPracticed,
		createdAt:      now,
		updatedAt:      now,
	}, nil
}

// Update updates the command entry data
func (c *CommandEntry) Update(
	commandName string,
	trainingStatus string,
	successRate *int,
	trainingMethod string,
	lastPracticed *time.Time,
) error {
	if err := validateCommandData(commandName, successRate, lastPracticed); err != nil {
		return err
	}

	c.commandName = commandName
	c.trainingStatus = trainingStatus
	c.successRate = successRate
	c.trainingMethod = trainingMethod
	c.lastPracticed = lastPracticed
	c.updatedAt = time.Now()
	return nil
}

// Getters
func (c *CommandEntry) ID() uuid.UUID {
	return c.id
}

func (c *CommandEntry) EntryID() uuid.UUID {
	return c.entryID
}

func (c *CommandEntry) CommandName() string {
	return c.commandName
}

func (c *CommandEntry) TrainingStatus() string {
	return c.trainingStatus
}

func (c *CommandEntry) SuccessRate() *int {
	return c.successRate
}

func (c *CommandEntry) TrainingMethod() string {
	return c.trainingMethod
}

func (c *CommandEntry) LastPracticed() *time.Time {
	return c.lastPracticed
}

func (c *CommandEntry) CreatedAt() time.Time {
	return c.createdAt
}

func (c *CommandEntry) UpdatedAt() time.Time {
	return c.updatedAt
}

// validateCommandData validates command-specific fields
func validateCommandData(commandName string, successRate *int, lastPracticed *time.Time) error {
	if commandName == "" {
		return ErrCommandNameRequired
	}

	if successRate != nil && (*successRate < 0 || *successRate > 100) {
		return ErrInvalidSuccessRate
	}

	if lastPracticed != nil && lastPracticed.After(time.Now()) {
		return ErrLastPracticedInFuture
	}

	return nil
}