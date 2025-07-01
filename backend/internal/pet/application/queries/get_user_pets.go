package queries

import (
	"context"
	"github.com/google/uuid"
	"pet-of-the-day/internal/pet/domain"
)

type GetUserPets struct {
	UserID    uuid.UUID `json:"user_id"`
	OwnerOnly bool      `json:"owner_only"`
}

type GetUserPetsResult struct {
	Pets []*domain.Pet `json:"pets"`
}

type GetUserPetsHandler struct {
	petRepo domain.Repository
}

func NewGetUserPetsHandler(petRepo domain.Repository) *GetUserPetsHandler {
	return &GetUserPetsHandler{
		petRepo: petRepo,
	}
}

func (h *GetUserPetsHandler) Handle(ctx context.Context, query GetUserPets) (*GetUserPetsResult, error) {
	if query.OwnerOnly {
		return h.handleOwnerOnly(ctx, query)
	}

	return h.handleAllPetByUserID(ctx, query)
}

func (h *GetUserPetsHandler) handleOwnerOnly(ctx context.Context, query GetUserPets) (*GetUserPetsResult, error) {
	pets, err := h.petRepo.FindAllPetsByOwnerId(ctx, query.UserID)
	if err != nil {
		return nil, err
	}

	return &GetUserPetsResult{
		Pets: pets,
	}, nil
}

func (h *GetUserPetsHandler) handleAllPetByUserID(ctx context.Context, query GetUserPets) (*GetUserPetsResult, error) {
	pets, err := h.petRepo.FindAllPetsByUserID(ctx, query.UserID)
	if err != nil {
		return nil, err
	}

	return &GetUserPetsResult{
		Pets: pets,
	}, nil
}
