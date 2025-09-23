package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvalidCost             = errors.New("cost must be positive")
	ErrFollowUpDateInPast      = errors.New("follow_up_date must be in the future")
)

// MedicalEntry represents specialized medical entry data
type MedicalEntry struct {
	id                uuid.UUID
	entryID          uuid.UUID
	veterinarianName string
	treatmentType    string
	medications      string
	followUpDate     *time.Time // Optional
	cost             *float64   // Optional, positive value
	attachments      []string   // URLs or file references, max 5
	createdAt        time.Time
	updatedAt        time.Time
}

// NewMedicalEntry creates a new medical entry
func NewMedicalEntry(
	entryID uuid.UUID,
	veterinarianName string,
	treatmentType string,
	medications string,
	followUpDate *time.Time,
	cost *float64,
	attachments []string,
) (*MedicalEntry, error) {
	if err := validateMedicalData(followUpDate, cost, attachments); err != nil {
		return nil, err
	}

	now := time.Now()
	return &MedicalEntry{
		id:               uuid.New(),
		entryID:          entryID,
		veterinarianName: veterinarianName,
		treatmentType:    treatmentType,
		medications:      medications,
		followUpDate:     followUpDate,
		cost:             cost,
		attachments:      attachments,
		createdAt:        now,
		updatedAt:        now,
	}, nil
}

// Update updates the medical entry data
func (m *MedicalEntry) Update(
	veterinarianName string,
	treatmentType string,
	medications string,
	followUpDate *time.Time,
	cost *float64,
	attachments []string,
) error {
	if err := validateMedicalData(followUpDate, cost, attachments); err != nil {
		return err
	}

	m.veterinarianName = veterinarianName
	m.treatmentType = treatmentType
	m.medications = medications
	m.followUpDate = followUpDate
	m.cost = cost
	m.attachments = attachments
	m.updatedAt = time.Now()
	return nil
}

// Getters
func (m *MedicalEntry) ID() uuid.UUID {
	return m.id
}

func (m *MedicalEntry) EntryID() uuid.UUID {
	return m.entryID
}

func (m *MedicalEntry) VeterinarianName() string {
	return m.veterinarianName
}

func (m *MedicalEntry) TreatmentType() string {
	return m.treatmentType
}

func (m *MedicalEntry) Medications() string {
	return m.medications
}

func (m *MedicalEntry) FollowUpDate() *time.Time {
	return m.followUpDate
}

func (m *MedicalEntry) Cost() *float64 {
	return m.cost
}

func (m *MedicalEntry) Attachments() []string {
	return m.attachments
}

func (m *MedicalEntry) CreatedAt() time.Time {
	return m.createdAt
}

func (m *MedicalEntry) UpdatedAt() time.Time {
	return m.updatedAt
}

// validateMedicalData validates medical-specific fields
func validateMedicalData(followUpDate *time.Time, cost *float64, attachments []string) error {
	if followUpDate != nil && followUpDate.Before(time.Now()) {
		return ErrFollowUpDateInPast
	}

	if cost != nil && *cost < 0 {
		return ErrInvalidCost
	}

	if len(attachments) > 5 {
		return ErrTooManyAttachments
	}

	return nil
}