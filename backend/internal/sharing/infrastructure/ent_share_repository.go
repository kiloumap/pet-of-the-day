package infrastructure

import (
	"context"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/share"
	"pet-of-the-day/internal/sharing/domain"
)

// EntShareRepository implements the ShareRepository interface using Ent ORM
type EntShareRepository struct {
	client *ent.Client
}

// NewEntShareRepository creates a new Ent-based share repository
func NewEntShareRepository(client *ent.Client) domain.ShareRepository {
	return &EntShareRepository{client: client}
}

// Save creates or updates a share
func (r *EntShareRepository) Save(ctx context.Context, domainShare *domain.Share) error {
	// Check if this is an update (share already exists)
	existingShare, err := r.client.Share.Query().
		Where(share.ID(domainShare.ID())).
		Only(ctx)

	if err != nil && !ent.IsNotFound(err) {
		return err
	}

	if existingShare != nil {
		// Update existing share
		_, err = r.client.Share.UpdateOneID(domainShare.ID()).
			SetPermission(mapDomainPermissionToEnt(domainShare.Permission())).
			SetStatus(mapDomainStatusToEnt(domainShare.Status())).
			SetUpdatedAt(time.Now()).
			SetNillableExpiresAt(domainShare.ExpiresAt()).
			SetNillableRevokedAt(domainShare.RevokedAt()).
			Save(ctx)
		return err
	}

	// Create new share
	createQuery := r.client.Share.Create().
		SetID(domainShare.ID()).
		SetResourceID(domainShare.ResourceID()).
		SetResourceType(domainShare.ResourceType()).
		SetOwnerID(domainShare.OwnerID()).
		SetSharedWithID(domainShare.SharedWith()).
		SetPermission(mapDomainPermissionToEnt(domainShare.Permission())).
		SetStatus(mapDomainStatusToEnt(domainShare.Status())).
		SetCreatedAt(domainShare.CreatedAt()).
		SetUpdatedAt(time.Now())

	if expiresAt := domainShare.ExpiresAt(); expiresAt != nil {
		createQuery = createQuery.SetExpiresAt(*expiresAt)
	}

	if revokedAt := domainShare.RevokedAt(); revokedAt != nil {
		createQuery = createQuery.SetRevokedAt(*revokedAt)
	}

	_, err = createQuery.Save(ctx)
	return err
}

// FindByID retrieves a share by its ID
func (r *EntShareRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Share, error) {
	entShare, err := r.client.Share.Get(ctx, id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrShareNotFound
		}
		return nil, err
	}

	return r.mapEntToDomainShare(entShare), nil
}

// FindByResourceID retrieves all shares for a specific resource
func (r *EntShareRepository) FindByResourceID(ctx context.Context, resourceID uuid.UUID) ([]*domain.Share, error) {
	entShares, err := r.client.Share.Query().
		Where(share.ResourceID(resourceID)).
		All(ctx)
	if err != nil {
		return nil, err
	}

	return r.mapEntSharesToDomain(entShares), nil
}

// FindActiveByResourceID retrieves only active shares for a resource
func (r *EntShareRepository) FindActiveByResourceID(ctx context.Context, resourceID uuid.UUID) ([]*domain.Share, error) {
	entShares, err := r.client.Share.Query().
		Where(
			share.ResourceID(resourceID),
			share.StatusEQ(share.StatusActive),
		).
		All(ctx)
	if err != nil {
		return nil, err
	}

	return r.mapEntSharesToDomain(entShares), nil
}

// FindByUserID retrieves all shares where the user is the recipient
func (r *EntShareRepository) FindByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.Share, error) {
	entShares, err := r.client.Share.Query().
		Where(share.SharedWithID(userID)).
		Limit(limit).
		Offset(offset).
		Order(ent.Desc(share.FieldCreatedAt)).
		All(ctx)
	if err != nil {
		return nil, err
	}

	return r.mapEntSharesToDomain(entShares), nil
}

// FindActiveByUserID retrieves only active shares where the user is the recipient
func (r *EntShareRepository) FindActiveByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.Share, error) {
	entShares, err := r.client.Share.Query().
		Where(
			share.SharedWithID(userID),
			share.StatusEQ(share.StatusActive),
		).
		Limit(limit).
		Offset(offset).
		Order(ent.Desc(share.FieldCreatedAt)).
		All(ctx)
	if err != nil {
		return nil, err
	}

	return r.mapEntSharesToDomain(entShares), nil
}

// FindByResourceAndUser checks if a specific resource is shared with a specific user
func (r *EntShareRepository) FindByResourceAndUser(ctx context.Context, resourceID, userID uuid.UUID) (*domain.Share, error) {
	entShare, err := r.client.Share.Query().
		Where(
			share.ResourceID(resourceID),
			share.SharedWithID(userID),
		).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrShareNotFound
		}
		return nil, err
	}

	return r.mapEntToDomainShare(entShare), nil
}

// FindActiveByResourceAndUser checks if a specific resource is actively shared with a specific user
func (r *EntShareRepository) FindActiveByResourceAndUser(ctx context.Context, resourceID, userID uuid.UUID) (*domain.Share, error) {
	entShare, err := r.client.Share.Query().
		Where(
			share.ResourceID(resourceID),
			share.SharedWithID(userID),
			share.StatusEQ(share.StatusActive),
		).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrShareNotFound
		}
		return nil, err
	}

	return r.mapEntToDomainShare(entShare), nil
}

// FindByOwner retrieves all shares created by a specific owner
func (r *EntShareRepository) FindByOwner(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]*domain.Share, error) {
	entShares, err := r.client.Share.Query().
		Where(share.OwnerID(ownerID)).
		Limit(limit).
		Offset(offset).
		Order(ent.Desc(share.FieldCreatedAt)).
		All(ctx)
	if err != nil {
		return nil, err
	}

	return r.mapEntSharesToDomain(entShares), nil
}

// Delete removes a share
func (r *EntShareRepository) Delete(ctx context.Context, id uuid.UUID) error {
	err := r.client.Share.DeleteOneID(id).Exec(ctx)
	if err != nil && ent.IsNotFound(err) {
		return domain.ErrShareNotFound
	}
	return err
}

// DeleteByResource removes all shares for a specific resource
func (r *EntShareRepository) DeleteByResource(ctx context.Context, resourceID uuid.UUID) error {
	_, err := r.client.Share.Delete().
		Where(share.ResourceID(resourceID)).
		Exec(ctx)
	return err
}

// Helper methods for mapping between domain and Ent types

func (r *EntShareRepository) mapEntToDomainShare(entShare *ent.Share) *domain.Share {
	// Note: Using domain.ReconstructShare since we're loading from persistence
	domainShare := domain.ReconstructShare(
		entShare.ID,
		entShare.ResourceID,
		entShare.ResourceType,
		entShare.OwnerID,
		entShare.SharedWithID,
		mapEntPermissionToDomain(entShare.Permission),
		mapEntStatusToDomain(entShare.Status),
		entShare.CreatedAt,
		entShare.UpdatedAt,
		entShare.ExpiresAt,
		entShare.RevokedAt,
	)
	return domainShare
}

func (r *EntShareRepository) mapEntSharesToDomain(entShares []*ent.Share) []*domain.Share {
	domainShares := make([]*domain.Share, len(entShares))
	for i, entShare := range entShares {
		domainShares[i] = r.mapEntToDomainShare(entShare)
	}
	return domainShares
}

// Permission mapping functions
func mapDomainPermissionToEnt(permission domain.SharePermission) share.Permission {
	switch permission {
	case domain.SharePermissionRead:
		return share.PermissionRead
	case domain.SharePermissionReadWrite:
		return share.PermissionReadWrite
	case domain.SharePermissionAdmin:
		return share.PermissionAdmin
	default:
		return share.PermissionRead
	}
}

func mapEntPermissionToDomain(permission share.Permission) domain.SharePermission {
	switch permission {
	case share.PermissionRead:
		return domain.SharePermissionRead
	case share.PermissionReadWrite:
		return domain.SharePermissionReadWrite
	case share.PermissionAdmin:
		return domain.SharePermissionAdmin
	default:
		return domain.SharePermissionRead
	}
}

// Status mapping functions
func mapDomainStatusToEnt(status domain.ShareStatus) share.Status {
	switch status {
	case domain.ShareStatusActive:
		return share.StatusActive
	case domain.ShareStatusRevoked:
		return share.StatusRevoked
	case domain.ShareStatusExpired:
		return share.StatusExpired
	default:
		return share.StatusActive
	}
}

func mapEntStatusToDomain(status share.Status) domain.ShareStatus {
	switch status {
	case share.StatusActive:
		return domain.ShareStatusActive
	case share.StatusRevoked:
		return domain.ShareStatusRevoked
	case share.StatusExpired:
		return domain.ShareStatusExpired
	default:
		return domain.ShareStatusActive
	}
}