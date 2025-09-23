package queries

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/internal/notebook/domain"
)

// GetNotebookEntriesQuery represents the query to get notebook entries
type GetNotebookEntriesQuery struct {
	PetID     uuid.UUID
	EntryType *domain.EntryType // Optional filter by type
	Limit     int               // Default 20
	Offset    int               // For pagination
}

// GetNotebookEntriesResult represents the result with specialized data
type GetNotebookEntriesResult struct {
	Entries       []*domain.NotebookEntry
	MedicalData   map[uuid.UUID]*domain.MedicalEntry   // Key: entry ID
	DietData      map[uuid.UUID]*domain.DietEntry      // Key: entry ID
	HabitData     map[uuid.UUID]*domain.HabitEntry     // Key: entry ID
	CommandData   map[uuid.UUID]*domain.CommandEntry   // Key: entry ID
	Total         int
}

// GetNotebookEntriesHandler handles retrieving notebook entries
type GetNotebookEntriesHandler struct {
	notebookRepo    domain.NotebookRepository
	entryRepo       domain.NotebookEntryRepository
	medicalRepo     domain.MedicalEntryRepository
	dietRepo        domain.DietEntryRepository
	habitRepo       domain.HabitEntryRepository
	commandRepo     domain.CommandEntryRepository
}

// NewGetNotebookEntriesHandler creates a new handler
func NewGetNotebookEntriesHandler(
	notebookRepo domain.NotebookRepository,
	entryRepo domain.NotebookEntryRepository,
	medicalRepo domain.MedicalEntryRepository,
	dietRepo domain.DietEntryRepository,
	habitRepo domain.HabitEntryRepository,
	commandRepo domain.CommandEntryRepository,
) *GetNotebookEntriesHandler {
	return &GetNotebookEntriesHandler{
		notebookRepo: notebookRepo,
		entryRepo:    entryRepo,
		medicalRepo:  medicalRepo,
		dietRepo:     dietRepo,
		habitRepo:    habitRepo,
		commandRepo:  commandRepo,
	}
}

// Handle executes the query
func (h *GetNotebookEntriesHandler) Handle(ctx context.Context, query *GetNotebookEntriesQuery) (*GetNotebookEntriesResult, error) {
	// Get notebook for pet
	notebook, err := h.notebookRepo.FindByPetID(ctx, query.PetID)
	if err != nil {
		return nil, err
	}

	// Set default limit
	limit := query.Limit
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	var entries []*domain.NotebookEntry
	var total int

	// Get entries based on filter
	if query.EntryType != nil {
		entries, err = h.entryRepo.FindByNotebookIDAndType(ctx, notebook.ID(), *query.EntryType, limit, query.Offset)
		if err != nil {
			return nil, err
		}
		// For type-filtered queries, we'd need to implement CountByNotebookIDAndType
		total = len(entries) // Simplified for now
	} else {
		entries, err = h.entryRepo.FindByNotebookID(ctx, notebook.ID(), limit, query.Offset)
		if err != nil {
			return nil, err
		}
		total, err = h.entryRepo.CountByNotebookID(ctx, notebook.ID())
		if err != nil {
			return nil, err
		}
	}

	// Load specialized data for each entry
	result := &GetNotebookEntriesResult{
		Entries:     entries,
		MedicalData: make(map[uuid.UUID]*domain.MedicalEntry),
		DietData:    make(map[uuid.UUID]*domain.DietEntry),
		HabitData:   make(map[uuid.UUID]*domain.HabitEntry),
		CommandData: make(map[uuid.UUID]*domain.CommandEntry),
		Total:       total,
	}

	for _, entry := range entries {
		switch entry.EntryType() {
		case domain.EntryTypeMedical:
			if medicalData, err := h.medicalRepo.FindByEntryID(ctx, entry.ID()); err == nil {
				result.MedicalData[entry.ID()] = medicalData
			}
		case domain.EntryTypeDiet:
			if dietData, err := h.dietRepo.FindByEntryID(ctx, entry.ID()); err == nil {
				result.DietData[entry.ID()] = dietData
			}
		case domain.EntryTypeHabits:
			if habitData, err := h.habitRepo.FindByEntryID(ctx, entry.ID()); err == nil {
				result.HabitData[entry.ID()] = habitData
			}
		case domain.EntryTypeCommands:
			if commandData, err := h.commandRepo.FindByEntryID(ctx, entry.ID()); err == nil {
				result.CommandData[entry.ID()] = commandData
			}
		}
	}

	return result, nil
}

// GetNotebookEntryQuery represents the query to get a specific notebook entry
type GetNotebookEntryQuery struct {
	EntryID uuid.UUID
}

// GetNotebookEntryHandler handles retrieving a specific notebook entry
type GetNotebookEntryHandler struct {
	entryRepo       domain.NotebookEntryRepository
	medicalRepo     domain.MedicalEntryRepository
	dietRepo        domain.DietEntryRepository
	habitRepo       domain.HabitEntryRepository
	commandRepo     domain.CommandEntryRepository
}

// NewGetNotebookEntryHandler creates a new handler
func NewGetNotebookEntryHandler(
	entryRepo domain.NotebookEntryRepository,
	medicalRepo domain.MedicalEntryRepository,
	dietRepo domain.DietEntryRepository,
	habitRepo domain.HabitEntryRepository,
	commandRepo domain.CommandEntryRepository,
) *GetNotebookEntryHandler {
	return &GetNotebookEntryHandler{
		entryRepo:   entryRepo,
		medicalRepo: medicalRepo,
		dietRepo:    dietRepo,
		habitRepo:   habitRepo,
		commandRepo: commandRepo,
	}
}

// Handle executes the query
func (h *GetNotebookEntryHandler) Handle(ctx context.Context, query *GetNotebookEntryQuery) (*GetNotebookEntriesResult, error) {
	// Get the entry
	entry, err := h.entryRepo.FindByID(ctx, query.EntryID)
	if err != nil {
		return nil, err
	}

	// Create result with single entry
	result := &GetNotebookEntriesResult{
		Entries:     []*domain.NotebookEntry{entry},
		MedicalData: make(map[uuid.UUID]*domain.MedicalEntry),
		DietData:    make(map[uuid.UUID]*domain.DietEntry),
		HabitData:   make(map[uuid.UUID]*domain.HabitEntry),
		CommandData: make(map[uuid.UUID]*domain.CommandEntry),
		Total:       1,
	}

	// Load specialized data
	switch entry.EntryType() {
	case domain.EntryTypeMedical:
		if medicalData, err := h.medicalRepo.FindByEntryID(ctx, entry.ID()); err == nil {
			result.MedicalData[entry.ID()] = medicalData
		}
	case domain.EntryTypeDiet:
		if dietData, err := h.dietRepo.FindByEntryID(ctx, entry.ID()); err == nil {
			result.DietData[entry.ID()] = dietData
		}
	case domain.EntryTypeHabits:
		if habitData, err := h.habitRepo.FindByEntryID(ctx, entry.ID()); err == nil {
			result.HabitData[entry.ID()] = habitData
		}
	case domain.EntryTypeCommands:
		if commandData, err := h.commandRepo.FindByEntryID(ctx, entry.ID()); err == nil {
			result.CommandData[entry.ID()] = commandData
		}
	}

	return result, nil
}