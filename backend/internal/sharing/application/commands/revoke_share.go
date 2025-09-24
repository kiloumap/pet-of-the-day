package commands

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"pet-of-the-day/internal/sharing/domain"
	"pet-of-the-day/internal/shared/events"
)

// ShareRevokedEvent represents a domain event when a share is revoked
type ShareRevokedEvent struct {
	events.BaseEvent
	Share     *domain.Share `json:"share"`
	RevokedBy uuid.UUID     `json:"revoked_by"`
	Reason    string        `json:"reason"`
}

// RevokeShareCommand represents the command to revoke a share
type RevokeShareCommand struct {
	ShareID     uuid.UUID `json:"share_id"`
	RequestorID uuid.UUID `json:"requestor_id"`
	Reason      string    `json:"reason,omitempty"`
}

// RevokeShareResult represents the result of revoking a share
type RevokeShareResult struct {
	Success bool `json:"success"`
}

// RevokeShareHandler handles revoking shares
type RevokeShareHandler struct {
	shareRepo domain.ShareRepository
	eventBus  events.EventBus
}

// NewRevokeShareHandler creates a new handler
func NewRevokeShareHandler(
	shareRepo domain.ShareRepository,
	eventBus events.EventBus,
) *RevokeShareHandler {
	return &RevokeShareHandler{
		shareRepo: shareRepo,
		eventBus:  eventBus,
	}
}

// Handle processes the revoke share command
func (h *RevokeShareHandler) Handle(ctx context.Context, cmd *RevokeShareCommand) (*RevokeShareResult, error) {
	// Validate the command
	if err := h.validateCommand(cmd); err != nil {
		return nil, err
	}

	// Find the share
	share, err := h.shareRepo.FindByID(ctx, cmd.ShareID)
	if err != nil {
		return nil, err
	}

	// Verify requestor has permission to revoke the share
	// Either the owner or the recipient can revoke
	if share.OwnerID() != cmd.RequestorID && share.SharedWith() != cmd.RequestorID {
		return nil, errors.New("only the resource owner or recipient can revoke shares")
	}

	// Check if already revoked
	if share.Status() == domain.ShareStatusRevoked {
		return &RevokeShareResult{Success: true}, nil // Already revoked
	}

	// Revoke the share
	if err := share.Revoke(); err != nil {
		return nil, err
	}

	// Save the updated share
	if err := h.shareRepo.Save(ctx, share); err != nil {
		return nil, err
	}

	// Publish domain event
	event := ShareRevokedEvent{
		BaseEvent: events.NewBaseEvent("ShareRevoked", share.ResourceID()),
		Share:     share,
		RevokedBy: cmd.RequestorID,
		Reason:    cmd.Reason,
	}

	if err := h.eventBus.Publish(ctx, event); err != nil {
		// Log error but don't fail the operation
	}

	return &RevokeShareResult{Success: true}, nil
}

// validateCommand validates the revoke share command
func (h *RevokeShareHandler) validateCommand(cmd *RevokeShareCommand) error {
	if cmd.ShareID == uuid.Nil {
		return errors.New("share_id is required")
	}

	if cmd.RequestorID == uuid.Nil {
		return errors.New("requestor_id is required")
	}

	return nil
}