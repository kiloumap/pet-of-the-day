package commands

import (
	"context"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

type JoinGroupCommand struct {
	GroupID uuid.UUID   `json:"group_id"`
	UserID  uuid.UUID   `json:"user_id"`
	PetIDs  []uuid.UUID `json:"pet_ids"`
}

type JoinGroupHandler struct {
	groupRepo         domain.GroupRepository
	membershipRepo    domain.MembershipRepository
	eventBus          events.EventBus
	validationService *domain.CrossContextValidationService
}

func NewJoinGroupHandler(
	groupRepo domain.GroupRepository,
	membershipRepo domain.MembershipRepository,
	eventBus events.EventBus,
	validationService *domain.CrossContextValidationService,
) *JoinGroupHandler {
	return &JoinGroupHandler{
		groupRepo:         groupRepo,
		membershipRepo:    membershipRepo,
		eventBus:          eventBus,
		validationService: validationService,
	}
}

func (h *JoinGroupHandler) Handle(ctx context.Context, cmd JoinGroupCommand) (*domain.Membership, error) {
	if err := h.validationService.ValidateJoinGroup(ctx, cmd.UserID, cmd.PetIDs); err != nil {
		return nil, err
	}

	group, err := h.groupRepo.FindByID(ctx, cmd.GroupID)
	if err != nil {
		return nil, domain.ErrGroupNotFound
	}
	if group == nil {
		return nil, domain.ErrGroupNotFound
	}

	existingMembership, err := h.membershipRepo.FindByGroupAndUser(ctx, cmd.GroupID, cmd.UserID)
	if err == nil && existingMembership != nil && existingMembership.IsActive() {
		return nil, domain.ErrMembershipAlreadyMember
	}

	membership, err := domain.NewMembership(cmd.GroupID, cmd.UserID, cmd.PetIDs)
	if err != nil {
		return nil, err
	}

	if group.Privacy() == domain.GroupPrivacyPrivate && group.IsCreator(cmd.UserID) {
		if err := membership.Accept(); err != nil {
			return nil, err
		}
	}

	if err := h.membershipRepo.Save(ctx, membership); err != nil {
		return nil, err
	}

	for _, event := range membership.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the command
		}
	}

	membership.ClearEvents()
	return membership, nil
}
