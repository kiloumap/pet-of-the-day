package queries

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"pet-of-the-day/internal/sharing/domain"
)

// CheckAccessQuery represents the query to check access to a resource
type CheckAccessQuery struct {
	ResourceID         uuid.UUID               `json:"resource_id"`
	ResourceType       string                  `json:"resource_type"`
	UserID             uuid.UUID               `json:"user_id"`
	RequiredPermission domain.SharePermission `json:"required_permission"`
}

// CheckAccessResult represents the result of checking access
type CheckAccessResult struct {
	HasAccess           bool                    `json:"has_access"`
	IsOwner             bool                    `json:"is_owner"`
	EffectivePermission domain.SharePermission `json:"effective_permission,omitempty"`
	ShareID             uuid.UUID               `json:"share_id,omitempty"`
	GrantedBy           uuid.UUID               `json:"granted_by,omitempty"`
}

// CheckAccessHandler handles checking access to resources
type CheckAccessHandler struct {
	shareRepo   domain.ShareRepository
	resourceSvc domain.ResourceService
}

// NewCheckAccessHandler creates a new handler
func NewCheckAccessHandler(
	shareRepo domain.ShareRepository,
	resourceSvc domain.ResourceService,
) *CheckAccessHandler {
	return &CheckAccessHandler{
		shareRepo:   shareRepo,
		resourceSvc: resourceSvc,
	}
}

// Handle processes the check access query
func (h *CheckAccessHandler) Handle(ctx context.Context, query *CheckAccessQuery) (*CheckAccessResult, error) {
	// Validate the query
	if err := h.validateQuery(query); err != nil {
		return nil, err
	}

	// First check if user is the owner
	isOwner, err := h.resourceSvc.ValidateResourceOwnership(ctx, query.ResourceID, query.ResourceType, query.UserID)
	if err != nil {
		return nil, err
	}

	if isOwner {
		// Owner has all permissions
		return &CheckAccessResult{
			HasAccess:           true,
			IsOwner:             true,
			EffectivePermission: domain.SharePermissionAdmin,
		}, nil
	}

	// Check if user has access through sharing
	share, err := h.shareRepo.FindActiveByResourceAndUser(ctx, query.ResourceID, query.UserID)
	if err != nil {
		// No share found or error occurred
		return &CheckAccessResult{
			HasAccess: false,
			IsOwner:   false,
		}, nil
	}

	if share == nil {
		// No active share found
		return &CheckAccessResult{
			HasAccess: false,
			IsOwner:   false,
		}, nil
	}

	// Check if the share provides sufficient permission
	hasAccess := share.CanAccess(query.RequiredPermission)

	return &CheckAccessResult{
		HasAccess:           hasAccess,
		IsOwner:             false,
		EffectivePermission: share.Permission(),
		ShareID:             share.ID(),
		GrantedBy:           share.OwnerID(),
	}, nil
}

// validateQuery validates the check access query
func (h *CheckAccessHandler) validateQuery(query *CheckAccessQuery) error {
	if query.ResourceID == uuid.Nil {
		return errors.New("resource_id is required")
	}

	if query.ResourceType == "" {
		return errors.New("resource_type is required")
	}

	if query.UserID == uuid.Nil {
		return errors.New("user_id is required")
	}

	// Validate required permission
	switch query.RequiredPermission {
	case domain.SharePermissionRead, domain.SharePermissionReadWrite, domain.SharePermissionAdmin:
		// Valid permissions
	default:
		return domain.ErrInvalidPermission
	}

	return nil
}