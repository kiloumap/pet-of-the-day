package infrastructure

import (
	"context"

	"pet-of-the-day/internal/pet/domain"
	"sync"

	"github.com/google/uuid"
)

// MockPetRepository implements domain.Repository for testing without Ent
type MockPetRepository struct {
	mu       sync.RWMutex
	pets     map[uuid.UUID]*domain.Pet
	coOwners map[uuid.UUID][]uuid.UUID
}

func NewMockPetRepository() *MockPetRepository {
	return &MockPetRepository{
		pets:     make(map[uuid.UUID]*domain.Pet),
		coOwners: make(map[uuid.UUID][]uuid.UUID),
	}
}

func (r *MockPetRepository) Save(ctx context.Context, pet *domain.Pet, ownerID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.pets[pet.ID()] = pet

	return nil
}

func (r *MockPetRepository) AddCoOwner(ctx context.Context, petID uuid.UUID, userID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.pets[petID]; !exists {
		return domain.ErrPetNotFound
	}

	for _, existingID := range r.coOwners[petID] {
		if existingID == userID {
			return nil
		}
	}

	r.coOwners[petID] = append(r.coOwners[petID], userID)
	return nil
}

func (r *MockPetRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Pet, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	pet, exists := r.pets[id]
	if !exists {
		return nil, domain.ErrPetNotFound
	}

	return pet, nil
}

func (r *MockPetRepository) FindOneByOwnerIdAndName(ctx context.Context, ownerId uuid.UUID, name string) (*domain.Pet, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, pet := range r.pets {
		if pet.OwnerID() == ownerId && pet.Name() == name {
			return pet, nil
		}
	}

	return nil, domain.ErrPetNotFound
}

func (r *MockPetRepository) FindAllPetsByOwnerId(ctx context.Context, ownerId uuid.UUID) ([]*domain.Pet, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var pets []*domain.Pet

	for _, pet := range r.pets {
		if pet.OwnerID() == ownerId {
			pets = append(pets, pet)
		}
	}

	return pets, nil
}

func (r *MockPetRepository) FindAllPetsByCoOwnerID(ctx context.Context, coOwnerID uuid.UUID) ([]*domain.Pet, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var pets []*domain.Pet

	for petID, coOwnerIDs := range r.coOwners {
		for _, id := range coOwnerIDs {
			if id == coOwnerID {
				if pet, exists := r.pets[petID]; exists {
					pets = append(pets, pet)
				}
				break
			}
		}
	}

	return pets, nil
}

func (r *MockPetRepository) ExistsByOwnerId(ctx context.Context, ownerId uuid.UUID, name string) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, pet := range r.pets {
		if pet.OwnerID() == ownerId && pet.Name() == name {
			return true, nil
		}
	}

	return false, nil
}

func (r *MockPetRepository) GetCoOwnersByPetID(ctx context.Context, petID uuid.UUID) ([]uuid.UUID, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	_, exists := r.pets[petID]
	if !exists {
		return nil, domain.ErrPetNotFound
	}

	return r.coOwners[petID], nil
}
