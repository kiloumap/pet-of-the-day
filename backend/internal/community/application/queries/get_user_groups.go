package queries

import (
	"context"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

type GetUserGroupsQuery struct {
	UserID uuid.UUID `json:"user_id"`
}

type UserGroupsResult struct {
	CreatedGroups []*domain.Group    `json:"created_groups"`
	JoinedGroups  []*GroupMembership `json:"joined_groups"`
}

type GroupMembership struct {
	Group      *domain.Group      `json:"group"`
	Membership *domain.Membership `json:"membership"`
}

type GetUserGroupsHandler struct {
	groupRepo      domain.GroupRepository
	membershipRepo domain.MembershipRepository
}

func NewGetUserGroupsHandler(
	groupRepo domain.GroupRepository,
	membershipRepo domain.MembershipRepository,
) *GetUserGroupsHandler {
	return &GetUserGroupsHandler{
		groupRepo:      groupRepo,
		membershipRepo: membershipRepo,
	}
}

func (h *GetUserGroupsHandler) Handle(ctx context.Context, query GetUserGroupsQuery) (*UserGroupsResult, error) {
	// Get groups created by user
	createdGroups, err := h.groupRepo.FindByCreatorID(ctx, query.UserID)
	if err != nil {
		return nil, err
	}

	// Get user's active memberships
	memberships, err := h.membershipRepo.FindActiveByUserID(ctx, query.UserID)
	if err != nil {
		return nil, err
	}

	// For each membership, get the group details
	joinedGroups := make([]*GroupMembership, 0, len(memberships))
	for _, membership := range memberships {
		// Skip if this is a group the user created (already in createdGroups)
		var isCreatedGroup bool
		for _, createdGroup := range createdGroups {
			if createdGroup.ID() == membership.GroupID() {
				isCreatedGroup = true
				break
			}
		}
		if isCreatedGroup {
			continue
		}

		group, err := h.groupRepo.FindByID(ctx, membership.GroupID())
		if err != nil {
			// Skip this group if we can't find it
			continue
		}
		if group != nil {
			joinedGroups = append(joinedGroups, &GroupMembership{
				Group:      group,
				Membership: membership,
			})
		}
	}

	return &UserGroupsResult{
		CreatedGroups: createdGroups,
		JoinedGroups:  joinedGroups,
	}, nil
}
