package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// ShareRequest represents a request to create a new share
type ShareRequest struct {
	ResourceID     uuid.UUID       `json:"resource_id" validate:"required"`
	ResourceType   string          `json:"resource_type" validate:"required,oneof=notebook pet profile"`
	SharedWithID   uuid.UUID       `json:"shared_with_id" validate:"required"`
	Permission     SharePermission `json:"permission" validate:"required,oneof=read read_write admin"`
	ExpiresAt      *time.Time      `json:"expires_at,omitempty"`
	Message        string          `json:"message,omitempty" validate:"max=500"`
}

// Validate validates the share request
func (sr *ShareRequest) Validate() error {
	if sr.ResourceID == uuid.Nil {
		return errors.New("resource_id is required")
	}

	if sr.ResourceType == "" {
		return errors.New("resource_type is required")
	}

	if sr.SharedWithID == uuid.Nil {
		return errors.New("shared_with_id is required")
	}

	if err := validatePermission(sr.Permission); err != nil {
		return err
	}

	if sr.ExpiresAt != nil && sr.ExpiresAt.Before(time.Now()) {
		return errors.New("expiration date cannot be in the past")
	}

	if len(sr.Message) > 500 {
		return errors.New("message cannot exceed 500 characters")
	}

	return nil
}

// ShareUpdateRequest represents a request to update an existing share
type ShareUpdateRequest struct {
	Permission SharePermission `json:"permission,omitempty" validate:"omitempty,oneof=read read_write admin"`
	ExpiresAt  *time.Time      `json:"expires_at,omitempty"`
	Message    string          `json:"message,omitempty" validate:"max=500"`
}

// Validate validates the share update request
func (sur *ShareUpdateRequest) Validate() error {
	if sur.Permission != "" {
		if err := validatePermission(sur.Permission); err != nil {
			return err
		}
	}

	if sur.ExpiresAt != nil && sur.ExpiresAt.Before(time.Now()) {
		return errors.New("expiration date cannot be in the past")
	}

	if len(sur.Message) > 500 {
		return errors.New("message cannot exceed 500 characters")
	}

	return nil
}

// ShareResponse represents a share in API responses
type ShareResponse struct {
	ID           uuid.UUID       `json:"id"`
	ResourceID   uuid.UUID       `json:"resource_id"`
	ResourceType string          `json:"resource_type"`
	OwnerID      uuid.UUID       `json:"owner_id"`
	SharedWith   uuid.UUID       `json:"shared_with"`
	Permission   SharePermission `json:"permission"`
	Status       ShareStatus     `json:"status"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
	ExpiresAt    *time.Time      `json:"expires_at,omitempty"`
	RevokedAt    *time.Time      `json:"revoked_at,omitempty"`
	IsActive     bool            `json:"is_active"`
}

// NewShareResponse creates a response object from a share entity
func NewShareResponse(share *Share) *ShareResponse {
	return &ShareResponse{
		ID:           share.ID(),
		ResourceID:   share.ResourceID(),
		ResourceType: share.ResourceType(),
		OwnerID:      share.OwnerID(),
		SharedWith:   share.SharedWith(),
		Permission:   share.Permission(),
		Status:       share.Status(),
		CreatedAt:    share.CreatedAt(),
		UpdatedAt:    share.UpdatedAt(),
		ExpiresAt:    share.ExpiresAt(),
		RevokedAt:    share.RevokedAt(),
		IsActive:     share.IsActive(),
	}
}

// ShareListResponse represents a paginated list of shares
type ShareListResponse struct {
	Shares     []*ShareResponse `json:"shares"`
	Total      int              `json:"total"`
	Page       int              `json:"page"`
	PageSize   int              `json:"page_size"`
	TotalPages int              `json:"total_pages"`
}

// NewShareListResponse creates a paginated share list response
func NewShareListResponse(shares []*Share, total, page, pageSize int) *ShareListResponse {
	shareResponses := make([]*ShareResponse, len(shares))
	for i, share := range shares {
		shareResponses[i] = NewShareResponse(share)
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &ShareListResponse{
		Shares:     shareResponses,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}

// AccessCheckRequest represents a request to check access to a resource
type AccessCheckRequest struct {
	ResourceID         uuid.UUID       `json:"resource_id" validate:"required"`
	ResourceType       string          `json:"resource_type" validate:"required"`
	UserID             uuid.UUID       `json:"user_id" validate:"required"`
	RequiredPermission SharePermission `json:"required_permission" validate:"required"`
}

// Validate validates the access check request
func (acr *AccessCheckRequest) Validate() error {
	if acr.ResourceID == uuid.Nil {
		return errors.New("resource_id is required")
	}

	if acr.ResourceType == "" {
		return errors.New("resource_type is required")
	}

	if acr.UserID == uuid.Nil {
		return errors.New("user_id is required")
	}

	return validatePermission(acr.RequiredPermission)
}

// AccessCheckResponse represents the result of an access check
type AccessCheckResponse struct {
	HasAccess        bool            `json:"has_access"`
	GrantedBy        uuid.UUID       `json:"granted_by,omitempty"`
	EffectivePermission SharePermission `json:"effective_permission,omitempty"`
	ShareID          uuid.UUID       `json:"share_id,omitempty"`
	ExpiresAt        *time.Time      `json:"expires_at,omitempty"`
}

// NewAccessCheckResponse creates an access check response
func NewAccessCheckResponse(hasAccess bool, share *Share) *AccessCheckResponse {
	response := &AccessCheckResponse{
		HasAccess: hasAccess,
	}

	if hasAccess && share != nil {
		response.GrantedBy = share.OwnerID()
		response.EffectivePermission = share.Permission()
		response.ShareID = share.ID()
		response.ExpiresAt = share.ExpiresAt()
	}

	return response
}

// ShareQuery represents query parameters for searching shares
type ShareQuery struct {
	ResourceType *string          `json:"resource_type,omitempty"`
	Permission   *SharePermission `json:"permission,omitempty"`
	Status       *ShareStatus     `json:"status,omitempty"`
	OwnerID      *uuid.UUID       `json:"owner_id,omitempty"`
	SharedWithID *uuid.UUID       `json:"shared_with_id,omitempty"`
	ActiveOnly   bool             `json:"active_only"`
	Page         int              `json:"page" validate:"min=1"`
	PageSize     int              `json:"page_size" validate:"min=1,max=100"`
}

// SetDefaults sets default values for the query
func (sq *ShareQuery) SetDefaults() {
	if sq.Page == 0 {
		sq.Page = 1
	}
	if sq.PageSize == 0 {
		sq.PageSize = 20
	}
}

// GetOffset calculates the offset for pagination
func (sq *ShareQuery) GetOffset() int {
	return (sq.Page - 1) * sq.PageSize
}

// Validate validates the share query
func (sq *ShareQuery) Validate() error {
	if sq.Page < 1 {
		return errors.New("page must be greater than 0")
	}

	if sq.PageSize < 1 || sq.PageSize > 100 {
		return errors.New("page_size must be between 1 and 100")
	}

	if sq.Permission != nil {
		if err := validatePermission(*sq.Permission); err != nil {
			return err
		}
	}

	return nil
}