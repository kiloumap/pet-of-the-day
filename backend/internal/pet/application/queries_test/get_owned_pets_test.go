package queries_test

import (
	"context"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"os"
	"pet-of-the-day/internal/pet/application/queries"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/pet/infrastructure"
	"testing"
	"time"
)

func init() {
	os.Setenv("GO_ENV", "test")
}

func TestGetOwnedPets_Handle_Success(t *testing.T) {
	repo := infrastructure.NewMockPetRepository()
	handler := queries.NewGetOwnedPetsHandler(repo)

	ownerID := uuid.New()
	arthas, _ := domain.NewPet(
		ownerID,
		"Arthas",
		domain.SpeciesDog,
		"Mini Aussie",
		time.Date(2025, time.August, 8, 0, 0, 0, 0, time.Local),
		"https://picsum.photos/200/300",
	)

	err := repo.Save(context.Background(), arthas)
	assert.NoError(t, err)

	archie, _ := domain.NewPet(
		ownerID,
		"Archie",
		domain.SpeciesDog,
		"Corgi",
		time.Date(2020, time.August, 26, 0, 0, 0, 0, time.Local),
		"https://picsum.photos/200/300",
	)

	err = repo.Save(context.Background(), archie)
	assert.NoError(t, err)

	query := queries.GetOwnedPets{
		UserID: ownerID,
	}
	result, err := handler.Handle(context.Background(), query)

	assert.NotNilf(t, result, "Should not be nil")
	assert.Equalf(t, ownerID, result.Pets[0].OwnerID(), "pet owner id should be equal")
	assert.Equalf(t, "Arthas", result.Pets[0].Name(), "Name should be Arthas")
	assert.Equalf(t, "Archie", result.Pets[1].Name(), "Name should be Archie")
	assert.Lenf(t, result.Pets, 2, "pet count should be equal")
}

func TestGetOwnedPets_Handle_Empty(t *testing.T) {
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
