package queries

import (
	"context"

	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

// GetCoOwnershipRequestQuery represents the query to get a specific co-ownership request
type GetCoOwnershipRequestQuery struct {
	RequestID uuid.UUID `json:"request_id"`
	UserID    uuid.UUID `json:"user_id"` // For authorization - user must be owner or co-owner
}

// GetCoOwnershipRequestResult represents the result
type GetCoOwnershipRequestResult struct {
	Request CoOwnershipRequestView `json:"request"`
}

// GetCoOwnershipRequestHandler handles the query
type GetCoOwnershipRequestHandler struct {
	coOwnershipRepo domain.CoOwnershipRepository
}

// NewGetCoOwnershipRequestHandler creates a new handler
func NewGetCoOwnershipRequestHandler(coOwnershipRepo domain.CoOwnershipRepository) *GetCoOwnershipRequestHandler {
	return &GetCoOwnershipRequestHandler{
		coOwnershipRepo: coOwnershipRepo,
	}
}

// Handle processes the query
func (h *GetCoOwnershipRequestHandler) Handle(ctx context.Context, query GetCoOwnershipRequestQuery) (*GetCoOwnershipRequestResult, error) {
	// Find the co-ownership request
	request, err := h.coOwnershipRepo.FindCoOwnershipRequestByID(ctx, query.RequestID)
	if err != nil {
		return nil, err
	}

	// Authorization: user must be either the granter or the co-owner
	if request.GrantedBy() != query.UserID && request.CoOwnerID() != query.UserID {
		return nil, domain.ErrNotAuthorized
	}

	return &GetCoOwnershipRequestResult{
		Request: mapToCoOwnershipRequestView(request),
	}, nil
}