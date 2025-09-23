package community

import (
	"context"

	"github.com/google/uuid"
	"pet-of-the-day/internal/community/application/commands"
	"pet-of-the-day/internal/community/application/queries"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/community/infrastructure"
	"pet-of-the-day/internal/community/infrastructure/ent"
	"pet-of-the-day/internal/community/interfaces/http"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/database"
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
	UpdateGroupHandler      *commands.UpdateGroupHandler
	DeleteGroupHandler      *commands.DeleteGroupHandler
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

// ScoreEventRepository interface for dependency injection
type ScoreEventRepository interface {
	DeleteByGroupID(ctx context.Context, groupID uuid.UUID) error
}

// NewCommunityService creates a new Community service with all dependencies
func NewCommunityService(eventBus events.EventBus, jwtService auth.JWTService, repoFactory *database.RepositoryFactory, scoreEventRepo ScoreEventRepository) *CommunityService {
	// Initialize real Ent repositories
	groupRepo := ent.NewEntGroupRepository(repoFactory.GetEntClient())
	membershipRepo := ent.NewEntMembershipRepository(repoFactory.GetEntClient())
	invitationRepo := ent.NewEntInvitationRepository(repoFactory.GetEntClient())

	// Initialize validation services with real repositories (this fixes the auth issue)
	petValidator := infrastructure.NewPetValidationAdapter(repoFactory.CreatePetRepository())
	userValidator := infrastructure.NewUserValidationAdapter(repoFactory.CreateUserRepository())
	validationService := domain.NewCrossContextValidationService(petValidator, userValidator)

	// Initialize command handlers
	createGroupHandler := commands.NewCreateGroupHandler(groupRepo, membershipRepo, invitationRepo, eventBus, validationService)
	updateGroupHandler := commands.NewUpdateGroupHandler(groupRepo)
	deleteGroupHandler := commands.NewDeleteGroupHandler(groupRepo, membershipRepo, invitationRepo, scoreEventRepo)
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
		updateGroupHandler,
		deleteGroupHandler,
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
		UpdateGroupHandler:      updateGroupHandler,
		DeleteGroupHandler:      deleteGroupHandler,
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

// Repository access methods
func (s *CommunityService) GetGroupRepository() domain.GroupRepository {
	return s.GroupRepo
}

func (s *CommunityService) GetMembershipRepository() domain.MembershipRepository {
	return s.MembershipRepo
}

func (s *CommunityService) GetInvitationRepository() domain.InvitationRepository {
	return s.InvitationRepo
}

// Services access methods
func (s *CommunityService) GetValidationService() *domain.CrossContextValidationService {
	return s.ValidationService
}

// Command handlers access methods
func (s *CommunityService) GetCreateGroupHandler() *commands.CreateGroupHandler {
	return s.CreateGroupHandler
}

func (s *CommunityService) GetUpdateGroupHandler() *commands.UpdateGroupHandler {
	return s.UpdateGroupHandler
}

func (s *CommunityService) GetDeleteGroupHandler() *commands.DeleteGroupHandler {
	return s.DeleteGroupHandler
}

func (s *CommunityService) GetJoinGroupHandler() *commands.JoinGroupHandler {
	return s.JoinGroupHandler
}

func (s *CommunityService) GetLeaveGroupHandler() *commands.LeaveGroupHandler {
	return s.LeaveGroupHandler
}

func (s *CommunityService) GetInviteToGroupHandler() *commands.InviteToGroupHandler {
	return s.InviteToGroupHandler
}

func (s *CommunityService) GetAcceptInvitationHandler() *commands.AcceptInvitationHandler {
	return s.AcceptInvitationHandler
}

func (s *CommunityService) GetUpdatePetsHandler() *commands.UpdateMembershipPetsHandler {
	return s.UpdatePetsHandler
}

func (s *CommunityService) GetGroupQueryHandler() *queries.GetGroupHandler {
	return s.GetGroupHandler
}

func (s *CommunityService) GetUserGroupsQueryHandler() *queries.GetUserGroupsHandler {
	return s.GetUserGroupsHandler
}

func (s *CommunityService) GetGroupMembersQueryHandler() *queries.GetGroupMembersHandler {
	return s.GetGroupMembersHandler
}

// HTTP handlers access methods
func (s *CommunityService) GetHTTPHandlers() *http.CommunityHandlers {
	return s.HTTPHandlers
}

// SetupTestData configures test data for mock repositories
func (s *CommunityService) SetupTestData() {
	// Note: This is a hack to access the mock validators
	// In real implementation, this would be properly dependency injected

	// For now, this is just a placeholder - in real implementation
	// the validation would be done via proper service interfaces
	// that communicate with the Pet and User bounded contexts
}
