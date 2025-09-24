package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrShareNotFound     = errors.New("share not found")
	ErrInvalidPermission = errors.New("invalid permission level")
	ErrShareExpired      = errors.New("share has expired")
	ErrAccessDenied      = errors.New("access denied")
)

// SharePermission represents the level of access granted
type SharePermission string

const (
	SharePermissionRead      SharePermission = "read"
	SharePermissionReadWrite SharePermission = "read_write"
	SharePermissionAdmin     SharePermission = "admin"
)

// ShareStatus represents the current status of a share
type ShareStatus string

const (
	ShareStatusActive   ShareStatus = "active"
	ShareStatusRevoked  ShareStatus = "revoked"
	ShareStatusExpired  ShareStatus = "expired"
	ShareStatusPending  ShareStatus = "pending"
)

// ShareableResource represents any resource that can be shared
type ShareableResource interface {
	ResourceID() uuid.UUID
	ResourceType() string
	OwnerID() uuid.UUID
	CanBeSharedWith(userID uuid.UUID) bool
}

// Share represents a generic sharing relationship
type Share struct {
	id         uuid.UUID
	resourceID uuid.UUID
	resourceType string
	ownerID    uuid.UUID
	sharedWith uuid.UUID
	permission SharePermission
	status     ShareStatus
	createdAt  time.Time
	updatedAt  time.Time
	expiresAt  *time.Time
	revokedAt  *time.Time
}

// NewShare creates a new share for a resource
func NewShare(
	resourceID uuid.UUID,
	resourceType string,
	ownerID uuid.UUID,
	sharedWith uuid.UUID,
	permission SharePermission,
) (*Share, error) {
	if err := validateShareData(resourceType, permission); err != nil {
		return nil, err
	}

	now := time.Now()
	return &Share{
		id:           uuid.New(),
		resourceID:   resourceID,
		resourceType: resourceType,
		ownerID:      ownerID,
		sharedWith:   sharedWith,
		permission:   permission,
		status:       ShareStatusActive,
		createdAt:    now,
		updatedAt:    now,
	}, nil
}

// ReconstructShare reconstructs a share from persistence data
func ReconstructShare(
	id uuid.UUID,
	resourceID uuid.UUID,
	resourceType string,
	ownerID uuid.UUID,
	sharedWith uuid.UUID,
	permission SharePermission,
	status ShareStatus,
	createdAt time.Time,
	updatedAt time.Time,
	expiresAt *time.Time,
	revokedAt *time.Time,
) *Share {
	return &Share{
		id:           id,
		resourceID:   resourceID,
		resourceType: resourceType,
		ownerID:      ownerID,
		sharedWith:   sharedWith,
		permission:   permission,
		status:       status,
		createdAt:    createdAt,
		updatedAt:    updatedAt,
		expiresAt:    expiresAt,
		revokedAt:    revokedAt,
	}
}

// UpdatePermission changes the permission level of the share
func (s *Share) UpdatePermission(permission SharePermission) error {
	if err := validatePermission(permission); err != nil {
		return err
	}

	s.permission = permission
	s.updatedAt = time.Now()
	return nil
}

// Revoke revokes the share
func (s *Share) Revoke() error {
	if s.status == ShareStatusRevoked {
		return nil // Already revoked
	}

	now := time.Now()
	s.status = ShareStatusRevoked
	s.revokedAt = &now
	s.updatedAt = now
	return nil
}

// SetExpiration sets an expiration date for the share
func (s *Share) SetExpiration(expiresAt time.Time) error {
	if expiresAt.Before(time.Now()) {
		return errors.New("expiration date cannot be in the past")
	}

	s.expiresAt = &expiresAt
	s.updatedAt = time.Now()
	return nil
}

// IsActive checks if the share is currently active
func (s *Share) IsActive() bool {
	if s.status != ShareStatusActive {
		return false
	}

	if s.expiresAt != nil && s.expiresAt.Before(time.Now()) {
		return false
	}

	return true
}

// CanAccess checks if the share allows the given access level
func (s *Share) CanAccess(requiredPermission SharePermission) bool {
	if !s.IsActive() {
		return false
	}

	switch s.permission {
	case SharePermissionAdmin:
		return true // Admin can do everything
	case SharePermissionReadWrite:
		return requiredPermission == SharePermissionRead || requiredPermission == SharePermissionReadWrite
	case SharePermissionRead:
		return requiredPermission == SharePermissionRead
	default:
		return false
	}
}

// Getters
func (s *Share) ID() uuid.UUID {
	return s.id
}

func (s *Share) ResourceID() uuid.UUID {
	return s.resourceID
}

func (s *Share) ResourceType() string {
	return s.resourceType
}

func (s *Share) OwnerID() uuid.UUID {
	return s.ownerID
}

func (s *Share) SharedWith() uuid.UUID {
	return s.sharedWith
}

func (s *Share) Permission() SharePermission {
	return s.permission
}

func (s *Share) Status() ShareStatus {
	return s.status
}

func (s *Share) CreatedAt() time.Time {
	return s.createdAt
}

func (s *Share) UpdatedAt() time.Time {
	return s.updatedAt
}

func (s *Share) ExpiresAt() *time.Time {
	return s.expiresAt
}

func (s *Share) RevokedAt() *time.Time {
	return s.revokedAt
}

// Helper functions for validation
func validateShareData(resourceType string, permission SharePermission) error {
	if resourceType == "" {
		return errors.New("resource type cannot be empty")
	}

	return validatePermission(permission)
}

func validatePermission(permission SharePermission) error {
	switch permission {
	case SharePermissionRead, SharePermissionReadWrite, SharePermissionAdmin:
		return nil
	default:
		return ErrInvalidPermission
	}
}

// Resource types constants
const (
	ResourceTypeNotebook = "notebook"
	ResourceTypePet      = "pet"
	ResourceTypeProfile  = "profile"
)