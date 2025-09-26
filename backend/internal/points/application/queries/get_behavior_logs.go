package queries

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/points/domain"
)

// GetBehaviorLogsQuery represents a query to get behavior logs
type GetBehaviorLogsQuery struct {
	PetID      *uuid.UUID `json:"pet_id,omitempty"`
	BehaviorID *uuid.UUID `json:"behavior_id,omitempty"`
	GroupID    *uuid.UUID `json:"group_id,omitempty"`
	DateFrom   *string    `json:"date_from,omitempty"`
	DateTo     *string    `json:"date_to,omitempty"`
	Limit      int        `json:"limit"`
	Offset     int        `json:"offset"`
	UserID     uuid.UUID  `json:"user_id" validate:"required"`
}

// GetBehaviorLogsResult represents the result of getting behavior logs
type GetBehaviorLogsResult struct {
	BehaviorLogs []*domain.BehaviorLog `json:"behavior_logs"`
	Total        int                   `json:"total"`
}

// GetBehaviorLogsHandler handles queries for getting behavior logs
type GetBehaviorLogsHandler struct {
	behaviorLogRepo domain.BehaviorLogRepository
	authRepo        domain.AuthorizationRepository
}

// NewGetBehaviorLogsHandler creates a new get behavior logs handler
func NewGetBehaviorLogsHandler(
	behaviorLogRepo domain.BehaviorLogRepository,
	authRepo domain.AuthorizationRepository,
) *GetBehaviorLogsHandler {
	return &GetBehaviorLogsHandler{
		behaviorLogRepo: behaviorLogRepo,
		authRepo:        authRepo,
	}
}

// Handle processes the get behavior logs query
func (h *GetBehaviorLogsHandler) Handle(ctx context.Context, query *GetBehaviorLogsQuery) (*GetBehaviorLogsResult, error) {
	if query.Limit <= 0 {
		query.Limit = 50
	}
	if query.Limit > 100 {
		query.Limit = 100
	}

	// Create filter
	filter := domain.NewBehaviorLogFilter()
	filter.PetID = query.PetID
	filter.BehaviorID = query.BehaviorID
	filter.GroupID = query.GroupID
	filter.Limit = query.Limit
	filter.Offset = query.Offset

	// Parse date filters if provided
	if query.DateFrom != nil {
		dateFrom, err := time.Parse("2006-01-02", *query.DateFrom)
		if err != nil {
			return nil, fmt.Errorf("invalid date_from format: %w", err)
		}
		filter.DateFrom = &dateFrom
	}

	if query.DateTo != nil {
		dateTo, err := time.Parse("2006-01-02", *query.DateTo)
		if err != nil {
			return nil, fmt.Errorf("invalid date_to format: %w", err)
		}
		filter.DateTo = &dateTo
	}

	// Authorization: User must have access to requested resources
	if query.PetID != nil {
		canAccess, err := h.authRepo.CanUserAccessPet(ctx, query.UserID, *query.PetID)
		if err != nil {
			return nil, fmt.Errorf("failed to check pet access: %w", err)
		}
		if !canAccess {
			return nil, fmt.Errorf("user does not have access to specified pet")
		}
	}

	if query.GroupID != nil {
		canAccess, err := h.authRepo.CanUserAccessGroup(ctx, query.UserID, *query.GroupID)
		if err != nil {
			return nil, fmt.Errorf("failed to check group access: %w", err)
		}
		if !canAccess {
			return nil, fmt.Errorf("user does not have access to specified group")
		}
	}

	// Get behavior logs
	behaviorLogs, err := h.behaviorLogRepo.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to get behavior logs: %w", err)
	}

	return &GetBehaviorLogsResult{
		BehaviorLogs: behaviorLogs,
		Total:        len(behaviorLogs),
	}, nil
}