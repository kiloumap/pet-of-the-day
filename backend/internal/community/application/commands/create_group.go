package commands

import (
	"context"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

type CreateGroupCommand struct {
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatorID   uuid.UUID `json:"creator_id"`
}

type CreateGroupHandler struct {
	groupRepo         domain.GroupRepository
	eventBus          events.EventBus
	validationService *domain.CrossContextValidationService
}

func NewCreateGroupHandler(
	groupRepo domain.GroupRepository,
	eventBus events.EventBus,
	validationService *domain.CrossContextValidationService,
) *CreateGroupHandler {
	return &CreateGroupHandler{
		groupRepo:         groupRepo,
		eventBus:          eventBus,
		validationService: validationService,
	}
}

func (h *CreateGroupHandler) Handle(ctx context.Context, cmd CreateGroupCommand) (*domain.Group, error) {
	// Validate creator exists
	if err := h.validationService.ValidateCreateGroup(ctx, cmd.CreatorID); err != nil {
		return nil, err
	}

	// Check if group with same name already exists
	existingGroup, err := h.groupRepo.FindByName(ctx, cmd.Name)
	if err == nil && existingGroup != nil {
		return nil, domain.ErrGroupAlreadyExists
	}

	// Create new group
	group, err := domain.NewGroup(cmd.Name, cmd.Description, cmd.CreatorID)
	if err != nil {
		return nil, err
	}

	// Save group
	if err := h.groupRepo.Save(ctx, group); err != nil {
		return nil, err
	}

	// Publish events
	for _, event := range group.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the command
			// In production, you might want to use outbox pattern
		}
	}

	group.ClearEvents()
	return group, nil
}