package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrEntryNotFound       = errors.New("notebook entry not found")
	ErrInvalidEntryType    = errors.New("invalid entry type")
	ErrTitleRequired       = errors.New("title is required")
	ErrTitleTooLong        = errors.New("title cannot exceed 200 characters")
	ErrContentRequired     = errors.New("content is required")
	ErrContentTooLong      = errors.New("content cannot exceed 10,000 characters")
	ErrFutureDateOccurred  = errors.New("date_occurred cannot be in the future")
	ErrTooManyTags         = errors.New("maximum 10 tags allowed per entry")
	ErrTooManyAttachments  = errors.New("maximum 5 attachments allowed per medical entry")
)

// EntryType represents the type of notebook entry
type EntryType string

const (
	EntryTypeMedical  EntryType = "medical"
	EntryTypeDiet     EntryType = "diet"
	EntryTypeHabits   EntryType = "habits"
	EntryTypeCommands EntryType = "commands"
)

// ValidEntryTypes contains all valid entry types
var ValidEntryTypes = map[EntryType]bool{
	EntryTypeMedical:  true,
	EntryTypeDiet:     true,
	EntryTypeHabits:   true,
	EntryTypeCommands: true,
}

// NotebookEntry represents a base entry in a pet's notebook
type NotebookEntry struct {
	id           uuid.UUID
	notebookID   uuid.UUID
	entryType    EntryType
	title        string
	content      string
	dateOccurred time.Time
	tags         []string
	authorID     uuid.UUID
	createdAt    time.Time
	updatedAt    time.Time
}

// NewNotebookEntry creates a new notebook entry
func NewNotebookEntry(
	notebookID uuid.UUID,
	entryType EntryType,
	title string,
	content string,
	dateOccurred time.Time,
	tags []string,
	authorID uuid.UUID,
) (*NotebookEntry, error) {
	if err := validateEntryData(entryType, title, content, dateOccurred, tags); err != nil {
		return nil, err
	}

	now := time.Now()
	return &NotebookEntry{
		id:           uuid.New(),
		notebookID:   notebookID,
		entryType:    entryType,
		title:        title,
		content:      content,
		dateOccurred: dateOccurred,
		tags:         tags,
		authorID:     authorID,
		createdAt:    now,
		updatedAt:    now,
	}, nil
}

// Update updates the entry content and metadata
func (e *NotebookEntry) Update(
	title string,
	content string,
	dateOccurred time.Time,
	tags []string,
) error {
	if err := validateEntryData(e.entryType, title, content, dateOccurred, tags); err != nil {
		return err
	}

	e.title = title
	e.content = content
	e.dateOccurred = dateOccurred
	e.tags = tags
	e.updatedAt = time.Now()
	return nil
}

// Getters
func (e *NotebookEntry) ID() uuid.UUID {
	return e.id
}

func (e *NotebookEntry) NotebookID() uuid.UUID {
	return e.notebookID
}

func (e *NotebookEntry) EntryType() EntryType {
	return e.entryType
}

func (e *NotebookEntry) Title() string {
	return e.title
}

func (e *NotebookEntry) Content() string {
	return e.content
}

func (e *NotebookEntry) DateOccurred() time.Time {
	return e.dateOccurred
}

func (e *NotebookEntry) Tags() []string {
	return e.tags
}

func (e *NotebookEntry) AuthorID() uuid.UUID {
	return e.authorID
}

func (e *NotebookEntry) CreatedAt() time.Time {
	return e.createdAt
}

func (e *NotebookEntry) UpdatedAt() time.Time {
	return e.updatedAt
}

// validateEntryData validates common entry fields
func validateEntryData(entryType EntryType, title, content string, dateOccurred time.Time, tags []string) error {
	if !ValidEntryTypes[entryType] {
		return ErrInvalidEntryType
	}

	if title == "" {
		return ErrTitleRequired
	}
	if len(title) > 200 {
		return ErrTitleTooLong
	}

	if content == "" {
		return ErrContentRequired
	}
	if len(content) > 10000 {
		return ErrContentTooLong
	}

	if dateOccurred.After(time.Now()) {
		return ErrFutureDateOccurred
	}

	if len(tags) > 10 {
		return ErrTooManyTags
	}

	return nil
}