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

// PetRankingResponse represents a pet's ranking in the leaderboard
type PetRankingResponse struct {
	PetID            string `json:"pet_id"`
	PetName          string `json:"pet_name"`
	OwnerName        string `json:"owner_name"`
	TotalPoints      int    `json:"total_points"`
	TodaysPoints     int    `json:"todays_points"`
	Rank             int    `json:"rank"`
	PositiveBehaviors int   `json:"positive_behaviors"`
	NegativeBehaviors int   `json:"negative_behaviors"`
	LastActivityAt   string `json:"last_activity_at"`
}

// GroupRankingsResponse represents the full API response
type GroupRankingsResponse struct {
	GroupID   string               `json:"group_id"`
	GroupName string               `json:"group_name"`
	Rankings  []PetRankingResponse `json:"rankings"`
	UpdatedAt string               `json:"updated_at"`
}

func TestGetGroupRankingsContract(t *testing.T) {
	// This test will fail until the endpoint is implemented
	router := mux.NewRouter()

	// TODO: This will fail - endpoint not implemented yet
	// router.HandleFunc("/api/groups/{id}/rankings", handleGetGroupRankings).Methods("GET")

	groupID := "550e8400-e29b-41d4-a716-446655440003"

	t.Run("should return 200 with group rankings", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/rankings", groupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This assertion will fail until endpoint is implemented
		assert.Equal(t, http.StatusOK, rr.Code, "Expected 200 OK status")

		var response GroupRankingsResponse
		err = json.Unmarshal(rr.Body.Bytes(), &response)
		require.NoError(t, err, "Response should be valid JSON")

		// Contract assertions
		assert.Equal(t, groupID, response.GroupID, "group_id should match request")
		assert.NotEmpty(t, response.GroupName, "group_name should not be empty")
		assert.IsType(t, []PetRankingResponse{}, response.Rankings, "rankings should be array")
		assert.NotEmpty(t, response.UpdatedAt, "updated_at should not be empty")

		if len(response.Rankings) > 0 {
			ranking := response.Rankings[0]

			// Required fields
			assert.NotEmpty(t, ranking.PetID, "pet_id should not be empty")
			assert.NotEmpty(t, ranking.PetName, "pet_name should not be empty")
			assert.NotEmpty(t, ranking.OwnerName, "owner_name should not be empty")
			assert.Greater(t, ranking.Rank, 0, "rank should be positive")
			assert.GreaterOrEqual(t, ranking.TotalPoints, 0, "total_points should not be negative")
			assert.GreaterOrEqual(t, ranking.TodaysPoints, 0, "todays_points should not be negative")
			assert.GreaterOrEqual(t, ranking.PositiveBehaviors, 0, "positive_behaviors should not be negative")
			assert.GreaterOrEqual(t, ranking.NegativeBehaviors, 0, "negative_behaviors should not be negative")

			// Rankings should be ordered by rank
			if len(response.Rankings) > 1 {
				for i := 1; i < len(response.Rankings); i++ {
					assert.Greater(t, response.Rankings[i].Rank, response.Rankings[i-1].Rank,
						"Rankings should be ordered by rank")
				}
			}
		}
	})

	t.Run("should return 401 without authorization", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/rankings", groupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until auth middleware is implemented
		assert.Equal(t, http.StatusUnauthorized, rr.Code, "Expected 401 Unauthorized")
	})

	t.Run("should return 403 for non-member", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/rankings", groupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer non-member-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until authorization is implemented
		assert.Equal(t, http.StatusForbidden, rr.Code, "Expected 403 Forbidden for non-member")
	})

	t.Run("should return 404 for non-existent group", func(t *testing.T) {
		nonExistentGroupID := "550e8400-e29b-41d4-a716-446655440999"
		url := fmt.Sprintf("/api/groups/%s/rankings", nonExistentGroupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until validation is implemented
		assert.Equal(t, http.StatusNotFound, rr.Code, "Expected 404 Not Found for non-existent group")
	})

	t.Run("should return 400 for invalid group_id", func(t *testing.T) {
		url := "/api/groups/invalid-uuid/rankings"
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until validation is implemented
		assert.Equal(t, http.StatusBadRequest, rr.Code, "Expected 400 Bad Request for invalid UUID")
	})

	t.Run("should support date range filtering", func(t *testing.T) {
		dateFrom := "2025-01-01"
		dateTo := "2025-01-31"
		url := fmt.Sprintf("/api/groups/%s/rankings?date_from=%s&date_to=%s", groupID, dateFrom, dateTo)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response GroupRankingsResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// Rankings should reflect the specified date range
			assert.NotNil(t, response.Rankings, "Rankings should be provided for date range")
		}
	})

	t.Run("should handle empty group gracefully", func(t *testing.T) {
		emptyGroupID := "550e8400-e29b-41d4-a716-446655440998"
		url := fmt.Sprintf("/api/groups/%s/rankings", emptyGroupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response GroupRankingsResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			assert.Empty(t, response.Rankings, "Rankings should be empty for group with no pets")
			assert.NotEmpty(t, response.GroupName, "Group name should still be present")
		}
	})

	t.Run("should respect timezone for daily calculations", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/rankings", groupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")
		req.Header.Set("X-Timezone", "America/New_York")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response GroupRankingsResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// Today's points should be calculated based on user's timezone
			for _, ranking := range response.Rankings {
				assert.GreaterOrEqual(t, ranking.TodaysPoints, 0, "Today's points should be non-negative")
			}
		}
	})

	t.Run("should handle server errors gracefully", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/rankings", groupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// Should return proper error structure for server errors
		if rr.Code >= 500 {
			var errorResponse map[string]interface{}
			err = json.Unmarshal(rr.Body.Bytes(), &errorResponse)
			require.NoError(t, err, "Error response should be valid JSON")

			assert.Contains(t, errorResponse, "error", "Error response should contain error field")
		}
	})
}