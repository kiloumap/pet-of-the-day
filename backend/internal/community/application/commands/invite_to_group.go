package commands

import (
	"context"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

type InviteToGroupCommand struct {
	GroupID      uuid.UUID `json:"group_id"`
	InviterID    uuid.UUID `json:"inviter_id"`
	InviteeEmail string    `json:"invitee_email,omitempty"`
	InviteType   string    `json:"invite_type"` // "email" or "code"
}

type InviteToGroupHandler struct {
	groupRepo      domain.GroupRepository
	membershipRepo domain.MembershipRepository
	invitationRepo domain.InvitationRepository
	eventBus       events.EventBus
}

func NewInviteToGroupHandler(
	groupRepo domain.GroupRepository,
	membershipRepo domain.MembershipRepository,
	invitationRepo domain.InvitationRepository,
	eventBus events.EventBus,
) *InviteToGroupHandler {
	return &InviteToGroupHandler{
		groupRepo:      groupRepo,
		membershipRepo: membershipRepo,
		invitationRepo: invitationRepo,
		eventBus:       eventBus,
	}
}

func (h *InviteToGroupHandler) Handle(ctx context.Context, cmd InviteToGroupCommand) (*domain.Invitation, error) {
	group, err := h.groupRepo.FindByID(ctx, cmd.GroupID)
	if err != nil {
		return nil, domain.ErrGroupNotFound
	}
	if group == nil {
		return nil, domain.ErrGroupNotFound
	}

	if !group.IsCreator(cmd.InviterID) {
		return nil, domain.ErrGroupUnauthorized
	}

	var invitation *domain.Invitation

	switch cmd.InviteType {
	case "email":
		if cmd.InviteeEmail == "" {
			return nil, domain.ErrInvitationInvalid
		}

		existing, err := h.invitationRepo.FindByGroupAndEmail(ctx, cmd.GroupID, cmd.InviteeEmail)
		if err == nil && existing != nil && existing.IsValid() {
			return nil, domain.ErrInvitationAlreadyExists
		}

		invitation, err = domain.NewEmailInvitation(cmd.GroupID, cmd.InviterID, cmd.InviteeEmail)
		if err != nil {
			return nil, err
		}

	case "code":
		invitation, err = domain.NewCodeInvitation(cmd.GroupID, cmd.InviterID)
		if err != nil {
			return nil, err
		}

	default:
		return nil, domain.ErrInvitationInvalid
	}

	if err := h.invitationRepo.Save(ctx, invitation); err != nil {
		return nil, err
	}

	for _, event := range invitation.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the command
		}
	}

	invitation.ClearEvents()
	return invitation, nil
}
