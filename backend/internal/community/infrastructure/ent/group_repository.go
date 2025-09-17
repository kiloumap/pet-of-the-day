package ent

import (
	"context"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

// EntGroupRepository implements the GroupRepository interface using Ent
type EntGroupRepository struct {
	// We'll inject the Ent client here
	// For now, we'll create a mock implementation
}

func NewEntGroupRepository() *EntGroupRepository {
	return &EntGroupRepository{}
}

func (r *EntGroupRepository) Save(ctx context.Context, group *domain.Group) error {
	// TODO: Implement with Ent once we update the schema
	// This would typically:
	// 1. Check if group exists (by ID)
	// 2. If exists, update; if not, create
	// 3. Map domain entity to Ent entity
	// 4. Save to database
	panic("not implemented - requires Ent schema update")
}

func (r *EntGroupRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Group, error) {
	// TODO: Implement with Ent
	// 1. Query database by ID
	// 2. Map Ent entity to domain entity using ReconstructGroup
	panic("not implemented - requires Ent schema update")
}

func (r *EntGroupRepository) FindByCreatorID(ctx context.Context, creatorID uuid.UUID) ([]*domain.Group, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntGroupRepository) FindByName(ctx context.Context, name string) (*domain.Group, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntGroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

// MockGroupRepository provides in-memory implementation for testing
type MockGroupRepository struct {
	groups map[uuid.UUID]*domain.Group
}

func NewMockGroupRepository() *MockGroupRepository {
	return &MockGroupRepository{
		groups: make(map[uuid.UUID]*domain.Group),
	}
}

func (r *MockGroupRepository) Save(ctx context.Context, group *domain.Group) error {
	r.groups[group.ID()] = group
	return nil
}

func (r *MockGroupRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Group, error) {
	group, exists := r.groups[id]
	if !exists {
		return nil, domain.ErrGroupNotFound
	}
	return group, nil
}

func (r *MockGroupRepository) FindByCreatorID(ctx context.Context, creatorID uuid.UUID) ([]*domain.Group, error) {
	var groups []*domain.Group
	for _, group := range r.groups {
		if group.CreatorID() == creatorID {
			groups = append(groups, group)
		}
	}
	return groups, nil
}

func (r *MockGroupRepository) FindByName(ctx context.Context, name string) (*domain.Group, error) {
	for _, group := range r.groups {
		if group.Name() == name {
			return group, nil
		}
	}
	return nil, domain.ErrGroupNotFound
}

func (r *MockGroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	delete(r.groups, id)
	return nil
}