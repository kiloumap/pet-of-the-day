package commands

import (
	"context"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

type CreateGroupCommand struct {
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Privacy     domain.GroupPrivacy `json:"privacy"`
	CreatorID   uuid.UUID           `json:"creator_id"`
	PetIDs      []uuid.UUID         `json:"pet_ids,omitempty"`
}

type CreateGroupHandler struct {
	groupRepo         domain.GroupRepository
	membershipRepo    domain.MembershipRepository
	invitationRepo    domain.InvitationRepository
	eventBus          events.EventBus
	validationService *domain.CrossContextValidationService
}

func NewCreateGroupHandler(
	groupRepo domain.GroupRepository,
	membershipRepo domain.MembershipRepository,
	invitationRepo domain.InvitationRepository,
	eventBus events.EventBus,
	validationService *domain.CrossContextValidationService,
) *CreateGroupHandler {
	return &CreateGroupHandler{
		groupRepo:         groupRepo,
		membershipRepo:    membershipRepo,
		invitationRepo:    invitationRepo,
		eventBus:          eventBus,
		validationService: validationService,
	}
}

type CreateGroupResult struct {
	Group      *domain.Group
	Membership *domain.Membership
	Invitation *domain.Invitation
}

func (h *CreateGroupHandler) Handle(ctx context.Context, cmd CreateGroupCommand) (*CreateGroupResult, error) {
	if err := h.validationService.ValidateJoinGroup(ctx, cmd.CreatorID, cmd.PetIDs); err != nil {
		return nil, err
	}

	existingGroup, err := h.groupRepo.FindByName(ctx, cmd.Name)
	if err == nil && existingGroup != nil {
		return nil, domain.ErrGroupAlreadyExists
	}

	group, err := domain.NewGroup(cmd.Name, cmd.Description, cmd.CreatorID)
	if err != nil {
		return nil, err
	}

	// Set privacy if provided
	if cmd.Privacy != "" {
		if err := group.SetPrivacy(cmd.Privacy); err != nil {
			return nil, err
		}
	}

	if err := h.groupRepo.Save(ctx, group); err != nil {
		return nil, err
	}

	membership, err := domain.NewMembership(group.ID(), cmd.CreatorID, cmd.PetIDs)
	if err != nil {
		return nil, err
	}

	if err := membership.Accept(); err != nil {
		return nil, err
	}

	if err := h.membershipRepo.Save(ctx, membership); err != nil {
		return nil, err
	}

	invitation, err := domain.NewCodeInvitation(group.ID(), cmd.CreatorID)
	if err != nil {
		return nil, err
	}

	if err := h.invitationRepo.Save(ctx, invitation); err != nil {
		return nil, err
	}

	for _, event := range group.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the command
		}
	}
	group.ClearEvents()

	for _, event := range membership.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the command
		}
	}
	membership.ClearEvents()

	for _, event := range invitation.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the command
		}
	}
	invitation.ClearEvents()

	return &CreateGroupResult{
		Group:      group,
		Membership: membership,
		Invitation: invitation,
	}, nil
}
