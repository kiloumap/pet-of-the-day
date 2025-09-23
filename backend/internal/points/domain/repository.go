package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// BehaviorRepository defines the interface for behavior data access
type BehaviorRepository interface {
	GetAll(ctx context.Context) ([]Behavior, error)
	GetBySpecies(ctx context.Context, species Species) ([]Behavior, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Behavior, error)
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