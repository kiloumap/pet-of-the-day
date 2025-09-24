package domain

import (
	"time"

	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/shared/types"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// CoOwnershipStatus represents the status of a co-ownership request
type CoOwnershipStatus string

const (
	CoOwnershipStatusPending  CoOwnershipStatus = "pending"
	CoOwnershipStatusActive   CoOwnershipStatus = "active"
	CoOwnershipStatusRevoked  CoOwnershipStatus = "revoked"
	CoOwnershipStatusRejected CoOwnershipStatus = "rejected"
)

// CoOwnershipRequest represents a co-ownership request in the domain
type CoOwnershipRequest struct {
	id         uuid.UUID
	petID      uuid.UUID
	coOwnerID  uuid.UUID
	grantedBy  uuid.UUID
	status     CoOwnershipStatus
	notes      string
	grantedAt  time.Time
	acceptedAt *time.Time
	revokedAt  *time.Time
	createdAt  time.Time
	updatedAt  time.Time
}

// NewCoOwnershipRequest creates a new co-ownership request
func NewCoOwnershipRequest(petID, coOwnerID, grantedBy uuid.UUID, notes string) *CoOwnershipRequest {
	return &CoOwnershipRequest{
		id:        uuid.New(),
		petID:     petID,
		coOwnerID: coOwnerID,
		grantedBy: grantedBy,
		status:    CoOwnershipStatusPending,
		notes:     notes,
		grantedAt: time.Now(),
		createdAt: time.Now(),
		updatedAt: time.Now(),
	}
}

// Accept accepts the co-ownership request
func (r *CoOwnershipRequest) Accept() {
	if r.status != CoOwnershipStatusPending {
		return
	}
	now := time.Now()
	r.status = CoOwnershipStatusActive
	r.acceptedAt = &now
	r.updatedAt = now
}

// Reject rejects the co-ownership request
func (r *CoOwnershipRequest) Reject() {
	if r.status != CoOwnershipStatusPending {
		return
	}
	r.status = CoOwnershipStatusRejected
	r.updatedAt = time.Now()
}

// Revoke revokes the co-ownership
func (r *CoOwnershipRequest) Revoke() {
	if r.status != CoOwnershipStatusActive {
		return
	}
	now := time.Now()
	r.status = CoOwnershipStatusRevoked
	r.revokedAt = &now
	r.updatedAt = now
}

// Getters for CoOwnershipRequest
func (r *CoOwnershipRequest) ID() uuid.UUID         { return r.id }
func (r *CoOwnershipRequest) PetID() uuid.UUID     { return r.petID }
func (r *CoOwnershipRequest) CoOwnerID() uuid.UUID { return r.coOwnerID }
func (r *CoOwnershipRequest) GrantedBy() uuid.UUID { return r.grantedBy }
func (r *CoOwnershipRequest) Status() CoOwnershipStatus { return r.status }
func (r *CoOwnershipRequest) Notes() string        { return r.notes }
func (r *CoOwnershipRequest) GrantedAt() time.Time { return r.grantedAt }
func (r *CoOwnershipRequest) AcceptedAt() *time.Time { return r.acceptedAt }
func (r *CoOwnershipRequest) RevokedAt() *time.Time { return r.revokedAt }
func (r *CoOwnershipRequest) CreatedAt() time.Time { return r.createdAt }
func (r *CoOwnershipRequest) UpdatedAt() time.Time { return r.updatedAt }

// ReconstructCoOwnershipRequest creates a co-ownership request from persistence data
func ReconstructCoOwnershipRequest(
	id, petID, coOwnerID, grantedBy uuid.UUID,
	status CoOwnershipStatus,
	notes string,
	grantedAt time.Time,
	acceptedAt, revokedAt *time.Time,
	createdAt, updatedAt time.Time,
) *CoOwnershipRequest {
	return &CoOwnershipRequest{
		id:         id,
		petID:      petID,
		coOwnerID:  coOwnerID,
		grantedBy:  grantedBy,
		status:     status,
		notes:      notes,
		grantedAt:  grantedAt,
		acceptedAt: acceptedAt,
		revokedAt:  revokedAt,
		createdAt:  createdAt,
		updatedAt:  updatedAt,
	}
}

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

// Co-ownership domain methods
func (u *User) CanGrantCoOwnership(petID uuid.UUID) bool {
	// User can grant co-ownership if they own the pet
	// This validation should be done at application layer with repository
	return true // Domain-level validation passed, repository will validate ownership
}

func (u *User) GrantCoOwnership(petID, coOwnerID uuid.UUID, notes string) *CoOwnershipRequest {
	request := &CoOwnershipRequest{
		id:         uuid.New(),
		petID:      petID,
		coOwnerID:  coOwnerID,
		grantedBy:  u.id,
		status:     CoOwnershipStatusPending,
		notes:      notes,
		grantedAt:  time.Now(),
		createdAt:  time.Now(),
		updatedAt:  time.Now(),
	}

	u.recordEvent(NewCoOwnershipGrantedEvent(request.id, petID, u.id, coOwnerID))
	return request
}

func (u *User) AcceptCoOwnership(requestID uuid.UUID) {
	u.recordEvent(NewCoOwnershipAcceptedEvent(requestID, u.id))
	u.updatedAt = time.Now()
}

func (u *User) RejectCoOwnership(requestID uuid.UUID) {
	u.recordEvent(NewCoOwnershipRejectedEvent(requestID, u.id))
	u.updatedAt = time.Now()
}

func (u *User) RevokeCoOwnership(requestID uuid.UUID) {
	u.recordEvent(NewCoOwnershipRevokedEvent(requestID, u.id))
	u.updatedAt = time.Now()
}

// Getters
func (u *User) ID() uuid.UUID        { return u.id }
func (u *User) Email() types.Email   { return u.email }
func (u *User) FirstName() string    { return u.firstName }
func (u *User) LastName() string     { return u.lastName }
func (u *User) CreatedAt() time.Time { return u.createdAt }
func (u *User) UpdatedAt() time.Time { return u.updatedAt }
func (u *User) PasswordHash() string { return u.password.Hash() }

// Full name helper
func (u *User) FullName() string {
	return u.firstName + " " + u.lastName
}
