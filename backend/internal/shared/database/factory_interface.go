package database

import (
	"pet-of-the-day/ent"
	petDomain "pet-of-the-day/internal/pet/domain"
	userDomain "pet-of-the-day/internal/user/domain"
)

// Factory defines the interface for repository factories
type Factory interface {
	// Repository creation methods
	CreateUserRepository() userDomain.Repository
	CreatePetRepository() petDomain.Repository

	// Direct client access for bounded contexts that need it
	GetEntClient() *ent.Client

	// Cleanup method
	Close() error
}

// Verify that RepositoryFactory implements Factory interface
var _ Factory = (*RepositoryFactory)(nil)