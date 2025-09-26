package queries

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/points/domain"
)

// GetGroupRankingsQuery represents a query to get group rankings
type GetGroupRankingsQuery struct {
	GroupID  uuid.UUID  `json:"group_id" validate:"required"`
	Date     *time.Time `json:"date,omitempty"`
	DateFrom *time.Time `json:"date_from,omitempty"`
	DateTo   *time.Time `json:"date_to,omitempty"`
	UserID   uuid.UUID  `json:"user_id" validate:"required"`
}

// GetGroupRankingsResult represents the result of getting group rankings
type GetGroupRankingsResult struct {
	GroupID   string                  `json:"group_id"`
	GroupName string                  `json:"group_name"`
	Rankings  []*domain.PetRanking    `json:"rankings"`
	UpdatedAt string                  `json:"updated_at"`
}

// GetGroupRankingsHandler handles queries for getting group rankings
type GetGroupRankingsHandler struct {
	dailyScoreRepo   domain.DailyScoreRepository
	authRepo         domain.AuthorizationRepository
	userSettingsRepo domain.UserSettingsRepository
}

// NewGetGroupRankingsHandler creates a new get group rankings handler
func NewGetGroupRankingsHandler(
	dailyScoreRepo domain.DailyScoreRepository,
	authRepo domain.AuthorizationRepository,
	userSettingsRepo domain.UserSettingsRepository,
) *GetGroupRankingsHandler {
	return &GetGroupRankingsHandler{
		dailyScoreRepo:   dailyScoreRepo,
		authRepo:         authRepo,
		userSettingsRepo: userSettingsRepo,
	}
}

// Handle executes the get group rankings query
func (h *GetGroupRankingsHandler) Handle(ctx context.Context, query *GetGroupRankingsQuery) (*GetGroupRankingsResult, error) {
	// Validate authorization
	canAccess, err := h.authRepo.CanUserAccessGroup(ctx, query.UserID, query.GroupID)
	if err != nil {
		return nil, fmt.Errorf("failed to check group access: %w", err)
	}
	if !canAccess {
		return nil, fmt.Errorf("user does not have access to group")
	}

	// Get group info
	groupInfo, err := h.authRepo.GetGroupInfo(ctx, query.GroupID)
	if err != nil {
		return nil, fmt.Errorf("failed to get group info: %w", err)
	}

	// Get user timezone settings
	userSettings, err := h.userSettingsRepo.GetUserTimezone(ctx, query.UserID)
	if err != nil {
		userSettings = domain.NewUserTimezoneSettings(query.UserID)
	}

	// Calculate date range
	var rankings []*domain.PetRanking
	if query.DateFrom != nil && query.DateTo != nil {
		// Date range query
		rankings, err = h.dailyScoreRepo.GetRankingsByDateRange(ctx, query.GroupID, *query.DateFrom, *query.DateTo)
	} else {
		// Single date query (default to today)
		targetDate, err := h.calculateTargetDate(query.Date, userSettings)
		if err != nil {
			return nil, fmt.Errorf("failed to calculate target date: %w", err)
		}
		rankings, err = h.dailyScoreRepo.GetRankings(ctx, query.GroupID, targetDate)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get rankings: %w", err)
	}

	// Sort and assign ranks
	rankings = h.assignRanks(rankings)

	return &GetGroupRankingsResult{
		GroupID:   query.GroupID.String(),
		GroupName: groupInfo.Name,
		Rankings:  rankings,
		UpdatedAt: time.Now().Format(time.RFC3339),
	}, nil
}

// calculateTargetDate calculates the target date for ranking calculation
func (h *GetGroupRankingsHandler) calculateTargetDate(date *time.Time, userSettings *domain.UserTimezoneSettings) (time.Time, error) {
	location, err := time.LoadLocation(userSettings.Timezone)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid timezone: %w", err)
	}

	var targetDate time.Time
	if date != nil {
		targetDate = *date
	} else {
		targetDate = time.Now()
	}

	// Convert to user's timezone and normalize to start of day
	localTime := targetDate.In(location)
	normalized := time.Date(localTime.Year(), localTime.Month(), localTime.Day(), 0, 0, 0, 0, location)

	return normalized, nil
}

// assignRanks sorts rankings and assigns rank positions with tie handling
func (h *GetGroupRankingsHandler) assignRanks(rankings []*domain.PetRanking) []*domain.PetRanking {
	if len(rankings) == 0 {
		return rankings
	}

	// Sort by ranking criteria (already done in repository, but ensure consistency)
	// Rankings should be sorted by total points DESC, then negative behaviors ASC

	currentRank := 1
	for i, ranking := range rankings {
		if i == 0 {
			// First place
			ranking.SetRank(currentRank, false)
		} else {
			// Check if tied with previous
			prevRanking := rankings[i-1]
			if ranking.CompareForRanking(prevRanking) == 0 {
				// Tied - same rank
				ranking.SetRank(currentRank, true)
				prevRanking.SetRank(currentRank, true) // Mark previous as tied too
			} else {
				// Not tied - increment rank by number of tied positions
				currentRank = i + 1
				ranking.SetRank(currentRank, false)
			}
		}
	}

	return rankings
}
