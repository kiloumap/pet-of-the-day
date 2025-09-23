package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrNotebookNotFound = errors.New("notebook not found")
	ErrUnauthorizedAccess = errors.New("unauthorized access to notebook")
)

// PetNotebook represents a pet's notebook container
type PetNotebook struct {
	id        uuid.UUID
	petID     uuid.UUID
	createdAt time.Time
	updatedAt time.Time
}

// NewPetNotebook creates a new notebook for a pet
func NewPetNotebook(petID uuid.UUID) *PetNotebook {
	now := time.Now()
	return &PetNotebook{
		id:        uuid.New(),
		petID:     petID,
		createdAt: now,
		updatedAt: now,
	}
}

// Getters
func (n *PetNotebook) ID() uuid.UUID {
	return n.id
}

func (n *PetNotebook) PetID() uuid.UUID {
	return n.petID
}

func (n *PetNotebook) CreatedAt() time.Time {
	return n.createdAt
}

func (n *PetNotebook) UpdatedAt() time.Time {
	return n.updatedAt
}

// Touch updates the notebook's last modified time
func (n *PetNotebook) Touch() {
	n.updatedAt = time.Now()
}