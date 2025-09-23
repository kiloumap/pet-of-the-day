package ent

import (
	"context"
	"pet-of-the-day/ent"
	"pet-of-the-day/ent/membership"
	"pet-of-the-day/ent/group"
	"pet-of-the-day/ent/user"
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

func (r *EntMembershipRepository) Save(ctx context.Context, domainMembership *domain.Membership) error {
	// Check if membership exists
	exists, err := r.client.Membership.Query().Where(
		membership.IDEQ(domainMembership.ID()),
	).Exist(ctx)
	if err != nil {
		return err
	}

	if exists {
		// Update existing membership
		return r.client.Membership.UpdateOneID(domainMembership.ID()).
			SetStatus(membership.Status(domainMembership.Status())).
			SetPetIds(domainMembership.PetIDs()).
			SetUpdatedAt(domainMembership.UpdatedAt()).
			Exec(ctx)
	} else {
		// Create new membership
		_, err := r.client.Membership.Create().
			SetID(domainMembership.ID()).
			SetGroupID(domainMembership.GroupID()).
			SetUserID(domainMembership.UserID()).
			SetStatus(membership.Status(domainMembership.Status())).
			SetPetIds(domainMembership.PetIDs()).
			SetCreatedAt(domainMembership.CreatedAt()).
			SetUpdatedAt(domainMembership.UpdatedAt()).
			Save(ctx)
		return err
	}
}

func (r *EntMembershipRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Membership, error) {
	entMembership, err := r.client.Membership.Query().
		Where(membership.IDEQ(id)).
		WithGroup().
		WithUser().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrMembershipNotFound
		}
		return nil, err
	}

	// Map Ent entity to domain entity
	status := domain.MembershipStatus(entMembership.Status.String())
	if err != nil {
		return nil, err
	}

	domainMembership := domain.ReconstructMembership(
		entMembership.ID,
		entMembership.Edges.Group.ID,
		entMembership.Edges.User.ID,
		entMembership.PetIds,
		status,
		entMembership.CreatedAt,
		entMembership.UpdatedAt,
	)

	return domainMembership, nil
}

func (r *EntMembershipRepository) FindByGroupAndUser(ctx context.Context, groupID, userID uuid.UUID) (*domain.Membership, error) {
	entMembership, err := r.client.Membership.Query().
		Where(
			membership.HasGroupWith(group.IDEQ(groupID)),
			membership.HasUserWith(user.IDEQ(userID)),
		).
		WithGroup().
		WithUser().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrMembershipNotFound
		}
		return nil, err
	}

	// Map Ent entity to domain entity
	status := domain.MembershipStatus(entMembership.Status.String())
	if err != nil {
		return nil, err
	}

	domainMembership := domain.ReconstructMembership(
		entMembership.ID,
		entMembership.Edges.Group.ID,
		entMembership.Edges.User.ID,
		entMembership.PetIds,
		status,
		entMembership.CreatedAt,
		entMembership.UpdatedAt,
	)

	return domainMembership, nil
}

func (r *EntMembershipRepository) FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Membership, error) {
	entMemberships, err := r.client.Membership.Query().
		Where(membership.HasGroupWith(group.IDEQ(groupID))).
		WithGroup().
		WithUser().
		All(ctx)
	if err != nil {
		return nil, err
	}

	var domainMemberships []*domain.Membership
	for _, entMembership := range entMemberships {
		status := domain.MembershipStatus(entMembership.Status.String())
		if err != nil {
			return nil, err
		}

		domainMembership := domain.ReconstructMembership(
			entMembership.ID,
			entMembership.Edges.Group.ID,
			entMembership.Edges.User.ID,
			entMembership.PetIds,
			status,
			entMembership.CreatedAt,
			entMembership.UpdatedAt,
		)
		domainMemberships = append(domainMemberships, domainMembership)
	}

	return domainMemberships, nil
}

func (r *EntMembershipRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Membership, error) {
	entMemberships, err := r.client.Membership.Query().
		Where(membership.HasUserWith(user.IDEQ(userID))).
		WithGroup().
		WithUser().
		All(ctx)
	if err != nil {
		return nil, err
	}

	var domainMemberships []*domain.Membership
	for _, entMembership := range entMemberships {
		status := domain.MembershipStatus(entMembership.Status.String())
		if err != nil {
			return nil, err
		}

		domainMembership := domain.ReconstructMembership(
			entMembership.ID,
			entMembership.Edges.Group.ID,
			entMembership.Edges.User.ID,
			entMembership.PetIds,
			status,
			entMembership.CreatedAt,
			entMembership.UpdatedAt,
		)
		domainMemberships = append(domainMemberships, domainMembership)
	}

	return domainMemberships, nil
}

func (r *EntMembershipRepository) FindActiveByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Membership, error) {
	entMemberships, err := r.client.Membership.Query().
		Where(
			membership.HasUserWith(user.IDEQ(userID)),
			membership.StatusEQ(membership.StatusActive),
		).
		WithGroup().
		WithUser().
		All(ctx)
	if err != nil {
		return nil, err
	}

	var domainMemberships []*domain.Membership
	for _, entMembership := range entMemberships {
		status := domain.MembershipStatus(entMembership.Status.String())
		if err != nil {
			return nil, err
		}

		domainMembership := domain.ReconstructMembership(
			entMembership.ID,
			entMembership.Edges.Group.ID,
			entMembership.Edges.User.ID,
			entMembership.PetIds,
			status,
			entMembership.CreatedAt,
			entMembership.UpdatedAt,
		)
		domainMemberships = append(domainMemberships, domainMembership)
	}

	return domainMemberships, nil
}

func (r *EntMembershipRepository) FindActiveByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Membership, error) {
	entMemberships, err := r.client.Membership.Query().
		Where(
			membership.HasGroupWith(group.IDEQ(groupID)),
			membership.StatusEQ(membership.StatusActive),
		).
		WithGroup().
		WithUser().
		All(ctx)
	if err != nil {
		return nil, err
	}

	var domainMemberships []*domain.Membership
	for _, entMembership := range entMemberships {
		status := domain.MembershipStatus(entMembership.Status.String())
		if err != nil {
			return nil, err
		}

		domainMembership := domain.ReconstructMembership(
			entMembership.ID,
			entMembership.Edges.Group.ID,
			entMembership.Edges.User.ID,
			entMembership.PetIds,
			status,
			entMembership.CreatedAt,
			entMembership.UpdatedAt,
		)
		domainMemberships = append(domainMemberships, domainMembership)
	}

	return domainMemberships, nil
}

func (r *EntMembershipRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.client.Membership.DeleteOneID(id).Exec(ctx)
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