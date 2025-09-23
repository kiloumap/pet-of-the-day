package commands

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/internal/petprofiles/domain"
	"pet-of-the-day/internal/shared/events"
)

// DeletePersonalityTraitCommand represents the command to delete a personality trait
type DeletePersonalityTraitCommand struct {
	TraitID   uuid.UUID
	DeletedBy uuid.UUID
}

// DeletePersonalityTraitHandler handles deleting personality traits
type DeletePersonalityTraitHandler struct {
	repo     domain.PetPersonalityRepository
	eventBus events.EventBus
}

// NewDeletePersonalityTraitHandler creates a new handler
func NewDeletePersonalityTraitHandler(repo domain.PetPersonalityRepository, eventBus events.EventBus) *DeletePersonalityTraitHandler {
	return &DeletePersonalityTraitHandler{
		repo:     repo,
		eventBus: eventBus,
	}
}

// Handle executes the command
func (h *DeletePersonalityTraitHandler) Handle(ctx context.Context, cmd *DeletePersonalityTraitCommand) error {
	// Retrieve existing trait for event data
	trait, err := h.repo.FindByID(ctx, cmd.TraitID)
	if err != nil {
		return err
	}

	// Delete the trait
	if err := h.repo.Delete(ctx, cmd.TraitID); err != nil {
		return err
	}

	// Publish domain event
	event := events.Event{
		Type: "personality_trait.deleted",
		Data: map[string]interface{}{
			"pet_id":     trait.PetID().String(),
			"trait_id":   trait.ID().String(),
			"trait_name": trait.TraitName(),
			"deleted_by": cmd.DeletedBy.String(),
		},
	}
	h.eventBus.Publish(event)

	return nil
}