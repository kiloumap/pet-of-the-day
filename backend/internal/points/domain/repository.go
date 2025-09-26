package domain

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// BehaviorRepository defines the interface for behavior data access
type BehaviorRepository interface {
	// Existing methods for backward compatibility
	GetAll(ctx context.Context) ([]Behavior, error)
	GetBySpecies(ctx context.Context, species Species) ([]Behavior, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Behavior, error)

	// New methods for behavior logging system
	Create(ctx context.Context, behavior *Behavior) error
	GetAllActive(ctx context.Context, species *Species) ([]*Behavior, error)
	GetByCategory(ctx context.Context, category BehaviorCategory, species *Species) ([]*Behavior, error)
	Update(ctx context.Context, behavior *Behavior) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetByName(ctx context.Context, name string) (*Behavior, error)
}

// ScoreEventRepository defines the interface for score event data access
type ScoreEventRepository interface {
	Create(ctx context.Context, event ScoreEvent) (*ScoreEvent, error)
	GetByID(ctx context.Context, id uuid.UUID) (*ScoreEvent, error)
	GetByPetAndGroup(ctx context.Context, petID, groupID uuid.UUID, limit int) ([]ScoreEvent, error)
	GetTotalPointsByPetAndGroup(ctx context.Context, petID, groupID uuid.UUID) (int, error)
	GetLeaderboardData(ctx context.Context, groupID uuid.UUID, startDate, endDate time.Time) ([]LeaderboardEntry, error)
	Delete(ctx context.Context, id uuid.UUID) error
	DeleteByGroupID(ctx context.Context, groupID uuid.UUID) error
	GetRecentActivitiesForUser(ctx context.Context, userID uuid.UUID, limit int) ([]ActivityItem, error)
}

// BehaviorLogRepository defines the interface for behavior log data access
type BehaviorLogRepository interface {
	// Create creates a new behavior log with group shares
	Create(ctx context.Context, behaviorLog *BehaviorLog) error

	// GetByID retrieves a behavior log by ID with group shares
	GetByID(ctx context.Context, id uuid.UUID) (*BehaviorLog, error)

	// Find retrieves behavior logs based on filter criteria
	Find(ctx context.Context, filter *BehaviorLogFilter) ([]*BehaviorLog, error)

	// Update updates an existing behavior log
	Update(ctx context.Context, behaviorLog *BehaviorLog) error

	// Delete deletes a behavior log (hard delete for data integrity)
	Delete(ctx context.Context, id uuid.UUID) error

	// GetLastLoggedAt retrieves the most recent logged_at time for a specific pet and behavior
	GetLastLoggedAt(ctx context.Context, petID, behaviorID uuid.UUID) (*time.Time, error)

	// GetBreakdown retrieves behavior breakdown for daily score calculation
	GetBreakdown(ctx context.Context, petID uuid.UUID, groupID uuid.UUID, date time.Time) ([]*DailyScoreBreakdown, error)

	// CountByDateRange counts behavior logs within a date range
	CountByDateRange(ctx context.Context, petID uuid.UUID, from, to time.Time) (int, error)

	// GetByGroup retrieves all behavior logs shared with a specific group
	GetByGroup(ctx context.Context, groupID uuid.UUID, filter *BehaviorLogFilter) ([]*BehaviorLog, error)

	// CleanupOldLogs removes behavior logs older than the retention period (6 months)
	CleanupOldLogs(ctx context.Context, cutoffDate time.Time) (int, error)
}

// DailyScoreRepository defines the interface for daily score data access
type DailyScoreRepository interface {
	// Create creates a new daily score entry
	Create(ctx context.Context, dailyScore *DailyScore) error

	// GetByID retrieves a daily score by ID
	GetByID(ctx context.Context, id uuid.UUID) (*DailyScore, error)

	// GetOrCreate retrieves an existing daily score or creates a new one
	GetOrCreate(ctx context.Context, petID, groupID uuid.UUID, date time.Time) (*DailyScore, error)

	// Update updates an existing daily score
	Update(ctx context.Context, dailyScore *DailyScore) error

	// Find retrieves daily scores based on filter criteria
	Find(ctx context.Context, filter *DailyScoreFilter) ([]*DailyScore, error)

	// GetRankings retrieves pet rankings for a group on a specific date
	GetRankings(ctx context.Context, groupID uuid.UUID, date time.Time) ([]*PetRanking, error)

	// GetRankingsByDateRange retrieves pet rankings for a group within a date range
	GetRankingsByDateRange(ctx context.Context, groupID uuid.UUID, from, to time.Time) ([]*PetRanking, error)

	// GetTopScorers retrieves the highest scoring pets for a group on a specific date
	GetTopScorers(ctx context.Context, groupID uuid.UUID, date time.Time) ([]*DailyScore, error)

	// RecalculateFromLogs recalculates daily scores based on behavior logs
	RecalculateFromLogs(ctx context.Context, petID, groupID uuid.UUID, date time.Time) (*DailyScore, error)

	// Delete deletes a daily score entry
	Delete(ctx context.Context, id uuid.UUID) error

	// GetHistoricalData retrieves historical daily scores for trend analysis
	GetHistoricalData(ctx context.Context, petID, groupID uuid.UUID, days int) ([]*DailyScore, error)
}

// PetOfTheDayRepository defines the interface for Pet of the Day data access
type PetOfTheDayRepository interface {
	// Create creates a new Pet of the Day winner record
	Create(ctx context.Context, winner *PetOfTheDayWinner) error

	// GetByGroupAndDate retrieves all Pet of the Day winners for a group on a specific date
	GetByGroupAndDate(ctx context.Context, groupID uuid.UUID, date time.Time) ([]*PetOfTheDayWinner, error)

	// GetWinnerHistory retrieves winner history for a group within a date range
	GetWinnerHistory(ctx context.Context, groupID uuid.UUID, from, to time.Time) ([]*PetOfTheDayWinner, error)

	// GetPetWinCount retrieves the number of times a pet has won Pet of the Day
	GetPetWinCount(ctx context.Context, petID uuid.UUID) (int, error)

	// GetGroupStats retrieves statistics for a group (total winners, unique winners, etc.)
	GetGroupStats(ctx context.Context, groupID uuid.UUID) (*GroupPetOfTheDayStats, error)

	// DeleteByGroupAndDate deletes winners for a specific group and date (for recalculation)
	DeleteByGroupAndDate(ctx context.Context, groupID uuid.UUID, date time.Time) error

	// GetLatestWinners retrieves the most recent winners across all groups
	GetLatestWinners(ctx context.Context, limit int) ([]*PetOfTheDayWinner, error)
}

// UserSettingsRepository defines the interface for user settings data access
type UserSettingsRepository interface {
	// GetUserTimezone retrieves a user's timezone settings
	GetUserTimezone(ctx context.Context, userID uuid.UUID) (*UserTimezoneSettings, error)

	// UpdateUserTimezone updates a user's timezone settings
	UpdateUserTimezone(ctx context.Context, userID uuid.UUID, settings *UserTimezoneSettings) error
}

// Authorization services that points context depends on
type PetAccessChecker interface {
	HasPetAccess(ctx context.Context, userID, petID uuid.UUID) (bool, error)
}

type GroupMembershipChecker interface {
	IsGroupMember(ctx context.Context, userID, groupID uuid.UUID) (bool, error)
}

type ScoreEventOwnerChecker interface {
	IsScoreEventOwner(ctx context.Context, userID, eventID uuid.UUID) (bool, error)
}

// AuthorizationRepository defines the interface for authorization checks across bounded contexts
type AuthorizationRepository interface {
	// CanUserAccessPet checks if a user can access a pet (owner or co-owner)
	CanUserAccessPet(ctx context.Context, userID, petID uuid.UUID) (bool, error)

	// CanUserAccessGroup checks if a user can access a group (member)
	CanUserAccessGroup(ctx context.Context, userID, groupID uuid.UUID) (bool, error)

	// IsPetInGroup checks if a pet is a member of a group
	IsPetInGroup(ctx context.Context, petID, groupID uuid.UUID) (bool, error)

	// GetUserPets retrieves all pets owned by a user
	GetUserPets(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error)

	// GetUserGroups retrieves all groups a user is a member of
	GetUserGroups(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error)

	// GetPetInfo retrieves basic pet information (name, species)
	GetPetInfo(ctx context.Context, petID uuid.UUID) (*PetInfo, error)

	// GetGroupInfo retrieves basic group information (name, description)
	GetGroupInfo(ctx context.Context, groupID uuid.UUID) (*GroupInfo, error)

	// GetUserInfo retrieves basic user information (name)
	GetUserInfo(ctx context.Context, userID uuid.UUID) (*UserInfo, error)
}

// GroupPetOfTheDayStats represents statistics about Pet of the Day winners for a group
type GroupPetOfTheDayStats struct {
	GroupID       uuid.UUID
	TotalWins     int
	UniquePets    int
	MostWins      int
	MostWinsPetID *uuid.UUID
	AverageScore  float64
	LastWinDate   *time.Time
}

// PetInfo represents basic pet information from the pet bounded context
type PetInfo struct {
	ID      uuid.UUID
	Name    string
	Species Species
	OwnerID uuid.UUID
}

// GroupInfo represents basic group information from the community bounded context
type GroupInfo struct {
	ID          uuid.UUID
	Name        string
	Description string
	OwnerID     uuid.UUID
}

// UserInfo represents basic user information
type UserInfo struct {
	ID   uuid.UUID
	Name string
}

// UserTimezoneSettings represents user's timezone and daily reset preferences
type UserTimezoneSettings struct {
	UserID         uuid.UUID
	Timezone       string
	DailyResetTime string
	UpdatedAt      time.Time
}

// NewUserTimezoneSettings creates default timezone settings for a user
func NewUserTimezoneSettings(userID uuid.UUID) *UserTimezoneSettings {
	return &UserTimezoneSettings{
		UserID:         userID,
		Timezone:       "UTC",
		DailyResetTime: "21:00",
		UpdatedAt:      time.Now(),
	}
}

// Validate validates the timezone settings
func (uts *UserTimezoneSettings) Validate() error {
	// Validate timezone
	if _, err := time.LoadLocation(uts.Timezone); err != nil {
		return fmt.Errorf("invalid timezone: %s", uts.Timezone)
	}

	// Validate daily reset time format
	if _, err := time.Parse("15:04", uts.DailyResetTime); err != nil {
		return fmt.Errorf("invalid daily reset time format: %s (expected HH:MM)", uts.DailyResetTime)
	}

	return nil
}

// RepositoryFactory defines the interface for creating repository instances
type RepositoryFactory interface {
	// Existing repositories
	NewBehaviorRepository() BehaviorRepository
	NewScoreEventRepository() ScoreEventRepository

	// New behavior logging repositories
	NewBehaviorLogRepository() BehaviorLogRepository
	NewDailyScoreRepository() DailyScoreRepository
	NewPetOfTheDayRepository() PetOfTheDayRepository
	NewAuthorizationRepository() AuthorizationRepository
	NewUserSettingsRepository() UserSettingsRepository
}
