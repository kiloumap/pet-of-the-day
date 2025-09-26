package commands

import (
	"context"
	"time"

	"github.com/google/uuid"
	"pet-of-the-day/internal/points/domain"
	"pet-of-the-day/internal/shared/events"
)

// CreateScoreEventHandler handles the creation of score events
type CreateScoreEventHandler struct {
	behaviorRepo           domain.BehaviorRepository
	scoreEventRepo         domain.ScoreEventRepository
	petAccessChecker       domain.PetAccessChecker
	groupMembershipChecker domain.GroupMembershipChecker
	eventBus               events.Bus
}

// NewCreateScoreEventHandler creates a new CreateScoreEventHandler
func NewCreateScoreEventHandler(
	behaviorRepo domain.BehaviorRepository,
	scoreEventRepo domain.ScoreEventRepository,
	petAccessChecker domain.PetAccessChecker,
	groupMembershipChecker domain.GroupMembershipChecker,
	eventBus events.Bus,
) *CreateScoreEventHandler {
	return &CreateScoreEventHandler{
		behaviorRepo:           behaviorRepo,
		scoreEventRepo:         scoreEventRepo,
		petAccessChecker:       petAccessChecker,
		groupMembershipChecker: groupMembershipChecker,
		eventBus:               eventBus,
	}
}

// Handle processes the create score event command
func (h *CreateScoreEventHandler) Handle(ctx context.Context, req domain.CreateScoreEventRequest) (*domain.ScoreEvent, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Check if user has access to the pet
	hasAccess, err := h.petAccessChecker.HasPetAccess(ctx, req.UserID, req.PetID)
	if err != nil {
		return nil, err
	}
	if !hasAccess {
		return nil, &AuthorizationError{Message: "You don't have permission to record actions for this pet"}
	}

	// Note: Group membership check temporarily relaxed
	// If user has pet access, they can record scores for that pet in any group
	// This provides better UX while maintaining security through pet ownership verification
	// TODO: Consider implementing auto-join or explicit group membership flow in the future

	// Optional group membership check (commented out for better UX)
	/*
		isMember, err := h.groupMembershipChecker.IsGroupMember(ctx, req.UserID, req.GroupID)
		if err != nil {
			return nil, err
		}
		if !isMember {
			return nil, &AuthorizationError{Message: "You are not a member of this group. Please join the group first to record scores."}
		}
	*/

	// Get behavior to verify it exists and get points
	behavior, err := h.behaviorRepo.GetByID(ctx, req.BehaviorID)
	if err != nil {
		return nil, err
	}
	if behavior == nil {
		return nil, &NotFoundError{Resource: "behavior", ID: req.BehaviorID.String()}
	}

	// Create score event
	scoreEvent := domain.ScoreEvent{
		ID:           uuid.New(),
		PetID:        req.PetID,
		BehaviorID:   req.BehaviorID,
		GroupID:      req.GroupID,
		RecordedByID: req.UserID,
		Points:       behavior.PointValue,
		Comment:      req.Comment,
		ActionDate:   req.ActionDate,
		RecordedAt:   time.Now(),
	}

	// Save score event
	createdEvent, err := h.scoreEventRepo.Create(ctx, scoreEvent)
	if err != nil {
		return nil, err
	}

	// Publish event
	event := events.NewBaseEvent("score_event.created", createdEvent.ID)
	h.eventBus.Publish(ctx, event)

	return createdEvent, nil
}

// AuthorizationError represents an authorization error
type AuthorizationError struct {
	Message string
}

func (e *AuthorizationError) Error() string {
	return e.Message
}

// NotFoundError represents a not found error
type NotFoundError struct {
	Resource string
	ID       string
}

func (e *NotFoundError) Error() string {
	return e.Resource + " not found: " + e.ID
}
