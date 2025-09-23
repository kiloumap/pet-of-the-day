package commands

import (
	"context"

	"github.com/google/uuid"
	"pet-of-the-day/internal/points/domain"
	"pet-of-the-day/internal/shared/events"
)

// DeleteScoreEventHandler handles the deletion of score events
type DeleteScoreEventHandler struct {
	scoreEventRepo         domain.ScoreEventRepository
	scoreEventOwnerChecker domain.ScoreEventOwnerChecker
	eventBus               events.Bus
}

// NewDeleteScoreEventHandler creates a new DeleteScoreEventHandler
func NewDeleteScoreEventHandler(
	scoreEventRepo domain.ScoreEventRepository,
	scoreEventOwnerChecker domain.ScoreEventOwnerChecker,
	eventBus events.Bus,
) *DeleteScoreEventHandler {
	return &DeleteScoreEventHandler{
		scoreEventRepo:         scoreEventRepo,
		scoreEventOwnerChecker: scoreEventOwnerChecker,
		eventBus:               eventBus,
	}
}

// Handle processes the delete score event command
func (h *DeleteScoreEventHandler) Handle(ctx context.Context, userID, eventID uuid.UUID) error {
	// Verify event exists and user is the owner
	isOwner, err := h.scoreEventOwnerChecker.IsScoreEventOwner(ctx, userID, eventID)
	if err != nil {
		return err
	}
	if !isOwner {
		return &AuthorizationError{Message: "You can only delete your own score events"}
	}

	// Get the event before deletion for event publishing
	event, err := h.scoreEventRepo.GetByID(ctx, eventID)
	if err != nil {
		return err
	}
	if event == nil {
		return &NotFoundError{Resource: "score event", ID: eventID.String()}
	}

	// Delete the event
	err = h.scoreEventRepo.Delete(ctx, eventID)
	if err != nil {
		return err
	}

	// Publish event
	eventPublish := events.NewBaseEvent("score_event.deleted", event.ID)
	h.eventBus.Publish(ctx, eventPublish)

	return nil
}
