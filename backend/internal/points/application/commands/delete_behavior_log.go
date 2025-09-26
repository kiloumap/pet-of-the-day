package commands

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/points/domain"
)

// DeleteBehaviorLogCommand represents a command to delete a behavior log
type DeleteBehaviorLogCommand struct {
	BehaviorLogID uuid.UUID `json:"behavior_log_id" validate:"required"`
	UserID        uuid.UUID `json:"user_id" validate:"required"`
}

// DeleteBehaviorLogResult represents the result of deleting a behavior log
type DeleteBehaviorLogResult struct {
	Message string `json:"message"`
}

// DeleteBehaviorLogHandler handles the deletion of behavior logs
type DeleteBehaviorLogHandler struct {
	behaviorLogRepo  domain.BehaviorLogRepository
	dailyScoreRepo   domain.DailyScoreRepository
	authRepo         domain.AuthorizationRepository
	userSettingsRepo domain.UserSettingsRepository
}

// NewDeleteBehaviorLogHandler creates a new delete behavior log handler
func NewDeleteBehaviorLogHandler(
	behaviorLogRepo domain.BehaviorLogRepository,
	dailyScoreRepo domain.DailyScoreRepository,
	authRepo domain.AuthorizationRepository,
	userSettingsRepo domain.UserSettingsRepository,
) *DeleteBehaviorLogHandler {
	return &DeleteBehaviorLogHandler{
		behaviorLogRepo:  behaviorLogRepo,
		dailyScoreRepo:   dailyScoreRepo,
		authRepo:         authRepo,
		userSettingsRepo: userSettingsRepo,
	}
}

// Handle executes the delete behavior log command
func (h *DeleteBehaviorLogHandler) Handle(ctx context.Context, cmd *DeleteBehaviorLogCommand) (*DeleteBehaviorLogResult, error) {
	// Get the behavior log to validate ownership
	behaviorLog, err := h.behaviorLogRepo.GetByID(ctx, cmd.BehaviorLogID)
	if err != nil {
		return nil, fmt.Errorf("failed to get behavior log: %w", err)
	}

	// Validate authorization - user must be the one who logged it or own the pet
	if err := h.validateAuthorization(ctx, cmd.UserID, behaviorLog); err != nil {
		return nil, err
	}

	// Update daily scores by removing this behavior log's contribution
	if err := h.updateDailyScores(ctx, behaviorLog); err != nil {
		return nil, fmt.Errorf("failed to update daily scores: %w", err)
	}

	// Delete the behavior log
	if err := h.behaviorLogRepo.Delete(ctx, cmd.BehaviorLogID); err != nil {
		return nil, fmt.Errorf("failed to delete behavior log: %w", err)
	}

	return &DeleteBehaviorLogResult{
		Message: "Behavior log deleted successfully",
	}, nil
}

// validateAuthorization checks if the user can delete this behavior log
func (h *DeleteBehaviorLogHandler) validateAuthorization(ctx context.Context, userID uuid.UUID, behaviorLog *domain.BehaviorLog) error {
	// User can delete if they logged it
	if behaviorLog.UserID == userID {
		return nil
	}

	// User can also delete if they own the pet
	canAccess, err := h.authRepo.CanUserAccessPet(ctx, userID, behaviorLog.PetID)
	if err != nil {
		return fmt.Errorf("failed to check pet access: %w", err)
	}

	if !canAccess {
		return fmt.Errorf("user %s does not have permission to delete this behavior log", userID)
	}

	return nil
}

// updateDailyScores removes this behavior log's contribution from daily scores
func (h *DeleteBehaviorLogHandler) updateDailyScores(ctx context.Context, behaviorLog *domain.BehaviorLog) error {
	// Get user's timezone settings
	userSettings, err := h.userSettingsRepo.GetUserTimezone(ctx, behaviorLog.UserID)
	if err != nil {
		userSettings = domain.NewUserTimezoneSettings(behaviorLog.UserID)
	}

	// Calculate the date based on user's timezone
	date, err := h.calculateUserDate(behaviorLog.LoggedAt, userSettings)
	if err != nil {
		return fmt.Errorf("failed to calculate user date: %w", err)
	}

	// Update daily score for each group
	for _, groupShare := range behaviorLog.GroupShares {
		dailyScore, err := h.dailyScoreRepo.GetOrCreate(ctx, behaviorLog.PetID, groupShare.GroupID, date)
		if err != nil {
			return fmt.Errorf("failed to get daily score: %w", err)
		}

		if err := dailyScore.RemoveBehaviorLog(behaviorLog); err != nil {
			return fmt.Errorf("failed to remove behavior log from daily score: %w", err)
		}

		if err := h.dailyScoreRepo.Update(ctx, dailyScore); err != nil {
			return fmt.Errorf("failed to update daily score: %w", err)
		}
	}

	return nil
}

// calculateUserDate calculates the date for daily scoring based on user's timezone and reset time
func (h *DeleteBehaviorLogHandler) calculateUserDate(loggedAt time.Time, userSettings *domain.UserTimezoneSettings) (time.Time, error) {
	location, err := time.LoadLocation(userSettings.Timezone)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid timezone %s: %w", userSettings.Timezone, err)
	}

	localTime := loggedAt.In(location)

	resetTime, err := time.Parse("15:04", userSettings.DailyResetTime)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid reset time %s: %w", userSettings.DailyResetTime, err)
	}

	resetDateTime := time.Date(
		localTime.Year(), localTime.Month(), localTime.Day(),
		resetTime.Hour(), resetTime.Minute(), 0, 0, location,
	)

	date := localTime
	if localTime.After(resetDateTime) {
		date = localTime.AddDate(0, 0, 1)
	}

	return time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, location), nil
}