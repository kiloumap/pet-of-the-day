package ent

import (
	"context"
	"pet-of-the-day/ent"
	"pet-of-the-day/ent/group"
	"pet-of-the-day/ent/user"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

// EntGroupRepository implements the GroupRepository interface using Ent
type EntGroupRepository struct {
	client *ent.Client
}

func NewEntGroupRepository(client *ent.Client) *EntGroupRepository {
	return &EntGroupRepository{
		client: client,
	}
}

func (r *EntGroupRepository) Save(ctx context.Context, domainGroup *domain.Group) error {
	// Check if group exists
	exists, err := r.client.Group.Query().Where(
		group.IDEQ(domainGroup.ID()),
	).Exist(ctx)
	if err != nil {
		return err
	}

	if exists {
		// Update existing group
		return r.client.Group.UpdateOneID(domainGroup.ID()).
			SetName(domainGroup.Name()).
			SetDescription(domainGroup.Description()).
			SetPrivacy(group.Privacy(domainGroup.Privacy())).
			SetUpdatedAt(domainGroup.UpdatedAt()).
			Exec(ctx)
	} else {
		// Get user first for the relation
		creator, err := r.client.User.Get(ctx, domainGroup.CreatorID())
		if err != nil {
			return err
		}

		// Create new group
		_, err = r.client.Group.Create().
			SetID(domainGroup.ID()).
			SetName(domainGroup.Name()).
			SetDescription(domainGroup.Description()).
			SetPrivacy(group.Privacy(domainGroup.Privacy())).
			SetCreator(creator).
			SetCreatedAt(domainGroup.CreatedAt()).
			SetUpdatedAt(domainGroup.UpdatedAt()).
			Save(ctx)
		return err
	}
}

func (r *EntGroupRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Group, error) {
	entGroup, err := r.client.Group.Query().
		Where(group.IDEQ(id)).
		WithCreator().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrGroupNotFound
		}
		return nil, err
	}

	// Map Ent entity to domain entity
	privacy := domain.GroupPrivacy(entGroup.Privacy.String())

	domainGroup := domain.ReconstructGroup(
		entGroup.ID,
		entGroup.Name,
		entGroup.Description,
		privacy,
		entGroup.Edges.Creator.ID,
		entGroup.CreatedAt,
		entGroup.UpdatedAt,
	)

	return domainGroup, nil
}

func (r *EntGroupRepository) FindByCreatorID(ctx context.Context, creatorID uuid.UUID) ([]*domain.Group, error) {
	entGroups, err := r.client.Group.Query().
		Where(group.HasCreatorWith(user.IDEQ(creatorID))).
		WithCreator().
		All(ctx)

	var domainGroups []*domain.Group
	for _, entGroup := range entGroups {
		privacy := domain.GroupPrivacy(entGroup.Privacy.String())
		if err != nil {
			return nil, err
		}

		domainGroup := domain.ReconstructGroup(
			entGroup.ID,
			entGroup.Name,
			entGroup.Description,
			privacy,
			entGroup.Edges.Creator.ID,
			entGroup.CreatedAt,
			entGroup.UpdatedAt,
		)
		domainGroups = append(domainGroups, domainGroup)
	}

	return domainGroups, nil
}

func (r *EntGroupRepository) FindByName(ctx context.Context, name string) (*domain.Group, error) {
	entGroup, err := r.client.Group.Query().
		Where(group.NameEQ(name)).
		WithCreator().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrGroupNotFound
		}
		return nil, err
	}

	// Map Ent entity to domain entity
	privacy := domain.GroupPrivacy(entGroup.Privacy.String())

	domainGroup := domain.ReconstructGroup(
		entGroup.ID,
		entGroup.Name,
		entGroup.Description,
		privacy,
		entGroup.Edges.Creator.ID,
		entGroup.CreatedAt,
		entGroup.UpdatedAt,
	)

	return domainGroup, nil
}

func (r *EntGroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.client.Group.DeleteOneID(id).Exec(ctx)
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