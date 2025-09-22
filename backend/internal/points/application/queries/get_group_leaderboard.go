package queries

import (
	"context"

	"pet-of-the-day/internal/points/domain"
)

// GetGroupLeaderboardHandler handles queries for group leaderboards
type GetGroupLeaderboardHandler struct {
	scoreEventRepo domain.ScoreEventRepository
}

// NewGetGroupLeaderboardHandler creates a new GetGroupLeaderboardHandler
func NewGetGroupLeaderboardHandler(scoreEventRepo domain.ScoreEventRepository) *GetGroupLeaderboardHandler {
	return &GetGroupLeaderboardHandler{
		scoreEventRepo: scoreEventRepo,
	}
}

// GetGroupLeaderboardResponse represents the response for group leaderboard
type GetGroupLeaderboardResponse struct {
	Leaderboard []domain.LeaderboardEntry `json:"leaderboard"`
	PeriodStart string                    `json:"period_start"`
	PeriodEnd   string                    `json:"period_end"`
}

// Handle processes the get group leaderboard query
func (h *GetGroupLeaderboardHandler) Handle(ctx context.Context, req domain.LeaderboardRequest) (*GetGroupLeaderboardResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	startDate, endDate := req.GetDateRange()

	leaderboard, err := h.scoreEventRepo.GetLeaderboardData(ctx, req.GroupID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// Add ranks
	for i := range leaderboard {
		leaderboard[i].Rank = i + 1
	}

	return &GetGroupLeaderboardResponse{
		Leaderboard: leaderboard,
		PeriodStart: startDate.Format("2006-01-02"),
		PeriodEnd:   endDate.Format("2006-01-02"),
	}, nil
}