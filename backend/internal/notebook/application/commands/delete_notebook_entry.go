package commands

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/internal/notebook/domain"
	"pet-of-the-day/internal/shared/events"
)

// DeleteNotebookEntryCommand represents the command to delete a notebook entry
type DeleteNotebookEntryCommand struct {
	EntryID   uuid.UUID
	DeletedBy uuid.UUID
}

// DeleteNotebookEntryHandler handles deleting notebook entries
type DeleteNotebookEntryHandler struct {
	entryRepo       domain.NotebookEntryRepository
	medicalRepo     domain.MedicalEntryRepository
	dietRepo        domain.DietEntryRepository
	habitRepo       domain.HabitEntryRepository
	commandRepo     domain.CommandEntryRepository
	eventBus        events.EventBus
}

// NewDeleteNotebookEntryHandler creates a new handler
func NewDeleteNotebookEntryHandler(
	entryRepo domain.NotebookEntryRepository,
	medicalRepo domain.MedicalEntryRepository,
	dietRepo domain.DietEntryRepository,
	habitRepo domain.HabitEntryRepository,
	commandRepo domain.CommandEntryRepository,
	eventBus events.EventBus,
) *DeleteNotebookEntryHandler {
	return &DeleteNotebookEntryHandler{
		entryRepo:   entryRepo,
		medicalRepo: medicalRepo,
		dietRepo:    dietRepo,
		habitRepo:   habitRepo,
		commandRepo: commandRepo,
		eventBus:    eventBus,
	}
}

// Handle executes the command
func (h *DeleteNotebookEntryHandler) Handle(ctx context.Context, cmd *DeleteNotebookEntryCommand) error {
	// Retrieve existing entry for event data
	entry, err := h.entryRepo.FindByID(ctx, cmd.EntryID)
	if err != nil {
		return err
	}

	// Delete specialized entry data first
	switch entry.EntryType() {
	case domain.EntryTypeMedical:
		if err := h.medicalRepo.Delete(ctx, entry.ID()); err != nil {
			return err
		}
	case domain.EntryTypeDiet:
		if err := h.dietRepo.Delete(ctx, entry.ID()); err != nil {
			return err
		}
	case domain.EntryTypeHabits:
		if err := h.habitRepo.Delete(ctx, entry.ID()); err != nil {
			return err
		}
	case domain.EntryTypeCommands:
		if err := h.commandRepo.Delete(ctx, entry.ID()); err != nil {
			return err
		}
	}

	// Delete the base entry
	if err := h.entryRepo.Delete(ctx, cmd.EntryID); err != nil {
		return err
	}

	// Publish domain event
	event := events.Event{
		Type: "notebook_entry.deleted",
		Data: map[string]interface{}{
			"entry_id":   entry.ID().String(),
			"entry_type": string(entry.EntryType()),
			"title":      entry.Title(),
			"deleted_by": cmd.DeletedBy.String(),
		},
	}
	h.eventBus.Publish(event)

	return nil
}