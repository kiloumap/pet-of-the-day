package domain

import (
	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/shared/types"

	"github.com/google/uuid"
)

const (
	UserRegisteredEventType    = "user.registered"
	PasswordChangedEventType   = "user.password_changed"
	UserLoggedInEventType      = "user.logged_in"
	CoOwnershipGrantedEventType = "user.coownership_granted"
	CoOwnershipAcceptedEventType = "user.coownership_accepted"
	CoOwnershipRejectedEventType = "user.coownership_rejected"
	CoOwnershipRevokedEventType  = "user.coownership_revoked"
)

type UserRegisteredEvent struct {
	events.BaseEvent
	Email types.Email `json:"email"`
}

func NewUserRegisteredEvent(userID uuid.UUID, email types.Email) UserRegisteredEvent {
	return UserRegisteredEvent{
		BaseEvent: events.NewBaseEvent(UserRegisteredEventType, userID),
		Email:     email,
	}
}

type PasswordChangedEvent struct {
	events.BaseEvent
}

func NewPasswordChangedEvent(userID uuid.UUID) PasswordChangedEvent {
	return PasswordChangedEvent{
		BaseEvent: events.NewBaseEvent(PasswordChangedEventType, userID),
	}
}

type UserLoggedInEvent struct {
	events.BaseEvent
}

func NewUserLoggedInEvent(userID uuid.UUID) UserLoggedInEvent {
	return UserLoggedInEvent{
		BaseEvent: events.NewBaseEvent(UserLoggedInEventType, userID),
	}
}

// Co-ownership events

type CoOwnershipGrantedEvent struct {
	events.BaseEvent
	RequestID uuid.UUID `json:"request_id"`
	PetID     uuid.UUID `json:"pet_id"`
	GrantedBy uuid.UUID `json:"granted_by"`
	CoOwnerID uuid.UUID `json:"co_owner_id"`
}

func NewCoOwnershipGrantedEvent(requestID, petID, grantedBy, coOwnerID uuid.UUID) CoOwnershipGrantedEvent {
	return CoOwnershipGrantedEvent{
		BaseEvent: events.NewBaseEvent(CoOwnershipGrantedEventType, requestID),
		RequestID: requestID,
		PetID:     petID,
		GrantedBy: grantedBy,
		CoOwnerID: coOwnerID,
	}
}

type CoOwnershipAcceptedEvent struct {
	events.BaseEvent
	RequestID uuid.UUID `json:"request_id"`
	AcceptedBy uuid.UUID `json:"accepted_by"`
}

func NewCoOwnershipAcceptedEvent(requestID, acceptedBy uuid.UUID) CoOwnershipAcceptedEvent {
	return CoOwnershipAcceptedEvent{
		BaseEvent: events.NewBaseEvent(CoOwnershipAcceptedEventType, requestID),
		RequestID: requestID,
		AcceptedBy: acceptedBy,
	}
}

type CoOwnershipRejectedEvent struct {
	events.BaseEvent
	RequestID uuid.UUID `json:"request_id"`
	RejectedBy uuid.UUID `json:"rejected_by"`
}

func NewCoOwnershipRejectedEvent(requestID, rejectedBy uuid.UUID) CoOwnershipRejectedEvent {
	return CoOwnershipRejectedEvent{
		BaseEvent: events.NewBaseEvent(CoOwnershipRejectedEventType, requestID),
		RequestID: requestID,
		RejectedBy: rejectedBy,
	}
}

type CoOwnershipRevokedEvent struct {
	events.BaseEvent
	RequestID uuid.UUID `json:"request_id"`
	RevokedBy uuid.UUID `json:"revoked_by"`
}

func NewCoOwnershipRevokedEvent(requestID, revokedBy uuid.UUID) CoOwnershipRevokedEvent {
	return CoOwnershipRevokedEvent{
		BaseEvent: events.NewBaseEvent(CoOwnershipRevokedEventType, requestID),
		RequestID: requestID,
		RevokedBy: revokedBy,
	}
}
