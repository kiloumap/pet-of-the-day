package commands

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/sharing/domain"
	"pet-of-the-day/internal/shared/events"
)

// ShareCreatedEvent represents a domain event when a share is created
type ShareCreatedEvent struct {
	events.BaseEvent
	Share *domain.Share `json:"share"`
}

// CreateShareCommand represents the command to create a new share
type CreateShareCommand struct {
	ResourceID   uuid.UUID               `json:"resource_id"`
	ResourceType string                  `json:"resource_type"`
	OwnerID      uuid.UUID               `json:"owner_id"`
	SharedWithID uuid.UUID               `json:"shared_with_id"`
	Permission   domain.SharePermission  `json:"permission"`
	ExpiresAt    *time.Time              `json:"expires_at,omitempty"`
}

// CreateShareResult represents the result of creating a share
type CreateShareResult struct {
	Share *domain.Share `json:"share"`
}

// CreateShareHandler handles creating shares
type CreateShareHandler struct {
	shareRepo     domain.ShareRepository
	resourceSvc   domain.ResourceService
	eventBus      events.EventBus
}

// NewCreateShareHandler creates a new handler
func NewCreateShareHandler(
	shareRepo domain.ShareRepository,
	resourceSvc domain.ResourceService,
	eventBus events.EventBus,
) *CreateShareHandler {
	return &CreateShareHandler{
		shareRepo:   shareRepo,
		resourceSvc: resourceSvc,
		eventBus:    eventBus,
	}
}

// Handle processes the create share command
func (h *CreateShareHandler) Handle(ctx context.Context, cmd *CreateShareCommand) (*CreateShareResult, error) {
	// Validate the command
	if err := h.validateCommand(cmd); err != nil {
		return nil, err
	}

	// Verify resource exists and requestor owns it
	exists, err := h.resourceSvc.ValidateResourceExists(ctx, cmd.ResourceID, cmd.ResourceType)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("resource not found")
	}

	isOwner, err := h.resourceSvc.ValidateResourceOwnership(ctx, cmd.ResourceID, cmd.ResourceType, cmd.OwnerID)
	if err != nil {
		return nil, err
	}
	if !isOwner {
		return nil, errors.New("only resource owner can create shares")
	}

	// Check if share already exists
	existingShare, err := h.shareRepo.FindByResourceAndUser(ctx, cmd.ResourceID, cmd.SharedWithID)
	if err == nil && existingShare != nil && existingShare.IsActive() {
		return nil, errors.New("resource is already shared with this user")
	}

	// Create the share
	share, err := domain.NewShare(
		cmd.ResourceID,
		cmd.ResourceType,
		cmd.OwnerID,
		cmd.SharedWithID,
		cmd.Permission,
	)
	if err != nil {
		return nil, err
	}

	// Set expiration if provided
	if cmd.ExpiresAt != nil {
		if err := share.SetExpiration(*cmd.ExpiresAt); err != nil {
			return nil, err
		}
	}

	// Save the share
	if err := h.shareRepo.Save(ctx, share); err != nil {
		return nil, err
	}

	// Publish domain event
	event := ShareCreatedEvent{
		BaseEvent: events.NewBaseEvent("ShareCreated", share.ResourceID()),
		Share:     share,
	}

	if err := h.eventBus.Publish(ctx, event); err != nil {
		// Log error but don't fail the operation
		// In a real implementation, you might want to use a more sophisticated error handling strategy
	}

	return &CreateShareResult{Share: share}, nil
}

// validateCommand validates the create share command
func (h *CreateShareHandler) validateCommand(cmd *CreateShareCommand) error {
	if cmd.ResourceID == uuid.Nil {
		return errors.New("resource_id is required")
	}

	if cmd.ResourceType == "" {
		return errors.New("resource_type is required")
	}

	if cmd.OwnerID == uuid.Nil {
		return errors.New("owner_id is required")
	}

	if cmd.SharedWithID == uuid.Nil {
		return errors.New("shared_with_id is required")
	}

	if cmd.OwnerID == cmd.SharedWithID {
		return errors.New("cannot share resource with yourself")
	}

	if cmd.Permission == "" {
		return errors.New("permission is required")
	}

	// Validate permission
	switch cmd.Permission {
	case domain.SharePermissionRead, domain.SharePermissionReadWrite, domain.SharePermissionAdmin:
		// Valid permissions
	default:
		return domain.ErrInvalidPermission
	}

	return nil
}