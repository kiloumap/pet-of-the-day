package domain

import (
	"crypto/rand"
	"encoding/hex"
	"pet-of-the-day/internal/shared/events"
	"time"

	"github.com/google/uuid"
)

type InvitationType string

const (
	InvitationTypeEmail InvitationType = "email"
	InvitationTypeCode  InvitationType = "code"
)

func (it InvitationType) IsValid() bool {
	return it == InvitationTypeEmail || it == InvitationTypeCode
}

type InvitationStatus string

const (
	InvitationStatusPending  InvitationStatus = "pending"
	InvitationStatusAccepted InvitationStatus = "accepted"
	InvitationStatusExpired  InvitationStatus = "expired"
	InvitationStatusRevoked  InvitationStatus = "revoked"
)

func (is InvitationStatus) IsValid() bool {
	return is == InvitationStatusPending ||
		is == InvitationStatusAccepted ||
		is == InvitationStatusExpired ||
		is == InvitationStatusRevoked
}

type Invitation struct {
	id           uuid.UUID
	groupID      uuid.UUID
	inviterID    uuid.UUID
	inviteeEmail string
	inviteCode   string
	inviteType   InvitationType
	status       InvitationStatus
	expiresAt    time.Time
	createdAt    time.Time
	updatedAt    time.Time

	events []events.Event
}

func NewEmailInvitation(groupID, inviterID uuid.UUID, inviteeEmail string) (*Invitation, error) {
	if inviteeEmail == "" {
		return nil, ErrInvitationInvalid
	}

	now := time.Now()
	invitation := &Invitation{
		id:           uuid.New(),
		groupID:      groupID,
		inviterID:    inviterID,
		inviteeEmail: inviteeEmail,
		inviteType:   InvitationTypeEmail,
		status:       InvitationStatusPending,
		expiresAt:    now.Add(7 * 24 * time.Hour), // 7 days
		createdAt:    now,
		updatedAt:    now,
	}

	invitation.recordEvent(NewInvitationSentEvent(invitation.id, groupID, inviterID, inviteeEmail))
	return invitation, nil
}

func NewCodeInvitation(groupID, inviterID uuid.UUID) (*Invitation, error) {
	code, err := generateInviteCode()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	invitation := &Invitation{
		id:         uuid.New(),
		groupID:    groupID,
		inviterID:  inviterID,
		inviteCode: code,
		inviteType: InvitationTypeCode,
		status:     InvitationStatusPending,
		expiresAt:  now.Add(24 * time.Hour), // 24 hours for QR codes
		createdAt:  now,
		updatedAt:  now,
	}

	return invitation, nil
}

func ReconstructInvitation(
	id, groupID, inviterID uuid.UUID,
	inviteeEmail, inviteCode string,
	inviteType InvitationType,
	status InvitationStatus,
	expiresAt, createdAt, updatedAt time.Time,
) *Invitation {
	return &Invitation{
		id:           id,
		groupID:      groupID,
		inviterID:    inviterID,
		inviteeEmail: inviteeEmail,
		inviteCode:   inviteCode,
		inviteType:   inviteType,
		status:       status,
		expiresAt:    expiresAt,
		createdAt:    createdAt,
		updatedAt:    updatedAt,
		events:       nil,
	}
}

func (i *Invitation) Accept() error {
	if i.status != InvitationStatusPending {
		return ErrInvitationInvalid
	}

	if time.Now().After(i.expiresAt) {
		i.status = InvitationStatusExpired
		i.updatedAt = time.Now()
		return ErrInvitationExpired
	}

	i.status = InvitationStatusAccepted
	i.updatedAt = time.Now()
	return nil
}

func (i *Invitation) Revoke() error {
	if i.status != InvitationStatusPending {
		return ErrInvitationInvalid
	}

	i.status = InvitationStatusRevoked
	i.updatedAt = time.Now()
	return nil
}

func (i *Invitation) IsExpired() bool {
	return time.Now().After(i.expiresAt) || i.status == InvitationStatusExpired
}

func (i *Invitation) IsValid() bool {
	return i.status == InvitationStatusPending && !i.IsExpired()
}

func generateInviteCode() (string, error) {
	bytes := make([]byte, 4) // 8 character hex string
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (i *Invitation) recordEvent(event events.Event) {
	i.events = append(i.events, event)
}

func (i *Invitation) DomainEvents() []events.Event {
	return i.events
}

func (i *Invitation) ClearEvents() {
	i.events = nil
}

// Getters
func (i *Invitation) ID() uuid.UUID             { return i.id }
func (i *Invitation) GroupID() uuid.UUID        { return i.groupID }
func (i *Invitation) InviterID() uuid.UUID      { return i.inviterID }
func (i *Invitation) InviteeEmail() string      { return i.inviteeEmail }
func (i *Invitation) InviteCode() string        { return i.inviteCode }
func (i *Invitation) InviteType() InvitationType { return i.inviteType }
func (i *Invitation) Status() InvitationStatus  { return i.status }
func (i *Invitation) ExpiresAt() time.Time      { return i.expiresAt }
func (i *Invitation) CreatedAt() time.Time      { return i.createdAt }
func (i *Invitation) UpdatedAt() time.Time      { return i.updatedAt }