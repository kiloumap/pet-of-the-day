package commands

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/shared/events"
)

type UpdatePetCommand struct {
	PetID     uuid.UUID
	UserID    uuid.UUID
	Name      *string
	Species   *string
	Breed     *string
	BirthDate *string
	PhotoURL  *string
}

type UpdatePetResult struct {
	Pet *domain.Pet
}

type UpdatePetHandler struct {
	petRepo  domain.Repository
	eventBus events.Bus
}

func NewUpdatePetHandler(petRepo domain.Repository, eventBus events.Bus) *UpdatePetHandler {
	return &UpdatePetHandler{
		petRepo:  petRepo,
		eventBus: eventBus,
	}
}

func (h *UpdatePetHandler) Handle(ctx context.Context, cmd UpdatePetCommand) (*UpdatePetResult, error) {
	// Get the existing pet
	pet, err := h.petRepo.FindByID(ctx, cmd.PetID)
	if err != nil {
		return nil, fmt.Errorf("failed to get pet: %w", err)
	}

	// Verify the user is the owner
	if pet.OwnerID() != cmd.UserID {
		return nil, fmt.Errorf("unauthorized: only the owner can update this pet")
	}

	// Update fields if provided
	if cmd.Name != nil {
		err = pet.UpdateName(*cmd.Name)
		if err != nil {
			return nil, fmt.Errorf("failed to update name: %w", err)
		}
	}

	if cmd.Species != nil {
		err = pet.UpdateSpecies(*cmd.Species)
		if err != nil {
			return nil, fmt.Errorf("failed to update species: %w", err)
		}
	}

	if cmd.Breed != nil {
		pet.UpdateBreed(*cmd.Breed)
	}

	if cmd.BirthDate != nil {
		pet.UpdateBirthDate(*cmd.BirthDate)
	}

	if cmd.PhotoURL != nil {
		pet.UpdatePhotoURL(*cmd.PhotoURL)
	}

	// Save the updated pet
	updatedPet, err := h.petRepo.Update(ctx, pet)
	if err != nil {
		return nil, fmt.Errorf("failed to update pet: %w", err)
	}

	// Publish domain events
	for _, event := range updatedPet.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the operation
			fmt.Printf("Failed to publish update pet event: %v\n", err)
		}
	}

	return &UpdatePetResult{
		Pet: updatedPet,
	}, nil
}