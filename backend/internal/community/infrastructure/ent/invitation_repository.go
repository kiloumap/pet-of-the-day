package ent

import (
	"context"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

// EntInvitationRepository implements the InvitationRepository interface using Ent
type EntInvitationRepository struct {
	// We'll inject the Ent client here
}

func NewEntInvitationRepository() *EntInvitationRepository {
	return &EntInvitationRepository{}
}

func (r *EntInvitationRepository) Save(ctx context.Context, invitation *domain.Invitation) error {
	// TODO: Implement with Ent once we update the schema
	panic("not implemented - requires Ent schema update")
}

func (r *EntInvitationRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Invitation, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntInvitationRepository) FindByCode(ctx context.Context, code string) (*domain.Invitation, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntInvitationRepository) FindByGroupAndEmail(ctx context.Context, groupID uuid.UUID, email string) (*domain.Invitation, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntInvitationRepository) FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Invitation, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntInvitationRepository) FindPendingByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Invitation, error) {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

func (r *EntInvitationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// TODO: Implement with Ent
	panic("not implemented - requires Ent schema update")
}

// MockInvitationRepository provides in-memory implementation for testing
type MockInvitationRepository struct {
	invitations map[uuid.UUID]*domain.Invitation
	codeIndex   map[string]*domain.Invitation
}

func NewMockInvitationRepository() *MockInvitationRepository {
	return &MockInvitationRepository{
		invitations: make(map[uuid.UUID]*domain.Invitation),
		codeIndex:   make(map[string]*domain.Invitation),
	}
}

func (r *MockInvitationRepository) Save(ctx context.Context, invitation *domain.Invitation) error {
	r.invitations[invitation.ID()] = invitation
	if invitation.InviteCode() != "" {
		r.codeIndex[invitation.InviteCode()] = invitation
	}
	return nil
}

func (r *MockInvitationRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Invitation, error) {
	invitation, exists := r.invitations[id]
	if !exists {
		return nil, domain.ErrInvitationNotFound
	}
	return invitation, nil
}

func (r *MockInvitationRepository) FindByCode(ctx context.Context, code string) (*domain.Invitation, error) {
	invitation, exists := r.codeIndex[code]
	if !exists {
		return nil, domain.ErrInvitationNotFound
	}
	return invitation, nil
}

func (r *MockInvitationRepository) FindByGroupAndEmail(ctx context.Context, groupID uuid.UUID, email string) (*domain.Invitation, error) {
	for _, invitation := range r.invitations {
		if invitation.GroupID() == groupID && invitation.InviteeEmail() == email {
			return invitation, nil
		}
	}
	return nil, domain.ErrInvitationNotFound
}

func (r *MockInvitationRepository) FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Invitation, error) {
	var invitations []*domain.Invitation
	for _, invitation := range r.invitations {
		if invitation.GroupID() == groupID {
			invitations = append(invitations, invitation)
		}
	}
	return invitations, nil
}

func (r *MockInvitationRepository) FindPendingByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Invitation, error) {
	var invitations []*domain.Invitation
	for _, invitation := range r.invitations {
		if invitation.GroupID() == groupID && invitation.Status() == domain.InvitationStatusPending {
			invitations = append(invitations, invitation)
		}
	}
	return invitations, nil
}

func (r *MockInvitationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	invitation, exists := r.invitations[id]
	if exists && invitation.InviteCode() != "" {
		delete(r.codeIndex, invitation.InviteCode())
	}
	delete(r.invitations, id)
	return nil
}