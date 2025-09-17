package domain

import (
	"pet-of-the-day/internal/shared/events"
	"time"

	"github.com/google/uuid"
)

type GroupPrivacy string

const (
	GroupPrivacyPrivate GroupPrivacy = "private"
	GroupPrivacyPublic  GroupPrivacy = "public"
)

func (gp GroupPrivacy) IsValid() bool {
	return gp == GroupPrivacyPrivate || gp == GroupPrivacyPublic
}

type Group struct {
	id          uuid.UUID
	name        string
	description string
	privacy     GroupPrivacy
	creatorID   uuid.UUID
	createdAt   time.Time
	updatedAt   time.Time

	events []events.Event
}

func NewGroup(name, description string, creatorID uuid.UUID) (*Group, error) {
	if name == "" {
		return nil, ErrGroupInvalidName
	}

	now := time.Now()
	group := &Group{
		id:          uuid.New(),
		name:        name,
		description: description,
		privacy:     GroupPrivacyPrivate, // Private by default
		creatorID:   creatorID,
		createdAt:   now,
		updatedAt:   now,
	}

	group.recordEvent(NewGroupCreatedEvent(group.id, group.name, group.creatorID))
	return group, nil
}

func ReconstructGroup(
	id uuid.UUID,
	name, description string,
	privacy GroupPrivacy,
	creatorID uuid.UUID,
	createdAt, updatedAt time.Time,
) *Group {
	return &Group{
		id:          id,
		name:        name,
		description: description,
		privacy:     privacy,
		creatorID:   creatorID,
		createdAt:   createdAt,
		updatedAt:   updatedAt,
		events:      nil,
	}
}

func (g *Group) UpdateDetails(name, description string) error {
	if name == "" {
		return ErrGroupInvalidName
	}

	g.name = name
	g.description = description
	g.updatedAt = time.Now()

	return nil
}

func (g *Group) SetPrivacy(privacy GroupPrivacy) error {
	if !privacy.IsValid() {
		return ErrGroupInvalidDescription
	}

	g.privacy = privacy
	g.updatedAt = time.Now()
	return nil
}

func (g *Group) IsCreator(userID uuid.UUID) bool {
	return g.creatorID == userID
}

func (g *Group) recordEvent(event events.Event) {
	g.events = append(g.events, event)
}

func (g *Group) DomainEvents() []events.Event {
	return g.events
}

func (g *Group) ClearEvents() {
	g.events = nil
}

// Getters
func (g *Group) ID() uuid.UUID        { return g.id }
func (g *Group) Name() string         { return g.name }
func (g *Group) Description() string  { return g.description }
func (g *Group) Privacy() GroupPrivacy { return g.privacy }
func (g *Group) CreatorID() uuid.UUID { return g.creatorID }
func (g *Group) CreatedAt() time.Time { return g.createdAt }
func (g *Group) UpdatedAt() time.Time { return g.updatedAt }