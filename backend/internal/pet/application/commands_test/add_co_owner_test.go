package commands_test

import (
	"context"
	"os"
	"pet-of-the-day/internal/pet/application/commands"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/pet/infrastructure"
	"pet-of-the-day/internal/shared/events"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func init() {
	_ = os.Setenv("GO_ENV", "test")
}

func TestAddCoOwnerHandler_Handle_Success(t *testing.T) {
	repo := infrastructure.NewMockPetRepository()
	eventBus := events.NewInMemoryBus()
	handler := commands.NewAddCoOwnerHandler(repo, eventBus)

	userID := uuid.New()
	arthas, _ := domain.NewPet(
		userID,
		"Arthas",
		domain.SpeciesDog,
		"Mini Aussie",
		time.Date(2025, time.August, 8, 0, 0, 0, 0, time.Local),
		"https://picsum.photos/200/300",
	)
	err := repo.Save(context.Background(), arthas)
	assert.NoError(t, err)

	coOwnerID := uuid.New()
	cmd := commands.AddCoOwner{
		PetID:     arthas.ID(),
		CoOwnerID: coOwnerID,
	}

	result, err := handler.Handle(context.Background(), cmd)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	assert.Truef(t, result.Success, "Added co owner should be added")
}

func TestAddCoOwnerHandler_Handle_PetNotFound(t *testing.T) {
	repo := infrastructure.NewMockPetRepository()
	eventBus := events.NewInMemoryBus()
	handler := commands.NewAddCoOwnerHandler(repo, eventBus)

	petID := uuid.New()
	arthas, _ := domain.NewPet(
		petID,
		"Arthas",
		domain.SpeciesDog,
		"Mini Aussie",
		time.Date(2025, time.August, 8, 0, 0, 0, 0, time.Local),
		"https://picsum.photos/200/300",
	)
	err := repo.Save(context.Background(), arthas)
	assert.NoError(t, err)

	coOwnerID := uuid.New()
	cmd := commands.AddCoOwner{
		PetID:     uuid.New(),
		CoOwnerID: coOwnerID,
	}
	result, _ := handler.Handle(context.Background(), cmd)
	assert.Errorf(t, domain.ErrPetNotFound, "Expected pet not found")
	assert.Nil(t, result)
}
