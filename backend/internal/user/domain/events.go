package domain

import (
	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/shared/types"

	"github.com/google/uuid"
)

const (
	UserRegisteredEventType  = "user.registered"
	PasswordChangedEventType = "user.password_changed"
	UserLoggedInEventType    = "user.logged_in"
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
