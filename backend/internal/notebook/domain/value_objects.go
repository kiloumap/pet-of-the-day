package domain

import (
	"time"

	"github.com/google/uuid"
)

// CreateNotebookEntryRequest represents the request to create a notebook entry
type CreateNotebookEntryRequest struct {
	EntryType    string    `json:"entry_type"`    // Required: medical, diet, habits, commands
	Title        string    `json:"title"`         // Required, max 200 chars
	Content      string    `json:"content"`       // Required, max 10,000 chars
	DateOccurred time.Time `json:"date_occurred"` // Required, cannot be future
	Tags         []string  `json:"tags,omitempty"` // Optional, max 10

	// Specialized fields (one set required based on entry_type)
	Medical *CreateMedicalEntryData `json:"medical,omitempty"`
	Diet    *CreateDietEntryData    `json:"diet,omitempty"`
	Habit   *CreateHabitEntryData   `json:"habit,omitempty"`
	Command *CreateCommandEntryData `json:"command,omitempty"`
}

// CreateMedicalEntryData represents medical-specific entry data
type CreateMedicalEntryData struct {
	VeterinarianName string     `json:"veterinarian_name,omitempty"`
	TreatmentType    string     `json:"treatment_type,omitempty"`
	Medications      string     `json:"medications,omitempty"`
	FollowUpDate     *time.Time `json:"follow_up_date,omitempty"` // Must be future
	Cost             *float64   `json:"cost,omitempty"`           // Must be positive
	Attachments      []string   `json:"attachments,omitempty"`    // Max 5
}

// CreateDietEntryData represents diet-specific entry data
type CreateDietEntryData struct {
	FoodType            string `json:"food_type,omitempty"`
	Quantity            string `json:"quantity,omitempty"`
	FeedingSchedule     string `json:"feeding_schedule,omitempty"`
	DietaryRestrictions string `json:"dietary_restrictions,omitempty"`
	ReactionNotes       string `json:"reaction_notes,omitempty"`
}

// CreateHabitEntryData represents habit-specific entry data
type CreateHabitEntryData struct {
	BehaviorPattern string `json:"behavior_pattern"` // Required
	Triggers        string `json:"triggers,omitempty"`
	Frequency       string `json:"frequency,omitempty"`
	Location        string `json:"location,omitempty"`
	Severity        int    `json:"severity"` // Required, 1-5
}

// CreateCommandEntryData represents command-specific entry data
type CreateCommandEntryData struct {
	CommandName    string     `json:"command_name"`               // Required
	TrainingStatus string     `json:"training_status,omitempty"`
	SuccessRate    *int       `json:"success_rate,omitempty"`     // 0-100
	TrainingMethod string     `json:"training_method,omitempty"`
	LastPracticed  *time.Time `json:"last_practiced,omitempty"`   // Cannot be future
}

// UpdateNotebookEntryRequest represents the request to update a notebook entry
type UpdateNotebookEntryRequest struct {
	Title        *string    `json:"title,omitempty"`
	Content      *string    `json:"content,omitempty"`
	DateOccurred *time.Time `json:"date_occurred,omitempty"`
	Tags         []string   `json:"tags,omitempty"`

	// Specialized fields updates
	Medical *CreateMedicalEntryData `json:"medical,omitempty"`
	Diet    *CreateDietEntryData    `json:"diet,omitempty"`
	Habit   *CreateHabitEntryData   `json:"habit,omitempty"`
	Command *CreateCommandEntryData `json:"command,omitempty"`
}

// NotebookEntryResponse represents a notebook entry response
type NotebookEntryResponse struct {
	ID           uuid.UUID  `json:"id"`
	EntryType    string     `json:"entry_type"`
	Title        string     `json:"title"`
	Content      string     `json:"content"`
	DateOccurred time.Time  `json:"date_occurred"`
	Tags         []string   `json:"tags"`
	AuthorID     uuid.UUID  `json:"author_id"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Specialized data (populated based on entry_type)
	Medical *MedicalEntryResponse `json:"medical,omitempty"`
	Diet    *DietEntryResponse    `json:"diet,omitempty"`
	Habit   *HabitEntryResponse   `json:"habit,omitempty"`
	Command *CommandEntryResponse `json:"command,omitempty"`
}

// MedicalEntryResponse represents medical entry response data
type MedicalEntryResponse struct {
	VeterinarianName string     `json:"veterinarian_name,omitempty"`
	TreatmentType    string     `json:"treatment_type,omitempty"`
	Medications      string     `json:"medications,omitempty"`
	FollowUpDate     *time.Time `json:"follow_up_date,omitempty"`
	Cost             *float64   `json:"cost,omitempty"`
	Attachments      []string   `json:"attachments,omitempty"`
}

// DietEntryResponse represents diet entry response data
type DietEntryResponse struct {
	FoodType            string `json:"food_type,omitempty"`
	Quantity            string `json:"quantity,omitempty"`
	FeedingSchedule     string `json:"feeding_schedule,omitempty"`
	DietaryRestrictions string `json:"dietary_restrictions,omitempty"`
	ReactionNotes       string `json:"reaction_notes,omitempty"`
}

// HabitEntryResponse represents habit entry response data
type HabitEntryResponse struct {
	BehaviorPattern string `json:"behavior_pattern"`
	Triggers        string `json:"triggers,omitempty"`
	Frequency       string `json:"frequency,omitempty"`
	Location        string `json:"location,omitempty"`
	Severity        int    `json:"severity"`
}

// CommandEntryResponse represents command entry response data
type CommandEntryResponse struct {
	CommandName    string     `json:"command_name"`
	TrainingStatus string     `json:"training_status,omitempty"`
	SuccessRate    *int       `json:"success_rate,omitempty"`
	TrainingMethod string     `json:"training_method,omitempty"`
	LastPracticed  *time.Time `json:"last_practiced,omitempty"`
}

// NotebookEntriesResponse represents a paginated list of notebook entries
type NotebookEntriesResponse struct {
	Entries []NotebookEntryResponse `json:"entries"`
	Total   int                     `json:"total"`
	Page    int                     `json:"page"`
	PerPage int                     `json:"per_page"`
}

// CreateNotebookShareRequest represents the request to share a notebook
type CreateNotebookShareRequest struct {
	SharedWith string `json:"shared_with"` // Email address
}

// NotebookShareResponse represents a notebook sharing permission
type NotebookShareResponse struct {
	ID         uuid.UUID    `json:"id"`
	SharedWith string       `json:"shared_with"` // Email
	SharedBy   uuid.UUID    `json:"shared_by"`
	ReadOnly   bool         `json:"read_only"`
	GrantedAt  time.Time    `json:"granted_at"`
	RevokedAt  *time.Time   `json:"revoked_at,omitempty"`
	CreatedAt  time.Time    `json:"created_at"`
}

// SharedNotebookResponse represents a notebook shared with the current user
type SharedNotebookResponse struct {
	NotebookID uuid.UUID             `json:"notebook_id"`
	PetID      uuid.UUID             `json:"pet_id"`
	PetName    string                `json:"pet_name"`
	OwnerName  string                `json:"owner_name"`
	SharedAt   time.Time             `json:"shared_at"`
	Share      NotebookShareResponse `json:"share"`
}

// SharedNotebooksListResponse represents a list of shared notebooks
type SharedNotebooksListResponse struct {
	Notebooks []SharedNotebookResponse `json:"notebooks"`
	Total     int                      `json:"total"`
	Page      int                      `json:"page"`
	PerPage   int                      `json:"per_page"`
}

// ToResponse converts a NotebookEntry domain entity to a response DTO
func (e *NotebookEntry) ToResponse() NotebookEntryResponse {
	return NotebookEntryResponse{
		ID:           e.id,
		EntryType:    string(e.entryType),
		Title:        e.title,
		Content:      e.content,
		DateOccurred: e.dateOccurred,
		Tags:         e.tags,
		AuthorID:     e.authorID,
		CreatedAt:    e.createdAt,
		UpdatedAt:    e.updatedAt,
	}
}

// ToResponse converts a MedicalEntry domain entity to a response DTO
func (m *MedicalEntry) ToResponse() MedicalEntryResponse {
	return MedicalEntryResponse{
		VeterinarianName: m.veterinarianName,
		TreatmentType:    m.treatmentType,
		Medications:      m.medications,
		FollowUpDate:     m.followUpDate,
		Cost:             m.cost,
		Attachments:      m.attachments,
	}
}

// ToResponse converts a DietEntry domain entity to a response DTO
func (d *DietEntry) ToResponse() DietEntryResponse {
	return DietEntryResponse{
		FoodType:            d.foodType,
		Quantity:            d.quantity,
		FeedingSchedule:     d.feedingSchedule,
		DietaryRestrictions: d.dietaryRestrictions,
		ReactionNotes:       d.reactionNotes,
	}
}

// ToResponse converts a HabitEntry domain entity to a response DTO
func (h *HabitEntry) ToResponse() HabitEntryResponse {
	return HabitEntryResponse{
		BehaviorPattern: h.behaviorPattern,
		Triggers:        h.triggers,
		Frequency:       h.frequency,
		Location:        h.location,
		Severity:        h.severity,
	}
}

// ToResponse converts a CommandEntry domain entity to a response DTO
func (c *CommandEntry) ToResponse() CommandEntryResponse {
	return CommandEntryResponse{
		CommandName:    c.commandName,
		TrainingStatus: c.trainingStatus,
		SuccessRate:    c.successRate,
		TrainingMethod: c.trainingMethod,
		LastPracticed:  c.lastPracticed,
	}
}

// ToResponse converts a NotebookShare domain entity to a response DTO
func (s *NotebookShare) ToResponse() NotebookShareResponse {
	return NotebookShareResponse{
		ID:         s.id,
		SharedWith: s.sharedWith,
		SharedBy:   s.sharedBy,
		ReadOnly:   s.readOnly,
		GrantedAt:  s.grantedAt,
		RevokedAt:  s.revokedAt,
		CreatedAt:  s.createdAt,
	}
}