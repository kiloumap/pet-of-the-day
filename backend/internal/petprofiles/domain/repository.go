package domain

import (
	"context"

	"github.com/google/uuid"
)

// PetPersonalityRepository defines the interface for personality trait persistence
type PetPersonalityRepository interface {
	// Save creates or updates a personality trait
	Save(ctx context.Context, personality *PetPersonality) error

	// FindByID retrieves a personality trait by its ID
	FindByID(ctx context.Context, id uuid.UUID) (*PetPersonality, error)

	// FindByPetID retrieves all personality traits for a specific pet
	FindByPetID(ctx context.Context, petID uuid.UUID) ([]*PetPersonality, error)

	// FindByPetIDAndTraitType retrieves a specific trait type for a pet (to prevent duplicates)
	FindByPetIDAndTraitType(ctx context.Context, petID uuid.UUID, traitType TraitType) (*PetPersonality, error)

	// Delete removes a personality trait
	Delete(ctx context.Context, id uuid.UUID) error

	// CountByPetID counts personality traits for a pet (to enforce 10 trait limit)
	CountByPetID(ctx context.Context, petID uuid.UUID) (int, error)
}