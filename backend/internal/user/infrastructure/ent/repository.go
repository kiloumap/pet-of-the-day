package ent

import (
	"context"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/user"
	"pet-of-the-day/internal/shared/types"
	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

type EntUserRepository struct {
	client *ent.Client
}

func NewEntUserRepository(client *ent.Client) *EntUserRepository {
	return &EntUserRepository{
		client: client,
	}
}

func (r *EntUserRepository) Save(ctx context.Context, domainUser *domain.User) error {
	_, err := r.client.User.Create().
		SetID(domainUser.ID()).
		SetEmail(domainUser.Email().String()).
		SetPasswordHash(domainUser.PasswordHash()).
		SetFirstName(domainUser.FirstName()).
		SetLastName(domainUser.LastName()).
		SetCreatedAt(domainUser.CreatedAt()).
		SetUpdatedAt(domainUser.UpdatedAt()).
		Save(ctx)

	return err
}

func (r *EntUserRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	entUser, err := r.client.User.
		Query().
		Where(user.ID(id)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return r.entToDomain(entUser)
}

func (r *EntUserRepository) FindByEmail(ctx context.Context, email types.Email) (*domain.User, error) {
	entUser, err := r.client.User.
		Query().
		Where(user.Email(email.String())).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return r.entToDomain(entUser)
}

func (r *EntUserRepository) ExistsByEmail(ctx context.Context, email types.Email) (bool, error) {
	return r.client.User.
		Query().
		Where(user.Email(email.String())).
		Exist(ctx)
}

func (r *EntUserRepository) entToDomain(entUser *ent.User) (*domain.User, error) {
	email, err := types.NewEmail(entUser.Email)
	if err != nil {
		return nil, err
	}

	return domain.ReconstructUser(
		entUser.ID,
		email,
		entUser.PasswordHash,
		entUser.FirstName,
		entUser.LastName,
		entUser.CreatedAt,
		entUser.UpdatedAt,
	), nil
}
