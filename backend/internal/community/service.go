package community

import (
	"pet-of-the-day/internal/community/application/commands"
	"pet-of-the-day/internal/community/application/queries"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/community/infrastructure"
	"pet-of-the-day/internal/community/interfaces/http"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/events"
)

// CommunityService assembles all Community bounded context components
type CommunityService struct {
	// Repositories
	GroupRepo      domain.GroupRepository
	MembershipRepo domain.MembershipRepository
	InvitationRepo domain.InvitationRepository

	// Services
	ValidationService *domain.CrossContextValidationService

	// Command Handlers
	CreateGroupHandler      *commands.CreateGroupHandler
	JoinGroupHandler        *commands.JoinGroupHandler
	LeaveGroupHandler       *commands.LeaveGroupHandler
	InviteToGroupHandler    *commands.InviteToGroupHandler
	AcceptInvitationHandler *commands.AcceptInvitationHandler
	UpdatePetsHandler       *commands.UpdateMembershipPetsHandler

	// Query Handlers
	GetGroupHandler        *queries.GetGroupHandler
	GetUserGroupsHandler   *queries.GetUserGroupsHandler
	GetGroupMembersHandler *queries.GetGroupMembersHandler

	// HTTP Handlers
	HTTPHandlers *http.CommunityHandlers
}

// NewCommunityService creates a new Community service with all dependencies
func NewCommunityService(eventBus events.EventBus, jwtService auth.JWTService) *CommunityService {
	// Initialize repositories (using mock for now)
	groupRepo := infrastructure.NewMockGroupRepository()
	membershipRepo := infrastructure.NewMockMembershipRepository()
	invitationRepo := infrastructure.NewMockInvitationRepository()

	// Initialize validation services
	petValidator := infrastructure.NewMockPetValidationAdapter()
	userValidator := infrastructure.NewMockUserValidationAdapter()
	validationService := domain.NewCrossContextValidationService(petValidator, userValidator)

	// Initialize command handlers
	createGroupHandler := commands.NewCreateGroupHandler(groupRepo, eventBus, validationService)
	joinGroupHandler := commands.NewJoinGroupHandler(groupRepo, membershipRepo, eventBus, validationService)
	leaveGroupHandler := commands.NewLeaveGroupHandler(groupRepo, membershipRepo, eventBus)
	inviteToGroupHandler := commands.NewInviteToGroupHandler(groupRepo, membershipRepo, invitationRepo, eventBus)
	acceptInvitationHandler := commands.NewAcceptInvitationHandler(groupRepo, membershipRepo, invitationRepo, eventBus)
	updatePetsHandler := commands.NewUpdateMembershipPetsHandler(membershipRepo, eventBus, validationService)

	// Initialize query handlers
	getGroupHandler := queries.NewGetGroupHandler(groupRepo, membershipRepo)
	getUserGroupsHandler := queries.NewGetUserGroupsHandler(groupRepo, membershipRepo)
	getGroupMembersHandler := queries.NewGetGroupMembersHandler(groupRepo, membershipRepo, invitationRepo)

	// Initialize HTTP handlers
	httpHandlers := http.NewCommunityHandlers(
		createGroupHandler,
		joinGroupHandler,
		leaveGroupHandler,
		inviteToGroupHandler,
		acceptInvitationHandler,
		updatePetsHandler,
		getGroupHandler,
		getUserGroupsHandler,
		getGroupMembersHandler,
	)

	return &CommunityService{
		GroupRepo:               groupRepo,
		MembershipRepo:          membershipRepo,
		InvitationRepo:          invitationRepo,
		ValidationService:       validationService,
		CreateGroupHandler:      createGroupHandler,
		JoinGroupHandler:        joinGroupHandler,
		LeaveGroupHandler:       leaveGroupHandler,
		InviteToGroupHandler:    inviteToGroupHandler,
		AcceptInvitationHandler: acceptInvitationHandler,
		UpdatePetsHandler:       updatePetsHandler,
		GetGroupHandler:         getGroupHandler,
		GetUserGroupsHandler:    getUserGroupsHandler,
		GetGroupMembersHandler:  getGroupMembersHandler,
		HTTPHandlers:            httpHandlers,
	}
}

// SetupTestData configures test data for mock repositories
func (s *CommunityService) SetupTestData() {
	// Note: This is a hack to access the mock validators
	// In real implementation, this would be properly dependency injected

	// For now, this is just a placeholder - in real implementation
	// the validation would be done via proper service interfaces
	// that communicate with the Pet and User bounded contexts
}