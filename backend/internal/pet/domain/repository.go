package domain

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Save(ctx context.Context, pet *Pet, ownerID uuid.UUID) error
	AddCoOwner(ctx context.Context, petID uuid.UUID, userID uuid.UUID) error
	FindByID(ctx context.Context, id uuid.UUID) (*Pet, error)
	FindOneByOwnerIdAndName(ctx context.Context, ownerId uuid.UUID, name string) (*Pet, error)
	FindAllPetsByOwnerId(ctx context.Context, ownerId uuid.UUID) ([]*Pet, error)
	FindAllPetsByCoOwnerID(ctx context.Context, ownerId uuid.UUID) ([]*Pet, error)
	ExistsByOwnerId(ctx context.Context, ownerId uuid.UUID, name string) (bool, error)
	GetCoOwnersByPetID(ctx context.Context, petID uuid.UUID) ([]uuid.UUID, error)
}
