package domain

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Save(ctx context.Context, pet *Pet) error
	FindByID(ctx context.Context, id uuid.UUID) (*Pet, error)
	FindOneByOwnerId(ctx context.Context, ownerId uuid.UUID, name string) (*Pet, error)
	FindAllPetsByOwnerId(ctx context.Context, ownerId uuid.UUID) ([]*Pet, error)
	FindAllPetsByUserID(ctx context.Context, ownerId uuid.UUID) ([]*Pet, error)
	ExistsByOwnerId(ctx context.Context, ownerId uuid.UUID, name string) (bool, error)
	GetCoOwnersByPetID(ctx context.Context, petID uuid.UUID) ([]uuid.UUID, error)
}
