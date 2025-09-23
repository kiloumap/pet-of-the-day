package commands

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"pet-of-the-day/internal/petprofiles/domain"
	"pet-of-the-day/internal/shared/events"
)

var (
	ErrMaxTraitsExceeded = errors.New("maximum 10 personality traits allowed per pet")
	ErrDuplicateTraitType = errors.New("trait type already exists for this pet")
)

// AddPersonalityTraitCommand represents the command to add a personality trait
type AddPersonalityTraitCommand struct {
	PetID          uuid.UUID
	TraitType      *string // Optional predefined trait
	CustomTrait    *string // Optional custom trait
	IntensityLevel int
	Notes          string
	AddedBy        uuid.UUID
}

// AddPersonalityTraitHandler handles adding personality traits
type AddPersonalityTraitHandler struct {
	repo     domain.PetPersonalityRepository
	eventBus events.Bus
}

// NewAddPersonalityTraitHandler creates a new handler
func NewAddPersonalityTraitHandler(repo domain.PetPersonalityRepository, eventBus events.EventBus) *AddPersonalityTraitHandler {
	return &AddPersonalityTraitHandler{
		repo:     repo,
		eventBus: eventBus,
	}
}

// Handle executes the command
func (h *AddPersonalityTraitHandler) Handle(ctx context.Context, cmd *AddPersonalityTraitCommand) (*domain.PetPersonality, error) {
	// Check trait limit (max 10 per pet)
	count, err := h.repo.CountByPetID(ctx, cmd.PetID)
	if err != nil {
		return nil, err
	}
	if count >= 10 {
		return nil, ErrMaxTraitsExceeded
	}

	var personality *domain.PetPersonality

	// Create personality trait based on type
	if cmd.TraitType != nil {
		// Predefined trait type
		traitType := domain.TraitType(*cmd.TraitType)

		// Check for duplicate trait type
		existing, err := h.repo.FindByPetIDAndTraitType(ctx, cmd.PetID, traitType)
		if err == nil && existing != nil {
			return nil, ErrDuplicateTraitType
		}

		personality, err = domain.NewPetPersonality(
			cmd.PetID,
			traitType,
			cmd.IntensityLevel,
			cmd.Notes,
			cmd.AddedBy,
		)
		if err != nil {
			return nil, err
		}
	} else if cmd.CustomTrait != nil {
		// Custom trait
		personality, err = domain.NewCustomPetPersonality(
			cmd.PetID,
			*cmd.CustomTrait,
			cmd.IntensityLevel,
			cmd.Notes,
			cmd.AddedBy,
		)
		if err != nil {
			return nil, err
		}
	} else {
		return nil, domain.ErrInvalidTraitData
	}

	// Save the personality trait
	if err := h.repo.Save(ctx, personality); err != nil {
		return nil, err
	}

	// Publish domain event
	event := events.Event{
		Type: "personality_trait.added",
		Data: map[string]interface{}{
			"pet_id":          cmd.PetID.String(),
			"trait_id":        personality.ID().String(),
			"trait_name":      personality.TraitName(),
			"intensity_level": personality.IntensityLevel(),
			"added_by":        cmd.AddedBy.String(),
		},
	}
	h.eventBus.Publish(event)

	return personality, nil
}