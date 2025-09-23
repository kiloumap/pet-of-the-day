package domain

import (
	"context"

	"github.com/google/uuid"
)

type GroupRepository interface {
	Save(ctx context.Context, group *Group) error
	FindByID(ctx context.Context, id uuid.UUID) (*Group, error)
	FindByCreatorID(ctx context.Context, creatorID uuid.UUID) ([]*Group, error)
	FindByName(ctx context.Context, name string) (*Group, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type MembershipRepository interface {
	Save(ctx context.Context, membership *Membership) error
	FindByID(ctx context.Context, id uuid.UUID) (*Membership, error)
	FindByGroupAndUser(ctx context.Context, groupID, userID uuid.UUID) (*Membership, error)
	FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*Membership, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) ([]*Membership, error)
	FindActiveByUserID(ctx context.Context, userID uuid.UUID) ([]*Membership, error)
	FindActiveByGroupID(ctx context.Context, groupID uuid.UUID) ([]*Membership, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type InvitationRepository interface {
	Save(ctx context.Context, invitation *Invitation) error
	FindByID(ctx context.Context, id uuid.UUID) (*Invitation, error)
	FindByCode(ctx context.Context, code string) (*Invitation, error)
	FindByGroupAndEmail(ctx context.Context, groupID uuid.UUID, email string) (*Invitation, error)
	FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*Invitation, error)
	FindPendingByGroupID(ctx context.Context, groupID uuid.UUID) ([]*Invitation, error)
	Delete(ctx context.Context, id uuid.UUID) error
}
