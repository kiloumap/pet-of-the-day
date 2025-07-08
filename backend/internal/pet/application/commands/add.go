package commands

import (
	"context"
	"log"
	"time"

	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

type AddPet struct {
	Name      string
	Species   domain.Species
	Breed     string
	BirthDate time.Time
	PhotoURL  string
}

type AddPetResult struct {
	PetId uuid.UUID   `json:"pet_id"`
	Pet   *domain.Pet `json:"pet"`
}

type AddPetHandler struct {
	petRepo  domain.Repository
	eventBus events.Bus
}

func NewAddPetHandler(petRepo domain.Repository, eventBus events.Bus) *AddPetHandler {
	return &AddPetHandler{
		petRepo:  petRepo,
		eventBus: eventBus,
	}
}

func (ph *AddPetHandler) Handle(ctx context.Context, cmd AddPet, ownerID uuid.UUID) (*AddPetResult, error) {
	exists, err := ph.petRepo.ExistsByOwnerId(ctx, ownerID, cmd.Name)
	if err != nil {
		return nil, err
	}

	if exists {
		return nil, domain.ErrPetAlreadyExist
	}

	pet, err := domain.NewPet(ownerID, cmd.Name, cmd.Species, cmd.Breed, cmd.BirthDate, cmd.PhotoURL)
	if err != nil {
		return nil, err
	}

	if err := ph.petRepo.Save(ctx, pet, ownerID); err != nil {
		return nil, err
	}

	for _, event := range pet.DomainEvents() {
		if err := ph.eventBus.Publish(ctx, event); err != nil {
			log.Printf("Failed to publish add new pet event: %v", err)
		}
	}

	return &AddPetResult{
		PetId: pet.ID(),
		Pet:   pet,
	}, nil
}
