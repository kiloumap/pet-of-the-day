package domain

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewGroup(t *testing.T) {
	tests := []struct {
		name        string
		groupName   string
		description string
		creatorID   uuid.UUID
		wantErr     error
	}{
		{
			name:        "valid group creation",
			groupName:   "Mon Quartier",
			description: "Groupe pour les voisins",
			creatorID:   uuid.New(),
			wantErr:     nil,
		},
		{
			name:        "empty name should fail",
			groupName:   "",
			description: "Some description",
			creatorID:   uuid.New(),
			wantErr:     ErrGroupInvalidName,
		},
		{
			name:        "empty description is allowed",
			groupName:   "Test Group",
			description: "",
			creatorID:   uuid.New(),
			wantErr:     nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			group, err := NewGroup(tt.groupName, tt.description, tt.creatorID)

			if tt.wantErr != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.wantErr, err)
				assert.Nil(t, group)
			} else {
				require.NoError(t, err)
				require.NotNil(t, group)

				assert.NotEqual(t, uuid.Nil, group.ID())
				assert.Equal(t, tt.groupName, group.Name())
				assert.Equal(t, tt.description, group.Description())
				assert.Equal(t, tt.creatorID, group.CreatorID())
				assert.Equal(t, GroupPrivacyPrivate, group.Privacy()) // Default is private
				assert.WithinDuration(t, time.Now(), group.CreatedAt(), time.Second)
				assert.WithinDuration(t, time.Now(), group.UpdatedAt(), time.Second)

				// Check domain events
				events := group.DomainEvents()
				require.Len(t, events, 1)

				event, ok := events[0].(*GroupCreatedEvent)
				require.True(t, ok)
				assert.Equal(t, group.ID(), event.GroupID)
				assert.Equal(t, group.Name(), event.GroupName)
				assert.Equal(t, group.CreatorID(), event.CreatorID)
			}
		})
	}
}

func TestGroup_UpdateDetails(t *testing.T) {
	group, err := NewGroup("Original Name", "Original Description", uuid.New())
	require.NoError(t, err)

	originalUpdatedAt := group.UpdatedAt()
	time.Sleep(time.Millisecond) // Ensure time difference

	t.Run("valid update", func(t *testing.T) {
		err := group.UpdateDetails("New Name", "New Description")
		require.NoError(t, err)

		assert.Equal(t, "New Name", group.Name())
		assert.Equal(t, "New Description", group.Description())
		assert.True(t, group.UpdatedAt().After(originalUpdatedAt))
	})

	t.Run("empty name should fail", func(t *testing.T) {
		err := group.UpdateDetails("", "Some description")
		assert.Equal(t, ErrGroupInvalidName, err)
	})
}

func TestGroup_SetPrivacy(t *testing.T) {
	group, err := NewGroup("Test Group", "Description", uuid.New())
	require.NoError(t, err)

	originalUpdatedAt := group.UpdatedAt()
	time.Sleep(time.Millisecond)

	t.Run("valid privacy change", func(t *testing.T) {
		err := group.SetPrivacy(GroupPrivacyPublic)
		require.NoError(t, err)

		assert.Equal(t, GroupPrivacyPublic, group.Privacy())
		assert.True(t, group.UpdatedAt().After(originalUpdatedAt))
	})

	t.Run("invalid privacy should fail", func(t *testing.T) {
		err := group.SetPrivacy("invalid")
		assert.Error(t, err)
	})
}

func TestGroup_IsCreator(t *testing.T) {
	creatorID := uuid.New()
	otherUserID := uuid.New()

	group, err := NewGroup("Test Group", "Description", creatorID)
	require.NoError(t, err)

	assert.True(t, group.IsCreator(creatorID))
	assert.False(t, group.IsCreator(otherUserID))
}

func TestGroupPrivacy_IsValid(t *testing.T) {
	tests := []struct {
		privacy GroupPrivacy
		valid   bool
	}{
		{GroupPrivacyPrivate, true},
		{GroupPrivacyPublic, true},
		{"invalid", false},
		{"", false},
	}

	for _, tt := range tests {
		assert.Equal(t, tt.valid, tt.privacy.IsValid())
	}
}

func TestReconstructGroup(t *testing.T) {
	id := uuid.New()
	creatorID := uuid.New()
	now := time.Now()

	group := ReconstructGroup(
		id,
		"Test Group",
		"Test Description",
		GroupPrivacyPublic,
		creatorID,
		now,
		now,
	)

	require.NotNil(t, group)
	assert.Equal(t, id, group.ID())
	assert.Equal(t, "Test Group", group.Name())
	assert.Equal(t, "Test Description", group.Description())
	assert.Equal(t, GroupPrivacyPublic, group.Privacy())
	assert.Equal(t, creatorID, group.CreatorID())
	assert.Equal(t, now, group.CreatedAt())
	assert.Equal(t, now, group.UpdatedAt())

	// Reconstructed entities should not have events
	assert.Empty(t, group.DomainEvents())
}