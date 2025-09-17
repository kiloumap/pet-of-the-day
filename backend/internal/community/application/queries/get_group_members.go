package queries

import (
	"context"
	"pet-of-the-day/internal/community/domain"

	"github.com/google/uuid"
)

type GetGroupMembersQuery struct {
	GroupID uuid.UUID `json:"group_id"`
	UserID  uuid.UUID `json:"user_id"` // For authorization
}

type GroupMembersResult struct {
	Group       *domain.Group           `json:"group"`
	Members     []*domain.Membership    `json:"members"`
	Invitations []*domain.Invitation    `json:"invitations,omitempty"` // Only for creators
}

type GetGroupMembersHandler struct {
	groupRepo      domain.GroupRepository
	membershipRepo domain.MembershipRepository
	invitationRepo domain.InvitationRepository
}

func NewGetGroupMembersHandler(
	groupRepo domain.GroupRepository,
	membershipRepo domain.MembershipRepository,
	invitationRepo domain.InvitationRepository,
) *GetGroupMembersHandler {
	return &GetGroupMembersHandler{
		groupRepo:      groupRepo,
		membershipRepo: membershipRepo,
		invitationRepo: invitationRepo,
	}
}

func (h *GetGroupMembersHandler) Handle(ctx context.Context, query GetGroupMembersQuery) (*GroupMembersResult, error) {
	// Find group
	group, err := h.groupRepo.FindByID(ctx, query.GroupID)
	if err != nil {
		return nil, domain.ErrGroupNotFound
	}
	if group == nil {
		return nil, domain.ErrGroupNotFound
	}

	// Check if user can access this group
	userMembership, err := h.membershipRepo.FindByGroupAndUser(ctx, query.GroupID, query.UserID)
	if err != nil {
		userMembership = nil
	}

	// User must be a member or creator to see members
	if userMembership == nil && !group.IsCreator(query.UserID) {
		return nil, domain.ErrGroupUnauthorized
	}

	// Get all active members
	members, err := h.membershipRepo.FindActiveByGroupID(ctx, query.GroupID)
	if err != nil {
		return nil, err
	}

	result := &GroupMembersResult{
		Group:   group,
		Members: members,
	}

	// If user is creator, also include pending invitations
	if group.IsCreator(query.UserID) {
		invitations, err := h.invitationRepo.FindPendingByGroupID(ctx, query.GroupID)
		if err == nil {
			result.Invitations = invitations
		}
	}

	return result, nil
}