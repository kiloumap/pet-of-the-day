package domain

import (
	"time"

	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
)

type Pet struct {
	id        uuid.UUID
	ownerID   uuid.UUID
	name      string
	species   Species
	breed     string
	birthDate time.Time
	photoUrl  string
	createdAt time.Time
	updatedAt time.Time

	events []events.Event
}

func NewPet(ownerId uuid.UUID, name string, species Species, breed string, birthDate time.Time, photoUrl string) (*Pet, error) {
	if name == "" {
		return nil, ErrInvalidName
	}

	if !species.IsValid() {
		return nil, ErrInvalidSpecies
	}
	pet := &Pet{
		id:        uuid.UUID{},
		ownerID:   ownerId,
		name:      name,
		species:   species,
		breed:     breed,
		birthDate: birthDate,
		photoUrl:  photoUrl,
		createdAt: time.Time{},
		updatedAt: time.Time{},
	}

	// @fixme maybe delay the event after the persistance
	pet.recordEvent(NewPetRegisteredEvent(pet.id, pet.name))
	return pet, nil
}

// ReconstructPet reconstructs a Pet from persistence data
func ReconstructPet(
	id uuid.UUID,
	ownerId uuid.UUID,
	name string,
	species Species,
	breed string,
	birthDate time.Time,
	photoUrl string,
	createdAt, updatedAt time.Time,
) *Pet {
	return &Pet{
		id:        id,
		ownerID:   ownerId,
		name:      name,
		species:   species,
		breed:     breed,
		birthDate: birthDate,
		photoUrl:  photoUrl,
		createdAt: createdAt,
		updatedAt: updatedAt,
		events:    nil, // No events when reconstructing from DB
	}
}

func (pet *Pet) recordEvent(event events.Event) {
	pet.events = append(pet.events, event)
}

func (pet *Pet) DomainEvents() []events.Event {
	return pet.events
}

func (pet *Pet) ClearEvents() {
	pet.events = nil
}

// Getters
func (pet *Pet) ID() uuid.UUID        { return pet.id }
func (pet *Pet) OwnerID() uuid.UUID   { return pet.ownerID }
func (pet *Pet) Name() string         { return pet.name }
func (pet *Pet) Species() Species     { return pet.species }
func (pet *Pet) Breed() string        { return pet.breed }
func (pet *Pet) PhotoUrl() string     { return pet.photoUrl }
func (pet *Pet) BirthDate() time.Time { return pet.birthDate }
func (pet *Pet) CreatedAt() time.Time { return pet.createdAt }
func (pet *Pet) UpdatedAt() time.Time { return pet.updatedAt }
