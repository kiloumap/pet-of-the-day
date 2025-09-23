package ent

import (
	"context"
	"pet-of-the-day/ent"
	"pet-of-the-day/ent/group"
	"pet-of-the-day/ent/invitation"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

// EntInvitationRepository implements the InvitationRepository interface using Ent
type EntInvitationRepository struct {
	client *ent.Client
}

func NewEntInvitationRepository(client *ent.Client) *EntInvitationRepository {
	return &EntInvitationRepository{
		client: client,
	}
}

func (r *EntInvitationRepository) Save(ctx context.Context, domainInvitation *domain.Invitation) error {
	// Check if invitation exists
	exists, err := r.client.Invitation.Query().Where(
		invitation.IDEQ(domainInvitation.ID()),
	).Exist(ctx)
	if err != nil {
		return err
	}

	if exists {
		// Update existing invitation
		return r.client.Invitation.UpdateOneID(domainInvitation.ID()).
			SetInviteeEmail(domainInvitation.InviteeEmail()).
			SetInviteCode(domainInvitation.InviteCode()).
			SetInviteType(invitation.InviteType(domainInvitation.InviteType())).
			SetStatus(invitation.Status(domainInvitation.Status())).
			SetExpiresAt(domainInvitation.ExpiresAt()).
			SetUpdatedAt(domainInvitation.UpdatedAt()).
			Exec(ctx)
	} else {
		// Create new invitation
		_, err := r.client.Invitation.Create().
			SetID(domainInvitation.ID()).
			SetGroupID(domainInvitation.GroupID()).
			SetInviterID(domainInvitation.InviterID()).
			SetInviteeEmail(domainInvitation.InviteeEmail()).
			SetInviteCode(domainInvitation.InviteCode()).
			SetInviteType(invitation.InviteType(domainInvitation.InviteType())).
			SetStatus(invitation.Status(domainInvitation.Status())).
			SetExpiresAt(domainInvitation.ExpiresAt()).
			SetCreatedAt(domainInvitation.CreatedAt()).
			SetUpdatedAt(domainInvitation.UpdatedAt()).
			Save(ctx)
		return err
	}
}

func (r *EntInvitationRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Invitation, error) {
	entInvitation, err := r.client.Invitation.Query().
		Where(invitation.IDEQ(id)).
		WithGroup().
		WithInviter().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrInvitationNotFound
		}
		return nil, err
	}

	// Map Ent entity to domain entity
	inviteType := domain.InvitationType(entInvitation.InviteType.String())
	if err != nil {
		return nil, err
	}

	status := domain.InvitationStatus(entInvitation.Status.String())
	if err != nil {
		return nil, err
	}

	domainInvitation := domain.ReconstructInvitation(
		entInvitation.ID,
		entInvitation.Edges.Group.ID,
		entInvitation.Edges.Inviter.ID,
		entInvitation.InviteeEmail,
		entInvitation.InviteCode,
		inviteType,
		status,
		entInvitation.ExpiresAt,
		entInvitation.CreatedAt,
		entInvitation.UpdatedAt,
	)

	return domainInvitation, nil
}

func (r *EntInvitationRepository) FindByCode(ctx context.Context, code string) (*domain.Invitation, error) {
	entInvitation, err := r.client.Invitation.Query().
		Where(invitation.InviteCodeEQ(code)).
		WithGroup().
		WithInviter().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrInvitationNotFound
		}
		return nil, err
	}

	// Map Ent entity to domain entity
	inviteType := domain.InvitationType(entInvitation.InviteType.String())
	if err != nil {
		return nil, err
	}

	status := domain.InvitationStatus(entInvitation.Status.String())
	if err != nil {
		return nil, err
	}

	domainInvitation := domain.ReconstructInvitation(
		entInvitation.ID,
		entInvitation.Edges.Group.ID,
		entInvitation.Edges.Inviter.ID,
		entInvitation.InviteeEmail,
		entInvitation.InviteCode,
		inviteType,
		status,
		entInvitation.ExpiresAt,
		entInvitation.CreatedAt,
		entInvitation.UpdatedAt,
	)

	return domainInvitation, nil
}

func (r *EntInvitationRepository) FindByGroupAndEmail(ctx context.Context, groupID uuid.UUID, email string) (*domain.Invitation, error) {
	entInvitation, err := r.client.Invitation.Query().
		Where(
			invitation.HasGroupWith(group.IDEQ(groupID)),
			invitation.InviteeEmailEQ(email),
		).
		WithGroup().
		WithInviter().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, domain.ErrInvitationNotFound
		}
		return nil, err
	}

	// Map Ent entity to domain entity
	inviteType := domain.InvitationType(entInvitation.InviteType.String())
	if err != nil {
		return nil, err
	}

	status := domain.InvitationStatus(entInvitation.Status.String())
	if err != nil {
		return nil, err
	}

	domainInvitation := domain.ReconstructInvitation(
		entInvitation.ID,
		entInvitation.Edges.Group.ID,
		entInvitation.Edges.Inviter.ID,
		entInvitation.InviteeEmail,
		entInvitation.InviteCode,
		inviteType,
		status,
		entInvitation.ExpiresAt,
		entInvitation.CreatedAt,
		entInvitation.UpdatedAt,
	)

	return domainInvitation, nil
}

func (r *EntInvitationRepository) FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Invitation, error) {
	entInvitations, err := r.client.Invitation.Query().
		Where(invitation.HasGroupWith(group.IDEQ(groupID))).
		WithGroup().
		WithInviter().
		All(ctx)
	if err != nil {
		return nil, err
	}

	var domainInvitations []*domain.Invitation
	for _, entInvitation := range entInvitations {
		inviteType := domain.InvitationType(entInvitation.InviteType.String())
		if err != nil {
			return nil, err
		}

		status := domain.InvitationStatus(entInvitation.Status.String())
		if err != nil {
			return nil, err
		}

		domainInvitation := domain.ReconstructInvitation(
			entInvitation.ID,
			entInvitation.Edges.Group.ID,
			entInvitation.Edges.Inviter.ID,
			entInvitation.InviteeEmail,
			entInvitation.InviteCode,
			inviteType,
			status,
			entInvitation.ExpiresAt,
			entInvitation.CreatedAt,
			entInvitation.UpdatedAt,
		)
		domainInvitations = append(domainInvitations, domainInvitation)
	}

	return domainInvitations, nil
}

func (r *EntInvitationRepository) FindPendingByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Invitation, error) {
	entInvitations, err := r.client.Invitation.Query().
		Where(
			invitation.HasGroupWith(group.IDEQ(groupID)),
			invitation.StatusEQ(invitation.StatusPending),
		).
		WithGroup().
		WithInviter().
		All(ctx)
	if err != nil {
		return nil, err
	}

	var domainInvitations []*domain.Invitation
	for _, entInvitation := range entInvitations {
		inviteType := domain.InvitationType(entInvitation.InviteType.String())
		if err != nil {
			return nil, err
		}

		status := domain.InvitationStatus(entInvitation.Status.String())
		if err != nil {
			return nil, err
		}

		domainInvitation := domain.ReconstructInvitation(
			entInvitation.ID,
			entInvitation.Edges.Group.ID,
			entInvitation.Edges.Inviter.ID,
			entInvitation.InviteeEmail,
			entInvitation.InviteCode,
			inviteType,
			status,
			entInvitation.ExpiresAt,
			entInvitation.CreatedAt,
			entInvitation.UpdatedAt,
		)
		domainInvitations = append(domainInvitations, domainInvitation)
	}

	return domainInvitations, nil
}

func (r *EntInvitationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.client.Invitation.DeleteOneID(id).Exec(ctx)
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
