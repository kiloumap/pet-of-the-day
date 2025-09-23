package commands

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/internal/petprofiles/domain"
	"pet-of-the-day/internal/shared/events"
)

// UpdatePersonalityTraitCommand represents the command to update a personality trait
type UpdatePersonalityTraitCommand struct {
	TraitID        uuid.UUID
	IntensityLevel *int    // Optional intensity update
	Notes          *string // Optional notes update
	UpdatedBy      uuid.UUID
}

// UpdatePersonalityTraitHandler handles updating personality traits
type UpdatePersonalityTraitHandler struct {
	repo     domain.PetPersonalityRepository
	eventBus events.EventBus
}

// NewUpdatePersonalityTraitHandler creates a new handler
func NewUpdatePersonalityTraitHandler(repo domain.PetPersonalityRepository, eventBus events.EventBus) *UpdatePersonalityTraitHandler {
	return &UpdatePersonalityTraitHandler{
		repo:     repo,
		eventBus: eventBus,
	}
}

// Handle executes the command
func (h *UpdatePersonalityTraitHandler) Handle(ctx context.Context, cmd *UpdatePersonalityTraitCommand) (*domain.PetPersonality, error) {
	// Retrieve existing trait
	trait, err := h.repo.FindByID(ctx, cmd.TraitID)
	if err != nil {
		return nil, err
	}

	// Update intensity if provided
	if cmd.IntensityLevel != nil {
		if err := trait.UpdateIntensity(*cmd.IntensityLevel, cmd.UpdatedBy); err != nil {
			return nil, err
		}
	}

	// Update notes if provided
	if cmd.Notes != nil {
		trait.UpdateNotes(*cmd.Notes)
	}

	// Save the updated trait
	if err := h.repo.Save(ctx, trait); err != nil {
		return nil, err
	}

	// Publish domain event
	event := events.Event{
		Type: "personality_trait.updated",
		Data: map[string]interface{}{
			"pet_id":          trait.PetID().String(),
			"trait_id":        trait.ID().String(),
			"trait_name":      trait.TraitName(),
			"intensity_level": trait.IntensityLevel(),
			"updated_by":      cmd.UpdatedBy.String(),
		},
	}
	h.eventBus.Publish(event)

	return trait, nil
}