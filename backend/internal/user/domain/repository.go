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

// CoOwnershipRepository handles co-ownership relationship persistence
type CoOwnershipRepository interface {
	// SaveCoOwnershipRequest saves a co-ownership request
	SaveCoOwnershipRequest(ctx context.Context, request *CoOwnershipRequest) error

	// FindCoOwnershipRequestByID finds a co-ownership request by ID
	FindCoOwnershipRequestByID(ctx context.Context, id uuid.UUID) (*CoOwnershipRequest, error)

	// FindCoOwnershipRequestsByPet finds all co-ownership requests for a pet
	FindCoOwnershipRequestsByPet(ctx context.Context, petID uuid.UUID) ([]*CoOwnershipRequest, error)

	// FindCoOwnershipRequestsByCoOwner finds all co-ownership requests for a potential co-owner
	FindCoOwnershipRequestsByCoOwner(ctx context.Context, userID uuid.UUID) ([]*CoOwnershipRequest, error)

	// FindActiveCoOwnersByPet finds all active co-owners for a pet
	FindActiveCoOwnersByPet(ctx context.Context, petID uuid.UUID) ([]uuid.UUID, error)

	// HasActiveCoOwnership checks if a user has active co-ownership of a pet
	HasActiveCoOwnership(ctx context.Context, petID, userID uuid.UUID) (bool, error)

	// DeleteCoOwnershipRequest deletes a co-ownership request (for cleanup)
	DeleteCoOwnershipRequest(ctx context.Context, id uuid.UUID) error
}
