package domain_test

import (
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"

	"pet-of-the-day/internal/pet/domain"
)

func TestNewPet_Success(t *testing.T) {
	id := uuid.New()
	pet, err := domain.NewPet(id, "Arthas", domain.SpeciesDog, "aussie", time.Now(), "https://picsum.photos/200/300")

	assert.NoErrorf(t, err, "Expected no error, got %v", err)
	assert.Equal(t, "Arthas", pet.Name())
	assert.Equal(t, "dog", string(pet.Species()))
	assert.Equal(t, id, pet.OwnerID())

	events := pet.DomainEvents()
	assert.Len(t, events, 1)
	assert.Equal(t, domain.PetRegisteredEventType, events[0].EventType())
}

func TestNewPet_InvalidName(t *testing.T) {
	_, err := domain.NewPet(uuid.New(), "", "dog", "aussie", time.Now(), "https://picsum.photos/200/300")

	assert.Errorf(t, err, "Expected ErrPetInvalidName, got %v", err)
}

func TestNewUser_InvalidSpecies(t *testing.T) {
	_, err := domain.NewPet(uuid.New(), "Arthas", "dragon", "aussie", time.Now(), "https://picsum.photos/200/300")

	assert.Errorf(t, err, "Expected ErrPetInvalidSpecies, got %v", err)

}
