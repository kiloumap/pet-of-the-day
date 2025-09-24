package infrastructure

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/dietentry"
	"pet-of-the-day/ent/notebookentry"
	"pet-of-the-day/internal/notebook/domain"
)

// EntDietEntryRepository implements the DietEntryRepository using Ent ORM
type EntDietEntryRepository struct {
	client *ent.Client
}

// NewEntDietEntryRepository creates a new Ent-based repository
func NewEntDietEntryRepository(client *ent.Client) domain.DietEntryRepository {
	return &EntDietEntryRepository{
		client: client,
	}
}

// Save creates or updates a diet entry
func (r *EntDietEntryRepository) Save(ctx context.Context, entry *domain.DietEntry) error {
	// Check if entry already exists by finding the related notebook entry
	existing, err := r.client.DietEntry.
		Query().
		Where(dietentry.HasNotebookEntryWith(notebookentry.ID(entry.EntryID()))).
		Only(ctx)

	if err != nil && !ent.IsNotFound(err) {
		return err
	}

	if existing != nil {
		// Update existing
		return r.client.DietEntry.
			UpdateOneID(existing.ID).
			SetFoodType(entry.FoodType()).
			SetQuantity(entry.Quantity()).
			SetFeedingSchedule(entry.FeedingSchedule()).
			SetDietaryRestrictions(entry.DietaryRestrictions()).
			SetReactionNotes(entry.ReactionNotes()).
			Exec(ctx)
	}

	// Create new
	_, err = r.client.DietEntry.
		Create().
		SetFoodType(entry.FoodType()).
		SetQuantity(entry.Quantity()).
		SetFeedingSchedule(entry.FeedingSchedule()).
		SetDietaryRestrictions(entry.DietaryRestrictions()).
		SetReactionNotes(entry.ReactionNotes()).
		SetNotebookEntryID(entry.EntryID()).
		Save(ctx)

	return err
}

// FindByEntryID retrieves diet data for a notebook entry
func (r *EntDietEntryRepository) FindByEntryID(ctx context.Context, entryID uuid.UUID) (*domain.DietEntry, error) {
	entDiet, err := r.client.DietEntry.
		Query().
		Where(dietentry.HasNotebookEntryWith(notebookentry.ID(entryID))).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrEntryNotFound
		}
		return nil, err
	}

	return r.entToDomain(entDiet, entryID), nil
}

// Delete removes diet entry data
func (r *EntDietEntryRepository) Delete(ctx context.Context, entryID uuid.UUID) error {
	_, err := r.client.DietEntry.
		Delete().
		Where(dietentry.HasNotebookEntryWith(notebookentry.ID(entryID))).
		Exec(ctx)

	return err
}

// entToDomain converts an Ent entity to a domain entity
func (r *EntDietEntryRepository) entToDomain(entDiet *ent.DietEntry, entryID uuid.UUID) *domain.DietEntry {
	// Create domain entity - this will handle validation
	dietEntry, _ := domain.NewDietEntry(
		entryID,
		entDiet.FoodType,
		entDiet.Quantity,
		entDiet.FeedingSchedule,
		entDiet.DietaryRestrictions,
		entDiet.ReactionNotes,
	)

	return dietEntry
}