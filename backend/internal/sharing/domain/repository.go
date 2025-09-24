package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// ShareRepository defines the interface for share persistence
type ShareRepository interface {
	// Save creates or updates a share
	Save(ctx context.Context, share *Share) error

	// FindByID retrieves a share by its ID
	FindByID(ctx context.Context, id uuid.UUID) (*Share, error)

	// FindByResourceID retrieves all shares for a specific resource
	FindByResourceID(ctx context.Context, resourceID uuid.UUID) ([]*Share, error)

	// FindActiveByResourceID retrieves only active shares for a resource
	FindActiveByResourceID(ctx context.Context, resourceID uuid.UUID) ([]*Share, error)

	// FindByUserID retrieves all shares where the user is the recipient
	FindByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*Share, error)

	// FindActiveByUserID retrieves only active shares where the user is the recipient
	FindActiveByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*Share, error)

	// FindByResourceAndUser checks if a specific resource is shared with a specific user
	FindByResourceAndUser(ctx context.Context, resourceID, userID uuid.UUID) (*Share, error)

	// FindActiveByResourceAndUser checks if a specific resource is actively shared with a specific user
	FindActiveByResourceAndUser(ctx context.Context, resourceID, userID uuid.UUID) (*Share, error)

	// FindByOwner retrieves all shares created by a specific owner
	FindByOwner(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]*Share, error)

	// Delete removes a share
	Delete(ctx context.Context, id uuid.UUID) error

	// DeleteByResource removes all shares for a specific resource (e.g., when resource is deleted)
	DeleteByResource(ctx context.Context, resourceID uuid.UUID) error
}

// ShareService defines the interface for share business logic
type ShareService interface {
	// CreateShare creates a new share for a resource
	CreateShare(ctx context.Context, resourceID uuid.UUID, resourceType string, ownerID, sharedWithID uuid.UUID, permission SharePermission) (*Share, error)

	// UpdateSharePermission updates the permission level of an existing share
	UpdateSharePermission(ctx context.Context, shareID uuid.UUID, newPermission SharePermission, requestorID uuid.UUID) error

	// RevokeShare revokes access to a shared resource
	RevokeShare(ctx context.Context, shareID uuid.UUID, requestorID uuid.UUID) error

	// GetUserShares retrieves all shares for a user (as recipient)
	GetUserShares(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*Share, error)

	// GetResourceShares retrieves all shares for a resource
	GetResourceShares(ctx context.Context, resourceID uuid.UUID, ownerID uuid.UUID) ([]*Share, error)

	// CheckAccess verifies if a user has specific access to a resource
	CheckAccess(ctx context.Context, resourceID, userID uuid.UUID, requiredPermission SharePermission) (bool, error)

	// SetShareExpiration sets an expiration date for a share
	SetShareExpiration(ctx context.Context, shareID uuid.UUID, expiresAt *time.Time, requestorID uuid.UUID) error

	// CleanupExpiredShares marks expired shares as inactive (background job)
	CleanupExpiredShares(ctx context.Context) error
}

// ResourceService defines the interface for resource validation
type ResourceService interface {
	// ValidateResourceExists checks if a resource exists and is accessible
	ValidateResourceExists(ctx context.Context, resourceID uuid.UUID, resourceType string) (bool, error)

	// ValidateResourceOwnership checks if a user owns a specific resource
	ValidateResourceOwnership(ctx context.Context, resourceID uuid.UUID, resourceType string, userID uuid.UUID) (bool, error)

	// GetResourceOwner retrieves the owner of a specific resource
	GetResourceOwner(ctx context.Context, resourceID uuid.UUID, resourceType string) (uuid.UUID, error)
}