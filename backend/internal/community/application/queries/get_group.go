package queries

import (
	"context"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

type GetGroupQuery struct {
	GroupID uuid.UUID `json:"group_id"`
	UserID  uuid.UUID `json:"user_id"` // For authorization
}

type GroupWithMembership struct {
	Group      *domain.Group      `json:"group"`
	Membership *domain.Membership `json:"membership,omitempty"`
	IsCreator  bool               `json:"is_creator"`
}

type GetGroupHandler struct {
	groupRepo      domain.GroupRepository
	membershipRepo domain.MembershipRepository
}

func NewGetGroupHandler(
	groupRepo domain.GroupRepository,
	membershipRepo domain.MembershipRepository,
) *GetGroupHandler {
	return &GetGroupHandler{
		groupRepo:      groupRepo,
		membershipRepo: membershipRepo,
	}
}

func (h *GetGroupHandler) Handle(ctx context.Context, query GetGroupQuery) (*GroupWithMembership, error) {
	// Find group
	group, err := h.groupRepo.FindByID(ctx, query.GroupID)
	if err != nil {
		return nil, domain.ErrGroupNotFound
	}
	if group == nil {
		return nil, domain.ErrGroupNotFound
	}

	// Find user's membership if exists
	membership, err := h.membershipRepo.FindByGroupAndUser(ctx, query.GroupID, query.UserID)
	if err != nil {
		// User is not a member, but might still be allowed to see group info
		// depending on privacy settings
		membership = nil
	}

	// Check if user can access this group
	if group.Privacy() == domain.GroupPrivacyPrivate {
		// Private groups can only be accessed by members or creator
		if membership == nil && !group.IsCreator(query.UserID) {
			return nil, domain.ErrGroupUnauthorized
		}
	}

	return &GroupWithMembership{
		Group:      group,
		Membership: membership,
		IsCreator:  group.IsCreator(query.UserID),
	}, nil
}