package ent

import (
	"context"

	"github.com/google/uuid"
	"pet-of-the-day/ent"
	"pet-of-the-day/ent/behavior"
	"pet-of-the-day/internal/points/domain"
)

// BehaviorRepository implements domain.BehaviorRepository using Ent
type BehaviorRepository struct {
	client *ent.Client
}

// NewBehaviorRepository creates a new BehaviorRepository
func NewBehaviorRepository(client *ent.Client) *BehaviorRepository {
	return &BehaviorRepository{
		client: client,
	}
}

// GetAll returns all global behaviors
func (r *BehaviorRepository) GetAll(ctx context.Context) ([]domain.Behavior, error) {
	behaviors, err := r.client.Behavior.Query().
		Where(behavior.IsGlobal(true)).
		All(ctx)
	if err != nil {
		return nil, err
	}

	return r.toDomainBehaviors(behaviors), nil
}

// GetBySpecies returns behaviors for a specific species
func (r *BehaviorRepository) GetBySpecies(ctx context.Context, species domain.Species) ([]domain.Behavior, error) {
	query := r.client.Behavior.Query().Where(behavior.IsGlobal(true))

	if species == domain.SpeciesDog || species == domain.SpeciesCat {
		query = query.Where(behavior.Or(
			behavior.SpeciesEQ(behavior.Species(species)),
			behavior.SpeciesEQ(behavior.Species(domain.SpeciesBoth)),
		))
	}

	behaviors, err := query.All(ctx)
	if err != nil {
		return nil, err
	}

	return r.toDomainBehaviors(behaviors), nil
}

// GetByID returns a behavior by ID
func (r *BehaviorRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Behavior, error) {
	behaviorEnt, err := r.client.Behavior.Get(ctx, id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, nil
		}
		return nil, err
	}

	domainBehavior := r.toDomainBehavior(behaviorEnt)
	return &domainBehavior, nil
}

// toDomainBehavior converts an ent.Behavior to domain.Behavior
func (r *BehaviorRepository) toDomainBehavior(b *ent.Behavior) domain.Behavior {
	return domain.Behavior{
		ID:          b.ID,
		Name:        b.Name,
		Description: b.Description,
		Category:    string(b.Category),
		Points:      b.Points,
		Species:     domain.Species(b.Species),
		IsGlobal:    b.IsGlobal,
	}
}

// toDomainBehaviors converts a slice of ent.Behavior to domain.Behavior
func (r *BehaviorRepository) toDomainBehaviors(behaviors []*ent.Behavior) []domain.Behavior {
	result := make([]domain.Behavior, len(behaviors))
	for i, b := range behaviors {
		result[i] = r.toDomainBehavior(b)
	}
	return result
}