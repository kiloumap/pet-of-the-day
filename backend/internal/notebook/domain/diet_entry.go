package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrNoSpecializedFields = errors.New("at least one specialized field is required for diet entry")
)

// DietEntry represents specialized diet entry data
type DietEntry struct {
	id                  uuid.UUID
	entryID             uuid.UUID
	foodType            string
	quantity            string
	feedingSchedule     string
	dietaryRestrictions string
	reactionNotes       string
	createdAt           time.Time
	updatedAt           time.Time
}

// NewDietEntry creates a new diet entry
func NewDietEntry(
	entryID uuid.UUID,
	foodType string,
	quantity string,
	feedingSchedule string,
	dietaryRestrictions string,
	reactionNotes string,
) (*DietEntry, error) {
	if err := validateDietData(foodType, quantity, feedingSchedule, dietaryRestrictions, reactionNotes); err != nil {
		return nil, err
	}

	now := time.Now()
	return &DietEntry{
		id:                  uuid.New(),
		entryID:             entryID,
		foodType:            foodType,
		quantity:            quantity,
		feedingSchedule:     feedingSchedule,
		dietaryRestrictions: dietaryRestrictions,
		reactionNotes:       reactionNotes,
		createdAt:           now,
		updatedAt:           now,
	}, nil
}

// Update updates the diet entry data
func (d *DietEntry) Update(
	foodType string,
	quantity string,
	feedingSchedule string,
	dietaryRestrictions string,
	reactionNotes string,
) error {
	if err := validateDietData(foodType, quantity, feedingSchedule, dietaryRestrictions, reactionNotes); err != nil {
		return err
	}

	d.foodType = foodType
	d.quantity = quantity
	d.feedingSchedule = feedingSchedule
	d.dietaryRestrictions = dietaryRestrictions
	d.reactionNotes = reactionNotes
	d.updatedAt = time.Now()
	return nil
}

// Getters
func (d *DietEntry) ID() uuid.UUID {
	return d.id
}

func (d *DietEntry) EntryID() uuid.UUID {
	return d.entryID
}

func (d *DietEntry) FoodType() string {
	return d.foodType
}

func (d *DietEntry) Quantity() string {
	return d.quantity
}

func (d *DietEntry) FeedingSchedule() string {
	return d.feedingSchedule
}

func (d *DietEntry) DietaryRestrictions() string {
	return d.dietaryRestrictions
}

func (d *DietEntry) ReactionNotes() string {
	return d.reactionNotes
}

func (d *DietEntry) CreatedAt() time.Time {
	return d.createdAt
}

func (d *DietEntry) UpdatedAt() time.Time {
	return d.updatedAt
}

// validateDietData ensures at least one specialized field is provided
func validateDietData(foodType, quantity, feedingSchedule, dietaryRestrictions, reactionNotes string) error {
	if foodType == "" && quantity == "" && feedingSchedule == "" && dietaryRestrictions == "" && reactionNotes == "" {
		return ErrNoSpecializedFields
	}
	return nil
}