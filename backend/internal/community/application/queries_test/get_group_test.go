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

func TestGetGroupHandler_Handle(t *testing.T) {
	tests := []struct {
		name       string
		setupMocks func(*infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository) (queries.GetGroupQuery, *domain.Group)
		wantErr    error
		checkResult func(*testing.T, *queries.GroupWithMembership, *domain.Group)
	}{
		{
			name: "creator accesses their group",
			setupMocks: func(groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository) (queries.GetGroupQuery, *domain.Group) {
				creatorID := uuid.New()
				group, _ := domain.NewGroup("Creator's Group", "Test group", creatorID)
				groupRepo.Save(context.Background(), group)

				return queries.GetGroupQuery{
					GroupID: group.ID(),
					UserID:  creatorID,
				}, group
			},
			wantErr: nil,
			checkResult: func(t *testing.T, result *queries.GroupWithMembership, expectedGroup *domain.Group) {
				assert.Equal(t, expectedGroup.ID(), result.Group.ID())
				assert.Equal(t, expectedGroup.Name(), result.Group.Name())
				assert.True(t, result.IsCreator)
				assert.Nil(t, result.Membership) // Creator doesn't have membership
			},
		},
		{
			name: "member accesses group",
			setupMocks: func(groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository) (queries.GetGroupQuery, *domain.Group) {
				creatorID := uuid.New()
				memberID := uuid.New()
				petIDs := []uuid.UUID{uuid.New()}

				group, _ := domain.NewGroup("Test Group", "Test group", creatorID)
				groupRepo.Save(context.Background(), group)

				membership, _ := domain.NewMembership(group.ID(), memberID, petIDs)
				membership.Accept() // Make active
				membershipRepo.Save(context.Background(), membership)

				return queries.GetGroupQuery{
					GroupID: group.ID(),
					UserID:  memberID,
				}, group
			},
			wantErr: nil,
			checkResult: func(t *testing.T, result *queries.GroupWithMembership, expectedGroup *domain.Group) {
				assert.Equal(t, expectedGroup.ID(), result.Group.ID())
				assert.False(t, result.IsCreator)
				assert.NotNil(t, result.Membership)
				assert.Equal(t, domain.MembershipStatusActive, result.Membership.Status())
			},
		},
		{
			name: "non-member tries to access private group",
			setupMocks: func(groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository) (queries.GetGroupQuery, *domain.Group) {
				creatorID := uuid.New()
				outsiderID := uuid.New()

				group, _ := domain.NewGroup("Private Group", "Test group", creatorID)
				group.SetPrivacy(domain.GroupPrivacyPrivate)
				groupRepo.Save(context.Background(), group)

				return queries.GetGroupQuery{
					GroupID: group.ID(),
					UserID:  outsiderID,
				}, group
			},
			wantErr: domain.ErrGroupUnauthorized,
			checkResult: func(t *testing.T, result *queries.GroupWithMembership, expectedGroup *domain.Group) {
				assert.Nil(t, result)
			},
		},
		{
			name: "non-member accesses public group",
			setupMocks: func(groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository) (queries.GetGroupQuery, *domain.Group) {
				creatorID := uuid.New()
				visitorID := uuid.New()

				group, _ := domain.NewGroup("Public Group", "Test group", creatorID)
				group.SetPrivacy(domain.GroupPrivacyPublic)
				groupRepo.Save(context.Background(), group)

				return queries.GetGroupQuery{
					GroupID: group.ID(),
					UserID:  visitorID,
				}, group
			},
			wantErr: nil,
			checkResult: func(t *testing.T, result *queries.GroupWithMembership, expectedGroup *domain.Group) {
				assert.Equal(t, expectedGroup.ID(), result.Group.ID())
				assert.False(t, result.IsCreator)
				assert.Nil(t, result.Membership) // No membership for visitor
			},
		},
		{
			name: "group does not exist",
			setupMocks: func(groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository) (queries.GetGroupQuery, *domain.Group) {
				nonExistentGroupID := uuid.New()
				userID := uuid.New()

				return queries.GetGroupQuery{
					GroupID: nonExistentGroupID,
					UserID:  userID,
				}, nil
			},
			wantErr: domain.ErrGroupNotFound,
			checkResult: func(t *testing.T, result *queries.GroupWithMembership, expectedGroup *domain.Group) {
				assert.Nil(t, result)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			groupRepo := infrastructure.NewMockGroupRepository()
			membershipRepo := infrastructure.NewMockMembershipRepository()
			handler := queries.NewGetGroupHandler(groupRepo, membershipRepo)

			// Setup mocks
			query, expectedGroup := tt.setupMocks(groupRepo, membershipRepo)

			// Execute
			result, err := handler.Handle(context.Background(), query)

			// Assert
			if tt.wantErr != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.wantErr, err)
			} else {
				require.NoError(t, err)
			}

			tt.checkResult(t, result, expectedGroup)
		})
	}
}

func TestGetGroupHandler_Handle_PendingMembership(t *testing.T) {
	// Setup
	groupRepo := infrastructure.NewMockGroupRepository()
	membershipRepo := infrastructure.NewMockMembershipRepository()
	handler := queries.NewGetGroupHandler(groupRepo, membershipRepo)

	creatorID := uuid.New()
	pendingUserID := uuid.New()
	petIDs := []uuid.UUID{uuid.New()}

	group, _ := domain.NewGroup("Test Group", "Test group", creatorID)
	groupRepo.Save(context.Background(), group)

	// Create pending membership
	membership, _ := domain.NewMembership(group.ID(), pendingUserID, petIDs)
	// Don't accept - leave as pending
	membershipRepo.Save(context.Background(), membership)

	query := queries.GetGroupQuery{
		GroupID: group.ID(),
		UserID:  pendingUserID,
	}

	// Execute
	result, err := handler.Handle(context.Background(), query)

	// Assert - user with pending membership should be able to access group
	require.NoError(t, err)
	require.NotNil(t, result)
	assert.Equal(t, group.ID(), result.Group.ID())
	assert.False(t, result.IsCreator)
	assert.NotNil(t, result.Membership)
	assert.Equal(t, domain.MembershipStatusPending, result.Membership.Status())
}