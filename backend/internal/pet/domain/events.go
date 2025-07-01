package domain

import (
	"github.com/google/uuid"
	"pet-of-the-day/internal/shared/events"
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
