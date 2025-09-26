package domain

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// BehaviorCategory represents valid behavior categories
type BehaviorCategory string

const (
	BehaviorCategoryPottyTraining BehaviorCategory = "potty_training"
	BehaviorCategoryFeeding       BehaviorCategory = "feeding"
	BehaviorCategorySocial        BehaviorCategory = "social"
	BehaviorCategoryTraining      BehaviorCategory = "training"
	BehaviorCategoryPlay          BehaviorCategory = "play"
)

// Species represents the species a behavior applies to
type Species string

const (
	SpeciesDog  Species = "dog"
	SpeciesCat  Species = "cat"
	SpeciesBoth Species = "both"
)

// Behavior represents a predefined action that pets can perform with associated point values
type Behavior struct {
	ID                 uuid.UUID
	Name               string
	Description        string
	Category           BehaviorCategory
	PointValue         int
	MinIntervalMinutes int
	Species            Species
	Icon               string
	IsActive           bool
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// NewBehavior creates a new behavior with validation
func NewBehavior(name, description string, category BehaviorCategory, pointValue, minIntervalMinutes int, species Species, icon string) (*Behavior, error) {
	if err := validateBehaviorName(name); err != nil {
		return nil, err
	}

	if err := validatePointValue(pointValue); err != nil {
		return nil, err
	}

	if err := validateMinInterval(minIntervalMinutes); err != nil {
		return nil, err
	}

	if err := validateCategory(category); err != nil {
		return nil, err
	}

	if err := validateSpecies(species); err != nil {
		return nil, err
	}

	now := time.Now()

	return &Behavior{
		ID:                 uuid.New(),
		Name:               name,
		Description:        description,
		Category:           category,
		PointValue:         pointValue,
		MinIntervalMinutes: minIntervalMinutes,
		Species:            species,
		Icon:               icon,
		IsActive:           true,
		CreatedAt:          now,
		UpdatedAt:          now,
	}, nil
}

// IsValidForSpecies checks if behavior applies to given species
func (b *Behavior) IsValidForSpecies(species Species) bool {
	return b.Species == SpeciesBoth || b.Species == species
}

// IsPositive returns true if behavior awards positive points
func (b *Behavior) IsPositive() bool {
	return b.PointValue > 0
}

// IsNegative returns true if behavior awards negative points
func (b *Behavior) IsNegative() bool {
	return b.PointValue < 0
}

// Update updates mutable fields of the behavior
func (b *Behavior) Update(name, description string, pointValue, minIntervalMinutes int, icon string, isActive bool) error {
	if err := validateBehaviorName(name); err != nil {
		return err
	}

	if err := validatePointValue(pointValue); err != nil {
		return err
	}

	if err := validateMinInterval(minIntervalMinutes); err != nil {
		return err
	}

	b.Name = name
	b.Description = description
	b.PointValue = pointValue
	b.MinIntervalMinutes = minIntervalMinutes
	b.Icon = icon
	b.IsActive = isActive
	b.UpdatedAt = time.Now()

	return nil
}

// Validation functions

func validateBehaviorName(name string) error {
	if len(name) == 0 {
		return fmt.Errorf("behavior name is required")
	}
	if len(name) > 100 {
		return fmt.Errorf("behavior name must be 100 characters or less")
	}
	return nil
}

func validatePointValue(pointValue int) error {
	if pointValue < -10 || pointValue > 10 {
		return fmt.Errorf("point value must be between -10 and +10")
	}
	if pointValue == 0 {
		return fmt.Errorf("point value cannot be zero")
	}
	return nil
}

func validateMinInterval(minutes int) error {
	if minutes < 5 || minutes > 1440 {
		return fmt.Errorf("minimum interval must be between 5 and 1440 minutes")
	}
	return nil
}

func validateCategory(category BehaviorCategory) error {
	switch category {
	case BehaviorCategoryPottyTraining, BehaviorCategoryFeeding, BehaviorCategorySocial, BehaviorCategoryTraining, BehaviorCategoryPlay:
		return nil
	default:
		return fmt.Errorf("invalid behavior category: %s", category)
	}
}

func validateSpecies(species Species) error {
	switch species {
	case SpeciesDog, SpeciesCat, SpeciesBoth:
		return nil
	default:
		return fmt.Errorf("invalid species: %s", species)
	}
}

// GetValidCategories returns all valid behavior categories
func GetValidCategories() []BehaviorCategory {
	return []BehaviorCategory{
		BehaviorCategoryPottyTraining,
		BehaviorCategoryFeeding,
		BehaviorCategorySocial,
		BehaviorCategoryTraining,
		BehaviorCategoryPlay,
	}
}

// GetValidSpecies returns all valid species options
func GetValidSpecies() []Species {
	return []Species{
		SpeciesDog,
		SpeciesCat,
		SpeciesBoth,
	}
}