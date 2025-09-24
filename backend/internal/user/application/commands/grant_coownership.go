package commands

import (
	"context"
	"log"

	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

// GrantCoOwnershipCommand represents the command to grant co-ownership of a pet
type GrantCoOwnershipCommand struct {
	PetID     uuid.UUID `json:"pet_id"`
	OwnerID   uuid.UUID `json:"owner_id"`
	CoOwnerID uuid.UUID `json:"co_owner_id"`
	Notes     string    `json:"notes,omitempty"`
}

// GrantCoOwnershipResult represents the result of granting co-ownership
type GrantCoOwnershipResult struct {
	RequestID uuid.UUID                  `json:"request_id"`
	Request   *domain.CoOwnershipRequest `json:"request"`
}

// GrantCoOwnershipHandler handles granting co-ownership
type GrantCoOwnershipHandler struct {
	userRepo        domain.Repository
	coOwnershipRepo domain.CoOwnershipRepository
	eventBus        events.Bus
}

// NewGrantCoOwnershipHandler creates a new handler
func NewGrantCoOwnershipHandler(
	userRepo domain.Repository,
	coOwnershipRepo domain.CoOwnershipRepository,
	eventBus events.Bus,
) *GrantCoOwnershipHandler {
	return &GrantCoOwnershipHandler{
		userRepo:        userRepo,
		coOwnershipRepo: coOwnershipRepo,
		eventBus:        eventBus,
	}
}

// Handle processes the grant co-ownership command
func (h *GrantCoOwnershipHandler) Handle(ctx context.Context, cmd GrantCoOwnershipCommand) (*GrantCoOwnershipResult, error) {
	// Validate the command
	if err := h.validateCommand(cmd); err != nil {
		return nil, err
	}

	// Find the user who is granting ownership
	owner, err := h.userRepo.FindByID(ctx, cmd.OwnerID)
	if err != nil {
		return nil, err
	}

	// Verify the co-owner exists
	_, err = h.userRepo.FindByID(ctx, cmd.CoOwnerID)
	if err != nil {
		return nil, err
	}

	// Check if co-ownership already exists
	hasCoOwnership, err := h.coOwnershipRepo.HasActiveCoOwnership(ctx, cmd.PetID, cmd.CoOwnerID)
	if err != nil {
		return nil, err
	}
	if hasCoOwnership {
		return nil, domain.ErrUserAlreadyCoOwner
	}

	// Grant co-ownership through the domain
	request := owner.GrantCoOwnership(cmd.PetID, cmd.CoOwnerID, cmd.Notes)

	// Save the co-ownership request
	if err := h.coOwnershipRepo.SaveCoOwnershipRequest(ctx, request); err != nil {
		return nil, err
	}

	// Publish domain events
	for _, event := range owner.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			log.Printf("Failed to publish co-ownership event: %v", err)
		}
	}

	// Clear events
	owner.ClearEvents()

	return &GrantCoOwnershipResult{
		RequestID: request.ID(),
		Request:   request,
	}, nil
}

// validateCommand validates the grant co-ownership command
func (h *GrantCoOwnershipHandler) validateCommand(cmd GrantCoOwnershipCommand) error {
	if cmd.PetID == uuid.Nil {
		return domain.ErrInvalidPetID
	}

	if cmd.OwnerID == uuid.Nil {
		return domain.ErrInvalidUserID
	}

	if cmd.CoOwnerID == uuid.Nil {
		return domain.ErrInvalidCoOwnerID
	}

	if cmd.OwnerID == cmd.CoOwnerID {
		return domain.ErrCannotCoOwnSelf
	}

	return nil
}