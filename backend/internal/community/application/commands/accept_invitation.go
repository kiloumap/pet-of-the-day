package commands

import (
	"context"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

type AcceptInvitationCommand struct {
	InvitationID uuid.UUID   `json:"invitation_id,omitempty"`
	InviteCode   string      `json:"invite_code,omitempty"`
	UserID       uuid.UUID   `json:"user_id"`
	PetIDs       []uuid.UUID `json:"pet_ids"`
}

type AcceptInvitationHandler struct {
	groupRepo      domain.GroupRepository
	membershipRepo domain.MembershipRepository
	invitationRepo domain.InvitationRepository
	eventBus       events.EventBus
}

func NewAcceptInvitationHandler(
	groupRepo domain.GroupRepository,
	membershipRepo domain.MembershipRepository,
	invitationRepo domain.InvitationRepository,
	eventBus events.EventBus,
) *AcceptInvitationHandler {
	return &AcceptInvitationHandler{
		groupRepo:      groupRepo,
		membershipRepo: membershipRepo,
		invitationRepo: invitationRepo,
		eventBus:       eventBus,
	}
}

func (h *AcceptInvitationHandler) Handle(ctx context.Context, cmd AcceptInvitationCommand) (*domain.Membership, error) {
	var invitation *domain.Invitation
	var err error

	// Find invitation by ID or code
	if cmd.InvitationID != uuid.Nil {
		invitation, err = h.invitationRepo.FindByID(ctx, cmd.InvitationID)
	} else if cmd.InviteCode != "" {
		invitation, err = h.invitationRepo.FindByCode(ctx, cmd.InviteCode)
	} else {
		return nil, domain.ErrInvitationInvalid
	}

	if err != nil {
		return nil, domain.ErrInvitationNotFound
	}
	if invitation == nil {
		return nil, domain.ErrInvitationNotFound
	}

	// Check if invitation is valid
	if !invitation.IsValid() {
		return nil, domain.ErrInvitationExpired
	}

	// Check if user is already a member
	existingMembership, err := h.membershipRepo.FindByGroupAndUser(ctx, invitation.GroupID(), cmd.UserID)
	if err == nil && existingMembership != nil && existingMembership.IsActive() {
		return nil, domain.ErrMembershipAlreadyMember
	}

	// Accept the invitation
	if err := invitation.Accept(); err != nil {
		return nil, err
	}

	// Create and accept membership
	membership, err := domain.NewMembership(invitation.GroupID(), cmd.UserID, cmd.PetIDs)
	if err != nil {
		return nil, err
	}

	// Auto-accept since they have a valid invitation
	if err := membership.Accept(); err != nil {
		return nil, err
	}

	// Save invitation and membership
	if err := h.invitationRepo.Save(ctx, invitation); err != nil {
		return nil, err
	}

	if err := h.membershipRepo.Save(ctx, membership); err != nil {
		return nil, err
	}

	// Publish events
	for _, event := range invitation.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the command
		}
	}

	for _, event := range membership.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the command
		}
	}

	invitation.ClearEvents()
	membership.ClearEvents()
	return membership, nil
}