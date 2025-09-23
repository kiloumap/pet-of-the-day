package queries_test

import (
	"context"
	"pet-of-the-day/internal/community/application/queries"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/community/infrastructure"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetUserGroupsHandler_Handle(t *testing.T) {
	tests := []struct {
		name        string
		setupMocks  func(*infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository, uuid.UUID) queries.GetUserGroupsQuery
		checkResult func(*testing.T, *queries.UserGroupsResult, uuid.UUID)
		wantErr     error
	}{
		{
			name: "user with created and joined groups",
			setupMocks: func(groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository, userID uuid.UUID) queries.GetUserGroupsQuery {
				// Create groups where user is creator
				createdGroup1, _ := domain.NewGroup("My Group 1", "First group", userID)
				createdGroup2, _ := domain.NewGroup("My Group 2", "Second group", userID)
				groupRepo.Save(context.Background(), createdGroup1)
				groupRepo.Save(context.Background(), createdGroup2)

				// Create group where user is member
				otherCreatorID := uuid.New()
				joinedGroup, _ := domain.NewGroup("Joined Group", "Group I joined", otherCreatorID)
				groupRepo.Save(context.Background(), joinedGroup)

				// Create active membership
				petIDs := []uuid.UUID{uuid.New(), uuid.New()}
				membership, _ := domain.NewMembership(joinedGroup.ID(), userID, petIDs)
				membership.Accept()
				membershipRepo.Save(context.Background(), membership)

				return queries.GetUserGroupsQuery{UserID: userID}
			},
			checkResult: func(t *testing.T, result *queries.UserGroupsResult, userID uuid.UUID) {
				// Should have 2 created groups
				assert.Len(t, result.CreatedGroups, 2)
				for _, group := range result.CreatedGroups {
					assert.Equal(t, userID, group.CreatorID())
				}

				// Should have 1 joined group
				assert.Len(t, result.JoinedGroups, 1)
				assert.Equal(t, "Joined Group", result.JoinedGroups[0].Group.Name())
				assert.Equal(t, domain.MembershipStatusActive, result.JoinedGroups[0].Membership.Status())
			},
			wantErr: nil,
		},
		{
			name: "user with only created groups",
			setupMocks: func(groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository, userID uuid.UUID) queries.GetUserGroupsQuery {
				// Create groups where user is creator
				createdGroup, _ := domain.NewGroup("Solo Group", "Only group", userID)
				groupRepo.Save(context.Background(), createdGroup)

				return queries.GetUserGroupsQuery{UserID: userID}
			},
			checkResult: func(t *testing.T, result *queries.UserGroupsResult, userID uuid.UUID) {
				assert.Len(t, result.CreatedGroups, 1)
				assert.Equal(t, "Solo Group", result.CreatedGroups[0].Name())
				assert.Len(t, result.JoinedGroups, 0)
			},
			wantErr: nil,
		},
		{
			name: "user with no groups",
			setupMocks: func(groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository, userID uuid.UUID) queries.GetUserGroupsQuery {
				// Don't create any groups or memberships
				return queries.GetUserGroupsQuery{UserID: userID}
			},
			checkResult: func(t *testing.T, result *queries.UserGroupsResult, userID uuid.UUID) {
				assert.Len(t, result.CreatedGroups, 0)
				assert.Len(t, result.JoinedGroups, 0)
			},
			wantErr: nil,
		},
		{
			name: "user with inactive memberships",
			setupMocks: func(groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository, userID uuid.UUID) queries.GetUserGroupsQuery {
				otherCreatorID := uuid.New()
				group, _ := domain.NewGroup("Test Group", "Group", otherCreatorID)
				groupRepo.Save(context.Background(), group)

				// Create left membership
				petIDs := []uuid.UUID{uuid.New()}
				membership, _ := domain.NewMembership(group.ID(), userID, petIDs)
				membership.Accept()
				membership.Leave() // User left
				membershipRepo.Save(context.Background(), membership)

				return queries.GetUserGroupsQuery{UserID: userID}
			},
			checkResult: func(t *testing.T, result *queries.UserGroupsResult, userID uuid.UUID) {
				assert.Len(t, result.CreatedGroups, 0)
				assert.Len(t, result.JoinedGroups, 0) // Should not include left memberships
			},
			wantErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			groupRepo := infrastructure.NewMockGroupRepository()
			membershipRepo := infrastructure.NewMockMembershipRepository()
			handler := queries.NewGetUserGroupsHandler(groupRepo, membershipRepo)

			userID := uuid.New()

			// Setup mocks
			query := tt.setupMocks(groupRepo, membershipRepo, userID)

			// Execute
			result, err := handler.Handle(context.Background(), query)

			// Assert
			if tt.wantErr != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.wantErr, err)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				require.NotNil(t, result)
				tt.checkResult(t, result, userID)
			}
		})
	}
}

func TestGetUserGroupsHandler_Handle_DoesNotDuplicateCreatedGroups(t *testing.T) {
	// Test that if a user creates a group AND has membership, it only appears in CreatedGroups
	groupRepo := infrastructure.NewMockGroupRepository()
	membershipRepo := infrastructure.NewMockMembershipRepository()
	handler := queries.NewGetUserGroupsHandler(groupRepo, membershipRepo)

	userID := uuid.New()

	// User creates a group
	createdGroup, _ := domain.NewGroup("My Group", "Description", userID)
	groupRepo.Save(context.Background(), createdGroup)

	// User also becomes a member of their own group
	petIDs := []uuid.UUID{uuid.New()}
	membership, _ := domain.NewMembership(createdGroup.ID(), userID, petIDs)
	membership.Accept()
	membershipRepo.Save(context.Background(), membership)

	query := queries.GetUserGroupsQuery{UserID: userID}

	// Execute
	result, err := handler.Handle(context.Background(), query)

	// Assert
	require.NoError(t, err)
	require.NotNil(t, result)

	// Should only appear in CreatedGroups, not JoinedGroups
	assert.Len(t, result.CreatedGroups, 1)
	assert.Equal(t, createdGroup.ID(), result.CreatedGroups[0].ID())
	assert.Len(t, result.JoinedGroups, 0)
}
