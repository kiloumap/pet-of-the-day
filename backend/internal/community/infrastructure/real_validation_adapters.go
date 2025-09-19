package infrastructure

import (
	"context"
	"pet-of-the-day/internal/community/domain"
	petDomain "pet-of-the-day/internal/pet/domain"
	userDomain "pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

// RealPetValidationAdapter implements PetOwnershipValidator using the actual pet repository
type RealPetValidationAdapter struct {
	petRepo petDomain.Repository
}

func NewPetValidationAdapter(petRepo petDomain.Repository) *RealPetValidationAdapter {
	return &RealPetValidationAdapter{
		petRepo: petRepo,
	}
}

func (a *RealPetValidationAdapter) ValidateUserOwnsPets(ctx context.Context, userID uuid.UUID, petIDs []uuid.UUID) error {
	for _, petID := range petIDs {
		pet, err := a.petRepo.FindByID(ctx, petID)
		if err != nil {
			return domain.ErrMembershipPetNotOwned
		}

		if pet.OwnerID() != userID {
			return domain.ErrMembershipPetNotOwned
		}
	}

	return nil
}

type RealUserValidationAdapter struct {
	userRepo userDomain.Repository
}

func NewUserValidationAdapter(userRepo userDomain.Repository) *RealUserValidationAdapter {
	return &RealUserValidationAdapter{
		userRepo: userRepo,
	}
}

func (a *RealUserValidationAdapter) ValidateUserExists(ctx context.Context, userID uuid.UUID) error {
	_, err := a.userRepo.FindByID(ctx, userID)
	if err != nil {
		return domain.ErrGroupUnauthorized
	}
	return nil
}
