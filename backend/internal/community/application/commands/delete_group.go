package commands

import (
	"context"
	"fmt"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

// ScoreEventRepository interface needed for deleting score events
type ScoreEventRepository interface {
	DeleteByGroupID(ctx context.Context, groupID uuid.UUID) error
}

type DeleteGroupCommand struct {
	GroupID uuid.UUID
	UserID  uuid.UUID
}

type DeleteGroupHandler struct {
	groupRepo      domain.GroupRepository
	membershipRepo domain.MembershipRepository
	invitationRepo domain.InvitationRepository
	scoreEventRepo ScoreEventRepository
}

func NewDeleteGroupHandler(
	groupRepo domain.GroupRepository,
	membershipRepo domain.MembershipRepository,
	invitationRepo domain.InvitationRepository,
	scoreEventRepo ScoreEventRepository,
) *DeleteGroupHandler {
	return &DeleteGroupHandler{
		groupRepo:      groupRepo,
		membershipRepo: membershipRepo,
		invitationRepo: invitationRepo,
		scoreEventRepo: scoreEventRepo,
	}
}

func (h *DeleteGroupHandler) Handle(ctx context.Context, cmd DeleteGroupCommand) error {
	group, err := h.groupRepo.FindByID(ctx, cmd.GroupID)
	if err != nil {
		return fmt.Errorf("failed to get group: %w", err)
	}

	if group.CreatorID() != cmd.UserID {
		return fmt.Errorf("only group creator can delete the group")
	}

	memberships, err := h.membershipRepo.FindByGroupID(ctx, cmd.GroupID)
	if err != nil {
		return fmt.Errorf("failed to find group memberships: %w", err)
	}
	for _, membership := range memberships {
		if err := h.membershipRepo.Delete(ctx, membership.ID()); err != nil {
			return fmt.Errorf("failed to delete membership %s: %w", membership.ID(), err)
		}
	}

	invitations, err := h.invitationRepo.FindByGroupID(ctx, cmd.GroupID)
	if err != nil {
		return fmt.Errorf("failed to find group invitations: %w", err)
	}
	for _, invitation := range invitations {
		if err := h.invitationRepo.Delete(ctx, invitation.ID()); err != nil {
			return fmt.Errorf("failed to delete invitation %s: %w", invitation.ID(), err)
		}
	}

	// Delete all score events for this group
	if err := h.scoreEventRepo.DeleteByGroupID(ctx, cmd.GroupID); err != nil {
		return fmt.Errorf("failed to delete score events for group: %w", err)
	}

	if err := h.groupRepo.Delete(ctx, cmd.GroupID); err != nil {
		return fmt.Errorf("failed to delete group: %w", err)
	}

	return nil
}
