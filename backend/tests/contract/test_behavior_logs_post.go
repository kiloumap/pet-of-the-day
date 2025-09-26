package contract

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// CreateBehaviorLogRequest represents the request body structure
type CreateBehaviorLogRequest struct {
	PetID    string   `json:"pet_id"`
	BehaviorID string `json:"behavior_id"`
	GroupIDs []string `json:"group_ids"`
	LoggedAt *string  `json:"logged_at,omitempty"`
	Notes    string   `json:"notes,omitempty"`
}

// BehaviorLogResponse represents the response structure
type BehaviorLogResponse struct {
	ID           string                 `json:"id"`
	PetID        string                 `json:"pet_id"`
	PetName      string                 `json:"pet_name"`
	Behavior     BehaviorResponse       `json:"behavior"`
	PointsAwarded int                  `json:"points_awarded"`
	LoggedAt     string                 `json:"logged_at"`
	CreatedAt    string                 `json:"created_at"`
	Notes        string                 `json:"notes"`
	SharedGroups []SharedGroupResponse  `json:"shared_groups"`
}

// SharedGroupResponse represents shared group info
type SharedGroupResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func TestPostBehaviorLogsContract(t *testing.T) {
	// This test will fail until the endpoint is implemented
	router := mux.NewRouter()

	// TODO: This will fail - endpoint not implemented yet
	// router.HandleFunc("/api/behavior-logs", handleCreateBehaviorLog).Methods("POST")

	validRequest := CreateBehaviorLogRequest{
		PetID:      "550e8400-e29b-41d4-a716-446655440001",
		BehaviorID: "550e8400-e29b-41d4-a716-446655440002",
		GroupIDs:   []string{"550e8400-e29b-41d4-a716-446655440003"},
		Notes:      "Good boy!",
	}

	t.Run("should create behavior log successfully", func(t *testing.T) {
		requestBody, err := json.Marshal(validRequest)
		require.NoError(t, err)

		req, err := http.NewRequest("POST", "/api/behavior-logs", bytes.NewBuffer(requestBody))
		require.NoError(t, err)

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This assertion will fail until endpoint is implemented
		assert.Equal(t, http.StatusCreated, rr.Code, "Expected 201 Created status")

		var response BehaviorLogResponse
		err = json.Unmarshal(rr.Body.Bytes(), &response)
		require.NoError(t, err, "Response should be valid JSON")

		// Contract assertions
		assert.NotEmpty(t, response.ID, "id should not be empty")
		assert.Equal(t, validRequest.PetID, response.PetID, "pet_id should match request")
		assert.NotEmpty(t, response.PetName, "pet_name should be populated")
		assert.NotEmpty(t, response.Behavior.ID, "behavior should be populated")
		assert.NotZero(t, response.PointsAwarded, "points_awarded should not be zero")
		assert.NotEmpty(t, response.LoggedAt, "logged_at should not be empty")
		assert.NotEmpty(t, response.CreatedAt, "created_at should not be empty")
		assert.Equal(t, validRequest.Notes, response.Notes, "notes should match request")
		assert.Len(t, response.SharedGroups, len(validRequest.GroupIDs), "shared_groups should match request")
	})

	t.Run("should return 400 for invalid request body", func(t *testing.T) {
		invalidRequest := `{"pet_id": "", "behavior_id": "invalid"}`

		req, err := http.NewRequest("POST", "/api/behavior-logs", bytes.NewBuffer([]byte(invalidRequest)))
		require.NoError(t, err)

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until validation is implemented
		assert.Equal(t, http.StatusBadRequest, rr.Code, "Expected 400 Bad Request for invalid data")

		var errorResponse map[string]interface{}
		err = json.Unmarshal(rr.Body.Bytes(), &errorResponse)
		require.NoError(t, err, "Error response should be valid JSON")

		assert.Contains(t, errorResponse, "error", "Error response should contain error field")
	})

	t.Run("should return 401 without authorization", func(t *testing.T) {
		requestBody, err := json.Marshal(validRequest)
		require.NoError(t, err)

		req, err := http.NewRequest("POST", "/api/behavior-logs", bytes.NewBuffer(requestBody))
		require.NoError(t, err)
		req.Header.Set("Content-Type", "application/json")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until auth middleware is implemented
		assert.Equal(t, http.StatusUnauthorized, rr.Code, "Expected 401 Unauthorized")
	})

	t.Run("should return 403 for unauthorized pet", func(t *testing.T) {
		unauthorizedRequest := validRequest
		unauthorizedRequest.PetID = "550e8400-e29b-41d4-a716-446655440999" // Pet not owned by user

		requestBody, err := json.Marshal(unauthorizedRequest)
		require.NoError(t, err)

		req, err := http.NewRequest("POST", "/api/behavior-logs", bytes.NewBuffer(requestBody))
		require.NoError(t, err)

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until authorization is implemented
		assert.Equal(t, http.StatusForbidden, rr.Code, "Expected 403 Forbidden for unauthorized pet")
	})

	t.Run("should return 404 for non-existent behavior", func(t *testing.T) {
		notFoundRequest := validRequest
		notFoundRequest.BehaviorID = "550e8400-e29b-41d4-a716-446655440999" // Non-existent behavior

		requestBody, err := json.Marshal(notFoundRequest)
		require.NoError(t, err)

		req, err := http.NewRequest("POST", "/api/behavior-logs", bytes.NewBuffer(requestBody))
		require.NoError(t, err)

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until validation is implemented
		assert.Equal(t, http.StatusNotFound, rr.Code, "Expected 404 Not Found for non-existent behavior")
	})

	t.Run("should prevent duplicate behavior within interval", func(t *testing.T) {
		// First request
		requestBody, err := json.Marshal(validRequest)
		require.NoError(t, err)

		req1, err := http.NewRequest("POST", "/api/behavior-logs", bytes.NewBuffer(requestBody))
		require.NoError(t, err)
		req1.Header.Set("Content-Type", "application/json")
		req1.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr1 := httptest.NewRecorder()
		router.ServeHTTP(rr1, req1)

		// Second request immediately after (should fail due to minimum interval)
		req2, err := http.NewRequest("POST", "/api/behavior-logs", bytes.NewBuffer(requestBody))
		require.NoError(t, err)
		req2.Header.Set("Content-Type", "application/json")
		req2.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr2 := httptest.NewRecorder()
		router.ServeHTTP(rr2, req2)

		// This will fail until duplicate prevention is implemented
		assert.Equal(t, http.StatusBadRequest, rr2.Code, "Expected 400 for duplicate within interval")

		var errorResponse map[string]interface{}
		err = json.Unmarshal(rr2.Body.Bytes(), &errorResponse)
		require.NoError(t, err)

		assert.Contains(t, errorResponse, "error", "Should contain error message about minimum interval")
	})

	t.Run("should handle custom logged_at timestamp", func(t *testing.T) {
		customTime := time.Now().Add(-1 * time.Hour).Format(time.RFC3339)
		customRequest := validRequest
		customRequest.LoggedAt = &customTime

		requestBody, err := json.Marshal(customRequest)
		require.NoError(t, err)

		req, err := http.NewRequest("POST", "/api/behavior-logs", bytes.NewBuffer(requestBody))
		require.NoError(t, err)

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusCreated {
			var response BehaviorLogResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			assert.Equal(t, customTime, response.LoggedAt, "logged_at should match custom timestamp")
		}
	})
}