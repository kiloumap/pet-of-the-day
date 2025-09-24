package commands

import (
	"context"
	"log"

	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

// AcceptCoOwnershipCommand represents the command to accept co-ownership of a pet
type AcceptCoOwnershipCommand struct {
	RequestID uuid.UUID `json:"request_id"`
	UserID    uuid.UUID `json:"user_id"` // The user accepting the co-ownership
}

// AcceptCoOwnershipResult represents the result of accepting co-ownership
type AcceptCoOwnershipResult struct {
	RequestID uuid.UUID                  `json:"request_id"`
	Request   *domain.CoOwnershipRequest `json:"request"`
}

// AcceptCoOwnershipHandler handles accepting co-ownership
type AcceptCoOwnershipHandler struct {
	userRepo        domain.Repository
	coOwnershipRepo domain.CoOwnershipRepository
	eventBus        events.Bus
}

// NewAcceptCoOwnershipHandler creates a new handler
func NewAcceptCoOwnershipHandler(
	userRepo domain.Repository,
	coOwnershipRepo domain.CoOwnershipRepository,
	eventBus events.Bus,
) *AcceptCoOwnershipHandler {
	return &AcceptCoOwnershipHandler{
		userRepo:        userRepo,
		coOwnershipRepo: coOwnershipRepo,
		eventBus:        eventBus,
	}
}

// Handle processes the accept co-ownership command
func (h *AcceptCoOwnershipHandler) Handle(ctx context.Context, cmd AcceptCoOwnershipCommand) (*AcceptCoOwnershipResult, error) {
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

	// Find the user who is accepting
	user, err := h.userRepo.FindByID(ctx, cmd.UserID)
	if err != nil {
		return nil, err
	}

	// Accept the co-ownership through domain
	user.AcceptCoOwnership(cmd.RequestID)
	request.Accept()

	// Save the updated request
	if err := h.coOwnershipRepo.SaveCoOwnershipRequest(ctx, request); err != nil {
		return nil, err
	}

	// Publish domain events
	for _, event := range user.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			log.Printf("Failed to publish co-ownership acceptance event: %v", err)
		}
	}

	// Clear events
	user.ClearEvents()

	return &AcceptCoOwnershipResult{
		RequestID: request.ID(),
		Request:   request,
	}, nil
}

// validateCommand validates the accept co-ownership command
func (h *AcceptCoOwnershipHandler) validateCommand(cmd AcceptCoOwnershipCommand) error {
	if cmd.RequestID == uuid.Nil {
		return domain.ErrCoOwnershipNotFound
	}

	if cmd.UserID == uuid.Nil {
		return domain.ErrInvalidUserID
	}

	return nil
}