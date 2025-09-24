package infrastructure

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/internal/sharing/domain"
)

// MockShareRepository provides mock implementation for testing
type MockShareRepository struct {
	shares map[uuid.UUID]*domain.Share
	mu     sync.RWMutex
}

// NewMockShareRepository creates a new mock repository
func NewMockShareRepository() domain.ShareRepository {
	return &MockShareRepository{
		shares: make(map[uuid.UUID]*domain.Share),
	}
}

// Save creates or updates a share
func (r *MockShareRepository) Save(ctx context.Context, share *domain.Share) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.shares[share.ID()] = share
	return nil
}

// FindByID retrieves a share by its ID
func (r *MockShareRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Share, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	share, exists := r.shares[id]
	if !exists {
		return nil, domain.ErrShareNotFound
	}
	return share, nil
}

// FindByResourceID retrieves all shares for a specific resource
func (r *MockShareRepository) FindByResourceID(ctx context.Context, resourceID uuid.UUID) ([]*domain.Share, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*domain.Share
	for _, share := range r.shares {
		if share.ResourceID() == resourceID {
			result = append(result, share)
		}
	}
	return result, nil
}

// FindActiveByResourceID retrieves only active shares for a resource
func (r *MockShareRepository) FindActiveByResourceID(ctx context.Context, resourceID uuid.UUID) ([]*domain.Share, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*domain.Share
	for _, share := range r.shares {
		if share.ResourceID() == resourceID && share.IsActive() {
			result = append(result, share)
		}
	}
	return result, nil
}

// FindByUserID retrieves all shares where the user is the recipient
func (r *MockShareRepository) FindByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.Share, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*domain.Share
	for _, share := range r.shares {
		if share.SharedWith() == userID {
			result = append(result, share)
		}
	}

	// Simple pagination
	start := offset
	end := offset + limit
	if start >= len(result) {
		return []*domain.Share{}, nil
	}
	if end > len(result) {
		end = len(result)
	}

	return result[start:end], nil
}

// FindActiveByUserID retrieves only active shares where the user is the recipient
func (r *MockShareRepository) FindActiveByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.Share, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*domain.Share
	for _, share := range r.shares {
		if share.SharedWith() == userID && share.IsActive() {
			result = append(result, share)
		}
	}

	// Simple pagination
	start := offset
	end := offset + limit
	if start >= len(result) {
		return []*domain.Share{}, nil
	}
	if end > len(result) {
		end = len(result)
	}

	return result[start:end], nil
}

// FindByResourceAndUser checks if a specific resource is shared with a specific user
func (r *MockShareRepository) FindByResourceAndUser(ctx context.Context, resourceID, userID uuid.UUID) (*domain.Share, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, share := range r.shares {
		if share.ResourceID() == resourceID && share.SharedWith() == userID {
			return share, nil
		}
	}
	return nil, domain.ErrShareNotFound
}

// FindActiveByResourceAndUser checks if a specific resource is actively shared with a specific user
func (r *MockShareRepository) FindActiveByResourceAndUser(ctx context.Context, resourceID, userID uuid.UUID) (*domain.Share, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, share := range r.shares {
		if share.ResourceID() == resourceID && share.SharedWith() == userID && share.IsActive() {
			return share, nil
		}
	}
	return nil, domain.ErrShareNotFound
}

// FindByOwner retrieves all shares created by a specific owner
func (r *MockShareRepository) FindByOwner(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]*domain.Share, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*domain.Share
	for _, share := range r.shares {
		if share.OwnerID() == ownerID {
			result = append(result, share)
		}
	}

	// Simple pagination
	start := offset
	end := offset + limit
	if start >= len(result) {
		return []*domain.Share{}, nil
	}
	if end > len(result) {
		end = len(result)
	}

	return result[start:end], nil
}

// Delete removes a share
func (r *MockShareRepository) Delete(ctx context.Context, id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.shares[id]; !exists {
		return domain.ErrShareNotFound
	}
	delete(r.shares, id)
	return nil
}

// DeleteByResource removes all shares for a specific resource
func (r *MockShareRepository) DeleteByResource(ctx context.Context, resourceID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for id, share := range r.shares {
		if share.ResourceID() == resourceID {
			delete(r.shares, id)
		}
	}
	return nil
}

// Reset clears all shares (useful for testing)
func (r *MockShareRepository) Reset() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.shares = make(map[uuid.UUID]*domain.Share)
}

// MockResourceService provides mock resource validation
type MockResourceService struct {
	resources map[uuid.UUID]MockResource
	mu        sync.RWMutex
}

type MockResource struct {
	ID       uuid.UUID
	Type     string
	OwnerID  uuid.UUID
	Exists   bool
}

// NewMockResourceService creates a new mock resource service
func NewMockResourceService() domain.ResourceService {
	return &MockResourceService{
		resources: make(map[uuid.UUID]MockResource),
	}
}

// ValidateResourceExists checks if a resource exists and is accessible
func (s *MockResourceService) ValidateResourceExists(ctx context.Context, resourceID uuid.UUID, resourceType string) (bool, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	resource, exists := s.resources[resourceID]
	if !exists {
		return false, nil
	}

	return resource.Exists && (resourceType == "" || resource.Type == resourceType), nil
}

// ValidateResourceOwnership checks if a user owns a specific resource
func (s *MockResourceService) ValidateResourceOwnership(ctx context.Context, resourceID uuid.UUID, resourceType string, userID uuid.UUID) (bool, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	resource, exists := s.resources[resourceID]
	if !exists {
		return false, nil
	}

	return resource.Exists && resource.OwnerID == userID && (resourceType == "" || resource.Type == resourceType), nil
}

// GetResourceOwner retrieves the owner of a specific resource
func (s *MockResourceService) GetResourceOwner(ctx context.Context, resourceID uuid.UUID, resourceType string) (uuid.UUID, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	resource, exists := s.resources[resourceID]
	if !exists || !resource.Exists {
		return uuid.Nil, domain.ErrShareNotFound
	}

	return resource.OwnerID, nil
}

// AddResource adds a resource for testing
func (s *MockResourceService) AddResource(resourceID uuid.UUID, resourceType string, ownerID uuid.UUID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.resources[resourceID] = MockResource{
		ID:      resourceID,
		Type:    resourceType,
		OwnerID: ownerID,
		Exists:  true,
	}
}

// RemoveResource removes a resource for testing
func (s *MockResourceService) RemoveResource(resourceID uuid.UUID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.resources, resourceID)
}

// Reset clears all resources (useful for testing)
func (s *MockResourceService) Reset() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.resources = make(map[uuid.UUID]MockResource)
}

// MockShareService provides a simple implementation of ShareService
type MockShareService struct {
	shareRepo   domain.ShareRepository
	resourceSvc domain.ResourceService
}

// NewMockShareService creates a new mock share service
func NewMockShareService(shareRepo domain.ShareRepository, resourceSvc domain.ResourceService) domain.ShareService {
	return &MockShareService{
		shareRepo:   shareRepo,
		resourceSvc: resourceSvc,
	}
}

// CreateShare creates a new share for a resource
func (s *MockShareService) CreateShare(ctx context.Context, resourceID uuid.UUID, resourceType string, ownerID, sharedWithID uuid.UUID, permission domain.SharePermission) (*domain.Share, error) {
	// Validate resource exists and ownership
	exists, err := s.resourceSvc.ValidateResourceExists(ctx, resourceID, resourceType)
	if err != nil || !exists {
		return nil, domain.ErrShareNotFound
	}

	isOwner, err := s.resourceSvc.ValidateResourceOwnership(ctx, resourceID, resourceType, ownerID)
	if err != nil || !isOwner {
		return nil, domain.ErrAccessDenied
	}

	// Create the share
	share, err := domain.NewShare(resourceID, resourceType, ownerID, sharedWithID, permission)
	if err != nil {
		return nil, err
	}

	// Save the share
	if err := s.shareRepo.Save(ctx, share); err != nil {
		return nil, err
	}

	return share, nil
}

// UpdateSharePermission updates the permission level of an existing share
func (s *MockShareService) UpdateSharePermission(ctx context.Context, shareID uuid.UUID, newPermission domain.SharePermission, requestorID uuid.UUID) error {
	share, err := s.shareRepo.FindByID(ctx, shareID)
	if err != nil {
		return err
	}

	if share.OwnerID() != requestorID {
		return domain.ErrAccessDenied
	}

	if err := share.UpdatePermission(newPermission); err != nil {
		return err
	}

	return s.shareRepo.Save(ctx, share)
}

// RevokeShare revokes access to a shared resource
func (s *MockShareService) RevokeShare(ctx context.Context, shareID uuid.UUID, requestorID uuid.UUID) error {
	share, err := s.shareRepo.FindByID(ctx, shareID)
	if err != nil {
		return err
	}

	// Either owner or recipient can revoke
	if share.OwnerID() != requestorID && share.SharedWith() != requestorID {
		return domain.ErrAccessDenied
	}

	if err := share.Revoke(); err != nil {
		return err
	}

	return s.shareRepo.Save(ctx, share)
}

// GetUserShares retrieves all shares for a user (as recipient)
func (s *MockShareService) GetUserShares(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.Share, error) {
	return s.shareRepo.FindActiveByUserID(ctx, userID, limit, offset)
}

// GetResourceShares retrieves all shares for a resource
func (s *MockShareService) GetResourceShares(ctx context.Context, resourceID uuid.UUID, ownerID uuid.UUID) ([]*domain.Share, error) {
	isOwner, err := s.resourceSvc.ValidateResourceOwnership(ctx, resourceID, "", ownerID)
	if err != nil || !isOwner {
		return nil, domain.ErrAccessDenied
	}

	return s.shareRepo.FindActiveByResourceID(ctx, resourceID)
}

// CheckAccess verifies if a user has specific access to a resource
func (s *MockShareService) CheckAccess(ctx context.Context, resourceID, userID uuid.UUID, requiredPermission domain.SharePermission) (bool, error) {
	// Check if user is owner
	ownerID, err := s.resourceSvc.GetResourceOwner(ctx, resourceID, "")
	if err == nil && ownerID == userID {
		return true, nil // Owner has all permissions
	}

	// Check through shares
	share, err := s.shareRepo.FindActiveByResourceAndUser(ctx, resourceID, userID)
	if err != nil || share == nil {
		return false, nil
	}

	return share.CanAccess(requiredPermission), nil
}

// SetShareExpiration sets an expiration date for a share
func (s *MockShareService) SetShareExpiration(ctx context.Context, shareID uuid.UUID, expiresAt *time.Time, requestorID uuid.UUID) error {
	share, err := s.shareRepo.FindByID(ctx, shareID)
	if err != nil {
		return err
	}

	if share.OwnerID() != requestorID {
		return domain.ErrAccessDenied
	}

	if expiresAt != nil {
		if err := share.SetExpiration(*expiresAt); err != nil {
			return err
		}
	}

	return s.shareRepo.Save(ctx, share)
}

// CleanupExpiredShares marks expired shares as inactive
func (s *MockShareService) CleanupExpiredShares(ctx context.Context) error {
	// In a real implementation, this would scan for expired shares and mark them inactive
	// For the mock, we'll just return nil
	return nil
}