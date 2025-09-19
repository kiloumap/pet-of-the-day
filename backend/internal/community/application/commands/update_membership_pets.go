package commands

import (
	"context"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

type UpdateMembershipPetsCommand struct {
	GroupID uuid.UUID   `json:"group_id"`
	UserID  uuid.UUID   `json:"user_id"`
	PetIDs  []uuid.UUID `json:"pet_ids"`
}

type UpdateMembershipPetsHandler struct {
	membershipRepo    domain.MembershipRepository
	eventBus          events.EventBus
	validationService *domain.CrossContextValidationService
}

func NewUpdateMembershipPetsHandler(
	membershipRepo domain.MembershipRepository,
	eventBus events.EventBus,
	validationService *domain.CrossContextValidationService,
) *UpdateMembershipPetsHandler {
	return &UpdateMembershipPetsHandler{
		membershipRepo:    membershipRepo,
		eventBus:          eventBus,
		validationService: validationService,
	}
}

func (h *UpdateMembershipPetsHandler) Handle(ctx context.Context, cmd UpdateMembershipPetsCommand) error {
	if err := h.validationService.ValidateUpdateMembershipPets(ctx, cmd.UserID, cmd.PetIDs); err != nil {
		return err
	}

	membership, err := h.membershipRepo.FindByGroupAndUser(ctx, cmd.GroupID, cmd.UserID)
	if err != nil {
		return domain.ErrMembershipNotFound
	}
	if membership == nil {
		return domain.ErrMembershipNotFound
	}

	if err := membership.UpdatePets(cmd.PetIDs); err != nil {
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
