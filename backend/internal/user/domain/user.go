package domain

import (
	"time"

	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/shared/types"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	id        uuid.UUID
	email     types.Email
	password  types.Password
	firstName string
	lastName  string
	createdAt time.Time
	updatedAt time.Time

	events []events.Event
}

func NewUser(email types.Email, plainPassword, firstName, lastName string) (*User, error) {
	if plainPassword == "" {
		return nil, ErrUserInvalidPassword
	}

	if firstName == "" || lastName == "" {
		return nil, ErrUserInvalidName
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &User{
		id:        uuid.New(),
		email:     email,
		password:  types.NewPasswordFromHash(string(hash)),
		firstName: firstName,
		lastName:  lastName,
		createdAt: time.Now(),
		updatedAt: time.Now(),
	}

	// @fixme maybe delay the event after the persistence
	user.recordEvent(NewUserRegisteredEvent(user.id, user.email))

	return user, nil
}

// ReconstructUser reconstructs a User from persistence data
func ReconstructUser(
	id uuid.UUID,
	email types.Email,
	passwordHash string,
	firstName, lastName string,
	createdAt, updatedAt time.Time,
) *User {
	return &User{
		id:        id,
		email:     email,
		password:  types.NewPasswordFromHash(passwordHash),
		firstName: firstName,
		lastName:  lastName,
		createdAt: createdAt,
		updatedAt: updatedAt,
		events:    nil, // No events when reconstructing from DB
	}
}

func (u *User) VerifyPassword(plainPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.password.Hash()), []byte(plainPassword))
}

func (u *User) ChangePassword(oldPassword, newPassword string) error {
	if err := u.VerifyPassword(oldPassword); err != nil {
		return ErrUserInvalidPassword
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	u.password = types.NewPasswordFromHash(string(hash))
	u.updatedAt = time.Now()

	u.recordEvent(NewPasswordChangedEvent(u.id))

	return nil
}

func (u *User) recordEvent(event events.Event) {
	u.events = append(u.events, event)
}

func (u *User) DomainEvents() []events.Event {
	return u.events
}

func (u *User) ClearEvents() {
	u.events = nil
}

// Getters
func (u *User) ID() uuid.UUID        { return u.id }
func (u *User) Email() types.Email   { return u.email }
func (u *User) FirstName() string    { return u.firstName }
func (u *User) LastName() string     { return u.lastName }
func (u *User) CreatedAt() time.Time { return u.createdAt }
func (u *User) UpdatedAt() time.Time { return u.updatedAt }
func (u *User) PasswordHash() string { return u.password.Hash() }
