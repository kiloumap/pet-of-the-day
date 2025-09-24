package queries

import (
	"context"

	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

// GetCoOwnershipRequestsQuery represents the query to get co-ownership requests for a user
type GetCoOwnershipRequestsQuery struct {
	UserID uuid.UUID `json:"user_id"`
}

// CoOwnershipRequestView represents the view model for co-ownership requests
type CoOwnershipRequestView struct {
	ID         uuid.UUID `json:"id"`
	PetID      uuid.UUID `json:"pet_id"`
	CoOwnerID  uuid.UUID `json:"co_owner_id"`
	GrantedBy  uuid.UUID `json:"granted_by"`
	Status     string    `json:"status"`
	Notes      string    `json:"notes,omitempty"`
	GrantedAt  string    `json:"granted_at"`
	AcceptedAt *string   `json:"accepted_at,omitempty"`
	RevokedAt  *string   `json:"revoked_at,omitempty"`
	CreatedAt  string    `json:"created_at"`
	UpdatedAt  string    `json:"updated_at"`
}

// GetCoOwnershipRequestsResult represents the result of getting co-ownership requests
type GetCoOwnershipRequestsResult struct {
	Requests []CoOwnershipRequestView `json:"requests"`
}

// GetCoOwnershipRequestsHandler handles the query
type GetCoOwnershipRequestsHandler struct {
	coOwnershipRepo domain.CoOwnershipRepository
}

// NewGetCoOwnershipRequestsHandler creates a new handler
func NewGetCoOwnershipRequestsHandler(coOwnershipRepo domain.CoOwnershipRepository) *GetCoOwnershipRequestsHandler {
	return &GetCoOwnershipRequestsHandler{
		coOwnershipRepo: coOwnershipRepo,
	}
}

// Handle processes the query
func (h *GetCoOwnershipRequestsHandler) Handle(ctx context.Context, query GetCoOwnershipRequestsQuery) (*GetCoOwnershipRequestsResult, error) {
	// Find all co-ownership requests for the user
	requests, err := h.coOwnershipRepo.FindCoOwnershipRequestsByCoOwner(ctx, query.UserID)
	if err != nil {
		return nil, err
	}

	// Convert to view models
	views := make([]CoOwnershipRequestView, len(requests))
	for i, request := range requests {
		views[i] = mapToCoOwnershipRequestView(request)
	}

	return &GetCoOwnershipRequestsResult{
		Requests: views,
	}, nil
}

// mapToCoOwnershipRequestView converts domain model to view model
func mapToCoOwnershipRequestView(request *domain.CoOwnershipRequest) CoOwnershipRequestView {
	view := CoOwnershipRequestView{
		ID:        request.ID(),
		PetID:     request.PetID(),
		CoOwnerID: request.CoOwnerID(),
		GrantedBy: request.GrantedBy(),
		Status:    string(request.Status()),
		Notes:     request.Notes(),
		GrantedAt: request.GrantedAt().Format("2006-01-02T15:04:05Z07:00"),
		CreatedAt: request.CreatedAt().Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: request.UpdatedAt().Format("2006-01-02T15:04:05Z07:00"),
	}

	if acceptedAt := request.AcceptedAt(); acceptedAt != nil {
		acceptedStr := acceptedAt.Format("2006-01-02T15:04:05Z07:00")
		view.AcceptedAt = &acceptedStr
	}

	if revokedAt := request.RevokedAt(); revokedAt != nil {
		revokedStr := revokedAt.Format("2006-01-02T15:04:05Z07:00")
		view.RevokedAt = &revokedStr
	}

	return view
}