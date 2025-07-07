package queries

import (
	"context"
	"pet-of-the-day/internal/pet/domain"

	"github.com/google/uuid"
)

type GetCoOwnedPets struct {
	UserID uuid.UUID `json:"user_id"`
}

type GetCoOwnedPetsResult struct {
	Pets []*domain.Pet `json:"pets"`
}

type GetCoOwnedPetsHandler struct {
	petRepo domain.Repository
}

func NewGetCoOwnedPetsHandler(petRepo domain.Repository) *GetCoOwnedPetsHandler {
	return &GetCoOwnedPetsHandler{
		petRepo: petRepo,
	}
}

func (h *GetCoOwnedPetsHandler) Handle(ctx context.Context, query GetCoOwnedPets) (*GetCoOwnedPetsResult, error) {
	pets, err := h.petRepo.FindAllPetsByCoOwnerID(ctx, query.UserID)
	if err != nil {
		return nil, err
	}

	return &GetCoOwnedPetsResult{Pets: pets}, nil
}
