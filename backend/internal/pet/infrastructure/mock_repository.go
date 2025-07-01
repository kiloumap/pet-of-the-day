package infrastructure

import (
	"context"
	"sync"

	"pet-of-the-day/internal/pet/domain"

	"github.com/google/uuid"
)

// MockPetRepository implements domain.Repository for testing without Ent
type MockPetRepository struct {
	mu    sync.RWMutex
	pets  map[uuid.UUID]*domain.Pet
	owner map[string]uuid.UUID
}

func NewMockPetRepository() *MockPetRepository {
	return &MockPetRepository{
		pets: make(map[uuid.UUID]*domain.Pet),
	}
}

func (m MockPetRepository) Save(ctx context.Context, pet *domain.Pet) error {
	//TODO implement me
	panic("implement me")
}

func (m MockPetRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Pet, error) {
	//TODO implement me
	panic("implement me")
}

func (m MockPetRepository) FindOneByOwnerId(ctx context.Context, ownerId uuid.UUID, name string) (*domain.Pet, error) {
	//TODO implement me
	panic("implement me")
}

func (m MockPetRepository) FindAllPetsByOwnerId(ctx context.Context, ownerId uuid.UUID) ([]*domain.Pet, error) {
	//TODO implement me
	panic("implement me")
}

func (m MockPetRepository) FindAllPetsByUserID(ctx context.Context, ownerId uuid.UUID) ([]*domain.Pet, error) {
	//TODO implement me
	panic("implement me")
}

func (m MockPetRepository) ExistsByOwnerId(ctx context.Context, ownerId uuid.UUID, name string) (bool, error) {
	//TODO implement me
	panic("implement me")
}

func (m MockPetRepository) GetCoOwnersByPetID(ctx context.Context, petID uuid.UUID) ([]uuid.UUID, error) {
	//TODO implement me
	panic("implement me")
}
