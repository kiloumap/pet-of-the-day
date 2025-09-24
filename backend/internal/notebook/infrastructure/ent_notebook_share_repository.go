package infrastructure

import (
	"context"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/notebookshare"
	"pet-of-the-day/ent/petnotebook"
	"pet-of-the-day/ent/user"
	"pet-of-the-day/internal/notebook/domain"
)

// EntNotebookShareRepository implements the NotebookShareRepository using Ent ORM
type EntNotebookShareRepository struct {
	client *ent.Client
}

// NewEntNotebookShareRepository creates a new Ent-based repository
func NewEntNotebookShareRepository(client *ent.Client) domain.NotebookShareRepository {
	return &EntNotebookShareRepository{
		client: client,
	}
}

// Save creates or updates a sharing permission
func (r *EntNotebookShareRepository) Save(ctx context.Context, share *domain.NotebookShare) error {
	// First, find the user by email
	sharedWithUser, err := r.client.User.
		Query().
		Where(user.Email(share.SharedWith())).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			// User doesn't exist, this is a domain error
			return domain.ErrSharingNotFound
		}
		return err
	}

	// Check if share already exists
	existing, err := r.client.NotebookShare.
		Query().
		Where(notebookshare.ID(share.ID())).
		Only(ctx)

	if err != nil && !ent.IsNotFound(err) {
		return err
	}

	if existing != nil {
		// Update existing
		update := r.client.NotebookShare.
			UpdateOneID(share.ID()).
			SetStatus(notebookshare.Status("active"))

		if share.RevokedAt() != nil {
			update = update.
				SetRevokedAt(*share.RevokedAt()).
				SetStatus(notebookshare.Status("revoked"))
		}

		return update.Exec(ctx)
	}

	// Create new
	_, err = r.client.NotebookShare.
		Create().
		SetID(share.ID()).
		SetNotebookID(share.NotebookID()).
		SetSharedWithUserID(sharedWithUser.ID).
		SetSharedByUserID(share.SharedBy()).
		SetPermissionLevel(notebookshare.PermissionLevel("read_only")).
		SetGrantedAt(share.GrantedAt()).
		SetStatus(notebookshare.Status("active")).
		Save(ctx)

	return err
}

// FindByID retrieves a sharing permission by its ID
func (r *EntNotebookShareRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.NotebookShare, error) {
	entShare, err := r.client.NotebookShare.
		Query().
		Where(notebookshare.ID(id)).
		WithSharedWithUser().
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrSharingNotFound
		}
		return nil, err
	}

	return r.entToDomain(entShare), nil
}

// FindByNotebookID retrieves all sharing permissions for a notebook
func (r *EntNotebookShareRepository) FindByNotebookID(ctx context.Context, notebookID uuid.UUID) ([]*domain.NotebookShare, error) {
	entShares, err := r.client.NotebookShare.
		Query().
		Where(notebookshare.HasNotebookWith(petnotebook.ID(notebookID))).
		WithSharedWithUser().
		Order(ent.Desc(notebookshare.FieldGrantedAt)).
		All(ctx)

	if err != nil {
		return nil, err
	}

	shares := make([]*domain.NotebookShare, len(entShares))
	for i, entShare := range entShares {
		shares[i] = r.entToDomain(entShare)
	}

	return shares, nil
}

// FindActiveByNotebookIDAndEmail checks if notebook is shared with specific email
func (r *EntNotebookShareRepository) FindActiveByNotebookIDAndEmail(ctx context.Context, notebookID uuid.UUID, email string) (*domain.NotebookShare, error) {
	entShare, err := r.client.NotebookShare.
		Query().
		Where(
			notebookshare.HasNotebookWith(petnotebook.ID(notebookID)),
			notebookshare.HasSharedWithUserWith(user.Email(email)),
			notebookshare.StatusEQ(notebookshare.StatusActive),
		).
		WithSharedWithUser().
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, nil // No active share found
		}
		return nil, err
	}

	return r.entToDomain(entShare), nil
}

// FindSharedWithUser retrieves all notebooks shared with a specific user
func (r *EntNotebookShareRepository) FindSharedWithUser(ctx context.Context, email string, limit, offset int) ([]*domain.NotebookShare, error) {
	entShares, err := r.client.NotebookShare.
		Query().
		Where(
			notebookshare.HasSharedWithUserWith(user.Email(email)),
			notebookshare.StatusEQ(notebookshare.StatusActive),
		).
		WithSharedWithUser().
		Order(ent.Desc(notebookshare.FieldGrantedAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)

	if err != nil {
		return nil, err
	}

	shares := make([]*domain.NotebookShare, len(entShares))
	for i, entShare := range entShares {
		shares[i] = r.entToDomain(entShare)
	}

	return shares, nil
}

// Delete removes a sharing permission
func (r *EntNotebookShareRepository) Delete(ctx context.Context, id uuid.UUID) error {
	err := r.client.NotebookShare.
		DeleteOneID(id).
		Exec(ctx)

	if err != nil && ent.IsNotFound(err) {
		return domain.ErrSharingNotFound
	}

	return err
}

// entToDomain converts an Ent entity to a domain entity
func (r *EntNotebookShareRepository) entToDomain(entShare *ent.NotebookShare) *domain.NotebookShare {
	// Get user email from edge
	email := ""
	if entShare.Edges.SharedWithUser != nil {
		email = entShare.Edges.SharedWithUser.Email
	}

	// Get notebook ID from edge
	notebookID := uuid.Nil
	if entShare.Edges.Notebook != nil {
		notebookID = entShare.Edges.Notebook.ID
	}

	// Get shared by user ID from edge
	sharedByID := uuid.Nil
	if entShare.Edges.SharedByUser != nil {
		sharedByID = entShare.Edges.SharedByUser.ID
	}

	// For domain creation, we need the owner email (this is a limitation of current design)
	// We'll pass the same email as both shared and owner for now
	share, _ := domain.NewNotebookShare(
		notebookID,
		email,
		sharedByID,
		email, // This should be the owner's email, but we don't have it here
	)

	// Set additional fields if they exist
	if !entShare.RevokedAt.IsZero() {
		share.Revoke()
	}

	return share
}