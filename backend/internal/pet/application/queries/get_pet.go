package queries

import (
	"context"
	"github.com/google/uuid"
	"pet-of-the-day/internal/pet/domain"
	"time"
)

type GetPetById struct {
	PetID uuid.UUID `json:"pet_id"`
}

type GetPetByIdResult struct {
	ID         uuid.UUID   `json:"id"`
	Name       string      `json:"name"`
	Species    string      `json:"species"`
	Breed      string      `json:"breed"`
	BirthDate  time.Time   `json:"birth_date"`
	PhotoURL   string      `json:"photo_url"`
	CreatedAt  time.Time   `json:"created_at"`
	OwnerID    uuid.UUID   `json:"owner_id"`
	CoOwnerIDs []uuid.UUID `json:"co_owner_ids"`
}

type GetPetByIDHandler struct {
	petRepo domain.Repository
}

func NewGetPetByIDHandler(petRepo domain.Repository) *GetPetByIDHandler {
	return &GetPetByIDHandler{
		petRepo: petRepo,
	}
}

func (h *GetPetByIDHandler) Handle(ctx context.Context, query GetPetById) (*GetPetByIdResult, error) {
	pet, err := h.petRepo.FindByID(ctx, query.PetID)
	if err != nil {
		return nil, err
	}

	coOwnerIDs, err := h.petRepo.GetCoOwnersByPetID(ctx, query.PetID)
	if err != nil {
		return nil, err
	}

	return &GetPetByIdResult{
		ID:         pet.ID(),
		Name:       pet.Name(),
		Species:    string(pet.Species()),
		Breed:      pet.Breed(),
		BirthDate:  pet.BirthDate(),
		PhotoURL:   pet.PhotoUrl(),
		CreatedAt:  pet.CreatedAt(),
		OwnerID:    pet.OwnerID(),
		CoOwnerIDs: coOwnerIDs,
	}, nil
}
