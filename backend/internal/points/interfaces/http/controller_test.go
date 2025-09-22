package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"pet-of-the-day/internal/points/application/commands"
	"pet-of-the-day/internal/points/application/queries"
	"pet-of-the-day/internal/points/domain"
	"pet-of-the-day/internal/points/infrastructure"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/events"
)

func setupTestController() (*Controller, *infrastructure.MockBehaviorRepository) {
	behaviorRepo := infrastructure.NewMockBehaviorRepository()
	scoreEventRepo := infrastructure.NewMockScoreEventRepository()
	petAccessChecker := infrastructure.NewMockPetAccessChecker()
	groupMembershipChecker := infrastructure.NewMockGroupMembershipChecker()
	scoreEventOwnerChecker := infrastructure.NewMockScoreEventOwnerChecker()
	eventBus := events.NewInMemoryBus()

	getBehaviorsHandler := queries.NewGetBehaviorsHandler(behaviorRepo)
	createScoreEventHandler := commands.NewCreateScoreEventHandler(
		behaviorRepo, scoreEventRepo, petAccessChecker, groupMembershipChecker, eventBus,
	)
	deleteScoreEventHandler := commands.NewDeleteScoreEventHandler(
		scoreEventRepo, scoreEventOwnerChecker, eventBus,
	)
	getPetScoreEventsHandler := queries.NewGetPetScoreEventsHandler(scoreEventRepo)
	getGroupLeaderboardHandler := queries.NewGetGroupLeaderboardHandler(scoreEventRepo)

	controller := NewController(
		getBehaviorsHandler,
		createScoreEventHandler,
		deleteScoreEventHandler,
		getPetScoreEventsHandler,
		getGroupLeaderboardHandler,
	)

	return controller, behaviorRepo
}

func addUserToContext(req *http.Request, userID uuid.UUID) *http.Request {
	ctx := context.WithValue(req.Context(), auth.UserIDKey, userID)
	return req.WithContext(ctx)
}

func TestController_GetBehaviors(t *testing.T) {
	controller, behaviorRepo := setupTestController()

	// Add test behavior
	behavior := domain.Behavior{
		ID:       uuid.New(),
		Name:     "Sit",
		Points:   5,
		Species:  domain.SpeciesDog,
		IsGlobal: true,
	}
	behaviorRepo.AddBehavior(behavior)

	t.Run("Get all behaviors", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/behaviors", nil)
		w := httptest.NewRecorder()

		controller.GetBehaviors(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}

		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to parse response: %v", err)
		}

		behaviors, ok := response["behaviors"].([]interface{})
		if !ok {
			t.Fatal("Expected behaviors array in response")
		}
		if len(behaviors) != 1 {
			t.Errorf("Expected 1 behavior, got %d", len(behaviors))
		}
	})

	t.Run("Get behaviors by species", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/behaviors?species=dog", nil)
		w := httptest.NewRecorder()

		controller.GetBehaviors(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
	})

	t.Run("Invalid species", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/behaviors?species=bird", nil)
		w := httptest.NewRecorder()

		controller.GetBehaviors(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})
}

func TestController_CreateScoreEvent(t *testing.T) {
	controller, behaviorRepo := setupTestController()

	// Add test behavior
	behaviorID := uuid.New()
	behavior := domain.Behavior{
		ID:     behaviorID,
		Name:   "Sit",
		Points: 10,
	}
	behaviorRepo.AddBehavior(behavior)

	userID := uuid.New()
	petID := uuid.New()
	groupID := uuid.New()

	t.Run("Successful creation", func(t *testing.T) {
		// Setup permissions for successful creation
		petAccessChecker := infrastructure.NewMockPetAccessChecker()
		groupMembershipChecker := infrastructure.NewMockGroupMembershipChecker()
		petAccessChecker.SetAccess(userID, petID, true)
		groupMembershipChecker.SetMembership(userID, groupID, true)

		// Create a new controller with proper setup
		scoreEventRepo := infrastructure.NewMockScoreEventRepository()
		scoreEventOwnerChecker := infrastructure.NewMockScoreEventOwnerChecker()
		eventBus := events.NewInMemoryBus()

		getBehaviorsHandler := queries.NewGetBehaviorsHandler(behaviorRepo)
		createScoreEventHandler := commands.NewCreateScoreEventHandler(
			behaviorRepo, scoreEventRepo, petAccessChecker, groupMembershipChecker, eventBus,
		)
		deleteScoreEventHandler := commands.NewDeleteScoreEventHandler(
			scoreEventRepo, scoreEventOwnerChecker, eventBus,
		)
		getPetScoreEventsHandler := queries.NewGetPetScoreEventsHandler(scoreEventRepo)
		getGroupLeaderboardHandler := queries.NewGetGroupLeaderboardHandler(scoreEventRepo)

		successController := NewController(
			getBehaviorsHandler,
			createScoreEventHandler,
			deleteScoreEventHandler,
			getPetScoreEventsHandler,
			getGroupLeaderboardHandler,
		)

		reqBody := map[string]interface{}{
			"pet_id":      petID.String(),
			"behavior_id": behaviorID.String(),
			"group_id":    groupID.String(),
			"comment":     "Good job!",
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/score-events", bytes.NewReader(body))
		req = addUserToContext(req, userID)
		w := httptest.NewRecorder()

		successController.CreateScoreEvent(w, req)

		if w.Code != http.StatusCreated {
			t.Errorf("Expected status 201, got %d", w.Code)
		}
	})

	t.Run("No authentication", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"pet_id":      petID.String(),
			"behavior_id": behaviorID.String(),
			"group_id":    groupID.String(),
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/score-events", bytes.NewReader(body))
		w := httptest.NewRecorder()

		controller.CreateScoreEvent(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status 401, got %d", w.Code)
		}
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/score-events", bytes.NewReader([]byte("invalid json")))
		req = addUserToContext(req, userID)
		w := httptest.NewRecorder()

		controller.CreateScoreEvent(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("Missing required fields", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"pet_id": petID.String(),
			// Missing behavior_id and group_id
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/score-events", bytes.NewReader(body))
		req = addUserToContext(req, userID)
		w := httptest.NewRecorder()

		controller.CreateScoreEvent(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("Invalid UUID", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"pet_id":      "invalid-uuid",
			"behavior_id": behaviorID.String(),
			"group_id":    groupID.String(),
		}
		body, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/score-events", bytes.NewReader(body))
		req = addUserToContext(req, userID)
		w := httptest.NewRecorder()

		controller.CreateScoreEvent(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})
}

func TestController_GetPetScoreEvents(t *testing.T) {
	controller, _ := setupTestController()

	petID := uuid.New()
	groupID := uuid.New()
	userID := uuid.New()

	t.Run("No authentication", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/pets/"+petID.String()+"/score-events?group_id="+groupID.String(), nil)
		req = mux.SetURLVars(req, map[string]string{"petId": petID.String()})
		w := httptest.NewRecorder()

		controller.GetPetScoreEvents(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status 401, got %d", w.Code)
		}
	})

	t.Run("Missing pet ID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/pets//score-events?group_id="+groupID.String(), nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"petId": ""})
		w := httptest.NewRecorder()

		controller.GetPetScoreEvents(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("Missing group ID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/pets/"+petID.String()+"/score-events", nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"petId": petID.String()})
		w := httptest.NewRecorder()

		controller.GetPetScoreEvents(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("Invalid pet UUID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/pets/invalid-uuid/score-events?group_id="+groupID.String(), nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"petId": "invalid-uuid"})
		w := httptest.NewRecorder()

		controller.GetPetScoreEvents(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("Valid request", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/pets/"+petID.String()+"/score-events?group_id="+groupID.String(), nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"petId": petID.String()})
		w := httptest.NewRecorder()

		controller.GetPetScoreEvents(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
	})
}

func TestController_GetGroupLeaderboard(t *testing.T) {
	controller, _ := setupTestController()

	groupID := uuid.New()
	userID := uuid.New()

	t.Run("No authentication", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/groups/"+groupID.String()+"/leaderboard", nil)
		req = mux.SetURLVars(req, map[string]string{"groupId": groupID.String()})
		w := httptest.NewRecorder()

		controller.GetGroupLeaderboard(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status 401, got %d", w.Code)
		}
	})

	t.Run("Missing group ID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/groups//leaderboard", nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"groupId": ""})
		w := httptest.NewRecorder()

		controller.GetGroupLeaderboard(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("Invalid group UUID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/groups/invalid-uuid/leaderboard", nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"groupId": "invalid-uuid"})
		w := httptest.NewRecorder()

		controller.GetGroupLeaderboard(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("Valid daily request", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/groups/"+groupID.String()+"/leaderboard", nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"groupId": groupID.String()})
		w := httptest.NewRecorder()

		controller.GetGroupLeaderboard(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
	})

	t.Run("Valid weekly request", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/groups/"+groupID.String()+"/leaderboard?period=weekly", nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"groupId": groupID.String()})
		w := httptest.NewRecorder()

		controller.GetGroupLeaderboard(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
	})
}

func TestController_DeleteScoreEvent(t *testing.T) {
	controller, _ := setupTestController()

	eventID := uuid.New()
	userID := uuid.New()

	t.Run("Successful deletion", func(t *testing.T) {
		// Create a new event and setup permissions
		scoreEventRepo := infrastructure.NewMockScoreEventRepository()
		scoreEventOwnerChecker := infrastructure.NewMockScoreEventOwnerChecker()
		eventBus := events.NewInMemoryBus()

		// Create an event first
		event := domain.ScoreEvent{
			ID:           eventID,
			PetID:        uuid.New(),
			BehaviorID:   uuid.New(),
			GroupID:      uuid.New(),
			RecordedByID: userID,
			Points:       10,
			Comment:      "Test event",
			ActionDate:   time.Now(),
			RecordedAt:   time.Now(),
		}
		scoreEventRepo.Create(context.Background(), event)
		scoreEventOwnerChecker.SetOwnership(userID, eventID, true)

		// Create controller with proper setup
		behaviorRepo := infrastructure.NewMockBehaviorRepository()
		petAccessChecker := infrastructure.NewMockPetAccessChecker()
		groupMembershipChecker := infrastructure.NewMockGroupMembershipChecker()

		getBehaviorsHandler := queries.NewGetBehaviorsHandler(behaviorRepo)
		createScoreEventHandler := commands.NewCreateScoreEventHandler(
			behaviorRepo, scoreEventRepo, petAccessChecker, groupMembershipChecker, eventBus,
		)
		deleteScoreEventHandler := commands.NewDeleteScoreEventHandler(
			scoreEventRepo, scoreEventOwnerChecker, eventBus,
		)
		getPetScoreEventsHandler := queries.NewGetPetScoreEventsHandler(scoreEventRepo)
		getGroupLeaderboardHandler := queries.NewGetGroupLeaderboardHandler(scoreEventRepo)

		successController := NewController(
			getBehaviorsHandler,
			createScoreEventHandler,
			deleteScoreEventHandler,
			getPetScoreEventsHandler,
			getGroupLeaderboardHandler,
		)

		req := httptest.NewRequest("DELETE", "/score-events/"+eventID.String(), nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"eventId": eventID.String()})
		w := httptest.NewRecorder()

		successController.DeleteScoreEvent(w, req)

		if w.Code != http.StatusNoContent {
			t.Errorf("Expected status 204, got %d", w.Code)
		}
	})

	t.Run("No authentication", func(t *testing.T) {
		req := httptest.NewRequest("DELETE", "/score-events/"+eventID.String(), nil)
		req = mux.SetURLVars(req, map[string]string{"eventId": eventID.String()})
		w := httptest.NewRecorder()

		controller.DeleteScoreEvent(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status 401, got %d", w.Code)
		}
	})

	t.Run("Missing event ID", func(t *testing.T) {
		req := httptest.NewRequest("DELETE", "/score-events/", nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"eventId": ""})
		w := httptest.NewRecorder()

		controller.DeleteScoreEvent(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("Invalid event UUID", func(t *testing.T) {
		req := httptest.NewRequest("DELETE", "/score-events/invalid-uuid", nil)
		req = addUserToContext(req, userID)
		req = mux.SetURLVars(req, map[string]string{"eventId": "invalid-uuid"})
		w := httptest.NewRecorder()

		controller.DeleteScoreEvent(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})
}