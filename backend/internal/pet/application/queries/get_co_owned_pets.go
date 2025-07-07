package queries

import (
	"context"
	"pet-of-the-day/internal/pet/domain"

	"github.com/google/uuid"
)

type GetOwnedPets struct {
	UserID uuid.UUID `json:"user_id"`
}

type GetOwnedPetsResult struct {
	Pets []*domain.Pet `json:"pets"`
}

type GetOwnedPetsHandler struct {
	petRepo domain.Repository
}

func NewGetOwnedPetsHandler(petRepo domain.Repository) *GetOwnedPetsHandler {
	return &GetOwnedPetsHandler{
		petRepo: petRepo,
	}
}

func (h *GetOwnedPetsHandler) Handle(ctx context.Context, query GetOwnedPets) (*GetOwnedPetsResult, error) {
	pets, err := h.petRepo.FindAllPetsByOwnerId(ctx, query.UserID)
	if err != nil {
		return nil, err
	}

	return &GetOwnedPetsResult{Pets: pets}, nil
}
