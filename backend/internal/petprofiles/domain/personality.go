package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvalidIntensityLevel      = errors.New("intensity level must be between 1 and 5")
	ErrInvalidTraitData          = errors.New("either trait_type or custom_trait must be provided, not both")
	ErrCustomTraitTooLong        = errors.New("custom trait cannot exceed 100 characters")
	ErrInvalidTraitType          = errors.New("invalid trait type")
	ErrPersonalityTraitNotFound  = errors.New("personality trait not found")
)

// TraitType represents predefined personality trait types
type TraitType string

const (
	TraitTypePlayful     TraitType = "playful"
	TraitTypeCalm        TraitType = "calm"
	TraitTypeEnergetic   TraitType = "energetic"
	TraitTypeShy         TraitType = "shy"
	TraitTypeAggressive  TraitType = "aggressive"
	TraitTypeFriendly    TraitType = "friendly"
	TraitTypeAnxious     TraitType = "anxious"
	TraitTypeConfident   TraitType = "confident"
	TraitTypeSocial      TraitType = "social"
	TraitTypeIndependent TraitType = "independent"
)

// ValidTraitTypes contains all valid predefined trait types
var ValidTraitTypes = map[TraitType]bool{
	TraitTypePlayful:     true,
	TraitTypeCalm:        true,
	TraitTypeEnergetic:   true,
	TraitTypeShy:         true,
	TraitTypeAggressive:  true,
	TraitTypeFriendly:    true,
	TraitTypeAnxious:     true,
	TraitTypeConfident:   true,
	TraitTypeSocial:      true,
	TraitTypeIndependent: true,
}

// PetPersonality represents a personality trait assigned to a pet
type PetPersonality struct {
	id             uuid.UUID
	petID          uuid.UUID
	traitType      *TraitType // Optional predefined trait
	customTrait    *string    // Optional custom trait
	intensityLevel int        // 1-5 range
	notes          string     // Optional notes
	addedBy        uuid.UUID  // User who added this trait
	createdAt      time.Time
	updatedAt      time.Time
}

// NewPetPersonality creates a new PetPersonality with predefined trait type
func NewPetPersonality(
	petID uuid.UUID,
	traitType TraitType,
	intensityLevel int,
	notes string,
	addedBy uuid.UUID,
) (*PetPersonality, error) {
	if err := validateIntensityLevel(intensityLevel); err != nil {
		return nil, err
	}

	if !ValidTraitTypes[traitType] {
		return nil, ErrInvalidTraitType
	}

	now := time.Now()
	return &PetPersonality{
		id:             uuid.New(),
		petID:          petID,
		traitType:      &traitType,
		customTrait:    nil,
		intensityLevel: intensityLevel,
		notes:          notes,
		addedBy:        addedBy,
		createdAt:      now,
		updatedAt:      now,
	}, nil
}

// NewCustomPetPersonality creates a new PetPersonality with custom trait
func NewCustomPetPersonality(
	petID uuid.UUID,
	customTrait string,
	intensityLevel int,
	notes string,
	addedBy uuid.UUID,
) (*PetPersonality, error) {
	if err := validateIntensityLevel(intensityLevel); err != nil {
		return nil, err
	}

	if len(customTrait) == 0 {
		return nil, ErrInvalidTraitData
	}

	if len(customTrait) > 100 {
		return nil, ErrCustomTraitTooLong
	}

	now := time.Now()
	return &PetPersonality{
		id:             uuid.New(),
		petID:          petID,
		traitType:      nil,
		customTrait:    &customTrait,
		intensityLevel: intensityLevel,
		notes:          notes,
		addedBy:        addedBy,
		createdAt:      now,
		updatedAt:      now,
	}, nil
}

// UpdateIntensity updates the intensity level of the trait
func (p *PetPersonality) UpdateIntensity(intensityLevel int, updatedBy uuid.UUID) error {
	if err := validateIntensityLevel(intensityLevel); err != nil {
		return err
	}

	p.intensityLevel = intensityLevel
	p.updatedAt = time.Now()
	return nil
}

// UpdateNotes updates the notes for the trait
func (p *PetPersonality) UpdateNotes(notes string) {
	p.notes = notes
	p.updatedAt = time.Now()
}

// Getters
func (p *PetPersonality) ID() uuid.UUID {
	return p.id
}

func (p *PetPersonality) PetID() uuid.UUID {
	return p.petID
}

func (p *PetPersonality) TraitType() *TraitType {
	return p.traitType
}

func (p *PetPersonality) CustomTrait() *string {
	return p.customTrait
}

func (p *PetPersonality) IntensityLevel() int {
	return p.intensityLevel
}

func (p *PetPersonality) Notes() string {
	return p.notes
}

func (p *PetPersonality) AddedBy() uuid.UUID {
	return p.addedBy
}

func (p *PetPersonality) CreatedAt() time.Time {
	return p.createdAt
}

func (p *PetPersonality) UpdatedAt() time.Time {
	return p.updatedAt
}

// IsCustomTrait returns true if this is a custom trait (not predefined)
func (p *PetPersonality) IsCustomTrait() bool {
	return p.customTrait != nil
}

// TraitName returns the display name of the trait (either predefined or custom)
func (p *PetPersonality) TraitName() string {
	if p.traitType != nil {
		return string(*p.traitType)
	}
	if p.customTrait != nil {
		return *p.customTrait
	}
	return ""
}

// validateIntensityLevel validates that intensity level is within valid range
func validateIntensityLevel(level int) error {
	if level < 1 || level > 5 {
		return ErrInvalidIntensityLevel
	}
	return nil
}