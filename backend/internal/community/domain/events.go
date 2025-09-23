package domain

import (
	"pet-of-the-day/internal/shared/events"
	"time"

	"github.com/google/uuid"
)

type GroupCreatedEvent struct {
	events.BaseEvent
	GroupID   uuid.UUID `json:"group_id"`
	GroupName string    `json:"group_name"`
	CreatorID uuid.UUID `json:"creator_id"`
	CreatedAt time.Time `json:"created_at"`
}

func NewGroupCreatedEvent(groupID uuid.UUID, groupName string, creatorID uuid.UUID) *GroupCreatedEvent {
	return &GroupCreatedEvent{
		BaseEvent: events.NewBaseEvent("community.group.created", groupID),
		GroupID:   groupID,
		GroupName: groupName,
		CreatorID: creatorID,
		CreatedAt: time.Now(),
	}
}

type MembershipRequestedEvent struct {
	events.BaseEvent
	GroupID     uuid.UUID   `json:"group_id"`
	UserID      uuid.UUID   `json:"user_id"`
	PetIDs      []uuid.UUID `json:"pet_ids"`
	RequestedAt time.Time   `json:"requested_at"`
}

func NewMembershipRequestedEvent(groupID, userID uuid.UUID, petIDs []uuid.UUID) *MembershipRequestedEvent {
	return &MembershipRequestedEvent{
		BaseEvent:   events.NewBaseEvent("community.membership.requested", groupID),
		GroupID:     groupID,
		UserID:      userID,
		PetIDs:      petIDs,
		RequestedAt: time.Now(),
	}
}

type MembershipAcceptedEvent struct {
	events.BaseEvent
	GroupID    uuid.UUID   `json:"group_id"`
	UserID     uuid.UUID   `json:"user_id"`
	PetIDs     []uuid.UUID `json:"pet_ids"`
	AcceptedAt time.Time   `json:"accepted_at"`
}

func NewMembershipAcceptedEvent(groupID, userID uuid.UUID, petIDs []uuid.UUID) *MembershipAcceptedEvent {
	return &MembershipAcceptedEvent{
		BaseEvent:  events.NewBaseEvent("community.membership.accepted", groupID),
		GroupID:    groupID,
		UserID:     userID,
		PetIDs:     petIDs,
		AcceptedAt: time.Now(),
	}
}

type MembershipLeftEvent struct {
	events.BaseEvent
	GroupID uuid.UUID `json:"group_id"`
	UserID  uuid.UUID `json:"user_id"`
	LeftAt  time.Time `json:"left_at"`
}

func NewMembershipLeftEvent(groupID, userID uuid.UUID) *MembershipLeftEvent {
	return &MembershipLeftEvent{
		BaseEvent: events.NewBaseEvent("community.membership.left", groupID),
		GroupID:   groupID,
		UserID:    userID,
		LeftAt:    time.Now(),
	}
}

type InvitationSentEvent struct {
	events.BaseEvent
	InvitationID uuid.UUID `json:"invitation_id"`
	GroupID      uuid.UUID `json:"group_id"`
	InviterID    uuid.UUID `json:"inviter_id"`
	InviteeEmail string    `json:"invitee_email"`
	SentAt       time.Time `json:"sent_at"`
}

func NewInvitationSentEvent(invitationID, groupID, inviterID uuid.UUID, inviteeEmail string) *InvitationSentEvent {
	return &InvitationSentEvent{
		BaseEvent:    events.NewBaseEvent("community.invitation.sent", groupID),
		InvitationID: invitationID,
		GroupID:      groupID,
		InviterID:    inviterID,
		InviteeEmail: inviteeEmail,
		SentAt:       time.Now(),
	}
}
