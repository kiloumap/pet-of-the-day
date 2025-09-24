package infrastructure

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/commandentry"
	"pet-of-the-day/ent/notebookentry"
	"pet-of-the-day/internal/notebook/domain"
)

// EntCommandEntryRepository implements the CommandEntryRepository using Ent ORM
type EntCommandEntryRepository struct {
	client *ent.Client
}

// NewEntCommandEntryRepository creates a new Ent-based repository
func NewEntCommandEntryRepository(client *ent.Client) domain.CommandEntryRepository {
	return &EntCommandEntryRepository{
		client: client,
	}
}

// Save creates or updates a command entry
func (r *EntCommandEntryRepository) Save(ctx context.Context, entry *domain.CommandEntry) error {
	// Check if entry already exists by finding the related notebook entry
	existing, err := r.client.CommandEntry.
		Query().
		Where(commandentry.HasNotebookEntryWith(notebookentry.ID(entry.EntryID()))).
		Only(ctx)

	if err != nil && !ent.IsNotFound(err) {
		return err
	}

	if existing != nil {
		// Update existing
		update := r.client.CommandEntry.
			UpdateOneID(existing.ID).
			SetCommandName(entry.CommandName()).
			SetTrainingMethod(entry.TrainingMethod())

		if entry.TrainingStatus() != "" {
			update = update.SetTrainingStatus(commandentry.TrainingStatus(entry.TrainingStatus()))
		}

		if entry.SuccessRate() != nil {
			update = update.SetSuccessRate(*entry.SuccessRate())
		} else {
			update = update.ClearSuccessRate()
		}

		if entry.LastPracticed() != nil {
			update = update.SetLastPracticed(*entry.LastPracticed())
		} else {
			update = update.ClearLastPracticed()
		}

		return update.Exec(ctx)
	}

	// Create new
	create := r.client.CommandEntry.
		Create().
		SetCommandName(entry.CommandName()).
		SetTrainingMethod(entry.TrainingMethod()).
		SetNotebookEntryID(entry.EntryID())

	if entry.TrainingStatus() != "" {
		create = create.SetTrainingStatus(commandentry.TrainingStatus(entry.TrainingStatus()))
	}

	if entry.SuccessRate() != nil {
		create = create.SetSuccessRate(*entry.SuccessRate())
	}

	if entry.LastPracticed() != nil {
		create = create.SetLastPracticed(*entry.LastPracticed())
	}

	_, err = create.Save(ctx)

	return err
}

// FindByEntryID retrieves command data for a notebook entry
func (r *EntCommandEntryRepository) FindByEntryID(ctx context.Context, entryID uuid.UUID) (*domain.CommandEntry, error) {
	entCommand, err := r.client.CommandEntry.
		Query().
		Where(commandentry.HasNotebookEntryWith(notebookentry.ID(entryID))).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrEntryNotFound
		}
		return nil, err
	}

	return r.entToDomain(entCommand, entryID), nil
}

// Delete removes command entry data
func (r *EntCommandEntryRepository) Delete(ctx context.Context, entryID uuid.UUID) error {
	_, err := r.client.CommandEntry.
		Delete().
		Where(commandentry.HasNotebookEntryWith(notebookentry.ID(entryID))).
		Exec(ctx)

	return err
}

// entToDomain converts an Ent entity to a domain entity
func (r *EntCommandEntryRepository) entToDomain(entCommand *ent.CommandEntry, entryID uuid.UUID) *domain.CommandEntry {
	// Map Ent enum to string
	trainingStatus := string(entCommand.TrainingStatus)

	// Convert fields to pointers as needed by domain
	successRate := &entCommand.SuccessRate
	lastPracticed := &entCommand.LastPracticed

	// Create domain entity - this will handle validation
	commandEntry, _ := domain.NewCommandEntry(
		entryID,
		entCommand.CommandName,
		trainingStatus,
		successRate,
		entCommand.TrainingMethod,
		lastPracticed,
	)

	return commandEntry
}