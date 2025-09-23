package queries

import (
	"context"
	"pet-of-the-day/internal/points/domain"

	"github.com/google/uuid"
)

type GetRecentActivitiesHandler struct {
	scoreEventRepo domain.ScoreEventRepository
}

func NewGetRecentActivitiesHandler(scoreEventRepo domain.ScoreEventRepository) *GetRecentActivitiesHandler {
	return &GetRecentActivitiesHandler{
		scoreEventRepo: scoreEventRepo,
	}
}

func (h *GetRecentActivitiesHandler) Handle(ctx context.Context, userID uuid.UUID, limit int) ([]domain.ActivityItem, error) {
	return h.scoreEventRepo.GetRecentActivitiesForUser(ctx, userID, limit)
}