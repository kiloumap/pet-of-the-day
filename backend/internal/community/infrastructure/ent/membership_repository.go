package ent

import (
	"context"
	"pet-of-the-day/ent"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

// EntMembershipRepository implements the MembershipRepository interface using Ent
type EntMembershipRepository struct {
	client *ent.Client
}

func NewEntMembershipRepository(client *ent.Client) *EntMembershipRepository {
	return &EntMembershipRepository{
		client: client,
	}
}

func (r *EntMembershipRepository) Save(ctx context.Context, membership *domain.Membership) error {
	// TODO: Implement with Ent once we update the schema
	panic("not implemented - requires Ent schema update")
}

func (r *EntMembershipRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Membership, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntMembershipRepository) FindByGroupAndUser(ctx context.Context, groupID, userID uuid.UUID) (*domain.Membership, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntMembershipRepository) FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Membership, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntMembershipRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Membership, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntMembershipRepository) FindActiveByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Membership, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntMembershipRepository) FindActiveByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Membership, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntMembershipRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

// MockMembershipRepository provides in-memory implementation for testing
type MockMembershipRepository struct {
	memberships map[uuid.UUID]*domain.Membership
}

func NewMockMembershipRepository() *MockMembershipRepository {
	return &MockMembershipRepository{
		memberships: make(map[uuid.UUID]*domain.Membership),
	}
}

func (r *MockMembershipRepository) Save(ctx context.Context, membership *domain.Membership) error {
	r.memberships[membership.ID()] = membership
	return nil
}

func (r *MockMembershipRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Membership, error) {
	membership, exists := r.memberships[id]
	if !exists {
		return nil, domain.ErrMembershipNotFound
	}
	return membership, nil
}

func (r *MockMembershipRepository) FindByGroupAndUser(ctx context.Context, groupID, userID uuid.UUID) (*domain.Membership, error) {
	for _, membership := range r.memberships {
		if membership.GroupID() == groupID && membership.UserID() == userID {
			return membership, nil
		}
	}
	return nil, domain.ErrMembershipNotFound
}

func (r *MockMembershipRepository) FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Membership, error) {
	var memberships []*domain.Membership
	for _, membership := range r.memberships {
		if membership.GroupID() == groupID {
			memberships = append(memberships, membership)
		}
	}
	return memberships, nil
}

func (r *MockMembershipRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Membership, error) {
	var memberships []*domain.Membership
	for _, membership := range r.memberships {
		if membership.UserID() == userID {
			memberships = append(memberships, membership)
		}
	}
	return memberships, nil
}

func (r *MockMembershipRepository) FindActiveByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Membership, error) {
	var memberships []*domain.Membership
	for _, membership := range r.memberships {
		if membership.UserID() == userID && membership.IsActive() {
			memberships = append(memberships, membership)
		}
	}
	return memberships, nil
}

func (r *MockMembershipRepository) FindActiveByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Membership, error) {
	var memberships []*domain.Membership
	for _, membership := range r.memberships {
		if membership.GroupID() == groupID && membership.IsActive() {
			memberships = append(memberships, membership)
		}
	}
	return memberships, nil
}

func (r *MockMembershipRepository) Delete(ctx context.Context, id uuid.UUID) error {
	delete(r.memberships, id)
	return nil
}