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

func TestGetPetByIDHandler_Handle_Success(t *testing.T) {
	repo := infrastructure.NewMockPetRepository()
	handler := queries.NewGetPetByIDHandler(repo)

	ownerID := uuid.New()
	pet, _ := domain.NewPet(
		ownerID,
		"Arthas",
		domain.SpeciesDog,
		"Mini Aussie",
		time.Date(2025, time.August, 8, 0, 0, 0, 0, time.Local),
		"https://picsum.photos/200/300",
	)

	err := repo.Save(context.Background(), pet)
	assert.NoError(t, err)

	query := queries.GetPetById{
		PetID: pet.ID(),
	}

	result, err := handler.Handle(context.Background(), query)
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, pet.ID(), result.ID)
	assert.Equal(t, "Arthas", result.Name)
	assert.Equal(t, string(domain.SpeciesDog), result.Species)
	assert.Equal(t, ownerID, result.OwnerID)
	assert.Empty(t, result.CoOwnerIDs)
}

func TestGetPetByIDHandler_Handle_Empty(t *testing.T) {
	repo := infrastructure.NewMockPetRepository()
	handler := queries.NewGetPetByIDHandler(repo)

	query := queries.GetPetById{
		PetID: uuid.New(),
	}

	result, err := handler.Handle(context.Background(), query)
	assert.ErrorIs(t, err, domain.ErrPetNotFound)
	assert.Nil(t, result)
}
