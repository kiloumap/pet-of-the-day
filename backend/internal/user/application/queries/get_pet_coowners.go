package queries

import (
	"context"

	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

// GetPetCoOwnersQuery represents the query to get co-owners for a pet
type GetPetCoOwnersQuery struct {
	PetID uuid.UUID `json:"pet_id"`
}

// CoOwnerView represents a co-owner view model
type CoOwnerView struct {
	UserID uuid.UUID `json:"user_id"`
	Status string    `json:"status"`
}

// GetPetCoOwnersResult represents the result of getting pet co-owners
type GetPetCoOwnersResult struct {
	PetID     uuid.UUID     `json:"pet_id"`
	CoOwners  []CoOwnerView `json:"co_owners"`
	Requests  []CoOwnershipRequestView `json:"requests"`
}

// GetPetCoOwnersHandler handles the query
type GetPetCoOwnersHandler struct {
	coOwnershipRepo domain.CoOwnershipRepository
}

// NewGetPetCoOwnersHandler creates a new handler
func NewGetPetCoOwnersHandler(coOwnershipRepo domain.CoOwnershipRepository) *GetPetCoOwnersHandler {
	return &GetPetCoOwnersHandler{
		coOwnershipRepo: coOwnershipRepo,
	}
}

// Handle processes the query
func (h *GetPetCoOwnersHandler) Handle(ctx context.Context, query GetPetCoOwnersQuery) (*GetPetCoOwnersResult, error) {
	// Find all co-ownership requests for the pet
	requests, err := h.coOwnershipRepo.FindCoOwnershipRequestsByPet(ctx, query.PetID)
	if err != nil {
		return nil, err
	}

	// Convert to view models
	requestViews := make([]CoOwnershipRequestView, len(requests))
	coOwnerViews := []CoOwnerView{}

	for i, request := range requests {
		requestViews[i] = mapToCoOwnershipRequestView(request)

		// Add active co-owners to the co-owners list
		if request.Status() == domain.CoOwnershipStatusActive {
			coOwnerViews = append(coOwnerViews, CoOwnerView{
				UserID: request.CoOwnerID(),
				Status: string(request.Status()),
			})
		}
	}

	return &GetPetCoOwnersResult{
		PetID:    query.PetID,
		CoOwners: coOwnerViews,
		Requests: requestViews,
	}, nil
}