package queries

import (
	"context"

	"github.com/google/uuid"
	"pet-of-the-day/internal/points/domain"
)

// GetPetScoreEventsHandler handles queries for pet score events
type GetPetScoreEventsHandler struct {
	scoreEventRepo domain.ScoreEventRepository
}

// NewGetPetScoreEventsHandler creates a new GetPetScoreEventsHandler
func NewGetPetScoreEventsHandler(scoreEventRepo domain.ScoreEventRepository) *GetPetScoreEventsHandler {
	return &GetPetScoreEventsHandler{
		scoreEventRepo: scoreEventRepo,
	}
}

// GetPetScoreEventsResponse represents the response for pet score events
type GetPetScoreEventsResponse struct {
	Events      []domain.ScoreEvent `json:"events"`
	TotalPoints int                 `json:"total_points"`
}

// Handle processes the get pet score events query
func (h *GetPetScoreEventsHandler) Handle(ctx context.Context, petID, groupID uuid.UUID, limit int) (*GetPetScoreEventsResponse, error) {
	if limit <= 0 || limit > 200 {
		limit = 50 // default
	}

	// Get score events
	events, err := h.scoreEventRepo.GetByPetAndGroup(ctx, petID, groupID, limit)
	if err != nil {
		return nil, err
	}

	// Get total points
	totalPoints, err := h.scoreEventRepo.GetTotalPointsByPetAndGroup(ctx, petID, groupID)
	if err != nil {
		return nil, err
	}

	return &GetPetScoreEventsResponse{
		Events:      events,
		TotalPoints: totalPoints,
	}, nil
}
