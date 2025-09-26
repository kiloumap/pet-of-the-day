package services

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/points/domain"
)

// RankingService handles ranking calculations and Pet of the Day selection
type RankingService struct {
	dailyScoreRepo      domain.DailyScoreRepository
	petOfTheDayRepo     domain.PetOfTheDayRepository
	authRepo            domain.AuthorizationRepository
	userSettingsRepo    domain.UserSettingsRepository
}

// NewRankingService creates a new ranking service
func NewRankingService(
	dailyScoreRepo domain.DailyScoreRepository,
	petOfTheDayRepo domain.PetOfTheDayRepository,
	authRepo domain.AuthorizationRepository,
	userSettingsRepo domain.UserSettingsRepository,
) *RankingService {
	return &RankingService{
		dailyScoreRepo:   dailyScoreRepo,
		petOfTheDayRepo:  petOfTheDayRepo,
		authRepo:         authRepo,
		userSettingsRepo: userSettingsRepo,
	}
}

// CalculateGroupRankings calculates and returns current rankings for a group
func (s *RankingService) CalculateGroupRankings(ctx context.Context, groupID uuid.UUID, date time.Time) ([]*domain.PetRanking, error) {
	// Get all daily scores for the group on the specified date
	topScorers, err := s.dailyScoreRepo.GetTopScorers(ctx, groupID, date)
	if err != nil {
		return nil, fmt.Errorf("failed to get top scorers: %w", err)
	}

	// Convert to PetRanking objects with additional information
	rankings := make([]*domain.PetRanking, 0, len(topScorers))

	for _, dailyScore := range topScorers {
		// Get pet info
		petInfo, err := s.authRepo.GetPetInfo(ctx, dailyScore.PetID)
		if err != nil {
			continue // Skip pets we can't get info for
		}

		// Get owner info
		ownerInfo, err := s.authRepo.GetUserInfo(ctx, petInfo.OwnerID)
		if err != nil {
			continue // Skip pets whose owner info we can't get
		}

		ranking := domain.NewPetRanking(dailyScore.PetID, petInfo.Name, ownerInfo.Name)
		ranking.UpdateFromDailyScore(dailyScore)

		rankings = append(rankings, ranking)
	}

	// Sort rankings by total points (desc) then by negative behaviors (asc)
	sort.Slice(rankings, func(i, j int) bool {
		return rankings[i].CompareForRanking(rankings[j]) > 0
	})

	// Assign ranks with tie handling
	return s.assignRanks(rankings), nil
}

// SelectPetOfTheDay selects the Pet of the Day winner(s) for a group on a specific date
func (s *RankingService) SelectPetOfTheDay(ctx context.Context, groupID uuid.UUID, date time.Time) ([]*domain.PetOfTheDayWinner, error) {
	// Get rankings for the date
	rankings, err := s.CalculateGroupRankings(ctx, groupID, date)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate rankings: %w", err)
	}

	// Find winners (rank 1 with positive scores)
	winners := make([]*domain.PetOfTheDayWinner, 0)

	for _, ranking := range rankings {
		// Only pets with rank 1 and positive scores can win
		if ranking.Rank == 1 && ranking.TotalPoints > 0 {
			// Get owner info
			petInfo, err := s.authRepo.GetPetInfo(ctx, ranking.PetID)
			if err != nil {
				continue
			}

			ownerInfo, err := s.authRepo.GetUserInfo(ctx, petInfo.OwnerID)
			if err != nil {
				continue
			}

			winner := domain.NewPetOfTheDayWinner(
				groupID,
				ranking.PetID,
				ranking.PetName,
				ownerInfo.Name,
				date,
				ranking.TotalPoints,
				ranking.PositiveBehaviors,
				ranking.NegativeBehaviors,
			)

			winners = append(winners, winner)
		}
	}

	// Clear existing winners for this date (in case of recalculation)
	if err := s.petOfTheDayRepo.DeleteByGroupAndDate(ctx, groupID, date); err != nil {
		return nil, fmt.Errorf("failed to clear existing winners: %w", err)
	}

	// Save new winners
	for _, winner := range winners {
		if err := s.petOfTheDayRepo.Create(ctx, winner); err != nil {
			return nil, fmt.Errorf("failed to save winner: %w", err)
		}
	}

	return winners, nil
}

// RecalculateDailyScores recalculates daily scores for a specific pet and group on a date
func (s *RankingService) RecalculateDailyScores(ctx context.Context, petID, groupID uuid.UUID, date time.Time) (*domain.DailyScore, error) {
	// Use repository's recalculation method
	recalculatedScore, err := s.dailyScoreRepo.RecalculateFromLogs(ctx, petID, groupID, date)
	if err != nil {
		return nil, fmt.Errorf("failed to recalculate daily scores: %w", err)
	}

	return recalculatedScore, nil
}

// GetPetOfTheDayWinners retrieves Pet of the Day winners for a group on a specific date
func (s *RankingService) GetPetOfTheDayWinners(ctx context.Context, groupID uuid.UUID, date time.Time) ([]*domain.PetOfTheDayWinner, error) {
	winners, err := s.petOfTheDayRepo.GetByGroupAndDate(ctx, groupID, date)
	if err != nil {
		return nil, fmt.Errorf("failed to get Pet of the Day winners: %w", err)
	}

	return winners, nil
}

// GetPetOfTheDayHistory retrieves Pet of the Day winner history for a group
func (s *RankingService) GetPetOfTheDayHistory(ctx context.Context, groupID uuid.UUID, from, to time.Time) ([]*domain.PetOfTheDayWinner, error) {
	history, err := s.petOfTheDayRepo.GetWinnerHistory(ctx, groupID, from, to)
	if err != nil {
		return nil, fmt.Errorf("failed to get Pet of the Day history: %w", err)
	}

	return history, nil
}

// GetGroupStats retrieves statistics about Pet of the Day winners for a group
func (s *RankingService) GetGroupStats(ctx context.Context, groupID uuid.UUID) (*domain.GroupPetOfTheDayStats, error) {
	stats, err := s.petOfTheDayRepo.GetGroupStats(ctx, groupID)
	if err != nil {
		return nil, fmt.Errorf("failed to get group stats: %w", err)
	}

	return stats, nil
}

// ScheduleDailyReset schedules Pet of the Day selection for all groups at their reset times
func (s *RankingService) ScheduleDailyReset(ctx context.Context) error {
	// This would typically be called by a cron job or scheduler
	// For now, it's a placeholder for the daily reset functionality
	
	// In a real implementation, this would:
	// 1. Get all groups
	// 2. For each group, get the owner's timezone and reset time
	// 3. Check if reset time has passed for today
	// 4. If so, calculate Pet of the Day for yesterday and save results
	// 5. Reset daily scores for new day
	
	return fmt.Errorf("daily reset scheduling not yet implemented")
}

// assignRanks assigns rank positions to rankings with proper tie handling
func (s *RankingService) assignRanks(rankings []*domain.PetRanking) []*domain.PetRanking {
	if len(rankings) == 0 {
		return rankings
	}

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
				// Mark previous as tied if not already marked
				if !prevRanking.IsTied {
					prevRanking.SetRank(currentRank, true)
				}
			} else {
				// Not tied - increment rank by number of tied positions
				currentRank = i + 1
				ranking.SetRank(currentRank, false)
			}
		}
	}

	return rankings
}

// ValidateRankingConsistency validates that rankings are mathematically consistent
func (s *RankingService) ValidateRankingConsistency(rankings []*domain.PetRanking) error {
	if len(rankings) == 0 {
		return nil
	}

	// Check that rankings are sorted correctly
	for i := 1; i < len(rankings); i++ {
		current := rankings[i]
		previous := rankings[i-1]

		// Current should not rank higher than previous
		if current.CompareForRanking(previous) > 0 {
			return fmt.Errorf("ranking inconsistency: pet %s should rank higher than pet %s",
				current.PetID, previous.PetID)
		}

		// Rank numbers should be consistent
		if current.Rank < previous.Rank {
			return fmt.Errorf("rank number inconsistency: pet %s has rank %d but follows pet with rank %d",
				current.PetID, current.Rank, previous.Rank)
		}
	}

	return nil
}

// GetTrendingPets identifies pets with significant point changes over time
func (s *RankingService) GetTrendingPets(ctx context.Context, groupID uuid.UUID, days int) ([]*domain.PetRanking, error) {
	// This is a placeholder for trending analysis
	// Would compare recent performance to historical averages
	return nil, fmt.Errorf("trending pets analysis not yet implemented")
}
