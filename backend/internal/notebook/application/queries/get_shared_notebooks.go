package queries

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/internal/notebook/domain"
)

// GetSharedNotebooksQuery represents the query to get notebooks shared with a user
type GetSharedNotebooksQuery struct {
	UserEmail string // Email of the user
	Limit     int    // Default 10
	Offset    int    // For pagination
}

// GetSharedNotebooksResult represents shared notebooks with pet information
type GetSharedNotebooksResult struct {
	SharedNotebooks []SharedNotebookInfo
	Total           int
}

// SharedNotebookInfo contains notebook sharing info with pet details
type SharedNotebookInfo struct {
	Share      *domain.NotebookShare
	NotebookID uuid.UUID
	PetID      uuid.UUID
	PetName    string
	OwnerName  string
}

// GetSharedNotebooksHandler handles retrieving shared notebooks
type GetSharedNotebooksHandler struct {
	shareRepo domain.NotebookShareRepository
	// Note: In a real implementation, we'd need access to Pet and User repositories
	// to get pet and owner information. For now, we'll return placeholder data.
}

// NewGetSharedNotebooksHandler creates a new handler
func NewGetSharedNotebooksHandler(shareRepo domain.NotebookShareRepository) *GetSharedNotebooksHandler {
	return &GetSharedNotebooksHandler{
		shareRepo: shareRepo,
	}
}

// Handle executes the query
func (h *GetSharedNotebooksHandler) Handle(ctx context.Context, query *GetSharedNotebooksQuery) (*GetSharedNotebooksResult, error) {
	// Set default limit
	limit := query.Limit
	if limit <= 0 || limit > 50 {
		limit = 10
	}

	// Get shared notebooks
	shares, err := h.shareRepo.FindSharedWithUser(ctx, query.UserEmail, limit, query.Offset)
	if err != nil {
		return nil, err
	}

	// Build result with notebook info
	sharedNotebooks := make([]SharedNotebookInfo, len(shares))
	for i, share := range shares {
		// In a real implementation, we'd query the pet and user repositories here
		// to get the actual pet name and owner name
		sharedNotebooks[i] = SharedNotebookInfo{
			Share:      share,
			NotebookID: share.NotebookID(),
			PetID:      uuid.Nil, // Would be fetched from notebook->pet relationship
			PetName:    "Pet Name", // Placeholder - would be fetched from Pet repository
			OwnerName:  "Owner Name", // Placeholder - would be fetched from User repository
		}
	}

	return &GetSharedNotebooksResult{
		SharedNotebooks: sharedNotebooks,
		Total:           len(shares), // Simplified - in real implementation we'd count total
	}, nil
}

// GetNotebookSharingQuery represents the query to get sharing permissions for a notebook
type GetNotebookSharingQuery struct {
	PetID uuid.UUID
}

// GetNotebookSharingHandler handles retrieving sharing permissions for a notebook
type GetNotebookSharingHandler struct {
	notebookRepo domain.NotebookRepository
	shareRepo    domain.NotebookShareRepository
}

// NewGetNotebookSharingHandler creates a new handler
func NewGetNotebookSharingHandler(
	notebookRepo domain.NotebookRepository,
	shareRepo domain.NotebookShareRepository,
) *GetNotebookSharingHandler {
	return &GetNotebookSharingHandler{
		notebookRepo: notebookRepo,
		shareRepo:    shareRepo,
	}
}

// Handle executes the query
func (h *GetNotebookSharingHandler) Handle(ctx context.Context, query *GetNotebookSharingQuery) ([]*domain.NotebookShare, error) {
	// Get notebook for pet
	notebook, err := h.notebookRepo.FindByPetID(ctx, query.PetID)
	if err != nil {
		return nil, err
	}

	// Get all sharing permissions for the notebook
	return h.shareRepo.FindByNotebookID(ctx, notebook.ID())
}