package ent

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/behavior"
	"pet-of-the-day/internal/points/domain"
)

// Helper functions for type conversion
func domainCategoryToEnt(category domain.BehaviorCategory) behavior.Category {
	return behavior.Category(string(category))
}

func entCategoryToDomain(category behavior.Category) domain.BehaviorCategory {
	return domain.BehaviorCategory(string(category))
}

func domainSpeciesToEnt(species domain.Species) behavior.Species {
	return behavior.Species(string(species))
}

func entSpeciesToDomain(species behavior.Species) domain.Species {
	return domain.Species(string(species))
}

// BehaviorRepository implements the domain.BehaviorRepository interface using Ent ORM
type BehaviorRepository struct {
	client *ent.Client
}

// NewBehaviorRepository creates a new Ent-based behavior repository
func NewBehaviorRepository(client *ent.Client) *BehaviorRepository {
	return &BehaviorRepository{
		client: client,
	}
}

// Create creates a new behavior
func (r *BehaviorRepository) Create(ctx context.Context, domainBehavior *domain.Behavior) error {
	_, err := r.client.Behavior.
		Create().
		SetID(domainBehavior.ID).
		SetName(domainBehavior.Name).
		SetDescription(domainBehavior.Description).
		SetCategory(domainCategoryToEnt(domainBehavior.Category)).
		SetPointValue(domainBehavior.PointValue).
		SetMinIntervalMinutes(domainBehavior.MinIntervalMinutes).
		SetSpecies(domainSpeciesToEnt(domainBehavior.Species)).
		SetIcon(domainBehavior.Icon).
		SetIsActive(domainBehavior.IsActive).
		SetCreatedAt(domainBehavior.CreatedAt).
		SetUpdatedAt(domainBehavior.UpdatedAt).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to create behavior: %w", err)
	}

	return nil
}

// GetByID retrieves a behavior by ID
func (r *BehaviorRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Behavior, error) {
	entBehavior, err := r.client.Behavior.
		Query().
		Where(behavior.ID(id)).
		First(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("behavior not found")
		}
		return nil, fmt.Errorf("failed to get behavior: %w", err)
	}

	return r.entToDomain(entBehavior), nil
}

// GetAll retrieves all behaviors (legacy method for backward compatibility)
func (r *BehaviorRepository) GetAll(ctx context.Context) ([]domain.Behavior, error) {
	entBehaviors, err := r.client.Behavior.
		Query().
		Where(behavior.IsActive(true)).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get all behaviors: %w", err)
	}

	behaviors := make([]domain.Behavior, len(entBehaviors))
	for i, entBehavior := range entBehaviors {
		domainBehavior := r.entToDomain(entBehavior)
		behaviors[i] = *domainBehavior
	}

	return behaviors, nil
}

// GetBySpecies retrieves behaviors by species (legacy method for backward compatibility)
func (r *BehaviorRepository) GetBySpecies(ctx context.Context, species domain.Species) ([]domain.Behavior, error) {
	entBehaviors, err := r.client.Behavior.
		Query().
		Where(
			behavior.IsActive(true),
			behavior.Or(
				behavior.SpeciesEQ(domainSpeciesToEnt(species)),
				behavior.SpeciesEQ(domainSpeciesToEnt(domain.SpeciesBoth)),
			),
		).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get behaviors by species: %w", err)
	}

	behaviors := make([]domain.Behavior, len(entBehaviors))
	for i, entBehavior := range entBehaviors {
		domainBehavior := r.entToDomain(entBehavior)
		behaviors[i] = *domainBehavior
	}

	return behaviors, nil
}

// GetAllActive retrieves all active behaviors, optionally filtered by species
func (r *BehaviorRepository) GetAllActive(ctx context.Context, species *domain.Species) ([]*domain.Behavior, error) {
	query := r.client.Behavior.
		Query().
		Where(behavior.IsActive(true))

	if species != nil {
		query = query.Where(
			behavior.Or(
				behavior.SpeciesEQ(domainSpeciesToEnt(*species)),
				behavior.SpeciesEQ(domainSpeciesToEnt(domain.SpeciesBoth)),
			),
		)
	}

	entBehaviors, err := query.All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get active behaviors: %w", err)
	}

	behaviors := make([]*domain.Behavior, len(entBehaviors))
	for i, entBehavior := range entBehaviors {
		behaviors[i] = r.entToDomain(entBehavior)
	}

	return behaviors, nil
}

// GetByCategory retrieves behaviors by category, optionally filtered by species
func (r *BehaviorRepository) GetByCategory(ctx context.Context, category domain.BehaviorCategory, species *domain.Species) ([]*domain.Behavior, error) {
	query := r.client.Behavior.
		Query().
		Where(
			behavior.IsActive(true),
			behavior.CategoryEQ(domainCategoryToEnt(category)),
		)

	if species != nil {
		query = query.Where(
			behavior.Or(
				behavior.SpeciesEQ(domainSpeciesToEnt(*species)),
				behavior.SpeciesEQ(domainSpeciesToEnt(domain.SpeciesBoth)),
			),
		)
	}

	entBehaviors, err := query.All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get behaviors by category: %w", err)
	}

	behaviors := make([]*domain.Behavior, len(entBehaviors))
	for i, entBehavior := range entBehaviors {
		behaviors[i] = r.entToDomain(entBehavior)
	}

	return behaviors, nil
}

// Update updates an existing behavior
func (r *BehaviorRepository) Update(ctx context.Context, domainBehavior *domain.Behavior) error {
	_, err := r.client.Behavior.
		UpdateOneID(domainBehavior.ID).
		SetName(domainBehavior.Name).
		SetDescription(domainBehavior.Description).
		SetPointValue(domainBehavior.PointValue).
		SetMinIntervalMinutes(domainBehavior.MinIntervalMinutes).
		SetIcon(domainBehavior.Icon).
		SetIsActive(domainBehavior.IsActive).
		SetUpdatedAt(domainBehavior.UpdatedAt).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to update behavior: %w", err)
	}

	return nil
}

// Delete soft deletes a behavior (sets IsActive to false)
func (r *BehaviorRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.client.Behavior.
		UpdateOneID(id).
		SetIsActive(false).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to delete behavior: %w", err)
	}

	return nil
}

// GetByName retrieves a behavior by name (for uniqueness checks)
func (r *BehaviorRepository) GetByName(ctx context.Context, name string) (*domain.Behavior, error) {
	entBehavior, err := r.client.Behavior.
		Query().
		Where(behavior.Name(name)).
		First(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, nil // Not found is not an error for name checks
		}
		return nil, fmt.Errorf("failed to get behavior by name: %w", err)
	}

	return r.entToDomain(entBehavior), nil
}

// entToDomain converts an Ent behavior entity to a domain behavior
func (r *BehaviorRepository) entToDomain(entBehavior *ent.Behavior) *domain.Behavior {
	return &domain.Behavior{
		ID:                 entBehavior.ID,
		Name:               entBehavior.Name,
		Description:        entBehavior.Description,
		Category:           entCategoryToDomain(entBehavior.Category),
		PointValue:         entBehavior.PointValue,
		MinIntervalMinutes: entBehavior.MinIntervalMinutes,
		Species:            entSpeciesToDomain(entBehavior.Species),
		Icon:               entBehavior.Icon,
		IsActive:           entBehavior.IsActive,
		CreatedAt:          entBehavior.CreatedAt,
		UpdatedAt:          entBehavior.UpdatedAt,
	}
}
