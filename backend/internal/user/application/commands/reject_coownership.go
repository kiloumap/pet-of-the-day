package commands

import (
	"context"
	"log"

	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

// RejectCoOwnershipCommand represents the command to reject co-ownership of a pet
type RejectCoOwnershipCommand struct {
	RequestID uuid.UUID `json:"request_id"`
	UserID    uuid.UUID `json:"user_id"` // The user rejecting the co-ownership
}

// RejectCoOwnershipResult represents the result of rejecting co-ownership
type RejectCoOwnershipResult struct {
	RequestID uuid.UUID                  `json:"request_id"`
	Request   *domain.CoOwnershipRequest `json:"request"`
}

// RejectCoOwnershipHandler handles rejecting co-ownership
type RejectCoOwnershipHandler struct {
	userRepo        domain.Repository
	coOwnershipRepo domain.CoOwnershipRepository
	eventBus        events.Bus
}

// NewRejectCoOwnershipHandler creates a new handler
func NewRejectCoOwnershipHandler(
	userRepo domain.Repository,
	coOwnershipRepo domain.CoOwnershipRepository,
	eventBus events.Bus,
) *RejectCoOwnershipHandler {
	return &RejectCoOwnershipHandler{
		userRepo:        userRepo,
		coOwnershipRepo: coOwnershipRepo,
		eventBus:        eventBus,
	}
}

// Handle processes the reject co-ownership command
func (h *RejectCoOwnershipHandler) Handle(ctx context.Context, cmd RejectCoOwnershipCommand) (*RejectCoOwnershipResult, error) {
	// Validate the command
	if err := h.validateCommand(cmd); err != nil {
		return nil, err
	}

	// Find the co-ownership request
	request, err := h.coOwnershipRepo.FindCoOwnershipRequestByID(ctx, cmd.RequestID)
	if err != nil {
		return nil, err
	}

	// Verify the user is the intended co-owner
	if request.CoOwnerID() != cmd.UserID {
		return nil, domain.ErrNotAuthorized
	}

	// Verify the request is still pending
	if request.Status() != domain.CoOwnershipStatusPending {
		return nil, domain.ErrCoOwnershipNotPending
	}

	// Find the user who is rejecting
	user, err := h.userRepo.FindByID(ctx, cmd.UserID)
	if err != nil {
		return nil, err
	}

	// Reject the co-ownership through domain
	user.RejectCoOwnership(cmd.RequestID)
	request.Reject()

	// Save the updated request
	if err := h.coOwnershipRepo.SaveCoOwnershipRequest(ctx, request); err != nil {
		return nil, err
	}

	// Publish domain events
	for _, event := range user.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			log.Printf("Failed to publish co-ownership rejection event: %v", err)
		}
	}

	// Clear events
	user.ClearEvents()

	return &RejectCoOwnershipResult{
		RequestID: request.ID(),
		Request:   request,
	}, nil
}

// validateCommand validates the reject co-ownership command
func (h *RejectCoOwnershipHandler) validateCommand(cmd RejectCoOwnershipCommand) error {
	if cmd.RequestID == uuid.Nil {
		return domain.ErrCoOwnershipNotFound
	}

	if cmd.UserID == uuid.Nil {
		return domain.ErrInvalidUserID
	}

	return nil
}