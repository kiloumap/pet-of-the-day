package commands

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/internal/notebook/domain"
	"pet-of-the-day/internal/shared/events"
)

// ShareNotebookCommand represents the command to share a notebook
type ShareNotebookCommand struct {
	PetID       uuid.UUID
	SharedWith  string // Email address
	SharedBy    uuid.UUID
	OwnerEmail  string // To prevent sharing with self
}

// ShareNotebookHandler handles sharing notebooks
type ShareNotebookHandler struct {
	notebookRepo domain.NotebookRepository
	shareRepo    domain.NotebookShareRepository
	eventBus     events.EventBus
}

// NewShareNotebookHandler creates a new handler
func NewShareNotebookHandler(
	notebookRepo domain.NotebookRepository,
	shareRepo domain.NotebookShareRepository,
	eventBus events.EventBus,
) *ShareNotebookHandler {
	return &ShareNotebookHandler{
		notebookRepo: notebookRepo,
		shareRepo:    shareRepo,
		eventBus:     eventBus,
	}
}

// Handle executes the command
func (h *ShareNotebookHandler) Handle(ctx context.Context, cmd *ShareNotebookCommand) (*domain.NotebookShare, error) {
	// Get notebook for pet
	notebook, err := h.notebookRepo.FindByPetID(ctx, cmd.PetID)
	if err != nil {
		return nil, err
	}

	// Check if notebook is already shared with this user
	existing, err := h.shareRepo.FindActiveByNotebookIDAndEmail(ctx, notebook.ID(), cmd.SharedWith)
	if err == nil && existing != nil {
		return nil, domain.ErrDuplicateActiveShare
	}

	// Create new sharing permission
	share, err := domain.NewNotebookShare(
		notebook.ID(),
		cmd.SharedWith,
		cmd.SharedBy,
		cmd.OwnerEmail,
	)
	if err != nil {
		return nil, err
	}

	// Save the sharing permission
	if err := h.shareRepo.Save(ctx, share); err != nil {
		return nil, err
	}

	// Publish domain event
	event := events.Event{
		Type: "notebook.shared",
		Data: map[string]interface{}{
			"pet_id":      cmd.PetID.String(),
			"notebook_id": notebook.ID().String(),
			"shared_with": cmd.SharedWith,
			"shared_by":   cmd.SharedBy.String(),
		},
	}
	h.eventBus.Publish(event)

	return share, nil
}

// RevokeNotebookShareCommand represents the command to revoke notebook sharing
type RevokeNotebookShareCommand struct {
	ShareID   uuid.UUID
	RevokedBy uuid.UUID
}

// RevokeNotebookShareHandler handles revoking notebook sharing
type RevokeNotebookShareHandler struct {
	shareRepo domain.NotebookShareRepository
	eventBus  events.EventBus
}

// NewRevokeNotebookShareHandler creates a new handler
func NewRevokeNotebookShareHandler(
	shareRepo domain.NotebookShareRepository,
	eventBus events.EventBus,
) *RevokeNotebookShareHandler {
	return &RevokeNotebookShareHandler{
		shareRepo: shareRepo,
		eventBus:  eventBus,
	}
}

// Handle executes the command
func (h *RevokeNotebookShareHandler) Handle(ctx context.Context, cmd *RevokeNotebookShareCommand) error {
	// Retrieve existing share
	share, err := h.shareRepo.FindByID(ctx, cmd.ShareID)
	if err != nil {
		return err
	}

	// Revoke the sharing
	if err := share.Revoke(); err != nil {
		return err
	}

	// Save the updated share
	if err := h.shareRepo.Save(ctx, share); err != nil {
		return err
	}

	// Publish domain event
	event := events.Event{
		Type: "notebook.share_revoked",
		Data: map[string]interface{}{
			"share_id":    share.ID().String(),
			"notebook_id": share.NotebookID().String(),
			"shared_with": share.SharedWith().String(),
			"revoked_by":  cmd.RevokedBy.String(),
		},
	}
	h.eventBus.Publish(event)

	return nil
}