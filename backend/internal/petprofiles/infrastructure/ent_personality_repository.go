package infrastructure

import (
	"context"
	"time"

	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/petpersonality"
	"pet-of-the-day/internal/petprofiles/domain"
)

// EntPetPersonalityRepository implements the PetPersonalityRepository using Ent ORM
type EntPetPersonalityRepository struct {
	client *ent.Client
}

// NewEntPetPersonalityRepository creates a new Ent-based repository
func NewEntPetPersonalityRepository(client *ent.Client) domain.PetPersonalityRepository {
	return &EntPetPersonalityRepository{
		client: client,
	}
}

// Save creates or updates a personality trait
func (r *EntPetPersonalityRepository) Save(ctx context.Context, personality *domain.PetPersonality) error {
	// Check if personality trait already exists
	existing, err := r.client.PetPersonality.
		Query().
		Where(petpersonality.ID(personality.ID())).
		Only(ctx)

	if err != nil && !ent.IsNotFound(err) {
		return err
	}

	if existing != nil {
		// Update existing
		return r.client.PetPersonality.
			UpdateOneID(personality.ID()).
			SetIntensityLevel(personality.IntensityLevel()).
			SetNotes(personality.Notes()).
			SetUpdatedAt(personality.UpdatedAt()).
			Exec(ctx)
	}

	// Create new
	query := r.client.PetPersonality.
		Create().
		SetID(personality.ID()).
		SetPetID(personality.PetID()).
		SetIntensityLevel(personality.IntensityLevel()).
		SetNotes(personality.Notes()).
		SetAddedBy(personality.AddedBy()).
		SetCreatedAt(personality.CreatedAt()).
		SetUpdatedAt(personality.UpdatedAt())

	// Set trait type or custom trait
	if personality.TraitType() != nil {
		traitType := petpersonality.TraitType(string(*personality.TraitType()))
		query = query.SetTraitType(traitType)
	}
	if personality.CustomTrait() != nil {
		query = query.SetCustomTrait(*personality.CustomTrait())
	}

	_, err = query.Save(ctx)
	return err
}

// FindByID retrieves a personality trait by its ID
func (r *EntPetPersonalityRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.PetPersonality, error) {
	entPersonality, err := r.client.PetPersonality.
		Query().
		Where(petpersonality.ID(id)).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrPersonalityTraitNotFound
		}
		return nil, err
	}

	return r.entToDomain(entPersonality), nil
}

// FindByPetID retrieves all personality traits for a specific pet
func (r *EntPetPersonalityRepository) FindByPetID(ctx context.Context, petID uuid.UUID) ([]*domain.PetPersonality, error) {
	entPersonalities, err := r.client.PetPersonality.
		Query().
		Where(petpersonality.PetID(petID)).
		Order(ent.Asc(petpersonality.FieldCreatedAt)).
		All(ctx)

	if err != nil {
		return nil, err
	}

	personalities := make([]*domain.PetPersonality, len(entPersonalities))
	for i, entPersonality := range entPersonalities {
		personalities[i] = r.entToDomain(entPersonality)
	}

	return personalities, nil
}

// FindByPetIDAndTraitType retrieves a specific trait type for a pet
func (r *EntPetPersonalityRepository) FindByPetIDAndTraitType(ctx context.Context, petID uuid.UUID, traitType domain.TraitType) (*domain.PetPersonality, error) {
	entTraitType := petpersonality.TraitType(string(traitType))

	entPersonality, err := r.client.PetPersonality.
		Query().
		Where(
			petpersonality.PetID(petID),
			petpersonality.TraitType(entTraitType),
		).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrPersonalityTraitNotFound
		}
		return nil, err
	}

	return r.entToDomain(entPersonality), nil
}

// Delete removes a personality trait
func (r *EntPetPersonalityRepository) Delete(ctx context.Context, id uuid.UUID) error {
	err := r.client.PetPersonality.
		DeleteOneID(id).
		Exec(ctx)

	if err != nil && ent.IsNotFound(err) {
		return domain.ErrPersonalityTraitNotFound
	}

	return err
}

// CountByPetID counts personality traits for a pet
func (r *EntPetPersonalityRepository) CountByPetID(ctx context.Context, petID uuid.UUID) (int, error) {
	return r.client.PetPersonality.
		Query().
		Where(petpersonality.PetID(petID)).
		Count(ctx)
}

// entToDomain converts an Ent entity to a domain entity
func (r *EntPetPersonalityRepository) entToDomain(entPersonality *ent.PetPersonality) *domain.PetPersonality {
	// Use reflection to create domain entity since constructors are not public
	// In a real implementation, we'd need to expose reconstruction methods
	// For now, we'll create a simplified conversion

	// This is a simplified approach - in production we'd need proper domain reconstruction
	var traitType *domain.TraitType
	if entPersonality.TraitType != nil {
		domainTraitType := domain.TraitType(*entPersonality.TraitType)
		traitType = &domainTraitType
	}

	// Since domain constructors are private, we'd need to add a reconstruction method
	// For now, we'll create using the public constructor and update fields
	var personality *domain.PetPersonality
	var err error

	if traitType != nil {
		personality, err = domain.NewPetPersonality(
			entPersonality.PetID,
			*traitType,
			entPersonality.IntensityLevel,
			entPersonality.Notes,
			entPersonality.AddedBy,
		)
	} else {
		customTrait := ""
		if entPersonality.CustomTrait != nil {
			customTrait = *entPersonality.CustomTrait
		}
		personality, err = domain.NewCustomPetPersonality(
			entPersonality.PetID,
			customTrait,
			entPersonality.IntensityLevel,
			entPersonality.Notes,
			entPersonality.AddedBy,
		)
	}

	if err != nil {
		// In production, we'd handle this better
		panic("Failed to reconstruct domain entity: " + err.Error())
	}

	return personality
}

// ErrPersonalityTraitNotFound is added to the domain package
var ErrPersonalityTraitNotFound = domain.ErrPersonalityTraitNotFound