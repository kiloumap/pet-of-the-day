package queries

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"pet-of-the-day/internal/sharing/domain"
)

// GetUserSharesQuery represents the query to get shares for a user
type GetUserSharesQuery struct {
	UserID     uuid.UUID `json:"user_id"`
	ActiveOnly bool      `json:"active_only"`
	Page       int       `json:"page"`
	PageSize   int       `json:"page_size"`
}

// GetUserSharesResult represents the result of getting user shares
type GetUserSharesResult struct {
	Shares     []*domain.Share `json:"shares"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
	TotalPages int             `json:"total_pages"`
}

// GetUserSharesHandler handles getting shares for a user
type GetUserSharesHandler struct {
	shareRepo domain.ShareRepository
}

// NewGetUserSharesHandler creates a new handler
func NewGetUserSharesHandler(shareRepo domain.ShareRepository) *GetUserSharesHandler {
	return &GetUserSharesHandler{
		shareRepo: shareRepo,
	}
}

// Handle processes the get user shares query
func (h *GetUserSharesHandler) Handle(ctx context.Context, query *GetUserSharesQuery) (*GetUserSharesResult, error) {
	// Validate the query
	if err := h.validateQuery(query); err != nil {
		return nil, err
	}

	// Set defaults
	if query.Page == 0 {
		query.Page = 1
	}
	if query.PageSize == 0 {
		query.PageSize = 20
	}

	// Calculate offset
	offset := (query.Page - 1) * query.PageSize

	// Get shares based on active filter
	var shares []*domain.Share
	var err error

	if query.ActiveOnly {
		shares, err = h.shareRepo.FindActiveByUserID(ctx, query.UserID, query.PageSize, offset)
	} else {
		shares, err = h.shareRepo.FindByUserID(ctx, query.UserID, query.PageSize, offset)
	}

	if err != nil {
		return nil, err
	}

	// For simplicity, we'll estimate total based on the current page
	// In a real implementation, you might want a separate count query
	total := len(shares)
	if len(shares) == query.PageSize {
		// Estimate that there might be more pages
		total = query.Page * query.PageSize + 1
	} else {
		// This is the last page
		total = (query.Page-1)*query.PageSize + len(shares)
	}

	totalPages := (total + query.PageSize - 1) / query.PageSize

	return &GetUserSharesResult{
		Shares:     shares,
		Total:      total,
		Page:       query.Page,
		PageSize:   query.PageSize,
		TotalPages: totalPages,
	}, nil
}

// validateQuery validates the get user shares query
func (h *GetUserSharesHandler) validateQuery(query *GetUserSharesQuery) error {
	if query.UserID == uuid.Nil {
		return errors.New("user_id is required")
	}

	if query.Page < 0 {
		return errors.New("page must be greater than or equal to 0")
	}

	if query.PageSize < 0 || query.PageSize > 100 {
		return errors.New("page_size must be between 0 and 100")
	}

	return nil
}