package infrastructure

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/petnotebook"
	"pet-of-the-day/internal/notebook/domain"
)

// EntNotebookRepository implements the NotebookRepository using Ent ORM
type EntNotebookRepository struct {
	client *ent.Client
}

// NewEntNotebookRepository creates a new Ent-based repository
func NewEntNotebookRepository(client *ent.Client) domain.NotebookRepository {
	return &EntNotebookRepository{
		client: client,
	}
}

// Save creates or updates a notebook
func (r *EntNotebookRepository) Save(ctx context.Context, notebook *domain.PetNotebook) error {
	// Check if notebook already exists
	existing, err := r.client.PetNotebook.
		Query().
		Where(petnotebook.ID(notebook.ID())).
		Only(ctx)

	if err != nil && !ent.IsNotFound(err) {
		return err
	}

	if existing != nil {
		// Update existing
		return r.client.PetNotebook.
			UpdateOneID(notebook.ID()).
			SetUpdatedAt(notebook.UpdatedAt()).
			Exec(ctx)
	}

	// Create new
	_, err = r.client.PetNotebook.
		Create().
		SetID(notebook.ID()).
		SetPetID(notebook.PetID()).
		SetCreatedAt(notebook.CreatedAt()).
		SetUpdatedAt(notebook.UpdatedAt()).
		Save(ctx)

	return err
}

// FindByID retrieves a notebook by its ID
func (r *EntNotebookRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.PetNotebook, error) {
	entNotebook, err := r.client.PetNotebook.
		Query().
		Where(petnotebook.ID(id)).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrNotebookNotFound
		}
		return nil, err
	}

	return r.entToDomain(entNotebook), nil
}

// FindByPetID retrieves a notebook for a specific pet
func (r *EntNotebookRepository) FindByPetID(ctx context.Context, petID uuid.UUID) (*domain.PetNotebook, error) {
	entNotebook, err := r.client.PetNotebook.
		Query().
		Where(petnotebook.PetID(petID)).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrNotebookNotFound
		}
		return nil, err
	}

	return r.entToDomain(entNotebook), nil
}

// CreateForPet creates a new notebook for a pet if it doesn't exist
func (r *EntNotebookRepository) CreateForPet(ctx context.Context, petID uuid.UUID) (*domain.PetNotebook, error) {
	notebook := domain.NewPetNotebook(petID)

	_, err := r.client.PetNotebook.
		Create().
		SetID(notebook.ID()).
		SetPetID(notebook.PetID()).
		SetCreatedAt(notebook.CreatedAt()).
		SetUpdatedAt(notebook.UpdatedAt()).
		Save(ctx)

	if err != nil {
		return nil, err
	}

	return notebook, nil
}

// Delete removes a notebook and all its entries
func (r *EntNotebookRepository) Delete(ctx context.Context, id uuid.UUID) error {
	err := r.client.PetNotebook.
		DeleteOneID(id).
		Exec(ctx)

	if err != nil && ent.IsNotFound(err) {
		return domain.ErrNotebookNotFound
	}

	return err
}

// entToDomain converts an Ent entity to a domain entity
func (r *EntNotebookRepository) entToDomain(entNotebook *ent.PetNotebook) *domain.PetNotebook {
	return domain.NewPetNotebook(entNotebook.PetID)
}