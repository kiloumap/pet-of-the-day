package queries

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/internal/petprofiles/domain"
)

// GetPetPersonalityQuery represents the query to get personality traits for a pet
type GetPetPersonalityQuery struct {
	PetID uuid.UUID
}

// GetPetPersonalityHandler handles retrieving personality traits for a pet
type GetPetPersonalityHandler struct {
	repo domain.PetPersonalityRepository
}

// NewGetPetPersonalityHandler creates a new handler
func NewGetPetPersonalityHandler(repo domain.PetPersonalityRepository) *GetPetPersonalityHandler {
	return &GetPetPersonalityHandler{
		repo: repo,
	}
}

// Handle executes the query
func (h *GetPetPersonalityHandler) Handle(ctx context.Context, query *GetPetPersonalityQuery) ([]*domain.PetPersonality, error) {
	return h.repo.FindByPetID(ctx, query.PetID)
}

// GetPersonalityTraitQuery represents the query to get a specific personality trait
type GetPersonalityTraitQuery struct {
	TraitID uuid.UUID
}

// GetPersonalityTraitHandler handles retrieving a specific personality trait
type GetPersonalityTraitHandler struct {
	repo domain.PetPersonalityRepository
}

// NewGetPersonalityTraitHandler creates a new handler
func NewGetPersonalityTraitHandler(repo domain.PetPersonalityRepository) *GetPersonalityTraitHandler {
	return &GetPersonalityTraitHandler{
		repo: repo,
	}
}

// Handle executes the query
func (h *GetPersonalityTraitHandler) Handle(ctx context.Context, query *GetPersonalityTraitQuery) (*domain.PetPersonality, error) {
	return h.repo.FindByID(ctx, query.TraitID)
}