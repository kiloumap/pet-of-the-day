package queries

import (
	"context"

	"pet-of-the-day/internal/points/domain"
)

// GetBehaviorsHandler handles queries for behaviors
type GetBehaviorsHandler struct {
	behaviorRepo domain.BehaviorRepository
}

// NewGetBehaviorsHandler creates a new GetBehaviorsHandler
func NewGetBehaviorsHandler(behaviorRepo domain.BehaviorRepository) *GetBehaviorsHandler {
	return &GetBehaviorsHandler{
		behaviorRepo: behaviorRepo,
	}
}

// GetAll returns all behaviors
func (h *GetBehaviorsHandler) GetAll(ctx context.Context) ([]domain.Behavior, error) {
	return h.behaviorRepo.GetAll(ctx)
}

// GetBySpecies returns behaviors for a specific species
func (h *GetBehaviorsHandler) GetBySpecies(ctx context.Context, species string) ([]domain.Behavior, error) {
	if !domain.IsValidSpecies(species) {
		return nil, &InvalidSpeciesError{Species: species}
	}

	return h.behaviorRepo.GetBySpecies(ctx, domain.Species(species))
}

// InvalidSpeciesError represents an invalid species error
type InvalidSpeciesError struct {
	Species string
}

func (e *InvalidSpeciesError) Error() string {
	return "invalid species: " + e.Species
}
