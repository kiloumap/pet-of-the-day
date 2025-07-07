package commands

import (
	"context"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

type AddCoOwner struct {
	PetID     uuid.UUID
	CoOwnerID uuid.UUID
}

type AddCoOwnerResult struct {
	Success bool `json:"success"`
}

type AddCoOwnerHandler struct {
	petRepo  domain.Repository
	eventBus events.Bus
}

func NewAddCoOwnerHandler(petRepo domain.Repository, eventBus events.Bus) *AddCoOwnerHandler {
	return &AddCoOwnerHandler{
		petRepo:  petRepo,
		eventBus: eventBus,
	}
}

func (handler *AddCoOwnerHandler) Handle(ctx context.Context, cmd AddCoOwner) (*AddCoOwnerResult, error) {
	err := handler.petRepo.AddCoOwner(ctx, cmd.PetID, cmd.CoOwnerID)
	if err != nil {
		return nil, err
	}

	return &AddCoOwnerResult{Success: true}, nil
}
