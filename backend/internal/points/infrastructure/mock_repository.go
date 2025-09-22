package infrastructure

import (
	"context"
	"sort"
	"time"

	"github.com/google/uuid"
	"pet-of-the-day/internal/points/domain"
)

// MockBehaviorRepository is a mock implementation of domain.BehaviorRepository
type MockBehaviorRepository struct {
	behaviors map[uuid.UUID]domain.Behavior
}

// NewMockBehaviorRepository creates a new MockBehaviorRepository
func NewMockBehaviorRepository() *MockBehaviorRepository {
	return &MockBehaviorRepository{
		behaviors: make(map[uuid.UUID]domain.Behavior),
	}
}

// AddBehavior adds a behavior to the mock repository
func (r *MockBehaviorRepository) AddBehavior(behavior domain.Behavior) {
	r.behaviors[behavior.ID] = behavior
}

// GetAll returns all behaviors
func (r *MockBehaviorRepository) GetAll(ctx context.Context) ([]domain.Behavior, error) {
	var result []domain.Behavior
	for _, behavior := range r.behaviors {
		if behavior.IsGlobal {
			result = append(result, behavior)
		}
	}
	return result, nil
}

// GetBySpecies returns behaviors for a specific species
func (r *MockBehaviorRepository) GetBySpecies(ctx context.Context, species domain.Species) ([]domain.Behavior, error) {
	var result []domain.Behavior
	for _, behavior := range r.behaviors {
		if behavior.IsGlobal && (behavior.Species == species || behavior.Species == domain.SpeciesBoth) {
			result = append(result, behavior)
		}
	}
	return result, nil
}

// GetByID returns a behavior by ID
func (r *MockBehaviorRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Behavior, error) {
	if behavior, exists := r.behaviors[id]; exists {
		return &behavior, nil
	}
	return nil, nil
}

// MockScoreEventRepository is a mock implementation of domain.ScoreEventRepository
type MockScoreEventRepository struct {
	events map[uuid.UUID]domain.ScoreEvent
}

// NewMockScoreEventRepository creates a new MockScoreEventRepository
func NewMockScoreEventRepository() *MockScoreEventRepository {
	return &MockScoreEventRepository{
		events: make(map[uuid.UUID]domain.ScoreEvent),
	}
}

// Create creates a new score event
func (r *MockScoreEventRepository) Create(ctx context.Context, event domain.ScoreEvent) (*domain.ScoreEvent, error) {
	r.events[event.ID] = event
	return &event, nil
}

// GetByID returns a score event by ID
func (r *MockScoreEventRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.ScoreEvent, error) {
	if event, exists := r.events[id]; exists {
		return &event, nil
	}
	return nil, nil
}

// GetByPetAndGroup returns score events for a specific pet in a group
func (r *MockScoreEventRepository) GetByPetAndGroup(ctx context.Context, petID, groupID uuid.UUID, limit int) ([]domain.ScoreEvent, error) {
	var result []domain.ScoreEvent
	for _, event := range r.events {
		if event.PetID == petID && event.GroupID == groupID {
			result = append(result, event)
		}
	}

	// Sort by action date descending
	sort.Slice(result, func(i, j int) bool {
		return result[i].ActionDate.After(result[j].ActionDate)
	})

	if len(result) > limit {
		result = result[:limit]
	}

	return result, nil
}

// GetTotalPointsByPetAndGroup returns total points for a pet in a group
func (r *MockScoreEventRepository) GetTotalPointsByPetAndGroup(ctx context.Context, petID, groupID uuid.UUID) (int, error) {
	totalPoints := 0
	for _, event := range r.events {
		if event.PetID == petID && event.GroupID == groupID {
			totalPoints += event.Points
		}
	}
	return totalPoints, nil
}

// GetLeaderboardData returns leaderboard data for a group within a date range
func (r *MockScoreEventRepository) GetLeaderboardData(ctx context.Context, groupID uuid.UUID, startDate, endDate time.Time) ([]domain.LeaderboardEntry, error) {
	petStats := make(map[uuid.UUID]domain.LeaderboardEntry)

	for _, event := range r.events {
		if event.GroupID == groupID &&
		   event.ActionDate.After(startDate) &&
		   event.ActionDate.Before(endDate) {

			if stats, exists := petStats[event.PetID]; exists {
				stats.TotalPoints += event.Points
				stats.ActionCount++
				petStats[event.PetID] = stats
			} else {
				petStats[event.PetID] = domain.LeaderboardEntry{
					PetID:       event.PetID,
					PetName:     "MockPet",
					Species:     "dog",
					OwnerName:   "MockOwner",
					TotalPoints: event.Points,
					ActionCount: 1,
				}
			}
		}
	}

	var leaderboard []domain.LeaderboardEntry
	for _, stats := range petStats {
		leaderboard = append(leaderboard, stats)
	}

	sort.Slice(leaderboard, func(i, j int) bool {
		return leaderboard[i].TotalPoints > leaderboard[j].TotalPoints
	})

	return leaderboard, nil
}

// Delete deletes a score event by ID
func (r *MockScoreEventRepository) Delete(ctx context.Context, id uuid.UUID) error {
	delete(r.events, id)
	return nil
}

// MockPetAccessChecker is a mock implementation of domain.PetAccessChecker
type MockPetAccessChecker struct {
	accessMap map[string]bool // key: userID-petID
}

// NewMockPetAccessChecker creates a new MockPetAccessChecker
func NewMockPetAccessChecker() *MockPetAccessChecker {
	return &MockPetAccessChecker{
		accessMap: make(map[string]bool),
	}
}

// SetAccess sets access for a user-pet combination
func (c *MockPetAccessChecker) SetAccess(userID, petID uuid.UUID, hasAccess bool) {
	key := userID.String() + "-" + petID.String()
	c.accessMap[key] = hasAccess
}

// HasPetAccess checks if a user has access to a pet
func (c *MockPetAccessChecker) HasPetAccess(ctx context.Context, userID, petID uuid.UUID) (bool, error) {
	key := userID.String() + "-" + petID.String()
	return c.accessMap[key], nil
}

// MockGroupMembershipChecker is a mock implementation of domain.GroupMembershipChecker
type MockGroupMembershipChecker struct {
	membershipMap map[string]bool // key: userID-groupID
}

// NewMockGroupMembershipChecker creates a new MockGroupMembershipChecker
func NewMockGroupMembershipChecker() *MockGroupMembershipChecker {
	return &MockGroupMembershipChecker{
		membershipMap: make(map[string]bool),
	}
}

// SetMembership sets membership for a user-group combination
func (c *MockGroupMembershipChecker) SetMembership(userID, groupID uuid.UUID, isMember bool) {
	key := userID.String() + "-" + groupID.String()
	c.membershipMap[key] = isMember
}

// IsGroupMember checks if a user is a member of a group
func (c *MockGroupMembershipChecker) IsGroupMember(ctx context.Context, userID, groupID uuid.UUID) (bool, error) {
	key := userID.String() + "-" + groupID.String()
	return c.membershipMap[key], nil
}

// MockScoreEventOwnerChecker is a mock implementation of domain.ScoreEventOwnerChecker
type MockScoreEventOwnerChecker struct {
	ownershipMap map[string]bool // key: userID-eventID
}

// NewMockScoreEventOwnerChecker creates a new MockScoreEventOwnerChecker
func NewMockScoreEventOwnerChecker() *MockScoreEventOwnerChecker {
	return &MockScoreEventOwnerChecker{
		ownershipMap: make(map[string]bool),
	}
}

// SetOwnership sets ownership for a user-event combination
func (c *MockScoreEventOwnerChecker) SetOwnership(userID, eventID uuid.UUID, isOwner bool) {
	key := userID.String() + "-" + eventID.String()
	c.ownershipMap[key] = isOwner
}

// IsScoreEventOwner checks if a user is the owner of a score event
func (c *MockScoreEventOwnerChecker) IsScoreEventOwner(ctx context.Context, userID, eventID uuid.UUID) (bool, error) {
	key := userID.String() + "-" + eventID.String()
	return c.ownershipMap[key], nil
}