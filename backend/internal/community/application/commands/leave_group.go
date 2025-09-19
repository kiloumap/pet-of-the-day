package commands

import (
	"context"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

type LeaveGroupCommand struct {
	GroupID uuid.UUID `json:"group_id"`
	UserID  uuid.UUID `json:"user_id"`
}

type LeaveGroupHandler struct {
	groupRepo      domain.GroupRepository
	membershipRepo domain.MembershipRepository
	eventBus       events.EventBus
}

func NewLeaveGroupHandler(
	groupRepo domain.GroupRepository,
	membershipRepo domain.MembershipRepository,
	eventBus events.EventBus,
) *LeaveGroupHandler {
	return &LeaveGroupHandler{
		groupRepo:      groupRepo,
		membershipRepo: membershipRepo,
		eventBus:       eventBus,
	}
}

func (h *LeaveGroupHandler) Handle(ctx context.Context, cmd LeaveGroupCommand) error {
	group, err := h.groupRepo.FindByID(ctx, cmd.GroupID)
	if err != nil {
		return domain.ErrGroupNotFound
	}
	if group == nil {
		return domain.ErrGroupNotFound
	}

	membership, err := h.membershipRepo.FindByGroupAndUser(ctx, cmd.GroupID, cmd.UserID)
	if err != nil {
		return domain.ErrMembershipNotFound
	}
	if membership == nil {
		return domain.ErrMembershipNotFound
	}

	if group.IsCreator(cmd.UserID) {
		return domain.ErrMembershipCannotLeave
	}

	if err := membership.Leave(); err != nil {
		return err
	}

	if err := h.membershipRepo.Save(ctx, membership); err != nil {
		return err
	}

	for _, event := range membership.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the command
		}
	}

	membership.ClearEvents()
	return nil
}
