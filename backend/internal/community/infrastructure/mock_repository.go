package infrastructure

import (
	"context"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

// MockGroupRepository provides in-memory implementation for testing
type MockGroupRepository struct {
	groups map[uuid.UUID]*domain.Group
}

func NewMockGroupRepository() *MockGroupRepository {
	return &MockGroupRepository{
		groups: make(map[uuid.UUID]*domain.Group),
	}
}

func (r *MockGroupRepository) Save(ctx context.Context, group *domain.Group) error {
	r.groups[group.ID()] = group
	return nil
}

func (r *MockGroupRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Group, error) {
	group, exists := r.groups[id]
	if !exists {
		return nil, domain.ErrGroupNotFound
	}
	return group, nil
}

func (r *MockGroupRepository) FindByCreatorID(ctx context.Context, creatorID uuid.UUID) ([]*domain.Group, error) {
	var groups []*domain.Group
	for _, group := range r.groups {
		if group.CreatorID() == creatorID {
			groups = append(groups, group)
		}
	}
	return groups, nil
}

func (r *MockGroupRepository) FindByName(ctx context.Context, name string) (*domain.Group, error) {
	for _, group := range r.groups {
		if group.Name() == name {
			return group, nil
		}
	}
	return nil, domain.ErrGroupNotFound
}

func (r *MockGroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	delete(r.groups, id)
	return nil
}

// MockMembershipRepository provides in-memory implementation for testing
type MockMembershipRepository struct {
	memberships map[uuid.UUID]*domain.Membership
}

func NewMockMembershipRepository() *MockMembershipRepository {
	return &MockMembershipRepository{
		memberships: make(map[uuid.UUID]*domain.Membership),
	}
}

func (r *MockMembershipRepository) Save(ctx context.Context, membership *domain.Membership) error {
	r.memberships[membership.ID()] = membership
	return nil
}

func (r *MockMembershipRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Membership, error) {
	membership, exists := r.memberships[id]
	if !exists {
		return nil, domain.ErrMembershipNotFound
	}
	return membership, nil
}

func (r *MockMembershipRepository) FindByGroupAndUser(ctx context.Context, groupID, userID uuid.UUID) (*domain.Membership, error) {
	for _, membership := range r.memberships {
		if membership.GroupID() == groupID && membership.UserID() == userID {
			return membership, nil
		}
	}
	return nil, domain.ErrMembershipNotFound
}

func (r *MockMembershipRepository) FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Membership, error) {
	var memberships []*domain.Membership
	for _, membership := range r.memberships {
		if membership.GroupID() == groupID {
			memberships = append(memberships, membership)
		}
	}
	return memberships, nil
}

func (r *MockMembershipRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Membership, error) {
	var memberships []*domain.Membership
	for _, membership := range r.memberships {
		if membership.UserID() == userID {
			memberships = append(memberships, membership)
		}
	}
	return memberships, nil
}

func (r *MockMembershipRepository) FindActiveByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Membership, error) {
	var memberships []*domain.Membership
	for _, membership := range r.memberships {
		if membership.UserID() == userID && membership.IsActive() {
			memberships = append(memberships, membership)
		}
	}
	return memberships, nil
}

func (r *MockMembershipRepository) FindActiveByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Membership, error) {
	var memberships []*domain.Membership
	for _, membership := range r.memberships {
		if membership.GroupID() == groupID && membership.IsActive() {
			memberships = append(memberships, membership)
		}
	}
	return memberships, nil
}

func (r *MockMembershipRepository) Delete(ctx context.Context, id uuid.UUID) error {
	delete(r.memberships, id)
	return nil
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

// Mock validation adapters for testing
type MockPetValidationAdapter struct {
	userPets map[uuid.UUID][]uuid.UUID // userID -> list of owned petIDs
}

func NewMockPetValidationAdapter() *MockPetValidationAdapter {
	return &MockPetValidationAdapter{
		userPets: make(map[uuid.UUID][]uuid.UUID),
	}
}

func (m *MockPetValidationAdapter) SetUserPets(userID uuid.UUID, petIDs []uuid.UUID) {
	m.userPets[userID] = petIDs
}

func (m *MockPetValidationAdapter) ValidateUserOwnsPets(ctx context.Context, userID uuid.UUID, petIDs []uuid.UUID) error {
	ownedPets, exists := m.userPets[userID]
	if !exists {
		return domain.ErrMembershipPetNotOwned
	}

	for _, petID := range petIDs {
		found := false
		for _, ownedPetID := range ownedPets {
			if petID == ownedPetID {
				found = true
				break
			}
		}
		if !found {
			return domain.ErrMembershipPetNotOwned
		}
	}

	return nil
}

type MockUserValidationAdapter struct {
	existingUsers map[uuid.UUID]bool
}

func NewMockUserValidationAdapter() *MockUserValidationAdapter {
	return &MockUserValidationAdapter{
		existingUsers: make(map[uuid.UUID]bool),
	}
}

func (m *MockUserValidationAdapter) AddUser(userID uuid.UUID) {
	m.existingUsers[userID] = true
}

func (m *MockUserValidationAdapter) ValidateUserExists(ctx context.Context, userID uuid.UUID) error {
	if !m.existingUsers[userID] {
		return domain.ErrGroupUnauthorized
	}
	return nil
}