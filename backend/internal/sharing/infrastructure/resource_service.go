package infrastructure

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/pet"
	"pet-of-the-day/ent/petnotebook"
	"pet-of-the-day/internal/sharing/domain"
)

// EntResourceService implements ResourceService using Ent ORM
type EntResourceService struct {
	client *ent.Client
}

// NewEntResourceService creates a new Ent-based resource service
func NewEntResourceService(client *ent.Client) domain.ResourceService {
	return &EntResourceService{client: client}
}

// ValidateResourceExists checks if a resource exists and is accessible
func (s *EntResourceService) ValidateResourceExists(ctx context.Context, resourceID uuid.UUID, resourceType string) (bool, error) {
	switch resourceType {
	case domain.ResourceTypeNotebook:
		exists, err := s.client.PetNotebook.Query().
			Where(petnotebook.ID(resourceID)).
			Exist(ctx)
		return exists, err

	case domain.ResourceTypePet:
		exists, err := s.client.Pet.Query().
			Where(pet.ID(resourceID)).
			Exist(ctx)
		return exists, err

	case domain.ResourceTypeProfile:
		// For profile sharing, we would check user existence
		// This is a placeholder - implement based on your profile sharing requirements
		return false, nil

	default:
		return false, nil
	}
}

// ValidateResourceOwnership checks if a user owns a specific resource
func (s *EntResourceService) ValidateResourceOwnership(ctx context.Context, resourceID uuid.UUID, resourceType string, userID uuid.UUID) (bool, error) {
	switch resourceType {
	case domain.ResourceTypeNotebook:
		notebook, err := s.client.PetNotebook.Query().
			Where(petnotebook.ID(resourceID)).
			WithPet(func(pq *ent.PetQuery) {
				pq.WithOwner()
			}).
			Only(ctx)
		if err != nil {
			if ent.IsNotFound(err) {
				return false, nil
			}
			return false, err
		}

		// Check if the user owns the pet that owns this notebook
		if notebook.Edges.Pet.Edges.Owner != nil {
			return notebook.Edges.Pet.Edges.Owner.ID == userID, nil
		}
		return false, nil

	case domain.ResourceTypePet:
		petEntity, err := s.client.Pet.Query().
			Where(pet.ID(resourceID)).
			WithOwner().
			Only(ctx)
		if err != nil {
			if ent.IsNotFound(err) {
				return false, nil
			}
			return false, err
		}

		if petEntity.Edges.Owner != nil {
			return petEntity.Edges.Owner.ID == userID, nil
		}
		return false, nil

	case domain.ResourceTypeProfile:
		// For profile sharing, the user owns their own profile
		return resourceID == userID, nil

	default:
		return false, nil
	}
}

// GetResourceOwner retrieves the owner of a specific resource
func (s *EntResourceService) GetResourceOwner(ctx context.Context, resourceID uuid.UUID, resourceType string) (uuid.UUID, error) {
	switch resourceType {
	case domain.ResourceTypeNotebook:
		notebook, err := s.client.PetNotebook.Query().
			Where(petnotebook.ID(resourceID)).
			WithPet(func(pq *ent.PetQuery) {
				pq.WithOwner()
			}).
			Only(ctx)
		if err != nil {
			if ent.IsNotFound(err) {
				return uuid.Nil, domain.ErrShareNotFound
			}
			return uuid.Nil, err
		}

		if notebook.Edges.Pet.Edges.Owner != nil {
			return notebook.Edges.Pet.Edges.Owner.ID, nil
		}
		return uuid.Nil, domain.ErrShareNotFound

	case domain.ResourceTypePet:
		petEntity, err := s.client.Pet.Query().
			Where(pet.ID(resourceID)).
			WithOwner().
			Only(ctx)
		if err != nil {
			if ent.IsNotFound(err) {
				return uuid.Nil, domain.ErrShareNotFound
			}
			return uuid.Nil, err
		}

		if petEntity.Edges.Owner != nil {
			return petEntity.Edges.Owner.ID, nil
		}
		return uuid.Nil, domain.ErrShareNotFound

	case domain.ResourceTypeProfile:
		// For profile sharing, the resource ID is the user ID
		return resourceID, nil

	default:
		return uuid.Nil, domain.ErrShareNotFound
	}
}