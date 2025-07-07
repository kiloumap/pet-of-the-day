package queries_test

import (
	"context"
	"os"
	"pet-of-the-day/internal/pet/application/queries"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/pet/infrastructure"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func init() {
	_ = os.Setenv("GO_ENV", "test")
}

func TestGetCoOwnedPets_Handle_Success(t *testing.T) {
	repo := infrastructure.NewMockPetRepository()
	handler := queries.NewGetCoOwnedPetsHandler(repo)

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

	otherUserID := uuid.New()
	archie, _ := domain.NewPet(
		otherUserID,
		"Archie",
		domain.SpeciesDog,
		"Corgi",
		time.Date(2020, time.August, 26, 0, 0, 0, 0, time.Local),
		"https://picsum.photos/200/300",
	)

	err = repo.Save(context.Background(), archie)
	assert.NoError(t, err)
	err = repo.AddCoOwner(context.Background(), archie.ID(), userID)
	assert.NoError(t, err)

	query := queries.GetCoOwnedPets{
		UserID: userID,
	}
	result, _ := handler.Handle(context.Background(), query)

	assert.NotNilf(t, result, "Should not be nil")
	assert.Equalf(t, otherUserID, result.Pets[0].OwnerID(), "pet owner id should be equal")
	assert.Equalf(t, "Archie", result.Pets[0].Name(), "Name should be Archie")
	assert.Lenf(t, result.Pets, 1, "pet count should be equal")
}

func TestGetCoOwnedPets_Handle_Empty(t *testing.T) {
	repo := infrastructure.NewMockPetRepository()
	handler := queries.NewGetOwnedPetsHandler(repo)

	query := queries.GetOwnedPets{
		UserID: uuid.New(),
	}

	result, err := handler.Handle(context.Background(), query)
	assert.NoError(t, err)
	assert.NotNilf(t, result, "Should not be nil")
	assert.Lenf(t, result.Pets, 0, "pet count should be equal")
}
