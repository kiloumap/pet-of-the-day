package http

import (
	"encoding/json"
	"net/http"
	"pet-of-the-day/internal/community/application/commands"
	"pet-of-the-day/internal/community/application/queries"
	"pet-of-the-day/internal/community/domain"
	"pet-of-the-day/internal/shared/auth"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type CommunityHandlers struct {
	// Command handlers
	createGroupHandler      *commands.CreateGroupHandler
	updateGroupHandler      *commands.UpdateGroupHandler
	deleteGroupHandler      *commands.DeleteGroupHandler
	joinGroupHandler        *commands.JoinGroupHandler
	leaveGroupHandler       *commands.LeaveGroupHandler
	inviteToGroupHandler    *commands.InviteToGroupHandler
	acceptInvitationHandler *commands.AcceptInvitationHandler
	updatePetsHandler       *commands.UpdateMembershipPetsHandler

	// Query handlers
	getGroupHandler        *queries.GetGroupHandler
	getUserGroupsHandler   *queries.GetUserGroupsHandler
	getGroupMembersHandler *queries.GetGroupMembersHandler
}

func NewCommunityHandlers(
	createGroupHandler *commands.CreateGroupHandler,
	updateGroupHandler *commands.UpdateGroupHandler,
	deleteGroupHandler *commands.DeleteGroupHandler,
	joinGroupHandler *commands.JoinGroupHandler,
	leaveGroupHandler *commands.LeaveGroupHandler,
	inviteToGroupHandler *commands.InviteToGroupHandler,
	acceptInvitationHandler *commands.AcceptInvitationHandler,
	updatePetsHandler *commands.UpdateMembershipPetsHandler,
	getGroupHandler *queries.GetGroupHandler,
	getUserGroupsHandler *queries.GetUserGroupsHandler,
	getGroupMembersHandler *queries.GetGroupMembersHandler,
) *CommunityHandlers {
	return &CommunityHandlers{
		createGroupHandler:      createGroupHandler,
		updateGroupHandler:      updateGroupHandler,
		deleteGroupHandler:      deleteGroupHandler,
		joinGroupHandler:        joinGroupHandler,
		leaveGroupHandler:       leaveGroupHandler,
		inviteToGroupHandler:    inviteToGroupHandler,
		acceptInvitationHandler: acceptInvitationHandler,
		updatePetsHandler:       updatePetsHandler,
		getGroupHandler:         getGroupHandler,
		getUserGroupsHandler:    getUserGroupsHandler,
		getGroupMembersHandler:  getGroupMembersHandler,
	}
}

// POST /groups
func (h *CommunityHandlers) CreateGroup(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		Privacy     string   `json:"privacy"`
		PetIDs      []string `json:"pet_ids,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := getUserIDOrError(w, r)
	if !ok {
		return
	}

	// Convert string pet IDs to UUIDs
	var petIDs []uuid.UUID
	for _, petIDStr := range req.PetIDs {
		petID, err := uuid.Parse(petIDStr)
		if err != nil {
			http.Error(w, "Invalid pet ID format", http.StatusBadRequest)
			return
		}
		petIDs = append(petIDs, petID)
	}

	cmd := commands.CreateGroupCommand{
		Name:        req.Name,
		Description: req.Description,
		Privacy:     domain.GroupPrivacy(req.Privacy),
		CreatorID:   userID,
		PetIDs:      petIDs,
	}

	result, err := h.createGroupHandler.Handle(r.Context(), cmd)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := map[string]interface{}{
		"id":          result.Group.ID(),
		"name":        result.Group.Name(),
		"description": result.Group.Description(),
		"privacy":     result.Group.Privacy(),
		"creator_id":  result.Group.CreatorID(),
		"created_at":  result.Group.CreatedAt(),
		"invite_code": result.Invitation.InviteCode(),
		"membership": map[string]interface{}{
			"id":      result.Membership.ID(),
			"user_id": result.Membership.UserID(),
			"pet_ids": result.Membership.PetIDs(),
			"status":  result.Membership.Status(),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// POST /groups/{groupId}/join
func (h *CommunityHandlers) JoinGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID, err := uuid.Parse(vars["groupId"])
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	var req struct {
		PetIDs []uuid.UUID `json:"pet_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := getUserIDOrError(w, r)
	if !ok {
		return
	}

	cmd := commands.JoinGroupCommand{
		GroupID: groupID,
		UserID:  userID,
		PetIDs:  req.PetIDs,
	}

	membership, err := h.joinGroupHandler.Handle(r.Context(), cmd)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := map[string]interface{}{
		"id":       membership.ID(),
		"group_id": membership.GroupID(),
		"user_id":  membership.UserID(),
		"pet_ids":  membership.PetIDs(),
		"status":   membership.Status(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// POST /groups/{groupId}/leave
func (h *CommunityHandlers) LeaveGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID, err := uuid.Parse(vars["groupId"])
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	userID, ok := getUserIDOrError(w, r)
	if !ok {
		return
	}

	cmd := commands.LeaveGroupCommand{
		GroupID: groupID,
		UserID:  userID,
	}

	if err := h.leaveGroupHandler.Handle(r.Context(), cmd); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// POST /groups/{groupId}/invite
func (h *CommunityHandlers) InviteToGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID, err := uuid.Parse(vars["groupId"])
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	var req struct {
		InviteeEmail string `json:"invitee_email,omitempty"`
		InviteType   string `json:"invite_type"` // "email" or "code"
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := getUserIDOrError(w, r)
	if !ok {
		return
	}

	cmd := commands.InviteToGroupCommand{
		GroupID:      groupID,
		InviterID:    userID,
		InviteeEmail: req.InviteeEmail,
		InviteType:   req.InviteType,
	}

	invitation, err := h.inviteToGroupHandler.Handle(r.Context(), cmd)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := map[string]interface{}{
		"id":           invitation.ID(),
		"group_id":     invitation.GroupID(),
		"invite_type":  invitation.InviteType(),
		"expires_at":   invitation.ExpiresAt(),
		"created_at":   invitation.CreatedAt(),
	}

	// Only include invite code for code invitations
	if invitation.InviteType() == "code" {
		response["invite_code"] = invitation.InviteCode()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// POST /invitations/accept
func (h *CommunityHandlers) AcceptInvitation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		InvitationID *uuid.UUID  `json:"invitation_id,omitempty"`
		InviteCode   string      `json:"invite_code,omitempty"`
		PetIDs       []uuid.UUID `json:"pet_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := getUserIDOrError(w, r)
	if !ok {
		return
	}

	cmd := commands.AcceptInvitationCommand{
		UserID:     userID,
		PetIDs:     req.PetIDs,
		InviteCode: req.InviteCode,
	}

	if req.InvitationID != nil {
		cmd.InvitationID = *req.InvitationID
	}

	membership, err := h.acceptInvitationHandler.Handle(r.Context(), cmd)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := map[string]interface{}{
		"id":       membership.ID(),
		"group_id": membership.GroupID(),
		"user_id":  membership.UserID(),
		"pet_ids":  membership.PetIDs(),
		"status":   membership.Status(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GET /groups/{groupId}
func (h *CommunityHandlers) GetGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID, err := uuid.Parse(vars["groupId"])
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	userID, ok := getUserIDOrError(w, r)
	if !ok {
		return
	}

	query := queries.GetGroupQuery{
		GroupID: groupID,
		UserID:  userID,
	}

	result, err := h.getGroupHandler.Handle(r.Context(), query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	response := map[string]interface{}{
		"group": map[string]interface{}{
			"id":          result.Group.ID(),
			"name":        result.Group.Name(),
			"description": result.Group.Description(),
			"privacy":     result.Group.Privacy(),
			"creator_id":  result.Group.CreatorID(),
			"created_at":  result.Group.CreatedAt(),
		},
		"is_creator": result.IsCreator,
	}

	if result.Membership != nil {
		response["membership"] = map[string]interface{}{
			"id":       result.Membership.ID(),
			"pet_ids":  result.Membership.PetIDs(),
			"status":   result.Membership.Status(),
			"joined_at": result.Membership.CreatedAt(),
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GET /users/{userId}/groups
func (h *CommunityHandlers) GetUserGroups(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	targetUserID, err := uuid.Parse(vars["userId"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	currentUserID, ok := getUserIDOrError(w, r)
	if !ok {
		return
	}

	// Users can only see their own groups for now
	if targetUserID != currentUserID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	query := queries.GetUserGroupsQuery{
		UserID: targetUserID,
	}

	result, err := h.getUserGroupsHandler.Handle(r.Context(), query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"created_groups": make([]interface{}, len(result.CreatedGroups)),
		"joined_groups":  make([]interface{}, len(result.JoinedGroups)),
	}

	for i, group := range result.CreatedGroups {
		response["created_groups"].([]interface{})[i] = map[string]interface{}{
			"id":          group.ID(),
			"name":        group.Name(),
			"description": group.Description(),
			"privacy":     group.Privacy(),
			"created_at":  group.CreatedAt(),
		}
	}

	for i, groupMembership := range result.JoinedGroups {
		response["joined_groups"].([]interface{})[i] = map[string]interface{}{
			"group": map[string]interface{}{
				"id":          groupMembership.Group.ID(),
				"name":        groupMembership.Group.Name(),
				"description": groupMembership.Group.Description(),
				"privacy":     groupMembership.Group.Privacy(),
				"created_at":  groupMembership.Group.CreatedAt(),
			},
			"membership": map[string]interface{}{
				"id":        groupMembership.Membership.ID(),
				"pet_ids":   groupMembership.Membership.PetIDs(),
				"status":    groupMembership.Membership.Status(),
				"joined_at": groupMembership.Membership.CreatedAt(),
			},
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// PUT /groups/{groupId}/pets
func (h *CommunityHandlers) UpdateMembershipPets(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupIDStr, ok := vars["groupId"]
	if !ok {
		http.Error(w, "Group ID is required", http.StatusBadRequest)
		return
	}

	groupID, err := uuid.Parse(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group ID format", http.StatusBadRequest)
		return
	}

	var req struct {
		PetIDs []string `json:"pet_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := getUserIDOrError(w, r)
	if !ok {
		return
	}

	// Convert string pet IDs to UUIDs
	var petIDs []uuid.UUID
	for _, petIDStr := range req.PetIDs {
		petID, err := uuid.Parse(petIDStr)
		if err != nil {
			http.Error(w, "Invalid pet ID format", http.StatusBadRequest)
			return
		}
		petIDs = append(petIDs, petID)
	}

	cmd := commands.UpdateMembershipPetsCommand{
		GroupID: groupID,
		UserID:  userID,
		PetIDs:  petIDs,
	}

	err = h.updatePetsHandler.Handle(r.Context(), cmd)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Pets updated successfully",
	})
}

// Helper function to extract user ID from context
func getUserIDFromContext(r *http.Request) (uuid.UUID, error) {
	return auth.GetUserIDFromContext(r.Context())
}

// Helper function to get user ID or return error response
func getUserIDOrError(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return uuid.Nil, false
	}
	return userID, true
}

// PUT /groups/{groupId}
func (h *CommunityHandlers) UpdateGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID, err := uuid.Parse(vars["groupId"])
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Privacy     string `json:"privacy"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := getUserIDOrError(w, r)
	if !ok {
		return
	}

	cmd := commands.UpdateGroupCommand{
		GroupID:     groupID,
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		Privacy:     domain.GroupPrivacy(req.Privacy),
	}

	group, err := h.updateGroupHandler.Handle(r.Context(), cmd)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := map[string]interface{}{
		"id":          group.ID(),
		"name":        group.Name(),
		"description": group.Description(),
		"privacy":     group.Privacy(),
		"creator_id":  group.CreatorID(),
		"created_at":  group.CreatedAt(),
		"updated_at":  group.UpdatedAt(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DELETE /groups/{groupId}
func (h *CommunityHandlers) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID, err := uuid.Parse(vars["groupId"])
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	userID, ok := getUserIDOrError(w, r)
	if !ok {
		return
	}

	cmd := commands.DeleteGroupCommand{
		GroupID: groupID,
		UserID:  userID,
	}

	if err := h.deleteGroupHandler.Handle(r.Context(), cmd); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}