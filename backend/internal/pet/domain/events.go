package domain

import (
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

const (
	PetRegisteredEventType             = "pet.registered"
	PersonalityTraitAddedEventType     = "pet.personality_trait_added"
	PersonalityTraitUpdatedEventType   = "pet.personality_trait_updated"
	PersonalityTraitDeletedEventType   = "pet.personality_trait_deleted"
)

type PetRegisteredEvent struct {
	events.BaseEvent
	Name string `json:"name"`
}

func NewPetRegisteredEvent(id uuid.UUID, name string) PetRegisteredEvent {
	return PetRegisteredEvent{
		BaseEvent: events.NewBaseEvent(PetRegisteredEventType, id),
		Name:      name,
	}
}

// Personality trait events

type PersonalityTraitAddedEvent struct {
	events.BaseEvent
	TraitType string `json:"trait_type"`
}

func NewPersonalityTraitAddedEvent(petID uuid.UUID, traitType string) PersonalityTraitAddedEvent {
	return PersonalityTraitAddedEvent{
		BaseEvent: events.NewBaseEvent(PersonalityTraitAddedEventType, petID),
		TraitType: traitType,
	}
}

type PersonalityTraitUpdatedEvent struct {
	events.BaseEvent
	TraitID uuid.UUID `json:"trait_id"`
}

func NewPersonalityTraitUpdatedEvent(petID, traitID uuid.UUID) PersonalityTraitUpdatedEvent {
	return PersonalityTraitUpdatedEvent{
		BaseEvent: events.NewBaseEvent(PersonalityTraitUpdatedEventType, petID),
		TraitID:   traitID,
	}
}

type PersonalityTraitDeletedEvent struct {
	events.BaseEvent
	TraitID uuid.UUID `json:"trait_id"`
}

func NewPersonalityTraitDeletedEvent(petID, traitID uuid.UUID) PersonalityTraitDeletedEvent {
	return PersonalityTraitDeletedEvent{
		BaseEvent: events.NewBaseEvent(PersonalityTraitDeletedEventType, petID),
		TraitID:   traitID,
	}
}
