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
