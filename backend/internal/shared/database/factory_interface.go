package database

import (
	"pet-of-the-day/ent"
	// TODO: Re-enable when notebook system compilation issues are fixed
	// notebookDomain "pet-of-the-day/internal/notebook/domain"
	petDomain "pet-of-the-day/internal/pet/domain"
	sharingDomain "pet-of-the-day/internal/sharing/domain"
	userDomain "pet-of-the-day/internal/user/domain"
)

// Factory defines the interface for repository factories
type Factory interface {
	// Repository creation methods
	CreateUserRepository() userDomain.Repository
	CreatePetRepository() petDomain.Repository
	CreateCoOwnershipRepository() userDomain.CoOwnershipRepository
	// TODO: Re-enable when notebook system compilation issues are fixed
	// CreateNotebookRepository() notebookDomain.NotebookRepository
	// CreateNotebookEntryRepository() notebookDomain.NotebookEntryRepository
	CreateShareRepository() sharingDomain.ShareRepository

	// Direct client access for bounded contexts that need it
	GetEntClient() *ent.Client

	// Cleanup method
	Close() error
}

// Verify that RepositoryFactory implements Factory interface
var _ Factory = (*RepositoryFactory)(nil)
