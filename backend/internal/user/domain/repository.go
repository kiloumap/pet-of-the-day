package domain

import (
	"context"

	"pet-of-the-day/internal/shared/types"

	"github.com/google/uuid"
)

type Repository interface {
	Save(ctx context.Context, user *User) error
	FindByID(ctx context.Context, id uuid.UUID) (*User, error)
	FindByEmail(ctx context.Context, email types.Email) (*User, error)
	ExistsByEmail(ctx context.Context, email types.Email) (bool, error)
}
