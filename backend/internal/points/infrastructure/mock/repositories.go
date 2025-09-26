package mock

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/points/domain"
)

// MockBehaviorRepository provides a mock implementation of domain.BehaviorRepository
type MockBehaviorRepository struct {
	mu         sync.RWMutex
	behaviors  map[uuid.UUID]*domain.Behavior
	nameIndex  map[string]uuid.UUID
}

// NewMockBehaviorRepository creates a new mock behavior repository
func NewMockBehaviorRepository() *MockBehaviorRepository {
	return &MockBehaviorRepository{
		behaviors: make(map[uuid.UUID]*domain.Behavior),
		nameIndex: make(map[string]uuid.UUID),
	}
}

func (r *MockBehaviorRepository) Create(ctx context.Context, behavior *domain.Behavior) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	// Check name uniqueness
	if _, exists := r.nameIndex[behavior.Name]; exists {
		return fmt.Errorf("behavior with name '%s' already exists", behavior.Name)
	}
	
	r.behaviors[behavior.ID] = behavior
	r.nameIndex[behavior.Name] = behavior.ID
	return nil
}

func (r *MockBehaviorRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Behavior, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	behavior, exists := r.behaviors[id]
	if !exists {
		return nil, fmt.Errorf("behavior not found")
	}
	return behavior, nil
}

func (r *MockBehaviorRepository) GetAll(ctx context.Context) ([]domain.Behavior, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	var behaviors []domain.Behavior
	for _, behavior := range r.behaviors {
		if behavior.IsActive {
			behaviors = append(behaviors, *behavior)
		}
	}
	return behaviors, nil
}

func (r *MockBehaviorRepository) GetBySpecies(ctx context.Context, species domain.Species) ([]domain.Behavior, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	var behaviors []domain.Behavior
	for _, behavior := range r.behaviors {
		if behavior.IsActive && (behavior.Species == species || behavior.Species == domain.SpeciesBoth) {
			behaviors = append(behaviors, *behavior)
		}
	}
	return behaviors, nil
}

func (r *MockBehaviorRepository) GetAllActive(ctx context.Context, species *domain.Species) ([]*domain.Behavior, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	var behaviors []*domain.Behavior
	for _, behavior := range r.behaviors {
		if behavior.IsActive {
			if species == nil || behavior.Species == *species || behavior.Species == domain.SpeciesBoth {
				behaviors = append(behaviors, behavior)
			}
		}
	}
	return behaviors, nil
}

func (r *MockBehaviorRepository) GetByCategory(ctx context.Context, category domain.BehaviorCategory, species *domain.Species) ([]*domain.Behavior, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	var behaviors []*domain.Behavior
	for _, behavior := range r.behaviors {
		if behavior.IsActive && behavior.Category == category {
			if species == nil || behavior.Species == *species || behavior.Species == domain.SpeciesBoth {
				behaviors = append(behaviors, behavior)
			}
		}
	}
	return behaviors, nil
}

func (r *MockBehaviorRepository) Update(ctx context.Context, behavior *domain.Behavior) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	if _, exists := r.behaviors[behavior.ID]; !exists {
		return fmt.Errorf("behavior not found")
	}
	
	r.behaviors[behavior.ID] = behavior
	return nil
}

func (r *MockBehaviorRepository) Delete(ctx context.Context, id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	behavior, exists := r.behaviors[id]
	if !exists {
		return fmt.Errorf("behavior not found")
	}
	
	behavior.IsActive = false
	return nil
}

func (r *MockBehaviorRepository) GetByName(ctx context.Context, name string) (*domain.Behavior, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	id, exists := r.nameIndex[name]
	if !exists {
		return nil, nil
	}
	
	return r.behaviors[id], nil
}

// MockBehaviorLogRepository provides a mock implementation of domain.BehaviorLogRepository
type MockBehaviorLogRepository struct {
	mu           sync.RWMutex
	behaviorLogs map[uuid.UUID]*domain.BehaviorLog
	lastLogged   map[string]*time.Time // key: petID_behaviorID
}

// NewMockBehaviorLogRepository creates a new mock behavior log repository
func NewMockBehaviorLogRepository() *MockBehaviorLogRepository {
	return &MockBehaviorLogRepository{
		behaviorLogs: make(map[uuid.UUID]*domain.BehaviorLog),
		lastLogged:   make(map[string]*time.Time),
	}
}

func (r *MockBehaviorLogRepository) Create(ctx context.Context, behaviorLog *domain.BehaviorLog) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.behaviorLogs[behaviorLog.ID] = behaviorLog
	
	// Update last logged time index
	key := fmt.Sprintf("%s_%s", behaviorLog.PetID, behaviorLog.BehaviorID)
	r.lastLogged[key] = &behaviorLog.LoggedAt
	
	return nil
}

func (r *MockBehaviorLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.BehaviorLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	behaviorLog, exists := r.behaviorLogs[id]
	if !exists {
		return nil, fmt.Errorf("behavior log not found")
	}
	return behaviorLog, nil
}

func (r *MockBehaviorLogRepository) Find(ctx context.Context, filter *domain.BehaviorLogFilter) ([]*domain.BehaviorLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	var matches []*domain.BehaviorLog
	
	for _, behaviorLog := range r.behaviorLogs {
		if r.matchesFilter(behaviorLog, filter) {
			matches = append(matches, behaviorLog)
		}
	}
	
	// Sort by logged_at descending
	sort.Slice(matches, func(i, j int) bool {
		return matches[i].LoggedAt.After(matches[j].LoggedAt)
	})
	
	// Apply pagination
	start := filter.Offset
	end := start + filter.Limit
	
	if start >= len(matches) {
		return []*domain.BehaviorLog{}, nil
	}
	
	if end > len(matches) {
		end = len(matches)
	}
	
	return matches[start:end], nil
}

func (r *MockBehaviorLogRepository) matchesFilter(behaviorLog *domain.BehaviorLog, filter *domain.BehaviorLogFilter) bool {
	if filter.PetID != nil && behaviorLog.PetID != *filter.PetID {
		return false
	}
	
	if filter.BehaviorID != nil && behaviorLog.BehaviorID != *filter.BehaviorID {
		return false
	}
	
	if filter.UserID != nil && behaviorLog.UserID != *filter.UserID {
		return false
	}
	
	if filter.DateFrom != nil && behaviorLog.LoggedAt.Before(*filter.DateFrom) {
		return false
	}
	
	if filter.DateTo != nil && behaviorLog.LoggedAt.After(*filter.DateTo) {
		return false
	}
	
	if filter.GroupID != nil {
		groupFound := false
		for _, share := range behaviorLog.GroupShares {
			if share.GroupID == *filter.GroupID {
				groupFound = true
				break
			}
		}
		if !groupFound {
			return false
		}
	}
	
	return true
}

func (r *MockBehaviorLogRepository) Update(ctx context.Context, behaviorLog *domain.BehaviorLog) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	if _, exists := r.behaviorLogs[behaviorLog.ID]; !exists {
		return fmt.Errorf("behavior log not found")
	}
	
	r.behaviorLogs[behaviorLog.ID] = behaviorLog
	return nil
}

func (r *MockBehaviorLogRepository) Delete(ctx context.Context, id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	behaviorLog, exists := r.behaviorLogs[id]
	if !exists {
		return fmt.Errorf("behavior log not found")
	}
	
	// Remove from last logged index
	key := fmt.Sprintf("%s_%s", behaviorLog.PetID, behaviorLog.BehaviorID)
	delete(r.lastLogged, key)
	
	delete(r.behaviorLogs, id)
	return nil
}

func (r *MockBehaviorLogRepository) GetLastLoggedAt(ctx context.Context, petID, behaviorID uuid.UUID) (*time.Time, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	key := fmt.Sprintf("%s_%s", petID, behaviorID)
	return r.lastLogged[key], nil
}

func (r *MockBehaviorLogRepository) GetBreakdown(ctx context.Context, petID uuid.UUID, groupID uuid.UUID, date time.Time) ([]*domain.DailyScoreBreakdown, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	// Calculate date boundaries
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)
	
	// Aggregate by behavior ID
	breakdown := make(map[uuid.UUID]*domain.DailyScoreBreakdown)
	
	for _, behaviorLog := range r.behaviorLogs {
		if behaviorLog.PetID != petID {
			continue
		}
		
		if behaviorLog.LoggedAt.Before(startOfDay) || behaviorLog.LoggedAt.After(endOfDay) {
			continue
		}
		
		// Check if shared with group
		sharedWithGroup := false
		for _, share := range behaviorLog.GroupShares {
			if share.GroupID == groupID {
				sharedWithGroup = true
				break
			}
		}
		if !sharedWithGroup {
			continue
		}
		
		behaviorID := behaviorLog.BehaviorID
		
		if existing, exists := breakdown[behaviorID]; exists {
			existing.Count++
			existing.TotalPoints += behaviorLog.PointsAwarded
		} else {
			breakdown[behaviorID] = &domain.DailyScoreBreakdown{
				BehaviorID:        behaviorID,
				BehaviorName:      "Mock Behavior",
				BehaviorCategory:  domain.BehaviorCategoryPottyTraining,
				Count:             1,
				PointsPerInstance: behaviorLog.PointsAwarded,
				TotalPoints:       behaviorLog.PointsAwarded,
			}
		}
	}
	
	// Convert to slice
	result := make([]*domain.DailyScoreBreakdown, 0, len(breakdown))
	for _, item := range breakdown {
		result = append(result, item)
	}
	
	return result, nil
}

func (r *MockBehaviorLogRepository) CountByDateRange(ctx context.Context, petID uuid.UUID, from, to time.Time) (int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	count := 0
	for _, behaviorLog := range r.behaviorLogs {
		if behaviorLog.PetID == petID && 
		   behaviorLog.LoggedAt.After(from) && 
		   behaviorLog.LoggedAt.Before(to) {
			count++
		}
	}
	
	return count, nil
}

func (r *MockBehaviorLogRepository) GetByGroup(ctx context.Context, groupID uuid.UUID, filter *domain.BehaviorLogFilter) ([]*domain.BehaviorLog, error) {
	if filter == nil {
		filter = domain.NewBehaviorLogFilter()
	}
	filter.GroupID = &groupID
	
	return r.Find(ctx, filter)
}

func (r *MockBehaviorLogRepository) CleanupOldLogs(ctx context.Context, cutoffDate time.Time) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	var toDelete []uuid.UUID
	
	for id, behaviorLog := range r.behaviorLogs {
		if behaviorLog.CreatedAt.Before(cutoffDate) {
			toDelete = append(toDelete, id)
		}
	}
	
	for _, id := range toDelete {
		behaviorLog := r.behaviorLogs[id]
		key := fmt.Sprintf("%s_%s", behaviorLog.PetID, behaviorLog.BehaviorID)
		delete(r.lastLogged, key)
		delete(r.behaviorLogs, id)
	}
	
	return len(toDelete), nil
}

// MockAuthorizationRepository provides a mock implementation of domain.AuthorizationRepository
type MockAuthorizationRepository struct {
	mu              sync.RWMutex
	userPets        map[uuid.UUID][]uuid.UUID
	userGroups      map[uuid.UUID][]uuid.UUID
	petGroups       map[uuid.UUID][]uuid.UUID
	pets            map[uuid.UUID]*domain.PetInfo
	groups          map[uuid.UUID]*domain.GroupInfo
	users           map[uuid.UUID]*domain.UserInfo
}

// NewMockAuthorizationRepository creates a new mock authorization repository
func NewMockAuthorizationRepository() *MockAuthorizationRepository {
	return &MockAuthorizationRepository{
		userPets:   make(map[uuid.UUID][]uuid.UUID),
		userGroups: make(map[uuid.UUID][]uuid.UUID),
		petGroups:  make(map[uuid.UUID][]uuid.UUID),
		pets:       make(map[uuid.UUID]*domain.PetInfo),
		groups:     make(map[uuid.UUID]*domain.GroupInfo),
		users:      make(map[uuid.UUID]*domain.UserInfo),
	}
}

// AddUserPet adds a pet ownership relationship
func (r *MockAuthorizationRepository) AddUserPet(userID, petID uuid.UUID, petInfo *domain.PetInfo) {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.userPets[userID] = append(r.userPets[userID], petID)
	r.pets[petID] = petInfo
}

// AddUserGroup adds a group membership relationship
func (r *MockAuthorizationRepository) AddUserGroup(userID, groupID uuid.UUID, groupInfo *domain.GroupInfo) {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.userGroups[userID] = append(r.userGroups[userID], groupID)
	r.groups[groupID] = groupInfo
}

// AddPetToGroup adds a pet to a group
func (r *MockAuthorizationRepository) AddPetToGroup(petID, groupID uuid.UUID) {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.petGroups[petID] = append(r.petGroups[petID], groupID)
}

func (r *MockAuthorizationRepository) CanUserAccessPet(ctx context.Context, userID, petID uuid.UUID) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	pets, exists := r.userPets[userID]
	if !exists {
		return false, nil
	}
	
	for _, id := range pets {
		if id == petID {
			return true, nil
		}
	}
	
	return false, nil
}

func (r *MockAuthorizationRepository) CanUserAccessGroup(ctx context.Context, userID, groupID uuid.UUID) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	groups, exists := r.userGroups[userID]
	if !exists {
		return false, nil
	}
	
	for _, id := range groups {
		if id == groupID {
			return true, nil
		}
	}
	
	return false, nil
}

func (r *MockAuthorizationRepository) IsPetInGroup(ctx context.Context, petID, groupID uuid.UUID) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	groups, exists := r.petGroups[petID]
	if !exists {
		return false, nil
	}
	
	for _, id := range groups {
		if id == groupID {
			return true, nil
		}
	}
	
	return false, nil
}

func (r *MockAuthorizationRepository) GetUserPets(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	return r.userPets[userID], nil
}

func (r *MockAuthorizationRepository) GetUserGroups(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	return r.userGroups[userID], nil
}

func (r *MockAuthorizationRepository) GetPetInfo(ctx context.Context, petID uuid.UUID) (*domain.PetInfo, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	info, exists := r.pets[petID]
	if !exists {
		return nil, fmt.Errorf("pet not found")
	}
	
	return info, nil
}

func (r *MockAuthorizationRepository) GetGroupInfo(ctx context.Context, groupID uuid.UUID) (*domain.GroupInfo, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	info, exists := r.groups[groupID]
	if !exists {
		return nil, fmt.Errorf("group not found")
	}
	
	return info, nil
}

func (r *MockAuthorizationRepository) GetUserInfo(ctx context.Context, userID uuid.UUID) (*domain.UserInfo, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	info, exists := r.users[userID]
	if !exists {
		return nil, fmt.Errorf("user not found")
	}

	return info, nil
}

// MockDailyScoreRepository provides a mock implementation of domain.DailyScoreRepository
type MockDailyScoreRepository struct {
	mu          sync.RWMutex
	dailyScores map[uuid.UUID]*domain.DailyScore
	dateIndex   map[string][]*domain.DailyScore // key: groupID_date
}

// NewMockDailyScoreRepository creates a new mock daily score repository
func NewMockDailyScoreRepository() *MockDailyScoreRepository {
	return &MockDailyScoreRepository{
		dailyScores: make(map[uuid.UUID]*domain.DailyScore),
		dateIndex:   make(map[string][]*domain.DailyScore),
	}
}

func (r *MockDailyScoreRepository) Create(ctx context.Context, dailyScore *domain.DailyScore) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.dailyScores[dailyScore.ID] = dailyScore

	// Update date index
	dateKey := fmt.Sprintf("%s_%s", dailyScore.GroupID, dailyScore.Date.Format("2006-01-02"))
	r.dateIndex[dateKey] = append(r.dateIndex[dateKey], dailyScore)

	return nil
}

func (r *MockDailyScoreRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.DailyScore, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	dailyScore, exists := r.dailyScores[id]
	if !exists {
		return nil, fmt.Errorf("daily score not found")
	}
	return dailyScore, nil
}

func (r *MockDailyScoreRepository) GetOrCreate(ctx context.Context, petID, groupID uuid.UUID, date time.Time) (*domain.DailyScore, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Look for existing score
	dateKey := fmt.Sprintf("%s_%s", groupID, date.Format("2006-01-02"))
	if scores, exists := r.dateIndex[dateKey]; exists {
		for _, score := range scores {
			if score.PetID == petID {
				return score, nil
			}
		}
	}

	// Create new score
	dailyScore, err := domain.NewDailyScore(petID, groupID, date)
	if err != nil {
		return nil, err
	}
	r.dailyScores[dailyScore.ID] = dailyScore
	r.dateIndex[dateKey] = append(r.dateIndex[dateKey], dailyScore)

	return dailyScore, nil
}

func (r *MockDailyScoreRepository) Update(ctx context.Context, dailyScore *domain.DailyScore) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.dailyScores[dailyScore.ID]; !exists {
		return fmt.Errorf("daily score not found")
	}

	r.dailyScores[dailyScore.ID] = dailyScore
	return nil
}

func (r *MockDailyScoreRepository) Find(ctx context.Context, filter *domain.DailyScoreFilter) ([]*domain.DailyScore, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var matches []*domain.DailyScore

	for _, dailyScore := range r.dailyScores {
		if r.matchesScoreFilter(dailyScore, filter) {
			matches = append(matches, dailyScore)
		}
	}

	// Sort by date descending
	sort.Slice(matches, func(i, j int) bool {
		return matches[i].Date.After(matches[j].Date)
	})

	// Apply pagination
	start := filter.Offset
	end := start + filter.Limit

	if start >= len(matches) {
		return []*domain.DailyScore{}, nil
	}

	if end > len(matches) {
		end = len(matches)
	}

	return matches[start:end], nil
}

func (r *MockDailyScoreRepository) matchesScoreFilter(dailyScore *domain.DailyScore, filter *domain.DailyScoreFilter) bool {
	if filter.PetID != nil && dailyScore.PetID != *filter.PetID {
		return false
	}

	if filter.GroupID != nil && dailyScore.GroupID != *filter.GroupID {
		return false
	}

	if filter.DateFrom != nil && dailyScore.Date.Before(*filter.DateFrom) {
		return false
	}

	if filter.DateTo != nil && dailyScore.Date.After(*filter.DateTo) {
		return false
	}

	return true
}

func (r *MockDailyScoreRepository) GetRankings(ctx context.Context, groupID uuid.UUID, date time.Time) ([]*domain.PetRanking, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	dateKey := fmt.Sprintf("%s_%s", groupID, date.Format("2006-01-02"))
	scores, exists := r.dateIndex[dateKey]
	if !exists {
		return []*domain.PetRanking{}, nil
	}

	rankings := make([]*domain.PetRanking, 0, len(scores))
	for _, score := range scores {
		ranking := domain.NewPetRanking(score.PetID, "Mock Pet", "Mock Owner")
		ranking.UpdateFromDailyScore(score)
		rankings = append(rankings, ranking)
	}

	// Sort by points descending, then by negative behaviors ascending
	sort.Slice(rankings, func(i, j int) bool {
		return rankings[i].CompareForRanking(rankings[j]) > 0
	})

	return rankings, nil
}

func (r *MockDailyScoreRepository) GetRankingsByDateRange(ctx context.Context, groupID uuid.UUID, from, to time.Time) ([]*domain.PetRanking, error) {
	// This would aggregate scores across the date range
	// For mock purposes, just return current rankings
	return r.GetRankings(ctx, groupID, from)
}

func (r *MockDailyScoreRepository) GetTopScorers(ctx context.Context, groupID uuid.UUID, date time.Time) ([]*domain.DailyScore, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	dateKey := fmt.Sprintf("%s_%s", groupID, date.Format("2006-01-02"))
	scores, exists := r.dateIndex[dateKey]
	if !exists {
		return []*domain.DailyScore{}, nil
	}

	// Sort by total points descending
	sortedScores := make([]*domain.DailyScore, len(scores))
	copy(sortedScores, scores)

	sort.Slice(sortedScores, func(i, j int) bool {
		return sortedScores[i].TotalPoints > sortedScores[j].TotalPoints
	})

	return sortedScores, nil
}

func (r *MockDailyScoreRepository) RecalculateFromLogs(ctx context.Context, petID, groupID uuid.UUID, date time.Time) (*domain.DailyScore, error) {
	// For mock purposes, just return the existing score or create a new one
	return r.GetOrCreate(ctx, petID, groupID, date)
}

func (r *MockDailyScoreRepository) Delete(ctx context.Context, id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	dailyScore, exists := r.dailyScores[id]
	if !exists {
		return fmt.Errorf("daily score not found")
	}

	delete(r.dailyScores, id)

	// Remove from date index
	dateKey := fmt.Sprintf("%s_%s", dailyScore.GroupID, dailyScore.Date.Format("2006-01-02"))
	if scores, exists := r.dateIndex[dateKey]; exists {
		filtered := make([]*domain.DailyScore, 0, len(scores)-1)
		for _, score := range scores {
			if score.ID != id {
				filtered = append(filtered, score)
			}
		}
		if len(filtered) == 0 {
			delete(r.dateIndex, dateKey)
		} else {
			r.dateIndex[dateKey] = filtered
		}
	}

	return nil
}

func (r *MockDailyScoreRepository) GetHistoricalData(ctx context.Context, petID, groupID uuid.UUID, days int) ([]*domain.DailyScore, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var historical []*domain.DailyScore
	for _, dailyScore := range r.dailyScores {
		if dailyScore.PetID == petID && dailyScore.GroupID == groupID {
			historical = append(historical, dailyScore)
		}
	}

	// Sort by date descending and limit
	sort.Slice(historical, func(i, j int) bool {
		return historical[i].Date.After(historical[j].Date)
	})

	if len(historical) > days {
		historical = historical[:days]
	}

	return historical, nil
}

// MockPetOfTheDayRepository provides a mock implementation of domain.PetOfTheDayRepository
type MockPetOfTheDayRepository struct {
	mu      sync.RWMutex
	winners map[uuid.UUID]*domain.PetOfTheDayWinner
	dateIndex map[string][]*domain.PetOfTheDayWinner // key: groupID_date
}

// NewMockPetOfTheDayRepository creates a new mock Pet of the Day repository
func NewMockPetOfTheDayRepository() *MockPetOfTheDayRepository {
	return &MockPetOfTheDayRepository{
		winners:   make(map[uuid.UUID]*domain.PetOfTheDayWinner),
		dateIndex: make(map[string][]*domain.PetOfTheDayWinner),
	}
}

func (r *MockPetOfTheDayRepository) Create(ctx context.Context, winner *domain.PetOfTheDayWinner) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.winners[winner.ID] = winner

	// Update date index
	dateKey := fmt.Sprintf("%s_%s", winner.GroupID, winner.Date.Format("2006-01-02"))
	r.dateIndex[dateKey] = append(r.dateIndex[dateKey], winner)

	return nil
}

func (r *MockPetOfTheDayRepository) GetByGroupAndDate(ctx context.Context, groupID uuid.UUID, date time.Time) ([]*domain.PetOfTheDayWinner, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	dateKey := fmt.Sprintf("%s_%s", groupID, date.Format("2006-01-02"))
	winners, exists := r.dateIndex[dateKey]
	if !exists {
		return []*domain.PetOfTheDayWinner{}, nil
	}

	return winners, nil
}

func (r *MockPetOfTheDayRepository) GetWinnerHistory(ctx context.Context, groupID uuid.UUID, from, to time.Time) ([]*domain.PetOfTheDayWinner, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var history []*domain.PetOfTheDayWinner
	for _, winner := range r.winners {
		if winner.GroupID == groupID &&
		   winner.Date.After(from.AddDate(0, 0, -1)) &&
		   winner.Date.Before(to.AddDate(0, 0, 1)) {
			history = append(history, winner)
		}
	}

	// Sort by date descending
	sort.Slice(history, func(i, j int) bool {
		return history[i].Date.After(history[j].Date)
	})

	return history, nil
}

func (r *MockPetOfTheDayRepository) GetPetWinCount(ctx context.Context, petID uuid.UUID) (int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	count := 0
	for _, winner := range r.winners {
		if winner.PetID == petID {
			count++
		}
	}

	return count, nil
}

func (r *MockPetOfTheDayRepository) GetGroupStats(ctx context.Context, groupID uuid.UUID) (*domain.GroupPetOfTheDayStats, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	stats := &domain.GroupPetOfTheDayStats{
		GroupID:       groupID,
		TotalWins:     0,
		UniquePets:    0,
		MostWins:      0,
		MostWinsPetID: nil,
		AverageScore:  0.0,
		LastWinDate:   nil,
	}

	petWins := make(map[uuid.UUID]int)
	totalScore := 0
	var latestDate *time.Time

	for _, winner := range r.winners {
		if winner.GroupID == groupID {
			stats.TotalWins++
			petWins[winner.PetID]++
			totalScore += winner.FinalScore

			if latestDate == nil || winner.Date.After(*latestDate) {
				latestDate = &winner.Date
			}
		}
	}

	stats.UniquePets = len(petWins)
	stats.LastWinDate = latestDate

	if stats.TotalWins > 0 {
		stats.AverageScore = float64(totalScore) / float64(stats.TotalWins)
	}

	// Find pet with most wins
	for petID, wins := range petWins {
		if wins > stats.MostWins {
			stats.MostWins = wins
			stats.MostWinsPetID = &petID
		}
	}

	return stats, nil
}

func (r *MockPetOfTheDayRepository) DeleteByGroupAndDate(ctx context.Context, groupID uuid.UUID, date time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	dateKey := fmt.Sprintf("%s_%s", groupID, date.Format("2006-01-02"))
	winners, exists := r.dateIndex[dateKey]
	if !exists {
		return nil
	}

	// Delete from main map
	for _, winner := range winners {
		delete(r.winners, winner.ID)
	}

	// Delete from date index
	delete(r.dateIndex, dateKey)

	return nil
}

func (r *MockPetOfTheDayRepository) GetLatestWinners(ctx context.Context, limit int) ([]*domain.PetOfTheDayWinner, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var allWinners []*domain.PetOfTheDayWinner
	for _, winner := range r.winners {
		allWinners = append(allWinners, winner)
	}

	// Sort by date descending
	sort.Slice(allWinners, func(i, j int) bool {
		return allWinners[i].Date.After(allWinners[j].Date)
	})

	if len(allWinners) > limit {
		allWinners = allWinners[:limit]
	}

	return allWinners, nil
}

// MockUserSettingsRepository provides a mock implementation of domain.UserSettingsRepository
type MockUserSettingsRepository struct {
	mu       sync.RWMutex
	settings map[uuid.UUID]*domain.UserTimezoneSettings
}

// NewMockUserSettingsRepository creates a new mock user settings repository
func NewMockUserSettingsRepository() *MockUserSettingsRepository {
	return &MockUserSettingsRepository{
		settings: make(map[uuid.UUID]*domain.UserTimezoneSettings),
	}
}

func (r *MockUserSettingsRepository) GetUserTimezone(ctx context.Context, userID uuid.UUID) (*domain.UserTimezoneSettings, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	settings, exists := r.settings[userID]
	if !exists {
		// Return default settings if not found
		return domain.NewUserTimezoneSettings(userID), nil
	}

	return settings, nil
}

func (r *MockUserSettingsRepository) UpdateUserTimezone(ctx context.Context, userID uuid.UUID, settings *domain.UserTimezoneSettings) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if err := settings.Validate(); err != nil {
		return err
	}

	settings.UpdatedAt = time.Now()
	r.settings[userID] = settings

	return nil
}
