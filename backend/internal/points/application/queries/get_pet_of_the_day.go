package queries

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/points/application/services"
	"pet-of-the-day/internal/points/domain"
)

// GetPetOfTheDayQuery represents a query to get Pet of the Day winner
type GetPetOfTheDayQuery struct {
	GroupID uuid.UUID `json:"group_id" validate:"required"`
	Date    time.Time `json:"date"`
	UserID  uuid.UUID `json:"user_id" validate:"required"`
}

// GetPetOfTheDayResult represents the result of getting Pet of the Day winner
type GetPetOfTheDayResult struct {
	Winner  *domain.PetOfTheDayWinner `json:"winner"`
	GroupID uuid.UUID                 `json:"group_id"`
	Date    time.Time                 `json:"date"`
}

// GetPetOfTheDayHandler handles queries for getting Pet of the Day winner
type GetPetOfTheDayHandler struct {
	rankingService *services.RankingService
	authRepo       domain.AuthorizationRepository
}

// NewGetPetOfTheDayHandler creates a new get Pet of the Day handler
func NewGetPetOfTheDayHandler(
	rankingService *services.RankingService,
	authRepo domain.AuthorizationRepository,
) *GetPetOfTheDayHandler {
	return &GetPetOfTheDayHandler{
		rankingService: rankingService,
		authRepo:       authRepo,
	}
}

// Handle processes the get Pet of the Day query
func (h *GetPetOfTheDayHandler) Handle(ctx context.Context, query *GetPetOfTheDayQuery) (*GetPetOfTheDayResult, error) {
	// Authorization: Check if user has access to the group
	canAccess, err := h.authRepo.CanUserAccessGroup(ctx, query.UserID, query.GroupID)
	if err != nil {
		return nil, fmt.Errorf("failed to check group access: %w", err)
	}
	if !canAccess {
		return nil, fmt.Errorf("user does not have access to specified group")
	}

	// Get Pet of the Day winners for the date
	winners, err := h.rankingService.GetPetOfTheDayWinners(ctx, query.GroupID, query.Date)
	if err != nil {
		return nil, fmt.Errorf("failed to get Pet of the Day winners: %w", err)
	}

	// Return the first winner (there could be ties, but UI typically shows one)
	var winner *domain.PetOfTheDayWinner
	if len(winners) > 0 {
		winner = winners[0]
	}

	return &GetPetOfTheDayResult{
		Winner:  winner,
		GroupID: query.GroupID,
		Date:    query.Date,
	}, nil
}