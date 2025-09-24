package commands

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/sharing/domain"
	"pet-of-the-day/internal/shared/events"
)

// ShareUpdatedEvent represents a domain event when a share is updated
type ShareUpdatedEvent struct {
	events.BaseEvent
	Share   *domain.Share `json:"share"`
	Changes []string      `json:"changes"`
}

// UpdateShareCommand represents the command to update a share
type UpdateShareCommand struct {
	ShareID     uuid.UUID               `json:"share_id"`
	RequestorID uuid.UUID               `json:"requestor_id"`
	Permission  *domain.SharePermission `json:"permission,omitempty"`
	ExpiresAt   *time.Time              `json:"expires_at,omitempty"`
}

// UpdateShareResult represents the result of updating a share
type UpdateShareResult struct {
	Share *domain.Share `json:"share"`
}

// UpdateShareHandler handles updating shares
type UpdateShareHandler struct {
	shareRepo   domain.ShareRepository
	eventBus    events.EventBus
}

// NewUpdateShareHandler creates a new handler
func NewUpdateShareHandler(
	shareRepo domain.ShareRepository,
	eventBus events.EventBus,
) *UpdateShareHandler {
	return &UpdateShareHandler{
		shareRepo: shareRepo,
		eventBus:  eventBus,
	}
}

// Handle processes the update share command
func (h *UpdateShareHandler) Handle(ctx context.Context, cmd *UpdateShareCommand) (*UpdateShareResult, error) {
	// Validate the command
	if err := h.validateCommand(cmd); err != nil {
		return nil, err
	}

	// Find the share
	share, err := h.shareRepo.FindByID(ctx, cmd.ShareID)
	if err != nil {
		return nil, err
	}

	// Verify requestor has permission to update the share
	if share.OwnerID() != cmd.RequestorID {
		return nil, errors.New("only the resource owner can update shares")
	}

	// Track what changed for events
	var changes []string

	// Update permission if provided
	if cmd.Permission != nil && *cmd.Permission != share.Permission() {
		if err := share.UpdatePermission(*cmd.Permission); err != nil {
			return nil, err
		}
		changes = append(changes, "permission")
	}

	// Update expiration if provided
	if cmd.ExpiresAt != nil {
		if err := share.SetExpiration(*cmd.ExpiresAt); err != nil {
			return nil, err
		}
		changes = append(changes, "expiration")
	}

	// Save the updated share
	if err := h.shareRepo.Save(ctx, share); err != nil {
		return nil, err
	}

	// Publish domain event if anything changed
	if len(changes) > 0 {
		event := ShareUpdatedEvent{
			BaseEvent: events.NewBaseEvent("ShareUpdated", share.ResourceID()),
			Share:     share,
			Changes:   changes,
		}

		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the operation
		}
	}

	return &UpdateShareResult{Share: share}, nil
}

// validateCommand validates the update share command
func (h *UpdateShareHandler) validateCommand(cmd *UpdateShareCommand) error {
	if cmd.ShareID == uuid.Nil {
		return errors.New("share_id is required")
	}

	if cmd.RequestorID == uuid.Nil {
		return errors.New("requestor_id is required")
	}

	// At least one field must be provided for update
	if cmd.Permission == nil && cmd.ExpiresAt == nil {
		return errors.New("at least one field must be provided for update")
	}

	// Validate permission if provided
	if cmd.Permission != nil {
		switch *cmd.Permission {
		case domain.SharePermissionRead, domain.SharePermissionReadWrite, domain.SharePermissionAdmin:
			// Valid permissions
		default:
			return domain.ErrInvalidPermission
		}
	}

	// Validate expiration if provided
	if cmd.ExpiresAt != nil && cmd.ExpiresAt.Before(time.Now()) {
		return errors.New("expiration date cannot be in the past")
	}

	return nil
}