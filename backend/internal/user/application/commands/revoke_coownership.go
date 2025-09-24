package commands

import (
	"context"
	"log"

	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

// RevokeCoOwnershipCommand represents the command to revoke co-ownership of a pet
type RevokeCoOwnershipCommand struct {
	RequestID uuid.UUID `json:"request_id"`
	UserID    uuid.UUID `json:"user_id"` // The user performing the revocation (owner or co-owner)
}

// RevokeCoOwnershipResult represents the result of revoking co-ownership
type RevokeCoOwnershipResult struct {
	RequestID uuid.UUID                  `json:"request_id"`
	Request   *domain.CoOwnershipRequest `json:"request"`
}

// RevokeCoOwnershipHandler handles revoking co-ownership
type RevokeCoOwnershipHandler struct {
	userRepo        domain.Repository
	coOwnershipRepo domain.CoOwnershipRepository
	eventBus        events.Bus
}

// NewRevokeCoOwnershipHandler creates a new handler
func NewRevokeCoOwnershipHandler(
	userRepo domain.Repository,
	coOwnershipRepo domain.CoOwnershipRepository,
	eventBus events.Bus,
) *RevokeCoOwnershipHandler {
	return &RevokeCoOwnershipHandler{
		userRepo:        userRepo,
		coOwnershipRepo: coOwnershipRepo,
		eventBus:        eventBus,
	}
}

// Handle processes the revoke co-ownership command
func (h *RevokeCoOwnershipHandler) Handle(ctx context.Context, cmd RevokeCoOwnershipCommand) (*RevokeCoOwnershipResult, error) {
	// Validate the command
	if err := h.validateCommand(cmd); err != nil {
		return nil, err
	}

	// Find the co-ownership request
	request, err := h.coOwnershipRepo.FindCoOwnershipRequestByID(ctx, cmd.RequestID)
	if err != nil {
		return nil, err
	}

	// Verify the user is authorized (either the granter or the co-owner)
	if request.GrantedBy() != cmd.UserID && request.CoOwnerID() != cmd.UserID {
		return nil, domain.ErrNotAuthorized
	}

	// Verify the request is active
	if request.Status() != domain.CoOwnershipStatusActive {
		return nil, domain.ErrCoOwnershipNotPending // Reusing error, could create specific one
	}

	// Find the user who is revoking
	user, err := h.userRepo.FindByID(ctx, cmd.UserID)
	if err != nil {
		return nil, err
	}

	// Revoke the co-ownership through domain
	user.RevokeCoOwnership(cmd.RequestID)
	request.Revoke()

	// Save the updated request
	if err := h.coOwnershipRepo.SaveCoOwnershipRequest(ctx, request); err != nil {
		return nil, err
	}

	// Publish domain events
	for _, event := range user.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			log.Printf("Failed to publish co-ownership revocation event: %v", err)
		}
	}

	// Clear events
	user.ClearEvents()

	return &RevokeCoOwnershipResult{
		RequestID: request.ID(),
		Request:   request,
	}, nil
}

// validateCommand validates the revoke co-ownership command
func (h *RevokeCoOwnershipHandler) validateCommand(cmd RevokeCoOwnershipCommand) error {
	if cmd.RequestID == uuid.Nil {
		return domain.ErrCoOwnershipNotFound
	}

	if cmd.UserID == uuid.Nil {
		return domain.ErrInvalidUserID
	}

	return nil
}