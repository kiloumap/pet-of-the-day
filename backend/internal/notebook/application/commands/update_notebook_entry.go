package commands

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/internal/notebook/domain"
	"pet-of-the-day/internal/shared/events"
)

// UpdateNotebookEntryCommand represents the command to update a notebook entry
type UpdateNotebookEntryCommand struct {
	EntryID   uuid.UUID
	Request   *domain.UpdateNotebookEntryRequest
	UpdatedBy uuid.UUID
}

// UpdateNotebookEntryHandler handles updating notebook entries
type UpdateNotebookEntryHandler struct {
	entryRepo       domain.NotebookEntryRepository
	medicalRepo     domain.MedicalEntryRepository
	dietRepo        domain.DietEntryRepository
	habitRepo       domain.HabitEntryRepository
	commandRepo     domain.CommandEntryRepository
	eventBus        events.EventBus
}

// NewUpdateNotebookEntryHandler creates a new handler
func NewUpdateNotebookEntryHandler(
	entryRepo domain.NotebookEntryRepository,
	medicalRepo domain.MedicalEntryRepository,
	dietRepo domain.DietEntryRepository,
	habitRepo domain.HabitEntryRepository,
	commandRepo domain.CommandEntryRepository,
	eventBus events.EventBus,
) *UpdateNotebookEntryHandler {
	return &UpdateNotebookEntryHandler{
		entryRepo:   entryRepo,
		medicalRepo: medicalRepo,
		dietRepo:    dietRepo,
		habitRepo:   habitRepo,
		commandRepo: commandRepo,
		eventBus:    eventBus,
	}
}

// Handle executes the command
func (h *UpdateNotebookEntryHandler) Handle(ctx context.Context, cmd *UpdateNotebookEntryCommand) (*CreateNotebookEntryResult, error) {
	// Retrieve existing entry
	entry, err := h.entryRepo.FindByID(ctx, cmd.EntryID)
	if err != nil {
		return nil, err
	}

	// Update base entry fields if provided
	title := entry.Title()
	content := entry.Content()
	dateOccurred := entry.DateOccurred()
	tags := entry.Tags()

	if cmd.Request.Title != nil {
		title = *cmd.Request.Title
	}
	if cmd.Request.Content != nil {
		content = *cmd.Request.Content
	}
	if cmd.Request.DateOccurred != nil {
		dateOccurred = *cmd.Request.DateOccurred
	}
	if cmd.Request.Tags != nil {
		tags = cmd.Request.Tags
	}

	// Update the base entry
	if err := entry.Update(title, content, dateOccurred, tags); err != nil {
		return nil, err
	}

	// Save the updated base entry
	if err := h.entryRepo.Save(ctx, entry); err != nil {
		return nil, err
	}

	result := &CreateNotebookEntryResult{
		Entry: entry,
	}

	// Update specialized entry based on type
	switch entry.EntryType() {
	case domain.EntryTypeMedical:
		if cmd.Request.Medical != nil {
			medicalEntry, err := h.medicalRepo.FindByEntryID(ctx, entry.ID())
			if err != nil {
				return nil, err
			}
			if err := medicalEntry.Update(
				cmd.Request.Medical.VeterinarianName,
				cmd.Request.Medical.TreatmentType,
				cmd.Request.Medical.Medications,
				cmd.Request.Medical.FollowUpDate,
				cmd.Request.Medical.Cost,
				cmd.Request.Medical.Attachments,
			); err != nil {
				return nil, err
			}
			if err := h.medicalRepo.Save(ctx, medicalEntry); err != nil {
				return nil, err
			}
			result.MedicalEntry = medicalEntry
		}

	case domain.EntryTypeDiet:
		if cmd.Request.Diet != nil {
			dietEntry, err := h.dietRepo.FindByEntryID(ctx, entry.ID())
			if err != nil {
				return nil, err
			}
			if err := dietEntry.Update(
				cmd.Request.Diet.FoodType,
				cmd.Request.Diet.Quantity,
				cmd.Request.Diet.FeedingSchedule,
				cmd.Request.Diet.DietaryRestrictions,
				cmd.Request.Diet.ReactionNotes,
			); err != nil {
				return nil, err
			}
			if err := h.dietRepo.Save(ctx, dietEntry); err != nil {
				return nil, err
			}
			result.DietEntry = dietEntry
		}

	case domain.EntryTypeHabits:
		if cmd.Request.Habit != nil {
			habitEntry, err := h.habitRepo.FindByEntryID(ctx, entry.ID())
			if err != nil {
				return nil, err
			}
			if err := habitEntry.Update(
				cmd.Request.Habit.BehaviorPattern,
				cmd.Request.Habit.Triggers,
				cmd.Request.Habit.Frequency,
				cmd.Request.Habit.Location,
				cmd.Request.Habit.Severity,
			); err != nil {
				return nil, err
			}
			if err := h.habitRepo.Save(ctx, habitEntry); err != nil {
				return nil, err
			}
			result.HabitEntry = habitEntry
		}

	case domain.EntryTypeCommands:
		if cmd.Request.Command != nil {
			commandEntry, err := h.commandRepo.FindByEntryID(ctx, entry.ID())
			if err != nil {
				return nil, err
			}
			if err := commandEntry.Update(
				cmd.Request.Command.CommandName,
				cmd.Request.Command.TrainingStatus,
				cmd.Request.Command.SuccessRate,
				cmd.Request.Command.TrainingMethod,
				cmd.Request.Command.LastPracticed,
			); err != nil {
				return nil, err
			}
			if err := h.commandRepo.Save(ctx, commandEntry); err != nil {
				return nil, err
			}
			result.CommandEntry = commandEntry
		}
	}

	// Publish domain event
	event := events.Event{
		Type: "notebook_entry.updated",
		Data: map[string]interface{}{
			"entry_id":   entry.ID().String(),
			"entry_type": string(entry.EntryType()),
			"title":      entry.Title(),
			"updated_by": cmd.UpdatedBy.String(),
		},
	}
	h.eventBus.Publish(event)

	return result, nil
}