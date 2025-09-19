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
		return nil, ErrPetInvalidName
	}

	if !species.IsValid() {
		return nil, ErrPetInvalidSpecies
	}

	now := time.Now()

	pet := &Pet{
		id:        uuid.New(),
		ownerID:   ownerId,
		name:      name,
		species:   species,
		breed:     breed,
		birthDate: birthDate,
		photoUrl:  photoUrl,
		createdAt: now,
		updatedAt: now,
	}

	// @fixme maybe delay the event after the persistence
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

func (p *Pet) recordEvent(event events.Event) {
	p.events = append(p.events, event)
}

func (p *Pet) DomainEvents() []events.Event {
	return p.events
}

func (p *Pet) ClearEvents() {
	p.events = nil
}

// Getters
func (p *Pet) ID() uuid.UUID        { return p.id }
func (p *Pet) OwnerID() uuid.UUID   { return p.ownerID }
func (p *Pet) Name() string         { return p.name }
func (p *Pet) Species() Species     { return p.species }
func (p *Pet) Breed() string        { return p.breed }
func (p *Pet) PhotoUrl() string     { return p.photoUrl }
func (p *Pet) BirthDate() time.Time { return p.birthDate }
func (p *Pet) CreatedAt() time.Time { return p.createdAt }
func (p *Pet) UpdatedAt() time.Time { return p.updatedAt }
func (p *Pet) PhotoURL() string   { return p.photoUrl }

// Update methods
func (p *Pet) UpdateName(name string) error {
	if name == "" {
		return ErrPetInvalidName
	}
	p.name = name
	p.updatedAt = time.Now()
	return nil
}

func (p *Pet) UpdateSpecies(species string) error {
	spec, err := NewSpecies(species)
	if err != nil {
		return err
	}
	p.species = spec
	p.updatedAt = time.Now()
	return nil
}

func (p *Pet) UpdateBreed(breed string) {
	p.breed = breed
	p.updatedAt = time.Now()
}

func (p *Pet) UpdateBirthDate(birthDate string) {
	if birthDate != "" {
		if parsed, err := time.Parse("2006-01-02", birthDate); err == nil {
			p.birthDate = parsed
		}
	}
	p.updatedAt = time.Now()
}

func (p *Pet) UpdatePhotoURL(photoUrl string) {
	p.photoUrl = photoUrl
	p.updatedAt = time.Now()
}
