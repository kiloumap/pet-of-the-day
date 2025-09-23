package community

import (
	"pet-of-the-day/internal/community/application/commands"
	"pet-of-the-day/internal/community/application/queries"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/community/interfaces/http"
)

// Service defines the interface for Community bounded context services
type Service interface {
	// Repository access
	GetGroupRepository() domain.GroupRepository
	GetMembershipRepository() domain.MembershipRepository
	GetInvitationRepository() domain.InvitationRepository

	// Services access
	GetValidationService() *domain.CrossContextValidationService

	// Command handlers access
	GetCreateGroupHandler() *commands.CreateGroupHandler
	GetUpdateGroupHandler() *commands.UpdateGroupHandler
	GetDeleteGroupHandler() *commands.DeleteGroupHandler
	GetJoinGroupHandler() *commands.JoinGroupHandler
	GetLeaveGroupHandler() *commands.LeaveGroupHandler
	GetInviteToGroupHandler() *commands.InviteToGroupHandler
	GetAcceptInvitationHandler() *commands.AcceptInvitationHandler
	GetUpdatePetsHandler() *commands.UpdateMembershipPetsHandler

	// Query handlers access
	GetGroupQueryHandler() *queries.GetGroupHandler
	GetUserGroupsQueryHandler() *queries.GetUserGroupsHandler
	GetGroupMembersQueryHandler() *queries.GetGroupMembersHandler

	// HTTP handlers access
	GetHTTPHandlers() *http.CommunityHandlers
}

// Verify that CommunityService implements Service interface
var _ Service = (*CommunityService)(nil)
