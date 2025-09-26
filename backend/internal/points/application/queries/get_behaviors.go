package queries

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"pet-of-the-day/internal/points/domain"
)

// GetBehaviorsQuery represents a query to get available behaviors
type GetBehaviorsQuery struct {
	Species  *domain.Species         `json:"species,omitempty"`
	Category *domain.BehaviorCategory `json:"category,omitempty"`
	UserID   uuid.UUID               `json:"user_id" validate:"required"`
}

// GetBehaviorsResult represents the result of getting behaviors
type GetBehaviorsResult struct {
	Behaviors []*domain.Behavior `json:"behaviors"`
}

// GetBehaviorsHandler handles queries for getting behaviors
type GetBehaviorsHandler struct {
	behaviorRepo domain.BehaviorRepository
	authRepo     domain.AuthorizationRepository
}

// NewGetBehaviorsHandler creates a new get behaviors handler
func NewGetBehaviorsHandler(
	behaviorRepo domain.BehaviorRepository,
	authRepo domain.AuthorizationRepository,
) *GetBehaviorsHandler {
	return &GetBehaviorsHandler{
		behaviorRepo: behaviorRepo,
		authRepo:     authRepo,
	}
}

// Handle executes the get behaviors query
func (h *GetBehaviorsHandler) Handle(ctx context.Context, query *GetBehaviorsQuery) (*GetBehaviorsResult, error) {
	var behaviors []*domain.Behavior
	var err error

	// Get behaviors based on query parameters
	if query.Category != nil {
		behaviors, err = h.behaviorRepo.GetByCategory(ctx, *query.Category, query.Species)
	} else {
		behaviors, err = h.behaviorRepo.GetAllActive(ctx, query.Species)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get behaviors: %w", err)
	}

	return &GetBehaviorsResult{
		Behaviors: behaviors,
	}, nil
}
