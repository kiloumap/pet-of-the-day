package commands_test

import (
	"context"
	"pet-of-the-day/internal/community/application/commands"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/community/infrastructure"
	"pet-of-the-day/internal/shared/events"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAcceptInvitationHandler_Handle(t *testing.T) {
	tests := []struct {
		name           string
		setupRepos     func() (*infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository, *infrastructure.MockInvitationRepository)
		cmd            commands.AcceptInvitationCommand
		expectedError  error
		validateResult func(t *testing.T, membership *domain.Membership, repos struct {
			group      *infrastructure.MockGroupRepository
			membership *infrastructure.MockMembershipRepository
			invitation *infrastructure.MockInvitationRepository
		})
	}{
		{
			name: "successful invitation acceptance by code",
			setupRepos: func() (*infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository, *infrastructure.MockInvitationRepository) {
				groupRepo := infrastructure.NewMockGroupRepository()
				membershipRepo := infrastructure.NewMockMembershipRepository()
				invitationRepo := infrastructure.NewMockInvitationRepository()

				// Create a group
				group := createTestGroup(t, "Test Group", uuid.New())
				groupRepo.Save(context.Background(), group)

				// Create a valid invitation
				invitation := createTestInvitation(t, group.ID(), "12345678")
				invitationRepo.Save(context.Background(), invitation)

				return groupRepo, membershipRepo, invitationRepo
			},
			cmd: commands.AcceptInvitationCommand{
				InviteCode: "12345678",
				UserID:     uuid.New(),
				PetIDs:     []uuid.UUID{uuid.New()},
			},
			expectedError: nil,
			validateResult: func(t *testing.T, membership *domain.Membership, repos struct {
				group      *infrastructure.MockGroupRepository
				membership *infrastructure.MockMembershipRepository
				invitation *infrastructure.MockInvitationRepository
			}) {
				assert.NotNil(t, membership)
				assert.Equal(t, domain.MembershipStatusActive, membership.Status())
				assert.Len(t, membership.PetIDs(), 1)

				// Verify invitation was accepted
				savedInvitations := repos.invitation.GetAll()
				assert.Len(t, savedInvitations, 1)
				assert.Equal(t, domain.InvitationStatusAccepted, savedInvitations[0].Status())

				// Verify membership was saved
				savedMemberships := repos.membership.GetAll()
				assert.Len(t, savedMemberships, 1)
				assert.Equal(t, domain.MembershipStatusActive, savedMemberships[0].Status())
			},
		},
		{
			name: "successful invitation acceptance with case insensitive code",
			setupRepos: func() (*infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository, *infrastructure.MockInvitationRepository) {
				groupRepo := infrastructure.NewMockGroupRepository()
				membershipRepo := infrastructure.NewMockMembershipRepository()
				invitationRepo := infrastructure.NewMockInvitationRepository()

				// Create a group
				group := createTestGroup(t, "Test Group", uuid.New())
				groupRepo.Save(context.Background(), group)

				// Create a valid invitation with lowercase code
				invitation := createTestInvitation(t, group.ID(), "abcd1234")
				invitationRepo.Save(context.Background(), invitation)

				return groupRepo, membershipRepo, invitationRepo
			},
			cmd: commands.AcceptInvitationCommand{
				InviteCode: "ABCD1234", // Uppercase code should work
				UserID:     uuid.New(),
				PetIDs:     []uuid.UUID{uuid.New()},
			},
			expectedError: nil,
			validateResult: func(t *testing.T, membership *domain.Membership, repos struct {
				group      *infrastructure.MockGroupRepository
				membership *infrastructure.MockMembershipRepository
				invitation *infrastructure.MockInvitationRepository
			}) {
				assert.NotNil(t, membership)
				assert.Equal(t, domain.MembershipStatusActive, membership.Status())
			},
		},
		{
			name: "successful invitation acceptance with whitespace in code",
			setupRepos: func() (*infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository, *infrastructure.MockInvitationRepository) {
				groupRepo := infrastructure.NewMockGroupRepository()
				membershipRepo := infrastructure.NewMockMembershipRepository()
				invitationRepo := infrastructure.NewMockInvitationRepository()

				// Create a group
				group := createTestGroup(t, "Test Group", uuid.New())
				groupRepo.Save(context.Background(), group)

				// Create a valid invitation
				invitation := createTestInvitation(t, group.ID(), "abcd1234")
				invitationRepo.Save(context.Background(), invitation)

				return groupRepo, membershipRepo, invitationRepo
			},
			cmd: commands.AcceptInvitationCommand{
				InviteCode: "  ABCD1234  ", // Code with spaces should work
				UserID:     uuid.New(),
				PetIDs:     []uuid.UUID{uuid.New()},
			},
			expectedError: nil,
			validateResult: func(t *testing.T, membership *domain.Membership, repos struct {
				group      *infrastructure.MockGroupRepository
				membership *infrastructure.MockMembershipRepository
				invitation *infrastructure.MockInvitationRepository
			}) {
				assert.NotNil(t, membership)
				assert.Equal(t, domain.MembershipStatusActive, membership.Status())
			},
		},
		{
			name: "invitation not found",
			setupRepos: func() (*infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository, *infrastructure.MockInvitationRepository) {
				groupRepo := infrastructure.NewMockGroupRepository()
				membershipRepo := infrastructure.NewMockMembershipRepository()
				invitationRepo := infrastructure.NewMockInvitationRepository()

				return groupRepo, membershipRepo, invitationRepo
			},
			cmd: commands.AcceptInvitationCommand{
				InviteCode: "nonexistent",
				UserID:     uuid.New(),
				PetIDs:     []uuid.UUID{uuid.New()},
			},
			expectedError: domain.ErrInvitationNotFound,
			validateResult: func(t *testing.T, membership *domain.Membership, repos struct {
				group      *infrastructure.MockGroupRepository
				membership *infrastructure.MockMembershipRepository
				invitation *infrastructure.MockInvitationRepository
			}) {
				assert.Nil(t, membership)
			},
		},
		{
			name: "expired invitation",
			setupRepos: func() (*infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository, *infrastructure.MockInvitationRepository) {
				groupRepo := infrastructure.NewMockGroupRepository()
				membershipRepo := infrastructure.NewMockMembershipRepository()
				invitationRepo := infrastructure.NewMockInvitationRepository()

				// Create a group
				group := createTestGroup(t, "Test Group", uuid.New())
				groupRepo.Save(context.Background(), group)

				// Create an expired invitation
				invitation := createExpiredTestInvitation(t, group.ID(), "expired123")
				invitationRepo.Save(context.Background(), invitation)

				return groupRepo, membershipRepo, invitationRepo
			},
			cmd: commands.AcceptInvitationCommand{
				InviteCode: "expired123",
				UserID:     uuid.New(),
				PetIDs:     []uuid.UUID{uuid.New()},
			},
			expectedError: domain.ErrInvitationExpired,
			validateResult: func(t *testing.T, membership *domain.Membership, repos struct {
				group      *infrastructure.MockGroupRepository
				membership *infrastructure.MockMembershipRepository
				invitation *infrastructure.MockInvitationRepository
			}) {
				assert.Nil(t, membership)
			},
		},
		{
			name: "user already member",
			setupRepos: func() (*infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository, *infrastructure.MockInvitationRepository) {
				groupRepo := infrastructure.NewMockGroupRepository()
				membershipRepo := infrastructure.NewMockMembershipRepository()
				invitationRepo := infrastructure.NewMockInvitationRepository()

				userID := uuid.New()
				groupID := uuid.New()

				// Create a group
				group := createTestGroup(t, "Test Group", groupID)
				groupRepo.Save(context.Background(), group)

				// Create a valid invitation
				invitation := createTestInvitation(t, groupID, "12345678")
				invitationRepo.Save(context.Background(), invitation)

				// Create existing membership
				existingMembership, _ := domain.NewMembership(groupID, userID, []uuid.UUID{uuid.New()})
				existingMembership.Accept()
				membershipRepo.Save(context.Background(), existingMembership)

				return groupRepo, membershipRepo, invitationRepo
			},
			cmd: commands.AcceptInvitationCommand{
				InviteCode: "12345678",
				UserID:     uuid.New(), // This needs to match the existing membership user
				PetIDs:     []uuid.UUID{uuid.New()},
			},
			expectedError: nil, // Should create new membership since UserID is different
			validateResult: func(t *testing.T, membership *domain.Membership, repos struct {
				group      *infrastructure.MockGroupRepository
				membership *infrastructure.MockMembershipRepository
				invitation *infrastructure.MockInvitationRepository
			}) {
				assert.NotNil(t, membership)
				// Should have 2 memberships now
				savedMemberships := repos.membership.GetAll()
				assert.Len(t, savedMemberships, 2)
			},
		},
		{
			name: "no invite code or invitation ID provided",
			setupRepos: func() (*infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository, *infrastructure.MockInvitationRepository) {
				groupRepo := infrastructure.NewMockGroupRepository()
				membershipRepo := infrastructure.NewMockMembershipRepository()
				invitationRepo := infrastructure.NewMockInvitationRepository()

				return groupRepo, membershipRepo, invitationRepo
			},
			cmd: commands.AcceptInvitationCommand{
				UserID: uuid.New(),
				PetIDs: []uuid.UUID{uuid.New()},
				// No InviteCode or InvitationID
			},
			expectedError: domain.ErrInvitationInvalid,
			validateResult: func(t *testing.T, membership *domain.Membership, repos struct {
				group      *infrastructure.MockGroupRepository
				membership *infrastructure.MockMembershipRepository
				invitation *infrastructure.MockInvitationRepository
			}) {
				assert.Nil(t, membership)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup repositories
			groupRepo, membershipRepo, invitationRepo := tt.setupRepos()
			eventBus := events.NewInMemoryEventBus()

			// Create handler
			handler := commands.NewAcceptInvitationHandler(
				groupRepo,
				membershipRepo,
				invitationRepo,
				eventBus,
			)

			// Handle command
			result, err := handler.Handle(context.Background(), tt.cmd)

			// Assert error
			if tt.expectedError != nil {
				assert.ErrorIs(t, err, tt.expectedError)
			} else {
				assert.NoError(t, err)
			}

			// Validate result
			repos := struct {
				group      *infrastructure.MockGroupRepository
				membership *infrastructure.MockMembershipRepository
				invitation *infrastructure.MockInvitationRepository
			}{
				group:      groupRepo,
				membership: membershipRepo,
				invitation: invitationRepo,
			}
			tt.validateResult(t, result, repos)
		})
	}
}

func TestAcceptInvitationHandler_Handle_SameUserAlreadyMember(t *testing.T) {
	groupRepo := infrastructure.NewMockGroupRepository()
	membershipRepo := infrastructure.NewMockMembershipRepository()
	invitationRepo := infrastructure.NewMockInvitationRepository()

	userID := uuid.New()
	groupID := uuid.New()

	// Create a group
	group := createTestGroup(t, "Test Group", groupID)
	groupRepo.Save(context.Background(), group)

	// Create a valid invitation
	invitation := createTestInvitation(t, groupID, "12345678")
	invitationRepo.Save(context.Background(), invitation)

	// Create existing membership for the same user
	existingMembership, _ := domain.NewMembership(groupID, userID, []uuid.UUID{uuid.New()})
	existingMembership.Accept()
	membershipRepo.Save(context.Background(), existingMembership)

	// Create handler
	eventBus := events.NewInMemoryEventBus()
	handler := commands.NewAcceptInvitationHandler(
		groupRepo,
		membershipRepo,
		invitationRepo,
		eventBus,
	)

	// Try to accept invitation with same user
	cmd := commands.AcceptInvitationCommand{
		InviteCode: "12345678",
		UserID:     userID, // Same user as existing membership
		PetIDs:     []uuid.UUID{uuid.New()},
	}

	result, err := handler.Handle(context.Background(), cmd)

	// Should return already member error
	assert.ErrorIs(t, err, domain.ErrMembershipAlreadyMember)
	assert.Nil(t, result)

	// Should still have only 1 membership
	savedMemberships := membershipRepo.GetAll()
	assert.Len(t, savedMemberships, 1)
}

// Helper functions

func createTestGroup(t *testing.T, name string, creatorID uuid.UUID) *domain.Group {
	group, err := domain.NewGroup(name, "Test description", creatorID)
	require.NoError(t, err)
	return group
}

func createTestInvitation(t *testing.T, groupID uuid.UUID, inviteCode string) *domain.Invitation {
	inviterID := uuid.New()

	// Create invitation using domain constructor
	invitation := domain.ReconstructInvitation(
		uuid.New(),
		groupID,
		inviterID,
		"",
		inviteCode,
		domain.InvitationTypeCode,
		domain.InvitationStatusPending,
		time.Now().Add(24*time.Hour), // Valid for 24 hours
		time.Now(),
		time.Now(),
	)

	return invitation
}

func createExpiredTestInvitation(t *testing.T, groupID uuid.UUID, inviteCode string) *domain.Invitation {
	inviterID := uuid.New()

	// Create expired invitation using domain constructor
	invitation := domain.ReconstructInvitation(
		uuid.New(),
		groupID,
		inviterID,
		"",
		inviteCode,
		domain.InvitationTypeCode,
		domain.InvitationStatusPending,
		time.Now().Add(-24*time.Hour), // Expired 24 hours ago
		time.Now(),
		time.Now(),
	)

	return invitation
}
