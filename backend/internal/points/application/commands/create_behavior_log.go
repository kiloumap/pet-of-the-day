package commands

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/points/domain"
)

// CreateBehaviorLogCommand represents a command to create a new behavior log
type CreateBehaviorLogCommand struct {
	PetID      uuid.UUID   `json:"pet_id" validate:"required"`
	BehaviorID uuid.UUID   `json:"behavior_id" validate:"required"`
	UserID     uuid.UUID   `json:"user_id" validate:"required"`
	GroupIDs   []uuid.UUID `json:"group_ids"`
	LoggedAt   *time.Time  `json:"logged_at,omitempty"`
	Notes      string      `json:"notes,omitempty"`
}

// CreateBehaviorLogResult represents the result of creating a behavior log
type CreateBehaviorLogResult struct {
	BehaviorLog *domain.BehaviorLog `json:"behavior_log"`
	Message     string              `json:"message"`
}

// CreateBehaviorLogHandler handles the creation of behavior logs
type CreateBehaviorLogHandler struct {
	behaviorRepo      domain.BehaviorRepository
	behaviorLogRepo   domain.BehaviorLogRepository
	dailyScoreRepo    domain.DailyScoreRepository
	authRepo          domain.AuthorizationRepository
	userSettingsRepo  domain.UserSettingsRepository
}

// NewCreateBehaviorLogHandler creates a new create behavior log handler
func NewCreateBehaviorLogHandler(
	behaviorRepo domain.BehaviorRepository,
	behaviorLogRepo domain.BehaviorLogRepository,
	dailyScoreRepo domain.DailyScoreRepository,
	authRepo domain.AuthorizationRepository,
	userSettingsRepo domain.UserSettingsRepository,
) *CreateBehaviorLogHandler {
	return &CreateBehaviorLogHandler{
		behaviorRepo:      behaviorRepo,
		behaviorLogRepo:   behaviorLogRepo,
		dailyScoreRepo:    dailyScoreRepo,
		authRepo:          authRepo,
		userSettingsRepo:  userSettingsRepo,
	}
}

// Handle executes the create behavior log command
func (h *CreateBehaviorLogHandler) Handle(ctx context.Context, cmd *CreateBehaviorLogCommand) (*CreateBehaviorLogResult, error) {
	// Validate authorization
	if err := h.validateAuthorization(ctx, cmd); err != nil {
		return nil, err
	}

	// Get behavior to validate and get point value
	behavior, err := h.behaviorRepo.GetByID(ctx, cmd.BehaviorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get behavior: %w", err)
	}

	if !behavior.IsActive {
		return nil, fmt.Errorf("behavior is not active")
	}

	// Validate pet species compatibility
	petInfo, err := h.authRepo.GetPetInfo(ctx, cmd.PetID)
	if err != nil {
		return nil, fmt.Errorf("failed to get pet info: %w", err)
	}

	if !behavior.IsValidForSpecies(petInfo.Species) {
		return nil, fmt.Errorf("behavior %s is not valid for %s", behavior.Name, petInfo.Species)
	}

	// Check for duplicate behavior within minimum interval
	if err := h.checkDuplicatePrevention(ctx, cmd.PetID, cmd.BehaviorID, cmd.LoggedAt, behavior.MinIntervalMinutes); err != nil {
		return nil, err
	}

	// Set logged at time if not provided
	loggedAt := time.Now()
	if cmd.LoggedAt != nil {
		loggedAt = *cmd.LoggedAt
	}

	// Create behavior log
	behaviorLog, err := domain.NewBehaviorLog(
		cmd.PetID,
		cmd.BehaviorID,
		cmd.UserID,
		behavior.PointValue,
		loggedAt,
		cmd.Notes,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create behavior log: %w", err)
	}

	// Add group shares
	for _, groupID := range cmd.GroupIDs {
		// Verify pet is in group and user can access group
		if err := h.validateGroupAccess(ctx, cmd.UserID, cmd.PetID, groupID); err != nil {
			return nil, fmt.Errorf("failed to validate group access for %s: %w", groupID, err)
		}

		if err := behaviorLog.AddGroupShare(groupID); err != nil {
			return nil, fmt.Errorf("failed to add group share: %w", err)
		}
	}

	// Save behavior log
	if err := h.behaviorLogRepo.Create(ctx, behaviorLog); err != nil {
		return nil, fmt.Errorf("failed to save behavior log: %w", err)
	}

	// Update daily scores for each group
	if err := h.updateDailyScores(ctx, behaviorLog); err != nil {
		return nil, fmt.Errorf("failed to update daily scores: %w", err)
	}

	return &CreateBehaviorLogResult{
		BehaviorLog: behaviorLog,
		Message:     fmt.Sprintf("Successfully logged behavior '%s' for %s", behavior.Name, petInfo.Name),
	}, nil
}

// validateAuthorization checks if the user can access the pet
func (h *CreateBehaviorLogHandler) validateAuthorization(ctx context.Context, cmd *CreateBehaviorLogCommand) error {
	canAccess, err := h.authRepo.CanUserAccessPet(ctx, cmd.UserID, cmd.PetID)
	if err != nil {
		return fmt.Errorf("failed to check pet access: %w", err)
	}

	if !canAccess {
		return fmt.Errorf("user %s does not have access to pet %s", cmd.UserID, cmd.PetID)
	}

	return nil
}

// validateGroupAccess checks if the user can share behavior to the group and pet is in group
func (h *CreateBehaviorLogHandler) validateGroupAccess(ctx context.Context, userID, petID, groupID uuid.UUID) error {
	// Check if user can access group
	canAccessGroup, err := h.authRepo.CanUserAccessGroup(ctx, userID, groupID)
	if err != nil {
		return fmt.Errorf("failed to check group access: %w", err)
	}

	if !canAccessGroup {
		return fmt.Errorf("user %s does not have access to group %s", userID, groupID)
	}

	// Check if pet is in group
	isPetInGroup, err := h.authRepo.IsPetInGroup(ctx, petID, groupID)
	if err != nil {
		return fmt.Errorf("failed to check pet membership in group: %w", err)
	}

	if !isPetInGroup {
		return fmt.Errorf("pet %s is not a member of group %s", petID, groupID)
	}

	return nil
}

// checkDuplicatePrevention verifies the behavior can be logged based on minimum interval rules
func (h *CreateBehaviorLogHandler) checkDuplicatePrevention(ctx context.Context, petID, behaviorID uuid.UUID, loggedAt *time.Time, minIntervalMinutes int) error {
	lastLoggedAt, err := h.behaviorLogRepo.GetLastLoggedAt(ctx, petID, behaviorID)
	if err != nil {
		return fmt.Errorf("failed to check last logged time: %w", err)
	}

	// If no previous log, allow this one
	if lastLoggedAt == nil {
		return nil
	}

	// Calculate the minimum time required between logs
	minInterval := time.Duration(minIntervalMinutes) * time.Minute

	// Use current time if loggedAt not specified
	currentTime := time.Now()
	if loggedAt != nil {
		currentTime = *loggedAt
	}

	// Check if enough time has passed
	timeSinceLastLog := currentTime.Sub(*lastLoggedAt)
	if timeSinceLastLog < minInterval {
		remainingTime := minInterval - timeSinceLastLog
		return fmt.Errorf("must wait %v before logging this behavior again (last logged %v ago)",
			remainingTime.Round(time.Minute), timeSinceLastLog.Round(time.Minute))
	}

	return nil
}

// updateDailyScores updates daily scores for all groups this behavior log is shared with
func (h *CreateBehaviorLogHandler) updateDailyScores(ctx context.Context, behaviorLog *domain.BehaviorLog) error {
	// Get user's timezone settings for proper daily boundary calculation
	userSettings, err := h.userSettingsRepo.GetUserTimezone(ctx, behaviorLog.UserID)
	if err != nil {
		// Use default if user settings not found
		userSettings = domain.NewUserTimezoneSettings(behaviorLog.UserID)
	}

	// Calculate the date based on user's timezone and daily reset time
	date, err := h.calculateUserDate(behaviorLog.LoggedAt, userSettings)
	if err != nil {
		return fmt.Errorf("failed to calculate user date: %w", err)
	}

	// Update daily score for each group
	for _, groupShare := range behaviorLog.GroupShares {
		dailyScore, err := h.dailyScoreRepo.GetOrCreate(ctx, behaviorLog.PetID, groupShare.GroupID, date)
		if err != nil {
			return fmt.Errorf("failed to get or create daily score: %w", err)
		}

		if err := dailyScore.AddBehaviorLog(behaviorLog); err != nil {
			return fmt.Errorf("failed to add behavior log to daily score: %w", err)
		}

		if err := h.dailyScoreRepo.Update(ctx, dailyScore); err != nil {
			return fmt.Errorf("failed to update daily score: %w", err)
		}
	}

	return nil
}

// calculateUserDate calculates the date for daily scoring based on user's timezone and reset time
func (h *CreateBehaviorLogHandler) calculateUserDate(loggedAt time.Time, userSettings *domain.UserTimezoneSettings) (time.Time, error) {
	location, err := time.LoadLocation(userSettings.Timezone)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid timezone %s: %w", userSettings.Timezone, err)
	}

	// Convert to user's timezone
	localTime := loggedAt.In(location)

	// Parse reset time
	resetTime, err := time.Parse("15:04", userSettings.DailyResetTime)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid reset time %s: %w", userSettings.DailyResetTime, err)
	}

	// Calculate reset time for the local date
	resetDateTime := time.Date(
		localTime.Year(), localTime.Month(), localTime.Day(),
		resetTime.Hour(), resetTime.Minute(), 0, 0, location,
	)

	// If logged before reset time, it belongs to the current day
	// If logged after reset time, it belongs to the next day
	date := localTime
	if localTime.After(resetDateTime) {
		date = localTime.AddDate(0, 0, 1)
	}

	// Return normalized date (start of day)
	return time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, location), nil
}