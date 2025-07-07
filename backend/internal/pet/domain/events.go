package domain

import (
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

const (
	PetRegisteredEventType = "pet.registered"
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
