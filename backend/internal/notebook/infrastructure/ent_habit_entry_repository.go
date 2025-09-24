package infrastructure

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/habitentry"
	"pet-of-the-day/ent/notebookentry"
	"pet-of-the-day/internal/notebook/domain"
)

// EntHabitEntryRepository implements the HabitEntryRepository using Ent ORM
type EntHabitEntryRepository struct {
	client *ent.Client
}

// NewEntHabitEntryRepository creates a new Ent-based repository
func NewEntHabitEntryRepository(client *ent.Client) domain.HabitEntryRepository {
	return &EntHabitEntryRepository{
		client: client,
	}
}

// Save creates or updates a habit entry
func (r *EntHabitEntryRepository) Save(ctx context.Context, entry *domain.HabitEntry) error {
	// Check if entry already exists by finding the related notebook entry
	existing, err := r.client.HabitEntry.
		Query().
		Where(habitentry.HasNotebookEntryWith(notebookentry.ID(entry.EntryID()))).
		Only(ctx)

	if err != nil && !ent.IsNotFound(err) {
		return err
	}

	if existing != nil {
		// Update existing
		update := r.client.HabitEntry.
			UpdateOneID(existing.ID).
			SetBehaviorPattern(entry.BehaviorPattern()).
			SetTriggers(entry.Triggers()).
			SetLocation(entry.Location()).
			SetSeverity(entry.Severity())

		if entry.Frequency() != "" {
			update = update.SetFrequency(habitentry.Frequency(entry.Frequency()))
		}

		return update.Exec(ctx)
	}

	// Create new
	create := r.client.HabitEntry.
		Create().
		SetBehaviorPattern(entry.BehaviorPattern()).
		SetTriggers(entry.Triggers()).
		SetLocation(entry.Location()).
		SetSeverity(entry.Severity()).
		SetNotebookEntryID(entry.EntryID())

	if entry.Frequency() != "" {
		create = create.SetFrequency(habitentry.Frequency(entry.Frequency()))
	}

	_, err = create.Save(ctx)
	return err
}

// FindByEntryID retrieves habit data for a notebook entry
func (r *EntHabitEntryRepository) FindByEntryID(ctx context.Context, entryID uuid.UUID) (*domain.HabitEntry, error) {
	entHabit, err := r.client.HabitEntry.
		Query().
		Where(habitentry.HasNotebookEntryWith(notebookentry.ID(entryID))).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrEntryNotFound
		}
		return nil, err
	}

	return r.entToDomain(entHabit, entryID), nil
}

// Delete removes habit entry data
func (r *EntHabitEntryRepository) Delete(ctx context.Context, entryID uuid.UUID) error {
	_, err := r.client.HabitEntry.
		Delete().
		Where(habitentry.HasNotebookEntryWith(notebookentry.ID(entryID))).
		Exec(ctx)

	return err
}

// entToDomain converts an Ent entity to a domain entity
func (r *EntHabitEntryRepository) entToDomain(entHabit *ent.HabitEntry, entryID uuid.UUID) *domain.HabitEntry {
	frequency := string(entHabit.Frequency)

	// Create domain entity - this will handle validation
	habitEntry, _ := domain.NewHabitEntry(
		entryID,
		entHabit.BehaviorPattern,
		entHabit.Triggers,
		frequency,
		entHabit.Location,
		entHabit.Severity,
	)

	return habitEntry
}