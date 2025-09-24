package infrastructure

import (
	"context"
	"sync"

	"pet-of-the-day/internal/shared/types"
	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

// MockUserRepository implements domain.Repository for testing without Ent
type MockUserRepository struct {
	mu     sync.RWMutex
	users  map[uuid.UUID]*domain.User
	emails map[string]uuid.UUID
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		users:  make(map[uuid.UUID]*domain.User),
		emails: make(map[string]uuid.UUID),
	}
}

func (r *MockUserRepository) Save(ctx context.Context, user *domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.users[user.ID()] = user
	r.emails[user.Email().String()] = user.ID()

	return nil
}

func (r *MockUserRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	user, exists := r.users[id]
	if !exists {
		return nil, domain.ErrUserNotFound
	}

	return user, nil
}

func (r *MockUserRepository) FindByEmail(ctx context.Context, email types.Email) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	userID, exists := r.emails[email.String()]
	if !exists {
		return nil, domain.ErrUserNotFound
	}

	return r.users[userID], nil
}

func (r *MockUserRepository) ExistsByEmail(ctx context.Context, email types.Email) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	_, exists := r.emails[email.String()]
	return exists, nil
}

// MockCoOwnershipRepository implements domain.CoOwnershipRepository for testing without Ent
type MockCoOwnershipRepository struct {
	mu        sync.RWMutex
	requests  map[uuid.UUID]*domain.CoOwnershipRequest
}

func NewMockCoOwnershipRepository() *MockCoOwnershipRepository {
	return &MockCoOwnershipRepository{
		requests: make(map[uuid.UUID]*domain.CoOwnershipRequest),
	}
}

func (r *MockCoOwnershipRepository) SaveCoOwnershipRequest(ctx context.Context, request *domain.CoOwnershipRequest) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.requests[request.ID()] = request
	return nil
}

func (r *MockCoOwnershipRepository) FindCoOwnershipRequestByID(ctx context.Context, id uuid.UUID) (*domain.CoOwnershipRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	request, exists := r.requests[id]
	if !exists {
		return nil, domain.ErrCoOwnershipNotFound
	}

	return request, nil
}

func (r *MockCoOwnershipRepository) FindCoOwnershipRequestsByPet(ctx context.Context, petID uuid.UUID) ([]*domain.CoOwnershipRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var requests []*domain.CoOwnershipRequest
	for _, request := range r.requests {
		if request.PetID() == petID {
			requests = append(requests, request)
		}
	}

	return requests, nil
}

func (r *MockCoOwnershipRepository) FindCoOwnershipRequestsByCoOwner(ctx context.Context, userID uuid.UUID) ([]*domain.CoOwnershipRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var requests []*domain.CoOwnershipRequest
	for _, request := range r.requests {
		if request.CoOwnerID() == userID {
			requests = append(requests, request)
		}
	}

	return requests, nil
}

func (r *MockCoOwnershipRepository) FindActiveCoOwnersByPet(ctx context.Context, petID uuid.UUID) ([]uuid.UUID, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var coOwners []uuid.UUID
	for _, request := range r.requests {
		if request.PetID() == petID && request.Status() == domain.CoOwnershipStatusActive {
			coOwners = append(coOwners, request.CoOwnerID())
		}
	}

	return coOwners, nil
}

func (r *MockCoOwnershipRepository) HasActiveCoOwnership(ctx context.Context, petID, userID uuid.UUID) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, request := range r.requests {
		if request.PetID() == petID && request.CoOwnerID() == userID && request.Status() == domain.CoOwnershipStatusActive {
			return true, nil
		}
	}

	return false, nil
}

func (r *MockCoOwnershipRepository) DeleteCoOwnershipRequest(ctx context.Context, id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.requests[id]; !exists {
		return domain.ErrCoOwnershipNotFound
	}

	delete(r.requests, id)
	return nil
}
