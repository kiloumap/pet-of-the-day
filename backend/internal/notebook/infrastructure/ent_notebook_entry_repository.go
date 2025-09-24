package infrastructure

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/notebookentry"
	"pet-of-the-day/ent/petnotebook"
	"pet-of-the-day/internal/notebook/domain"
)

// EntNotebookEntryRepository implements the NotebookEntryRepository using Ent ORM
type EntNotebookEntryRepository struct {
	client *ent.Client
}

// NewEntNotebookEntryRepository creates a new Ent-based repository
func NewEntNotebookEntryRepository(client *ent.Client) domain.NotebookEntryRepository {
	return &EntNotebookEntryRepository{
		client: client,
	}
}

// Save creates or updates a notebook entry
func (r *EntNotebookEntryRepository) Save(ctx context.Context, entry *domain.NotebookEntry) error {
	// Check if entry already exists
	existing, err := r.client.NotebookEntry.
		Query().
		Where(notebookentry.ID(entry.ID())).
		Only(ctx)

	if err != nil && !ent.IsNotFound(err) {
		return err
	}

	if existing != nil {
		// Update existing
		return r.client.NotebookEntry.
			UpdateOneID(entry.ID()).
			SetTitle(entry.Title()).
			SetContent(entry.Content()).
			SetEntryType(notebookentry.EntryType(entry.EntryType())).
			SetDateOccurred(entry.DateOccurred()).
			SetTags(entry.Tags()).
			SetUpdatedAt(entry.UpdatedAt()).
			Exec(ctx)
	}

	// Create new
	_, err = r.client.NotebookEntry.
		Create().
		SetID(entry.ID()).
		SetNotebookID(entry.NotebookID()).
		SetEntryType(notebookentry.EntryType(entry.EntryType())).
		SetTitle(entry.Title()).
		SetContent(entry.Content()).
		SetDateOccurred(entry.DateOccurred()).
		SetTags(entry.Tags()).
		SetAuthorID(entry.AuthorID()).
		SetCreatedAt(entry.CreatedAt()).
		SetUpdatedAt(entry.UpdatedAt()).
		Save(ctx)

	return err
}

// FindByID retrieves a notebook entry by its ID
func (r *EntNotebookEntryRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.NotebookEntry, error) {
	entEntry, err := r.client.NotebookEntry.
		Query().
		Where(notebookentry.ID(id)).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrEntryNotFound
		}
		return nil, err
	}

	return r.entToDomain(entEntry), nil
}

// FindByNotebookID retrieves entries for a specific notebook with pagination
func (r *EntNotebookEntryRepository) FindByNotebookID(ctx context.Context, notebookID uuid.UUID, limit, offset int) ([]*domain.NotebookEntry, error) {
	entEntries, err := r.client.NotebookEntry.
		Query().
		Where(notebookentry.HasNotebookWith(petnotebook.ID(notebookID))).
		Order(ent.Desc(notebookentry.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)

	if err != nil {
		return nil, err
	}

	entries := make([]*domain.NotebookEntry, len(entEntries))
	for i, entEntry := range entEntries {
		entries[i] = r.entToDomain(entEntry)
	}

	return entries, nil
}

// FindByNotebookIDAndType retrieves entries of a specific type for a notebook
func (r *EntNotebookEntryRepository) FindByNotebookIDAndType(ctx context.Context, notebookID uuid.UUID, entryType domain.EntryType, limit, offset int) ([]*domain.NotebookEntry, error) {
	entEntries, err := r.client.NotebookEntry.
		Query().
		Where(
			notebookentry.HasNotebookWith(petnotebook.ID(notebookID)),
			notebookentry.EntryTypeEQ(notebookentry.EntryType(entryType)),
		).
		Order(ent.Desc(notebookentry.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)

	if err != nil {
		return nil, err
	}

	entries := make([]*domain.NotebookEntry, len(entEntries))
	for i, entEntry := range entEntries {
		entries[i] = r.entToDomain(entEntry)
	}

	return entries, nil
}

// CountByNotebookID counts total entries in a notebook
func (r *EntNotebookEntryRepository) CountByNotebookID(ctx context.Context, notebookID uuid.UUID) (int, error) {
	return r.client.NotebookEntry.
		Query().
		Where(notebookentry.HasNotebookWith(petnotebook.ID(notebookID))).
		Count(ctx)
}

// Delete removes a notebook entry
func (r *EntNotebookEntryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	err := r.client.NotebookEntry.
		DeleteOneID(id).
		Exec(ctx)

	if err != nil && ent.IsNotFound(err) {
		return domain.ErrEntryNotFound
	}

	return err
}

// entToDomain converts an Ent entity to a domain entity
func (r *EntNotebookEntryRepository) entToDomain(entEntry *ent.NotebookEntry) *domain.NotebookEntry {
	entryType := domain.EntryType(entEntry.EntryType)

	// We need to get the notebook ID and author ID from edges or assume they're loaded
	notebookID := uuid.Nil
	if entEntry.Edges.Notebook != nil {
		notebookID = entEntry.Edges.Notebook.ID
	}

	authorID := uuid.Nil
	if entEntry.Edges.Author != nil {
		authorID = entEntry.Edges.Author.ID
	}

	entry, _ := domain.NewNotebookEntry(
		notebookID,
		entryType,
		entEntry.Title,
		entEntry.Content,
		entEntry.DateOccurred,
		entEntry.Tags,
		authorID,
	)

	return entry
}