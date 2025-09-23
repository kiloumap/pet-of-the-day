package domain

import (
	"context"

	"github.com/google/uuid"
)

// PetOwnershipValidator validates that a user owns the specified pets
type PetOwnershipValidator interface {
	ValidateUserOwnsPets(ctx context.Context, userID uuid.UUID, petIDs []uuid.UUID) error
}

// UserExistenceValidator validates that a user exists
type UserExistenceValidator interface {
	ValidateUserExists(ctx context.Context, userID uuid.UUID) error
}

// CrossContextValidationService provides validation across bounded contexts
type CrossContextValidationService struct {
	petValidator  PetOwnershipValidator
	userValidator UserExistenceValidator
}

func NewCrossContextValidationService(
	petValidator PetOwnershipValidator,
	userValidator UserExistenceValidator,
) *CrossContextValidationService {
	return &CrossContextValidationService{
		petValidator:  petValidator,
		userValidator: userValidator,
	}
}

func (s *CrossContextValidationService) ValidateCreateGroup(ctx context.Context, creatorID uuid.UUID) error {
	return s.userValidator.ValidateUserExists(ctx, creatorID)
}

func (s *CrossContextValidationService) ValidateJoinGroup(ctx context.Context, userID uuid.UUID, petIDs []uuid.UUID) error {
	// Validate user exists
	if err := s.userValidator.ValidateUserExists(ctx, userID); err != nil {
		return err
	}

	// Validate user owns all specified pets
	if len(petIDs) > 0 {
		return s.petValidator.ValidateUserOwnsPets(ctx, userID, petIDs)
	}

	return nil
}

func (s *CrossContextValidationService) ValidateUpdateMembershipPets(ctx context.Context, userID uuid.UUID, petIDs []uuid.UUID) error {
	// Validate user exists
	if err := s.userValidator.ValidateUserExists(ctx, userID); err != nil {
		return err
	}

	// Validate user owns all specified pets
	return s.petValidator.ValidateUserOwnsPets(ctx, userID, petIDs)
}
