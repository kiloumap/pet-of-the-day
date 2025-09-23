package http

import (
	"encoding/json"
	"net/http"
	"pet-of-the-day/internal/community/application/queries"
	"pet-of-the-day/internal/shared/auth"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)


// RegisterCommunityRoutes registers all community-related HTTP routes with authentication
func RegisterCommunityRoutes(router *mux.Router, handlers *CommunityHandlers, jwtService auth.JWTService) {
	// Protected routes that require authentication
	protected := router.PathPrefix("").Subrouter()
	protected.Use(jwtService.AuthMiddleware)

	// Group routes (all require auth)
	protected.HandleFunc("/groups", handlers.CreateGroup).Methods("POST")
	protected.HandleFunc("/groups/{groupId}", handlers.UpdateGroup).Methods("PUT")
	protected.HandleFunc("/groups/{groupId}", handlers.DeleteGroup).Methods("DELETE")
	protected.HandleFunc("/groups/{groupId}/join", handlers.JoinGroup).Methods("POST")
	protected.HandleFunc("/groups/{groupId}/leave", handlers.LeaveGroup).Methods("POST")
	protected.HandleFunc("/groups/{groupId}/invite", handlers.InviteToGroup).Methods("POST")
	protected.HandleFunc("/groups/{groupId}/pets", handlers.UpdateMembershipPets).Methods("PUT")
	protected.HandleFunc("/groups/{groupId}/members", handlers.GetGroupMembers).Methods("GET")
	protected.HandleFunc("/users/{userId}/groups", handlers.GetUserGroups).Methods("GET")
	protected.HandleFunc("/invitations/accept", handlers.AcceptInvitation).Methods("POST")

	// Semi-protected routes (optional auth for viewing groups)
	semiProtected := router.PathPrefix("").Subrouter()
	semiProtected.Use(jwtService.OptionalAuthMiddleware)
	semiProtected.HandleFunc("/groups/{groupId}", handlers.GetGroup).Methods("GET")
}

// GetGroupMembers handler implementation
func (h *CommunityHandlers) GetGroupMembers(w http.ResponseWriter, r *http.Request) {
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

	query := queries.GetGroupMembersQuery{
		GroupID: groupID,
		UserID:  userID,
	}

	result, err := h.getGroupMembersHandler.Handle(r.Context(), query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	response := map[string]interface{}{
		"group": map[string]interface{}{
			"id":          result.Group.ID(),
			"name":        result.Group.Name(),
			"description": result.Group.Description(),
			"privacy":     result.Group.Privacy(),
			"created_at":  result.Group.CreatedAt(),
		},
		"members": make([]interface{}, len(result.Members)),
	}

	for i, membership := range result.Members {
		response["members"].([]interface{})[i] = map[string]interface{}{
			"id":        membership.ID(),
			"user_id":   membership.UserID(),
			"pet_ids":   membership.PetIDs(),
			"status":    membership.Status(),
			"joined_at": membership.CreatedAt(),
		}
	}

	if result.Invitations != nil {
		invitations := make([]interface{}, len(result.Invitations))
		for i, invitation := range result.Invitations {
			invitationData := map[string]interface{}{
				"id":            invitation.ID(),
				"invite_type":   invitation.InviteType(),
				"invitee_email": invitation.InviteeEmail(),
				"status":        invitation.Status(),
				"expires_at":    invitation.ExpiresAt(),
				"created_at":    invitation.CreatedAt(),
			}

			// Only include invite code for code invitations
			if invitation.InviteType() == "code" {
				invitationData["invite_code"] = invitation.InviteCode()
			}

			invitations[i] = invitationData
		}
		response["invitations"] = invitations
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}