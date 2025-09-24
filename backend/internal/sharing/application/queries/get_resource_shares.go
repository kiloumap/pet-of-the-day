package queries

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"pet-of-the-day/internal/sharing/domain"
)

// GetResourceSharesQuery represents the query to get shares for a resource
type GetResourceSharesQuery struct {
	ResourceID  uuid.UUID `json:"resource_id"`
	RequestorID uuid.UUID `json:"requestor_id"`
	ActiveOnly  bool      `json:"active_only"`
}

// GetResourceSharesResult represents the result of getting resource shares
type GetResourceSharesResult struct {
	Shares []*domain.Share `json:"shares"`
}

// GetResourceSharesHandler handles getting shares for a resource
type GetResourceSharesHandler struct {
	shareRepo   domain.ShareRepository
	resourceSvc domain.ResourceService
}

// NewGetResourceSharesHandler creates a new handler
func NewGetResourceSharesHandler(
	shareRepo domain.ShareRepository,
	resourceSvc domain.ResourceService,
) *GetResourceSharesHandler {
	return &GetResourceSharesHandler{
		shareRepo:   shareRepo,
		resourceSvc: resourceSvc,
	}
}

// Handle processes the get resource shares query
func (h *GetResourceSharesHandler) Handle(ctx context.Context, query *GetResourceSharesQuery) (*GetResourceSharesResult, error) {
	// Validate the query
	if err := h.validateQuery(query); err != nil {
		return nil, err
	}

	// Verify requestor has permission to view shares for this resource
	// This would typically be the resource owner or someone with admin access
	ownerID, err := h.resourceSvc.GetResourceOwner(ctx, query.ResourceID, "")
	if err != nil {
		return nil, err
	}

	if ownerID != query.RequestorID {
		// Check if requestor has a share with admin permission
		share, err := h.shareRepo.FindActiveByResourceAndUser(ctx, query.ResourceID, query.RequestorID)
		if err != nil || share == nil || !share.CanAccess(domain.SharePermissionAdmin) {
			return nil, errors.New("insufficient permissions to view resource shares")
		}
	}

	// Get shares for the resource
	var shares []*domain.Share

	if query.ActiveOnly {
		shares, err = h.shareRepo.FindActiveByResourceID(ctx, query.ResourceID)
	} else {
		shares, err = h.shareRepo.FindByResourceID(ctx, query.ResourceID)
	}

	if err != nil {
		return nil, err
	}

	return &GetResourceSharesResult{
		Shares: shares,
	}, nil
}

// validateQuery validates the get resource shares query
func (h *GetResourceSharesHandler) validateQuery(query *GetResourceSharesQuery) error {
	if query.ResourceID == uuid.Nil {
		return errors.New("resource_id is required")
	}

	if query.RequestorID == uuid.Nil {
		return errors.New("requestor_id is required")
	}

	return nil
}