package queries

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/points/domain"
)

// GetPetDailyScoreQuery represents a query to get a pet's daily score
type GetPetDailyScoreQuery struct {
	PetID  uuid.UUID  `json:"pet_id" validate:"required"`
	Date   *time.Time `json:"date,omitempty"`
	UserID uuid.UUID  `json:"user_id" validate:"required"`
}

// GetPetDailyScoreResult represents the result of getting a pet's daily score
type GetPetDailyScoreResult struct {
	PetID             uuid.UUID                      `json:"pet_id"`
	PetName           string                         `json:"pet_name"`
	Date              string                         `json:"date"`
	TotalScore        int                            `json:"total_score"`
	PositiveBehaviors int                            `json:"positive_behaviors"`
	NegativeBehaviors int                            `json:"negative_behaviors"`
	Breakdown         []*domain.DailyScoreBreakdown  `json:"breakdown"`
	CalculatedAt      string                         `json:"calculated_at"`
	UserTimezone      string                         `json:"user_timezone"`
}

// GetPetDailyScoreHandler handles queries for getting a pet's daily score
type GetPetDailyScoreHandler struct {
	dailyScoreRepo    domain.DailyScoreRepository
	behaviorLogRepo   domain.BehaviorLogRepository
	authRepo          domain.AuthorizationRepository
	userSettingsRepo  domain.UserSettingsRepository
}

// NewGetPetDailyScoreHandler creates a new get pet daily score handler
func NewGetPetDailyScoreHandler(
	dailyScoreRepo domain.DailyScoreRepository,
	behaviorLogRepo domain.BehaviorLogRepository,
	authRepo domain.AuthorizationRepository,
	userSettingsRepo domain.UserSettingsRepository,
) *GetPetDailyScoreHandler {
	return &GetPetDailyScoreHandler{
		dailyScoreRepo:    dailyScoreRepo,
		behaviorLogRepo:   behaviorLogRepo,
		authRepo:          authRepo,
		userSettingsRepo:  userSettingsRepo,
	}
}

// Handle executes the get pet daily score query
func (h *GetPetDailyScoreHandler) Handle(ctx context.Context, query *GetPetDailyScoreQuery) (*GetPetDailyScoreResult, error) {
	// Validate authorization
	canAccess, err := h.authRepo.CanUserAccessPet(ctx, query.UserID, query.PetID)
	if err != nil {
		return nil, fmt.Errorf("failed to check pet access: %w", err)
	}
	if !canAccess {
		return nil, fmt.Errorf("user does not have access to pet")
	}

	// Get pet info
	petInfo, err := h.authRepo.GetPetInfo(ctx, query.PetID)
	if err != nil {
		return nil, fmt.Errorf("failed to get pet info: %w", err)
	}

	// Get user timezone settings
	userSettings, err := h.userSettingsRepo.GetUserTimezone(ctx, query.UserID)
	if err != nil {
		userSettings = domain.NewUserTimezoneSettings(query.UserID)
	}

	// Calculate target date
	targetDate, err := h.calculateTargetDate(query.Date, userSettings)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate target date: %w", err)
	}

	// Since we only have the pet and date, we need to aggregate scores across all groups
	// For simplicity, we'll get all user's groups and aggregate
	userGroups, err := h.authRepo.GetUserGroups(ctx, query.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user groups: %w", err)
	}

	// Aggregate scores across all groups
	totalScore := 0
	positiveBehaviors := 0
	negativeBehaviors := 0
	breakdown := make(map[uuid.UUID]*domain.DailyScoreBreakdown)

	for _, groupID := range userGroups {
		// Check if pet is in this group
		isPetInGroup, err := h.authRepo.IsPetInGroup(ctx, query.PetID, groupID)
		if err != nil {
			continue // Skip this group
		}
		if !isPetInGroup {
			continue
		}

		// Get daily score for this group
		filter := domain.NewDailyScoreFilter().WithPet(query.PetID).WithGroup(groupID).WithDate(targetDate)
		dailyScores, err := h.dailyScoreRepo.Find(ctx, filter)
		if err != nil {
			continue // Skip this group
		}

		for _, dailyScore := range dailyScores {
			totalScore += dailyScore.TotalPoints
			positiveBehaviors += dailyScore.PositiveBehaviors
			negativeBehaviors += dailyScore.NegativeBehaviors
		}

		// Get breakdown for this group
		groupBreakdown, err := h.behaviorLogRepo.GetBreakdown(ctx, query.PetID, groupID, targetDate)
		if err != nil {
			continue // Skip breakdown for this group
		}

		// Merge breakdown
		for _, item := range groupBreakdown {
			if existing, exists := breakdown[item.BehaviorID]; exists {
				existing.Count += item.Count
				existing.TotalPoints += item.TotalPoints
			} else {
				breakdown[item.BehaviorID] = item
			}
		}
	}

	// Convert breakdown map to slice
	breakdownSlice := make([]*domain.DailyScoreBreakdown, 0, len(breakdown))
	for _, item := range breakdown {
		breakdownSlice = append(breakdownSlice, item)
	}

	return &GetPetDailyScoreResult{
		PetID:             query.PetID,
		PetName:           petInfo.Name,
		Date:              targetDate.Format("2006-01-02"),
		TotalScore:        totalScore,
		PositiveBehaviors: positiveBehaviors,
		NegativeBehaviors: negativeBehaviors,
		Breakdown:         breakdownSlice,
		CalculatedAt:      time.Now().Format(time.RFC3339),
		UserTimezone:      userSettings.Timezone,
	}, nil
}

// calculateTargetDate calculates the target date for daily score calculation
func (h *GetPetDailyScoreHandler) calculateTargetDate(date *time.Time, userSettings *domain.UserTimezoneSettings) (time.Time, error) {
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
