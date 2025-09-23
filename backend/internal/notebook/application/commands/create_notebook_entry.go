package commands

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/internal/notebook/domain"
	"pet-of-the-day/internal/shared/events"
)

// CreateNotebookEntryCommand represents the command to create a notebook entry
type CreateNotebookEntryCommand struct {
	PetID     uuid.UUID
	Request   *domain.CreateNotebookEntryRequest
	AuthorID  uuid.UUID
}

// CreateNotebookEntryResult represents the result of creating a notebook entry
type CreateNotebookEntryResult struct {
	Entry          *domain.NotebookEntry
	MedicalEntry   *domain.MedicalEntry
	DietEntry      *domain.DietEntry
	HabitEntry     *domain.HabitEntry
	CommandEntry   *domain.CommandEntry
}

// CreateNotebookEntryHandler handles creating notebook entries
type CreateNotebookEntryHandler struct {
	notebookRepo     domain.NotebookRepository
	entryRepo        domain.NotebookEntryRepository
	medicalRepo      domain.MedicalEntryRepository
	dietRepo         domain.DietEntryRepository
	habitRepo        domain.HabitEntryRepository
	commandRepo      domain.CommandEntryRepository
	eventBus         events.EventBus
}

// NewCreateNotebookEntryHandler creates a new handler
func NewCreateNotebookEntryHandler(
	notebookRepo domain.NotebookRepository,
	entryRepo domain.NotebookEntryRepository,
	medicalRepo domain.MedicalEntryRepository,
	dietRepo domain.DietEntryRepository,
	habitRepo domain.HabitEntryRepository,
	commandRepo domain.CommandEntryRepository,
	eventBus events.EventBus,
) *CreateNotebookEntryHandler {
	return &CreateNotebookEntryHandler{
		notebookRepo: notebookRepo,
		entryRepo:    entryRepo,
		medicalRepo:  medicalRepo,
		dietRepo:     dietRepo,
		habitRepo:    habitRepo,
		commandRepo:  commandRepo,
		eventBus:     eventBus,
	}
}

// Handle executes the command
func (h *CreateNotebookEntryHandler) Handle(ctx context.Context, cmd *CreateNotebookEntryCommand) (*CreateNotebookEntryResult, error) {
	// Get or create notebook for pet
	notebook, err := h.notebookRepo.FindByPetID(ctx, cmd.PetID)
	if err != nil {
		if err == domain.ErrNotebookNotFound {
			notebook, err = h.notebookRepo.CreateForPet(ctx, cmd.PetID)
			if err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	// Create the base notebook entry
	entryType := domain.EntryType(cmd.Request.EntryType)
	entry, err := domain.NewNotebookEntry(
		notebook.ID(),
		entryType,
		cmd.Request.Title,
		cmd.Request.Content,
		cmd.Request.DateOccurred,
		cmd.Request.Tags,
		cmd.AuthorID,
	)
	if err != nil {
		return nil, err
	}

	// Save the base entry
	if err := h.entryRepo.Save(ctx, entry); err != nil {
		return nil, err
	}

	result := &CreateNotebookEntryResult{
		Entry: entry,
	}

	// Create specialized entry based on type
	switch entryType {
	case domain.EntryTypeMedical:
		if cmd.Request.Medical != nil {
			medicalEntry, err := domain.NewMedicalEntry(
				entry.ID(),
				cmd.Request.Medical.VeterinarianName,
				cmd.Request.Medical.TreatmentType,
				cmd.Request.Medical.Medications,
				cmd.Request.Medical.FollowUpDate,
				cmd.Request.Medical.Cost,
				cmd.Request.Medical.Attachments,
			)
			if err != nil {
				return nil, err
			}
			if err := h.medicalRepo.Save(ctx, medicalEntry); err != nil {
				return nil, err
			}
			result.MedicalEntry = medicalEntry
		}

	case domain.EntryTypeDiet:
		if cmd.Request.Diet != nil {
			dietEntry, err := domain.NewDietEntry(
				entry.ID(),
				cmd.Request.Diet.FoodType,
				cmd.Request.Diet.Quantity,
				cmd.Request.Diet.FeedingSchedule,
				cmd.Request.Diet.DietaryRestrictions,
				cmd.Request.Diet.ReactionNotes,
			)
			if err != nil {
				return nil, err
			}
			if err := h.dietRepo.Save(ctx, dietEntry); err != nil {
				return nil, err
			}
			result.DietEntry = dietEntry
		}

	case domain.EntryTypeHabits:
		if cmd.Request.Habit != nil {
			habitEntry, err := domain.NewHabitEntry(
				entry.ID(),
				cmd.Request.Habit.BehaviorPattern,
				cmd.Request.Habit.Triggers,
				cmd.Request.Habit.Frequency,
				cmd.Request.Habit.Location,
				cmd.Request.Habit.Severity,
			)
			if err != nil {
				return nil, err
			}
			if err := h.habitRepo.Save(ctx, habitEntry); err != nil {
				return nil, err
			}
			result.HabitEntry = habitEntry
		}

	case domain.EntryTypeCommands:
		if cmd.Request.Command != nil {
			commandEntry, err := domain.NewCommandEntry(
				entry.ID(),
				cmd.Request.Command.CommandName,
				cmd.Request.Command.TrainingStatus,
				cmd.Request.Command.SuccessRate,
				cmd.Request.Command.TrainingMethod,
				cmd.Request.Command.LastPracticed,
			)
			if err != nil {
				return nil, err
			}
			if err := h.commandRepo.Save(ctx, commandEntry); err != nil {
				return nil, err
			}
			result.CommandEntry = commandEntry
		}
	}

	// Touch notebook to update its timestamp
	notebook.Touch()
	if err := h.notebookRepo.Save(ctx, notebook); err != nil {
		return nil, err
	}

	// Publish domain event
	event := events.Event{
		Type: "notebook_entry.created",
		Data: map[string]interface{}{
			"pet_id":     cmd.PetID.String(),
			"entry_id":   entry.ID().String(),
			"entry_type": string(entryType),
			"title":      entry.Title(),
			"author_id":  cmd.AuthorID.String(),
		},
	}
	h.eventBus.Publish(ctx, event)

	return result, nil
}