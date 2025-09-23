package domain

import (
	"context"

	"github.com/google/uuid"
)

// NotebookRepository defines the interface for notebook persistence
type NotebookRepository interface {
	// Save creates or updates a notebook
	Save(ctx context.Context, notebook *PetNotebook) error

	// FindByID retrieves a notebook by its ID
	FindByID(ctx context.Context, id uuid.UUID) (*PetNotebook, error)

	// FindByPetID retrieves a notebook for a specific pet
	FindByPetID(ctx context.Context, petID uuid.UUID) (*PetNotebook, error)

	// CreateForPet creates a new notebook for a pet if it doesn't exist
	CreateForPet(ctx context.Context, petID uuid.UUID) (*PetNotebook, error)

	// Delete removes a notebook and all its entries
	Delete(ctx context.Context, id uuid.UUID) error
}

// NotebookEntryRepository defines the interface for notebook entry persistence
type NotebookEntryRepository interface {
	// Save creates or updates a notebook entry
	Save(ctx context.Context, entry *NotebookEntry) error

	// FindByID retrieves a notebook entry by its ID
	FindByID(ctx context.Context, id uuid.UUID) (*NotebookEntry, error)

	// FindByNotebookID retrieves entries for a specific notebook with pagination
	FindByNotebookID(ctx context.Context, notebookID uuid.UUID, limit, offset int) ([]*NotebookEntry, error)

	// FindByNotebookIDAndType retrieves entries of a specific type for a notebook
	FindByNotebookIDAndType(ctx context.Context, notebookID uuid.UUID, entryType EntryType, limit, offset int) ([]*NotebookEntry, error)

	// CountByNotebookID counts total entries in a notebook
	CountByNotebookID(ctx context.Context, notebookID uuid.UUID) (int, error)

	// Delete removes a notebook entry
	Delete(ctx context.Context, id uuid.UUID) error
}

// MedicalEntryRepository defines the interface for medical entry persistence
type MedicalEntryRepository interface {
	// Save creates or updates a medical entry
	Save(ctx context.Context, entry *MedicalEntry) error

	// FindByEntryID retrieves medical data for a notebook entry
	FindByEntryID(ctx context.Context, entryID uuid.UUID) (*MedicalEntry, error)

	// Delete removes medical entry data
	Delete(ctx context.Context, entryID uuid.UUID) error
}

// DietEntryRepository defines the interface for diet entry persistence
type DietEntryRepository interface {
	// Save creates or updates a diet entry
	Save(ctx context.Context, entry *DietEntry) error

	// FindByEntryID retrieves diet data for a notebook entry
	FindByEntryID(ctx context.Context, entryID uuid.UUID) (*DietEntry, error)

	// Delete removes diet entry data
	Delete(ctx context.Context, entryID uuid.UUID) error
}

// HabitEntryRepository defines the interface for habit entry persistence
type HabitEntryRepository interface {
	// Save creates or updates a habit entry
	Save(ctx context.Context, entry *HabitEntry) error

	// FindByEntryID retrieves habit data for a notebook entry
	FindByEntryID(ctx context.Context, entryID uuid.UUID) (*HabitEntry, error)

	// Delete removes habit entry data
	Delete(ctx context.Context, entryID uuid.UUID) error
}

// CommandEntryRepository defines the interface for command entry persistence
type CommandEntryRepository interface {
	// Save creates or updates a command entry
	Save(ctx context.Context, entry *CommandEntry) error

	// FindByEntryID retrieves command data for a notebook entry
	FindByEntryID(ctx context.Context, entryID uuid.UUID) (*CommandEntry, error)

	// Delete removes command entry data
	Delete(ctx context.Context, entryID uuid.UUID) error
}

// NotebookShareRepository defines the interface for notebook sharing persistence
type NotebookShareRepository interface {
	// Save creates or updates a sharing permission
	Save(ctx context.Context, share *NotebookShare) error

	// FindByID retrieves a sharing permission by its ID
	FindByID(ctx context.Context, id uuid.UUID) (*NotebookShare, error)

	// FindByNotebookID retrieves all sharing permissions for a notebook
	FindByNotebookID(ctx context.Context, notebookID uuid.UUID) ([]*NotebookShare, error)

	// FindActiveByNotebookIDAndEmail checks if notebook is shared with specific email
	FindActiveByNotebookIDAndEmail(ctx context.Context, notebookID uuid.UUID, email string) (*NotebookShare, error)

	// FindSharedWithUser retrieves all notebooks shared with a specific user
	FindSharedWithUser(ctx context.Context, email string, limit, offset int) ([]*NotebookShare, error)

	// Delete removes a sharing permission
	Delete(ctx context.Context, id uuid.UUID) error
}