package commands

import (
	"context"
	"fmt"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

type UpdateGroupCommand struct {
	GroupID     uuid.UUID
	UserID      uuid.UUID
	Name        string
	Description string
	Privacy     domain.GroupPrivacy
}

type UpdateGroupHandler struct {
	groupRepo domain.GroupRepository
}

func NewUpdateGroupHandler(groupRepo domain.GroupRepository) *UpdateGroupHandler {
	return &UpdateGroupHandler{
		groupRepo: groupRepo,
	}
}

func (h *UpdateGroupHandler) Handle(ctx context.Context, cmd UpdateGroupCommand) (*domain.Group, error) {
	group, err := h.groupRepo.FindByID(ctx, cmd.GroupID)
	if err != nil {
		return nil, fmt.Errorf("failed to get group: %w", err)
	}

	if group.CreatorID() != cmd.UserID {
		return nil, fmt.Errorf("only group creator can update the group")
	}

	if err := group.UpdateDetails(cmd.Name, cmd.Description); err != nil {
		return nil, fmt.Errorf("failed to update group details: %w", err)
	}

	if err := group.SetPrivacy(cmd.Privacy); err != nil {
		return nil, fmt.Errorf("failed to update group privacy: %w", err)
	}

	if err := h.groupRepo.Save(ctx, group); err != nil {
		return nil, fmt.Errorf("failed to save updated group: %w", err)
	}

	return group, nil
}
