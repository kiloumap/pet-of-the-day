package commands_test

import (
	"context"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"os"
	"pet-of-the-day/internal/pet/application/commands"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/pet/infrastructure"
	"pet-of-the-day/internal/shared/events"
	"testing"
	"time"
)

func init() {
	os.Setenv("GO_ENV", "test")
}

func TestAddPetHandler_Handle_Success(t *testing.T) {
	repo := infrastructure.NewMockPetRepository()
	eventBus := events.NewInMemoryBus()
	handler := commands.NewAddPetHandler(repo, eventBus)

	cmd := commands.AddPet{
		OwnerID:   uuid.New(),
		Name:      "Arthas",
		Species:   "dog",
		Breed:     "Mini Aussi",
		BirthDate: time.Date(2025, time.August, 8, 0, 0, 0, 0, time.Local),
		PhotoURL:  "https://picsum.photos/200/300",
	}

	result, err := handler.Handle(context.Background(), cmd)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if result == nil {
		t.Fatal("Expected result, got nil")
	}

	pet, err := repo.FindByID(context.Background(), result.PetId)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if pet.Name() != cmd.Name {
		t.Errorf("Expected pet name %s, got %s", cmd.Name, pet.Name())
	}
}

func TestAddPetHandler_Handle_PetAlreadyExists(t *testing.T) {
	repo := infrastructure.NewMockPetRepository()
	eventBus := events.NewInMemoryBus()
	handler := commands.NewAddPetHandler(repo, eventBus)

	ownerID := uuid.New()

	existingPet, _ := domain.NewPet(ownerID, "Arthas", "dog", "Aussi", time.Time{}, "https://picsum.photos/200/300")
	_ = repo.Save(context.Background(), existingPet)

	cmd := commands.AddPet{
		OwnerID:   existingPet.OwnerID(),
		Name:      "Arthas",
		Species:   domain.Species("dog"),
		Breed:     "Mini Aussi",
		BirthDate: time.Date(2025, time.August, 8, 0, 0, 0, 0, time.Local),
		PhotoURL:  "https://picsum.photos/200/300",
	}

	result, err := handler.Handle(context.Background(), cmd)

	assert.ErrorIs(t, err, domain.ErrPetAlreadyExist)
	assert.Nil(t, result)
	assert.Equal(t, domain.ErrPetAlreadyExist, err)
}

func TestAddPetHandler_Handle_InvalidName(t *testing.T) {
	repo := infrastructure.NewMockPetRepository()
	eventBus := events.NewInMemoryBus()
	handler := commands.NewAddPetHandler(repo, eventBus)

	cmd := commands.AddPet{
		OwnerID:   uuid.New(),
		Name:      "",
		Species:   domain.Species("dog"),
		Breed:     "Mini Aussi",
		BirthDate: time.Date(2025, time.August, 8, 0, 0, 0, 0, time.Local),
		PhotoURL:  "https://picsum.photos/200/300",
	}

	result, err := handler.Handle(context.Background(), cmd)

	assert.ErrorIs(t, err, domain.ErrPetInvalidName)
	assert.Nil(t, result)
	assert.Equal(t, domain.ErrPetInvalidName, err)
}
