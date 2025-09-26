package contract

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// BehaviorLogsListResponse represents the full API response
type BehaviorLogsListResponse struct {
	BehaviorLogs []BehaviorLogResponse `json:"behavior_logs"`
}

func TestGetBehaviorLogsContract(t *testing.T) {
	// This test will fail until the endpoint is implemented
	router := mux.NewRouter()

	// TODO: This will fail - endpoint not implemented yet
	// router.HandleFunc("/api/behavior-logs", handleGetBehaviorLogs).Methods("GET")

	t.Run("should return 200 with behavior logs list", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/behavior-logs", nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This assertion will fail until endpoint is implemented
		assert.Equal(t, http.StatusOK, rr.Code, "Expected 200 OK status")

		var response BehaviorLogsListResponse
		err = json.Unmarshal(rr.Body.Bytes(), &response)
		require.NoError(t, err, "Response should be valid JSON")

		// Contract assertions
		assert.IsType(t, []BehaviorLogResponse{}, response.BehaviorLogs, "behavior_logs should be array")

		if len(response.BehaviorLogs) > 0 {
			log := response.BehaviorLogs[0]

			// Required fields
			assert.NotEmpty(t, log.ID, "id should not be empty")
			assert.NotEmpty(t, log.PetID, "pet_id should not be empty")
			assert.NotEmpty(t, log.PetName, "pet_name should not be empty")
			assert.NotEmpty(t, log.Behavior.ID, "behavior should be populated")
			assert.NotZero(t, log.PointsAwarded, "points_awarded should not be zero")
			assert.NotEmpty(t, log.LoggedAt, "logged_at should not be empty")
			assert.NotEmpty(t, log.CreatedAt, "created_at should not be empty")
			assert.IsType(t, []SharedGroupResponse{}, log.SharedGroups, "shared_groups should be array")
		}
	})

	t.Run("should filter by pet_id query parameter", func(t *testing.T) {
		petID := "550e8400-e29b-41d4-a716-446655440001"
		url := fmt.Sprintf("/api/behavior-logs?pet_id=%s", petID)

		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response BehaviorLogsListResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// All returned logs should be for the specified pet
			for _, log := range response.BehaviorLogs {
				assert.Equal(t, petID, log.PetID, "All logs should be for specified pet")
			}
		}
	})

	t.Run("should filter by date range", func(t *testing.T) {
		dateFrom := "2025-01-01"
		dateTo := "2025-01-31"
		url := fmt.Sprintf("/api/behavior-logs?date_from=%s&date_to=%s", dateFrom, dateTo)

		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response BehaviorLogsListResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// All returned logs should be within date range
			for _, log := range response.BehaviorLogs {
				assert.NotEmpty(t, log.LoggedAt, "logged_at should be present for date filtering")
				// Additional date validation would be done in integration tests
			}
		}
	})

	t.Run("should filter by group_id query parameter", func(t *testing.T) {
		groupID := "550e8400-e29b-41d4-a716-446655440003"
		url := fmt.Sprintf("/api/behavior-logs?group_id=%s", groupID)

		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response BehaviorLogsListResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// All returned logs should be shared with the specified group
			for _, log := range response.BehaviorLogs {
				found := false
				for _, group := range log.SharedGroups {
					if group.ID == groupID {
						found = true
						break
					}
				}
				assert.True(t, found, "All logs should be shared with specified group")
			}
		}
	})

	t.Run("should return 401 without authorization", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/behavior-logs", nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until auth middleware is implemented
		assert.Equal(t, http.StatusUnauthorized, rr.Code, "Expected 401 Unauthorized")
	})

	t.Run("should return 400 for invalid query parameters", func(t *testing.T) {
		testCases := []struct {
			name string
			url  string
		}{
			{"invalid pet_id", "/api/behavior-logs?pet_id=invalid-uuid"},
			{"invalid date format", "/api/behavior-logs?date_from=invalid-date"},
			{"invalid group_id", "/api/behavior-logs?group_id=invalid-uuid"},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				req, err := http.NewRequest("GET", tc.url, nil)
				require.NoError(t, err)
				req.Header.Set("Authorization", "Bearer valid-jwt-token")

				rr := httptest.NewRecorder()
				router.ServeHTTP(rr, req)

				// This will fail until validation is implemented
				assert.Equal(t, http.StatusBadRequest, rr.Code, "Expected 400 for invalid query parameter")
			})
		}
	})

	t.Run("should return only logs for user's pets", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/behavior-logs", nil)
		require.NoError(t, err)
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response BehaviorLogsListResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// All returned logs should be for pets owned by the authenticated user
			// This would be validated based on the JWT token in the request
			for _, log := range response.BehaviorLogs {
				assert.NotEmpty(t, log.PetID, "pet_id should be present for authorization check")
			}
		}
	})

	t.Run("should support pagination", func(t *testing.T) {
		// Test with limit parameter
		req, err := http.NewRequest("GET", "/api/behavior-logs?limit=10&offset=0", nil)
		require.NoError(t, err)
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response BehaviorLogsListResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// Should not return more than the specified limit
			assert.LessOrEqual(t, len(response.BehaviorLogs), 10, "Should not exceed specified limit")
		}
	})

	t.Run("should handle empty results", func(t *testing.T) {
		// Request logs for a pet that has no logs
		req, err := http.NewRequest("GET", "/api/behavior-logs?pet_id=550e8400-e29b-41d4-a716-446655440999", nil)
		require.NoError(t, err)
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response BehaviorLogsListResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			assert.Empty(t, response.BehaviorLogs, "Should return empty array for no results")
		}
	})
}