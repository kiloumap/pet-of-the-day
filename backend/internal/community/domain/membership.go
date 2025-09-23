package domain

import (
	"pet-of-the-day/internal/shared/events"
	"time"

	"github.com/google/uuid"
)

type MembershipStatus string

const (
	MembershipStatusPending  MembershipStatus = "pending"
	MembershipStatusActive   MembershipStatus = "active"
	MembershipStatusLeft     MembershipStatus = "left"
	MembershipStatusRejected MembershipStatus = "rejected"
)

func (ms MembershipStatus) IsValid() bool {
	return ms == MembershipStatusPending ||
		ms == MembershipStatusActive ||
		ms == MembershipStatusLeft ||
		ms == MembershipStatusRejected
}

type Membership struct {
	id        uuid.UUID
	groupID   uuid.UUID
	userID    uuid.UUID
	petIDs    []uuid.UUID
	status    MembershipStatus
	createdAt time.Time
	updatedAt time.Time

	events []events.Event
}

func NewMembership(groupID, userID uuid.UUID, petIDs []uuid.UUID) (*Membership, error) {
	if len(petIDs) == 0 {
		return nil, ErrMembershipNoPets
	}

	now := time.Now()
	membership := &Membership{
		id:        uuid.New(),
		groupID:   groupID,
		userID:    userID,
		petIDs:    petIDs,
		status:    MembershipStatusPending,
		createdAt: now,
		updatedAt: now,
	}

	membership.recordEvent(NewMembershipRequestedEvent(groupID, userID, petIDs))
	return membership, nil
}

func ReconstructMembership(
	id, groupID, userID uuid.UUID,
	petIDs []uuid.UUID,
	status MembershipStatus,
	createdAt, updatedAt time.Time,
) *Membership {
	return &Membership{
		id:        id,
		groupID:   groupID,
		userID:    userID,
		petIDs:    petIDs,
		status:    status,
		createdAt: createdAt,
		updatedAt: updatedAt,
		events:    nil,
	}
}

func (m *Membership) Accept() error {
	if m.status != MembershipStatusPending {
		return ErrMembershipInvalidStatus
	}

	m.status = MembershipStatusActive
	m.updatedAt = time.Now()

	m.recordEvent(NewMembershipAcceptedEvent(m.groupID, m.userID, m.petIDs))
	return nil
}

func (m *Membership) Reject() error {
	if m.status != MembershipStatusPending {
		return ErrMembershipInvalidStatus
	}

	m.status = MembershipStatusRejected
	m.updatedAt = time.Now()

	return nil
}

func (m *Membership) Leave() error {
	if m.status != MembershipStatusActive {
		return ErrMembershipInvalidStatus
	}

	m.status = MembershipStatusLeft
	m.updatedAt = time.Now()

	m.recordEvent(NewMembershipLeftEvent(m.groupID, m.userID))
	return nil
}

func (m *Membership) UpdatePets(petIDs []uuid.UUID) error {
	if len(petIDs) == 0 {
		return ErrMembershipNoPets
	}

	if m.status != MembershipStatusActive {
		return ErrMembershipInvalidStatus
	}

	m.petIDs = petIDs
	m.updatedAt = time.Now()

	return nil
}

func (m *Membership) IsActive() bool {
	return m.status == MembershipStatusActive
}

func (m *Membership) IsPending() bool {
	return m.status == MembershipStatusPending
}

func (m *Membership) HasPet(petID uuid.UUID) bool {
	for _, pid := range m.petIDs {
		if pid == petID {
			return true
		}
	}
	return false
}

func (m *Membership) recordEvent(event events.Event) {
	m.events = append(m.events, event)
}

func (m *Membership) DomainEvents() []events.Event {
	return m.events
}

func (m *Membership) ClearEvents() {
	m.events = nil
}

// Getters
func (m *Membership) ID() uuid.UUID            { return m.id }
func (m *Membership) GroupID() uuid.UUID       { return m.groupID }
func (m *Membership) UserID() uuid.UUID        { return m.userID }
func (m *Membership) PetIDs() []uuid.UUID      { return m.petIDs }
func (m *Membership) Status() MembershipStatus { return m.status }
func (m *Membership) CreatedAt() time.Time     { return m.createdAt }
func (m *Membership) UpdatedAt() time.Time     { return m.updatedAt }
