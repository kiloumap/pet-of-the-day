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

func TestCreateGroupHandler_Handle(t *testing.T) {
	tests := []struct {
		name        string
		setupMocks  func(*infrastructure.MockUserValidationAdapter, *infrastructure.MockGroupRepository)
		command     commands.CreateGroupCommand
		wantErr     error
		wantGroupID bool
	}{
		{
			name: "successful group creation",
			setupMocks: func(userValidator *infrastructure.MockUserValidationAdapter, groupRepo *infrastructure.MockGroupRepository) {
				creatorID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
				userValidator.AddUser(creatorID)
			},
			command: commands.CreateGroupCommand{
				Name:        "Mon Quartier",
				Description: "Groupe pour les voisins",
				CreatorID:   uuid.MustParse("00000000-0000-0000-0000-000000000001"),
			},
			wantErr:     nil,
			wantGroupID: true,
		},
		{
			name: "user does not exist",
			setupMocks: func(userValidator *infrastructure.MockUserValidationAdapter, groupRepo *infrastructure.MockGroupRepository) {
				// Don't add user to validator
			},
			command: commands.CreateGroupCommand{
				Name:        "Test Group",
				Description: "Test description",
				CreatorID:   uuid.MustParse("00000000-0000-0000-0000-000000000002"),
			},
			wantErr:     domain.ErrGroupUnauthorized,
			wantGroupID: false,
		},
		{
			name: "empty group name",
			setupMocks: func(userValidator *infrastructure.MockUserValidationAdapter, groupRepo *infrastructure.MockGroupRepository) {
				creatorID := uuid.MustParse("00000000-0000-0000-0000-000000000003")
				userValidator.AddUser(creatorID)
			},
			command: commands.CreateGroupCommand{
				Name:        "",
				Description: "Test description",
				CreatorID:   uuid.MustParse("00000000-0000-0000-0000-000000000003"),
			},
			wantErr:     domain.ErrGroupInvalidName,
			wantGroupID: false,
		},
		{
			name: "duplicate group name",
			setupMocks: func(userValidator *infrastructure.MockUserValidationAdapter, groupRepo *infrastructure.MockGroupRepository) {
				creatorID := uuid.MustParse("00000000-0000-0000-0000-000000000004")
				userValidator.AddUser(creatorID)

				// Create existing group with same name
				existingGroup, _ := domain.NewGroup("Existing Group", "Description", creatorID)
				groupRepo.Save(context.Background(), existingGroup)
			},
			command: commands.CreateGroupCommand{
				Name:        "Existing Group",
				Description: "Another description",
				CreatorID:   uuid.MustParse("00000000-0000-0000-0000-000000000004"),
			},
			wantErr:     domain.ErrGroupAlreadyExists,
			wantGroupID: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			groupRepo := infrastructure.NewMockGroupRepository()
			eventBus := events.NewInMemoryEventBus()
			userValidator := infrastructure.NewMockUserValidationAdapter()
			petValidator := infrastructure.NewMockPetValidationAdapter()
			validationService := domain.NewCrossContextValidationService(petValidator, userValidator)

			handler := commands.NewCreateGroupHandler(groupRepo, eventBus, validationService)

			// Setup mocks
			tt.setupMocks(userValidator, groupRepo)

			// Execute
			group, err := handler.Handle(context.Background(), tt.command)

			// Assert
			if tt.wantErr != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.wantErr, err)
				assert.Nil(t, group)
			} else {
				require.NoError(t, err)
				require.NotNil(t, group)
				assert.Equal(t, tt.command.Name, group.Name())
				assert.Equal(t, tt.command.Description, group.Description())
				assert.Equal(t, tt.command.CreatorID, group.CreatorID())
				assert.Equal(t, domain.GroupPrivacyPrivate, group.Privacy())

				// Verify group was saved
				savedGroup, err := groupRepo.FindByID(context.Background(), group.ID())
				require.NoError(t, err)
				assert.Equal(t, group.ID(), savedGroup.ID())
			}
		})
	}
}

func TestCreateGroupHandler_Handle_Integration(t *testing.T) {
	// Setup
	groupRepo := infrastructure.NewMockGroupRepository()
	eventBus := events.NewInMemoryEventBus()
	userValidator := infrastructure.NewMockUserValidationAdapter()
	petValidator := infrastructure.NewMockPetValidationAdapter()
	validationService := domain.NewCrossContextValidationService(petValidator, userValidator)

	handler := commands.NewCreateGroupHandler(groupRepo, eventBus, validationService)

	creatorID := uuid.New()
	userValidator.AddUser(creatorID)

	// Test event publishing
	var publishedEvents []events.Event
	eventBus.Subscribe("community.group.created", events.HandlerFunc(func(ctx context.Context, event events.Event) error {
		publishedEvents = append(publishedEvents, event)
		return nil
	}))

	// Execute
	cmd := commands.CreateGroupCommand{
		Name:        "Test Event Group",
		Description: "Testing events",
		CreatorID:   creatorID,
	}

	group, err := handler.Handle(context.Background(), cmd)
	require.NoError(t, err)
	require.NotNil(t, group)

	// Verify event was published
	assert.Len(t, publishedEvents, 1)
	assert.Equal(t, "community.group.created", publishedEvents[0].EventType())
}