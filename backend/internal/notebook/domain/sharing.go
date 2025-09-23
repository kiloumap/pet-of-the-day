package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrSharingNotFound        = errors.New("notebook sharing not found")
	ErrCannotShareWithSelf    = errors.New("cannot share notebook with yourself")
	ErrDuplicateActiveShare   = errors.New("notebook is already shared with this user")
	ErrRevokedDateBeforeGrant = errors.New("revoked_at must be after granted_at")
	ErrOnlyOwnerCanShare      = errors.New("only pet owner can grant sharing permissions")
)

// NotebookShare represents sharing permissions for a notebook
type NotebookShare struct {
	id         uuid.UUID
	notebookID uuid.UUID
	sharedWith string     // Email of the user to share with
	sharedBy   uuid.UUID  // User who granted the sharing
	readOnly   bool       // Always true for shared users (only owners/co-owners can write)
	grantedAt  time.Time
	revokedAt  *time.Time // Optional, when sharing was revoked
	createdAt  time.Time
	updatedAt  time.Time
}

// NewNotebookShare creates a new notebook sharing permission
func NewNotebookShare(
	notebookID uuid.UUID,
	sharedWith string,
	sharedBy uuid.UUID,
	ownerEmail string, // To prevent sharing with self
) (*NotebookShare, error) {
	if err := validateSharingData(sharedWith, ownerEmail); err != nil {
		return nil, err
	}

	now := time.Now()
	return &NotebookShare{
		id:         uuid.New(),
		notebookID: notebookID,
		sharedWith: sharedWith,
		sharedBy:   sharedBy,
		readOnly:   true, // Shared users always have read-only access
		grantedAt:  now,
		revokedAt:  nil,
		createdAt:  now,
		updatedAt:  now,
	}, nil
}

// Revoke revokes the sharing permission
func (s *NotebookShare) Revoke() error {
	if s.revokedAt != nil {
		return nil // Already revoked
	}

	now := time.Now()
	if now.Before(s.grantedAt) {
		return ErrRevokedDateBeforeGrant
	}

	s.revokedAt = &now
	s.updatedAt = now
	return nil
}

// IsActive returns true if the sharing is currently active (not revoked)
func (s *NotebookShare) IsActive() bool {
	return s.revokedAt == nil
}

// Getters
func (s *NotebookShare) ID() uuid.UUID {
	return s.id
}

func (s *NotebookShare) NotebookID() uuid.UUID {
	return s.notebookID
}

func (s *NotebookShare) SharedWith() string {
	return s.sharedWith
}

func (s *NotebookShare) SharedBy() uuid.UUID {
	return s.sharedBy
}

func (s *NotebookShare) ReadOnly() bool {
	return s.readOnly
}

func (s *NotebookShare) GrantedAt() time.Time {
	return s.grantedAt
}

func (s *NotebookShare) RevokedAt() *time.Time {
	return s.revokedAt
}

func (s *NotebookShare) CreatedAt() time.Time {
	return s.createdAt
}

func (s *NotebookShare) UpdatedAt() time.Time {
	return s.updatedAt
}

// validateSharingData validates sharing business rules
func validateSharingData(sharedWith string, ownerEmail string) error {
	if sharedWith == ownerEmail {
		return ErrCannotShareWithSelf
	}
	return nil
}