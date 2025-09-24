package ent

import (
	"context"
	"pet-of-the-day/ent"
	"pet-of-the-day/ent/pet"
	"pet-of-the-day/ent/user"
	"pet-of-the-day/internal/pet/domain"

	"github.com/google/uuid"
)

type EntPetRepository struct {
	client *ent.Client
}

func NewEntPetRepository(client *ent.Client) *EntPetRepository {
	return &EntPetRepository{
		client: client,
	}
}

func (r *EntPetRepository) Save(ctx context.Context, domainPet *domain.Pet, ownerID uuid.UUID) error {
	_, err := r.client.Pet.Create().
		SetID(domainPet.ID()).
		SetName(domainPet.Name()).
		SetSpecies(string(domainPet.Species())).
		SetBreed(domainPet.Breed()).
		SetBirthDate(domainPet.BirthDate()).
		SetPhotoURL(domainPet.PhotoUrl()).
		SetOwnerID(ownerID).
		SetCreatedAt(domainPet.CreatedAt()).
		SetUpdatedAt(domainPet.UpdatedAt()).
		Save(ctx)

	return err
}

// TODO: Implement when co-ownership schema is ready
func (r *EntPetRepository) AddCoOwner(ctx context.Context, petID uuid.UUID, userID uuid.UUID) error {
	// user, err := r.client.User.Get(ctx, userID)
	// if err != nil {
	//     return err
	// }
	//
	// err = r.client.Pet.UpdateOneID(petID).
	//     AddCoOwners(user).
	//     Exec(ctx)
	//
	// if err != nil {
	//     if ent.IsNotFound(err) {
	//         return domain.ErrPetNotFound
	//     }
	// }
	return nil // Mock implementation until schema is ready
}

func (r *EntPetRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Pet, error) {
	entPet, err := r.client.Pet.
		Query().
		Where(pet.ID(id)).
		WithOwner().
		// TODO: Add WithCoOwners() when schema is ready
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrPetNotFound
		}
		return nil, err
	}

	return r.entToDomain(entPet)
}

func (r *EntPetRepository) FindOneByOwnerIdAndName(ctx context.Context, ownerID uuid.UUID, name string) (*domain.Pet, error) {
	entPet, err := r.client.Pet.
		Query().
		Where(
			pet.Name(name),
			pet.HasOwnerWith(user.ID(ownerID)),
		).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrPetNotFound
		}
		return nil, err
	}

	return r.entToDomain(entPet)
}

func (r *EntPetRepository) FindAllPetsByOwnerId(ctx context.Context, ownerID uuid.UUID) ([]*domain.Pet, error) {
	entPets, err := r.client.Pet.
		Query().
		Where(
			pet.HasOwnerWith(user.ID(ownerID)),
		).
		WithOwner().
		All(ctx)

	if err != nil {
		return nil, err
	}

	return r.entToDomains(entPets)
}

// TODO: Implement when co-ownership schema is ready
func (r *EntPetRepository) FindAllPetsByCoOwnerID(ctx context.Context, ownerID uuid.UUID) ([]*domain.Pet, error) {
	// entPets, err := r.client.Pet.
	//     Query().
	//     Where(
	//         pet.HasCoOwnersWith(user.ID(ownerID)),
	//     ).
	//     WithOwner().
	//     All(ctx)
	//
	// if err != nil {
	//     return nil, err
	// }
	//
	// return r.entToDomains(entPets)
	return []*domain.Pet{}, nil // Mock implementation until schema is ready
}

func (r *EntPetRepository) ExistsByOwnerId(ctx context.Context, ownerID uuid.UUID, name string) (bool, error) {
	return r.client.Pet.
		Query().
		Where(
			pet.Name(name),
			pet.HasOwnerWith(user.ID(ownerID)),
		).
		Exist(ctx)
}

// TODO: Implement when co-ownership schema is ready
func (r *EntPetRepository) GetCoOwnersByPetID(ctx context.Context, petID uuid.UUID) ([]uuid.UUID, error) {
	// pet, err := r.client.Pet.
	//     Query().
	//     Where(pet.ID(petID)).
	//     WithCoOwners().
	//     Only(ctx)
	//
	// if err != nil {
	//     return nil, err
	// }
	//
	// coOwnerIDs := make([]uuid.UUID, len(pet.Edges.CoOwners))
	// for i, coOwner := range pet.Edges.CoOwners {
	//     coOwnerIDs[i] = coOwner.ID
	// }
	//
	// return coOwnerIDs, nil
	return []uuid.UUID{}, nil // Mock implementation until schema is ready
}

func (r *EntPetRepository) Update(ctx context.Context, domainPet *domain.Pet) (*domain.Pet, error) {
	// Update the pet in the database
	_, err := r.client.Pet.
		UpdateOneID(domainPet.ID()).
		SetName(domainPet.Name()).
		SetSpecies(string(domainPet.Species())).
		SetBreed(domainPet.Breed()).
		SetBirthDate(domainPet.BirthDate()).
		SetPhotoURL(domainPet.PhotoURL()).
		Save(ctx)

	if err != nil {
		return nil, err
	}

	// Load the updated pet with owner to reconstruct the domain pet
	entPetWithOwner, err := r.client.Pet.
		Query().
		Where(pet.IDEQ(domainPet.ID())).
		WithOwner().
		Only(ctx)

	if err != nil {
		return nil, err
	}

	return r.entToDomain(entPetWithOwner)
}

func (r *EntPetRepository) Delete(ctx context.Context, petID uuid.UUID) error {
	return r.client.Pet.DeleteOneID(petID).Exec(ctx)
}

func (r *EntPetRepository) entToDomain(entPet *ent.Pet) (*domain.Pet, error) {
	return domain.ReconstructPet(
		entPet.ID,
		entPet.Edges.Owner.ID,
		entPet.Name,
		domain.Species(entPet.Species),
		entPet.Breed,
		entPet.BirthDate,
		entPet.PhotoURL,
		entPet.CreatedAt,
		entPet.UpdatedAt,
	), nil
}

func (r *EntPetRepository) entToDomains(entPets []*ent.Pet) ([]*domain.Pet, error) {
	pets := make([]*domain.Pet, len(entPets))

	for i, entPet := range entPets {
		domainPet, err := r.entToDomain(entPet)
		if err != nil {
			return nil, err
		}
		pets[i] = domainPet
	}

	return pets, nil
}
