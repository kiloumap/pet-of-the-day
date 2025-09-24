package infrastructure

import (
	"context"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/medicalentry"
	"pet-of-the-day/ent/notebookentry"
	"pet-of-the-day/internal/notebook/domain"
)

// EntMedicalEntryRepository implements the MedicalEntryRepository using Ent ORM
type EntMedicalEntryRepository struct {
	client *ent.Client
}

// NewEntMedicalEntryRepository creates a new Ent-based repository
func NewEntMedicalEntryRepository(client *ent.Client) domain.MedicalEntryRepository {
	return &EntMedicalEntryRepository{
		client: client,
	}
}

// Save creates or updates a medical entry
func (r *EntMedicalEntryRepository) Save(ctx context.Context, entry *domain.MedicalEntry) error {
	// Check if entry already exists by finding the related notebook entry
	existing, err := r.client.MedicalEntry.
		Query().
		Where(medicalentry.HasNotebookEntryWith(notebookentry.ID(entry.EntryID()))).
		Only(ctx)

	if err != nil && !ent.IsNotFound(err) {
		return err
	}

	if existing != nil {
		// Update existing
		update := r.client.MedicalEntry.
			UpdateOneID(existing.ID).
			SetVeterinarianName(entry.VeterinarianName()).
			SetTreatmentType(medicalentry.TreatmentType(entry.TreatmentType())).
			SetMedications(entry.Medications()).
			SetAttachments(entry.Attachments())

		if entry.FollowUpDate() != nil {
			update = update.SetFollowUpDate(*entry.FollowUpDate())
		} else {
			update = update.ClearFollowUpDate()
		}

		if entry.Cost() != nil {
			update = update.SetCost(*entry.Cost())
		} else {
			update = update.ClearCost()
		}

		return update.Exec(ctx)
	}

	// Create new
	create := r.client.MedicalEntry.
		Create().
		SetVeterinarianName(entry.VeterinarianName()).
		SetTreatmentType(medicalentry.TreatmentType(entry.TreatmentType())).
		SetMedications(entry.Medications()).
		SetAttachments(entry.Attachments()).
		SetNotebookEntryID(entry.EntryID())

	if entry.FollowUpDate() != nil {
		create = create.SetFollowUpDate(*entry.FollowUpDate())
	}

	if entry.Cost() != nil {
		create = create.SetCost(*entry.Cost())
	}

	_, err = create.Save(ctx)
	return err
}

// FindByEntryID retrieves medical data for a notebook entry
func (r *EntMedicalEntryRepository) FindByEntryID(ctx context.Context, entryID uuid.UUID) (*domain.MedicalEntry, error) {
	entMedical, err := r.client.MedicalEntry.
		Query().
		Where(medicalentry.HasNotebookEntryWith(notebookentry.ID(entryID))).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrEntryNotFound
		}
		return nil, err
	}

	return r.entToDomain(entMedical, entryID), nil
}

// Delete removes medical entry data
func (r *EntMedicalEntryRepository) Delete(ctx context.Context, entryID uuid.UUID) error {
	_, err := r.client.MedicalEntry.
		Delete().
		Where(medicalentry.HasNotebookEntryWith(notebookentry.ID(entryID))).
		Exec(ctx)

	return err
}

// entToDomain converts an Ent entity to a domain entity
func (r *EntMedicalEntryRepository) entToDomain(entMedical *ent.MedicalEntry, entryID uuid.UUID) *domain.MedicalEntry {
	// Convert optional fields to pointers
	var followUpDate *time.Time
	if !entMedical.FollowUpDate.IsZero() {
		followUpDate = &entMedical.FollowUpDate
	}

	var cost *float64
	if entMedical.Cost != 0 {
		cost = &entMedical.Cost
	}

	// Create domain entity - this will handle validation
	medicalEntry, _ := domain.NewMedicalEntry(
		entryID,
		entMedical.VeterinarianName,
		string(entMedical.TreatmentType),
		entMedical.Medications,
		followUpDate,
		cost,
		entMedical.Attachments,
	)

	return medicalEntry
}