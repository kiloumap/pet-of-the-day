package commands

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/shared/events"
)

type DeletePetCommand struct {
	PetID  uuid.UUID
	UserID uuid.UUID
}

type DeletePetHandler struct {
	petRepo  domain.Repository
	eventBus events.Bus
}

func NewDeletePetHandler(petRepo domain.Repository, eventBus events.Bus) *DeletePetHandler {
	return &DeletePetHandler{
		petRepo:  petRepo,
		eventBus: eventBus,
	}
}

func (h *DeletePetHandler) Handle(ctx context.Context, cmd DeletePetCommand) error {
	// Get the pet to verify ownership
	pet, err := h.petRepo.FindByID(ctx, cmd.PetID)
	if err != nil {
		return fmt.Errorf("failed to get pet: %w", err)
	}

	// Verify the user is the owner
	if pet.OwnerID() != cmd.UserID {
		return fmt.Errorf("unauthorized: only the owner can delete this pet")
	}

	// Delete the pet
	err = h.petRepo.Delete(ctx, cmd.PetID)
	if err != nil {
		return fmt.Errorf("failed to delete pet: %w", err)
	}

	// Note: For delete, we could publish domain events here if needed
	// But for now, we'll keep it simple

	return nil
}