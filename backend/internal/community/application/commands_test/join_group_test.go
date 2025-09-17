package commands_test

import (
	"context"
	"pet-of-the-day/internal/community/application/commands"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/community/infrastructure"
	"pet-of-the-day/internal/shared/events"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJoinGroupHandler_Handle(t *testing.T) {
	tests := []struct {
		name       string
		setupMocks func(*infrastructure.MockUserValidationAdapter, *infrastructure.MockPetValidationAdapter, *infrastructure.MockGroupRepository, *infrastructure.MockMembershipRepository) (commands.JoinGroupCommand, uuid.UUID)
		wantErr    error
	}{
		{
			name: "successful group join",
			setupMocks: func(userValidator *infrastructure.MockUserValidationAdapter, petValidator *infrastructure.MockPetValidationAdapter, groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository) (commands.JoinGroupCommand, uuid.UUID) {
				// Setup user and pets
				userID := uuid.New()
				petIDs := []uuid.UUID{uuid.New(), uuid.New()}
				userValidator.AddUser(userID)
				petValidator.SetUserPets(userID, petIDs)

				// Setup group
				creatorID := uuid.New()
				group, _ := domain.NewGroup("Test Group", "Description", creatorID)
				groupRepo.Save(context.Background(), group)

				return commands.JoinGroupCommand{
					GroupID: group.ID(),
					UserID:  userID,
					PetIDs:  petIDs,
				}, group.ID()
			},
			wantErr: nil,
		},
		{
			name: "user does not exist",
			setupMocks: func(userValidator *infrastructure.MockUserValidationAdapter, petValidator *infrastructure.MockPetValidationAdapter, groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository) (commands.JoinGroupCommand, uuid.UUID) {
				// Setup group but not user
				creatorID := uuid.New()
				group, _ := domain.NewGroup("Test Group", "Description", creatorID)
				groupRepo.Save(context.Background(), group)

				userID := uuid.New()
				petIDs := []uuid.UUID{uuid.New()}

				return commands.JoinGroupCommand{
					GroupID: group.ID(),
					UserID:  userID,
					PetIDs:  petIDs,
				}, group.ID()
			},
			wantErr: domain.ErrGroupUnauthorized,
		},
		{
			name: "user does not own pets",
			setupMocks: func(userValidator *infrastructure.MockUserValidationAdapter, petValidator *infrastructure.MockPetValidationAdapter, groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository) (commands.JoinGroupCommand, uuid.UUID) {
				// Setup user but not pets
				userID := uuid.New()
				userValidator.AddUser(userID)
				petValidator.SetUserPets(userID, []uuid.UUID{}) // No pets

				// Setup group
				creatorID := uuid.New()
				group, _ := domain.NewGroup("Test Group", "Description", creatorID)
				groupRepo.Save(context.Background(), group)

				unauthorizedPetIDs := []uuid.UUID{uuid.New()}

				return commands.JoinGroupCommand{
					GroupID: group.ID(),
					UserID:  userID,
					PetIDs:  unauthorizedPetIDs,
				}, group.ID()
			},
			wantErr: domain.ErrMembershipPetNotOwned,
		},
		{
			name: "group does not exist",
			setupMocks: func(userValidator *infrastructure.MockUserValidationAdapter, petValidator *infrastructure.MockPetValidationAdapter, groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository) (commands.JoinGroupCommand, uuid.UUID) {
				// Setup user and pets
				userID := uuid.New()
				petIDs := []uuid.UUID{uuid.New()}
				userValidator.AddUser(userID)
				petValidator.SetUserPets(userID, petIDs)

				nonExistentGroupID := uuid.New()

				return commands.JoinGroupCommand{
					GroupID: nonExistentGroupID,
					UserID:  userID,
					PetIDs:  petIDs,
				}, nonExistentGroupID
			},
			wantErr: domain.ErrGroupNotFound,
		},
		{
			name: "user already member",
			setupMocks: func(userValidator *infrastructure.MockUserValidationAdapter, petValidator *infrastructure.MockPetValidationAdapter, groupRepo *infrastructure.MockGroupRepository, membershipRepo *infrastructure.MockMembershipRepository) (commands.JoinGroupCommand, uuid.UUID) {
				// Setup user and pets
				userID := uuid.New()
				petIDs := []uuid.UUID{uuid.New()}
				userValidator.AddUser(userID)
				petValidator.SetUserPets(userID, petIDs)

				// Setup group
				creatorID := uuid.New()
				group, _ := domain.NewGroup("Test Group", "Description", creatorID)
				groupRepo.Save(context.Background(), group)

				// Create existing membership
				membership, _ := domain.NewMembership(group.ID(), userID, petIDs)
				membership.Accept() // Make it active
				membershipRepo.Save(context.Background(), membership)

				return commands.JoinGroupCommand{
					GroupID: group.ID(),
					UserID:  userID,
					PetIDs:  petIDs,
				}, group.ID()
			},
			wantErr: domain.ErrMembershipAlreadyMember,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			groupRepo := infrastructure.NewMockGroupRepository()
			membershipRepo := infrastructure.NewMockMembershipRepository()
			eventBus := events.NewInMemoryEventBus()
			userValidator := infrastructure.NewMockUserValidationAdapter()
			petValidator := infrastructure.NewMockPetValidationAdapter()
			validationService := domain.NewCrossContextValidationService(petValidator, userValidator)

			handler := commands.NewJoinGroupHandler(groupRepo, membershipRepo, eventBus, validationService)

			// Setup mocks
			cmd, expectedGroupID := tt.setupMocks(userValidator, petValidator, groupRepo, membershipRepo)

			// Execute
			membership, err := handler.Handle(context.Background(), cmd)

			// Assert
			if tt.wantErr != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.wantErr, err)
				assert.Nil(t, membership)
			} else {
				require.NoError(t, err)
				require.NotNil(t, membership)
				assert.Equal(t, expectedGroupID, membership.GroupID())
				assert.Equal(t, cmd.UserID, membership.UserID())
				assert.Equal(t, cmd.PetIDs, membership.PetIDs())
				// Should be pending for private groups
				assert.Equal(t, domain.MembershipStatusPending, membership.Status())

				// Verify membership was saved
				savedMembership, err := membershipRepo.FindByID(context.Background(), membership.ID())
				require.NoError(t, err)
				assert.Equal(t, membership.ID(), savedMembership.ID())
			}
		})
	}
}

func TestJoinGroupHandler_Handle_CreatorAutoAccept(t *testing.T) {
	// Setup
	groupRepo := infrastructure.NewMockGroupRepository()
	membershipRepo := infrastructure.NewMockMembershipRepository()
	eventBus := events.NewInMemoryEventBus()
	userValidator := infrastructure.NewMockUserValidationAdapter()
	petValidator := infrastructure.NewMockPetValidationAdapter()
	validationService := domain.NewCrossContextValidationService(petValidator, userValidator)

	handler := commands.NewJoinGroupHandler(groupRepo, membershipRepo, eventBus, validationService)

	// Setup: creator joins their own group
	creatorID := uuid.New()
	petIDs := []uuid.UUID{uuid.New()}
	userValidator.AddUser(creatorID)
	petValidator.SetUserPets(creatorID, petIDs)

	group, _ := domain.NewGroup("Creator's Group", "Description", creatorID)
	groupRepo.Save(context.Background(), group)

	cmd := commands.JoinGroupCommand{
		GroupID: group.ID(),
		UserID:  creatorID,
		PetIDs:  petIDs,
	}

	// Execute
	membership, err := handler.Handle(context.Background(), cmd)

	// Assert - creator should be auto-accepted
	require.NoError(t, err)
	require.NotNil(t, membership)
	assert.Equal(t, domain.MembershipStatusActive, membership.Status())
}