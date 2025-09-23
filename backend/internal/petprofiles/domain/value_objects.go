package domain

import (
	"time"

	"github.com/google/uuid"
)

// AddPersonalityTraitRequest represents the request to add a personality trait
type AddPersonalityTraitRequest struct {
	TraitType      *string `json:"trait_type,omitempty"`      // Optional predefined trait
	CustomTrait    *string `json:"custom_trait,omitempty"`    // Optional custom trait
	IntensityLevel int     `json:"intensity_level"`           // Required, 1-5
	Notes          string  `json:"notes,omitempty"`           // Optional notes
}

// UpdatePersonalityTraitRequest represents the request to update a personality trait
type UpdatePersonalityTraitRequest struct {
	IntensityLevel *int    `json:"intensity_level,omitempty"` // Optional intensity update
	Notes          *string `json:"notes,omitempty"`           // Optional notes update
}

// PersonalityTraitResponse represents the response for a personality trait
type PersonalityTraitResponse struct {
	ID             uuid.UUID  `json:"id"`
	TraitType      *string    `json:"trait_type,omitempty"`
	CustomTrait    *string    `json:"custom_trait,omitempty"`
	IntensityLevel int        `json:"intensity_level"`
	Notes          string     `json:"notes,omitempty"`
	AddedBy        uuid.UUID  `json:"added_by"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// PetPersonalityListResponse represents a list of personality traits
type PetPersonalityListResponse struct {
	Traits []PersonalityTraitResponse `json:"traits"`
	Total  int                        `json:"total"`
}

// ToResponse converts a PetPersonality domain entity to a response DTO
func (p *PetPersonality) ToResponse() PersonalityTraitResponse {
	var traitType *string
	if p.traitType != nil {
		s := string(*p.traitType)
		traitType = &s
	}

	return PersonalityTraitResponse{
		ID:             p.id,
		TraitType:      traitType,
		CustomTrait:    p.customTrait,
		IntensityLevel: p.intensityLevel,
		Notes:          p.notes,
		AddedBy:        p.addedBy,
		CreatedAt:      p.createdAt,
		UpdatedAt:      p.updatedAt,
	}
}