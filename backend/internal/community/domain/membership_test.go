package domain

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewMembership(t *testing.T) {
	groupID := uuid.New()
	userID := uuid.New()
	petIDs := []uuid.UUID{uuid.New(), uuid.New()}

	tests := []struct {
		name    string
		petIDs  []uuid.UUID
		wantErr error
	}{
		{
			name:    "valid membership with pets",
			petIDs:  petIDs,
			wantErr: nil,
		},
		{
			name:    "membership without pets should fail",
			petIDs:  []uuid.UUID{},
			wantErr: ErrMembershipNoPets,
		},
		{
			name:    "nil pets should fail",
			petIDs:  nil,
			wantErr: ErrMembershipNoPets,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			membership, err := NewMembership(groupID, userID, tt.petIDs)

			if tt.wantErr != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.wantErr, err)
				assert.Nil(t, membership)
			} else {
				require.NoError(t, err)
				require.NotNil(t, membership)

				assert.NotEqual(t, uuid.Nil, membership.ID())
				assert.Equal(t, groupID, membership.GroupID())
				assert.Equal(t, userID, membership.UserID())
				assert.Equal(t, tt.petIDs, membership.PetIDs())
				assert.Equal(t, MembershipStatusPending, membership.Status())
				assert.WithinDuration(t, time.Now(), membership.CreatedAt(), time.Second)
				assert.WithinDuration(t, time.Now(), membership.UpdatedAt(), time.Second)

				// Check domain events
				events := membership.DomainEvents()
				require.Len(t, events, 1)

				event, ok := events[0].(*MembershipRequestedEvent)
				require.True(t, ok)
				assert.Equal(t, groupID, event.GroupID)
				assert.Equal(t, userID, event.UserID)
				assert.Equal(t, tt.petIDs, event.PetIDs)
			}
		})
	}
}

func TestMembership_Accept(t *testing.T) {
	membership, err := NewMembership(uuid.New(), uuid.New(), []uuid.UUID{uuid.New()})
	require.NoError(t, err)

	originalUpdatedAt := membership.UpdatedAt()
	time.Sleep(time.Millisecond)

	t.Run("accept pending membership", func(t *testing.T) {
		membership.ClearEvents() // Clear creation events

		err := membership.Accept()
		require.NoError(t, err)

		assert.Equal(t, MembershipStatusActive, membership.Status())
		assert.True(t, membership.UpdatedAt().After(originalUpdatedAt))
		assert.True(t, membership.IsActive())

		// Check acceptance event
		events := membership.DomainEvents()
		require.Len(t, events, 1)

		event, ok := events[0].(*MembershipAcceptedEvent)
		require.True(t, ok)
		assert.Equal(t, membership.GroupID(), event.GroupID)
		assert.Equal(t, membership.UserID(), event.UserID)
	})

	t.Run("accept non-pending membership should fail", func(t *testing.T) {
		// Membership is already active
		err := membership.Accept()
		assert.Equal(t, ErrMembershipInvalidStatus, err)
	})
}

func TestMembership_Reject(t *testing.T) {
	membership, err := NewMembership(uuid.New(), uuid.New(), []uuid.UUID{uuid.New()})
	require.NoError(t, err)

	originalUpdatedAt := membership.UpdatedAt()
	time.Sleep(time.Millisecond)

	t.Run("reject pending membership", func(t *testing.T) {
		err := membership.Reject()
		require.NoError(t, err)

		assert.Equal(t, MembershipStatusRejected, membership.Status())
		assert.True(t, membership.UpdatedAt().After(originalUpdatedAt))
		assert.False(t, membership.IsActive())
	})
}

func TestMembership_Leave(t *testing.T) {
	membership, err := NewMembership(uuid.New(), uuid.New(), []uuid.UUID{uuid.New()})
	require.NoError(t, err)

	// Accept first
	err = membership.Accept()
	require.NoError(t, err)

	originalUpdatedAt := membership.UpdatedAt()
	time.Sleep(time.Millisecond)

	t.Run("leave active membership", func(t *testing.T) {
		membership.ClearEvents() // Clear previous events

		err := membership.Leave()
		require.NoError(t, err)

		assert.Equal(t, MembershipStatusLeft, membership.Status())
		assert.True(t, membership.UpdatedAt().After(originalUpdatedAt))
		assert.False(t, membership.IsActive())

		// Check leave event
		events := membership.DomainEvents()
		require.Len(t, events, 1)

		event, ok := events[0].(*MembershipLeftEvent)
		require.True(t, ok)
		assert.Equal(t, membership.GroupID(), event.GroupID)
		assert.Equal(t, membership.UserID(), event.UserID)
	})
}

func TestMembership_UpdatePets(t *testing.T) {
	membership, err := NewMembership(uuid.New(), uuid.New(), []uuid.UUID{uuid.New()})
	require.NoError(t, err)

	// Accept first
	err = membership.Accept()
	require.NoError(t, err)

	originalPetIDs := membership.PetIDs()
	newPetIDs := []uuid.UUID{uuid.New(), uuid.New(), uuid.New()}
	originalUpdatedAt := membership.UpdatedAt()
	time.Sleep(time.Millisecond)

	t.Run("update pets for active membership", func(t *testing.T) {
		err := membership.UpdatePets(newPetIDs)
		require.NoError(t, err)

		assert.Equal(t, newPetIDs, membership.PetIDs())
		assert.NotEqual(t, originalPetIDs, membership.PetIDs())
		assert.True(t, membership.UpdatedAt().After(originalUpdatedAt))
	})

	t.Run("update with empty pets should fail", func(t *testing.T) {
		err := membership.UpdatePets([]uuid.UUID{})
		assert.Equal(t, ErrMembershipNoPets, err)
	})

	t.Run("update pets for non-active membership should fail", func(t *testing.T) {
		membership.Leave()
		err := membership.UpdatePets([]uuid.UUID{uuid.New()})
		assert.Equal(t, ErrMembershipInvalidStatus, err)
	})
}

func TestMembership_HasPet(t *testing.T) {
	petID1 := uuid.New()
	petID2 := uuid.New()
	petID3 := uuid.New()

	membership, err := NewMembership(uuid.New(), uuid.New(), []uuid.UUID{petID1, petID2})
	require.NoError(t, err)

	assert.True(t, membership.HasPet(petID1))
	assert.True(t, membership.HasPet(petID2))
	assert.False(t, membership.HasPet(petID3))
}

func TestMembershipStatus_IsValid(t *testing.T) {
	tests := []struct {
		status MembershipStatus
		valid  bool
	}{
		{MembershipStatusPending, true},
		{MembershipStatusActive, true},
		{MembershipStatusLeft, true},
		{MembershipStatusRejected, true},
		{"invalid", false},
		{"", false},
	}

	for _, tt := range tests {
		assert.Equal(t, tt.valid, tt.status.IsValid())
	}
}

func TestReconstructMembership(t *testing.T) {
	id := uuid.New()
	groupID := uuid.New()
	userID := uuid.New()
	petIDs := []uuid.UUID{uuid.New(), uuid.New()}
	now := time.Now()

	membership := ReconstructMembership(
		id, groupID, userID,
		petIDs,
		MembershipStatusActive,
		now, now,
	)

	require.NotNil(t, membership)
	assert.Equal(t, id, membership.ID())
	assert.Equal(t, groupID, membership.GroupID())
	assert.Equal(t, userID, membership.UserID())
	assert.Equal(t, petIDs, membership.PetIDs())
	assert.Equal(t, MembershipStatusActive, membership.Status())
	assert.Equal(t, now, membership.CreatedAt())
	assert.Equal(t, now, membership.UpdatedAt())

	// Reconstructed entities should not have events
	assert.Empty(t, membership.DomainEvents())
}