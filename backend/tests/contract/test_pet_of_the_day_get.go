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

// PetOfTheDayWinner represents a winning pet
type PetOfTheDayWinner struct {
	PetID             string `json:"pet_id"`
	PetName           string `json:"pet_name"`
	OwnerName         string `json:"owner_name"`
	FinalScore        int    `json:"final_score"`
	PositiveBehaviors int    `json:"positive_behaviors"`
	NegativeBehaviors int    `json:"negative_behaviors"`
	PhotoURL          string `json:"photo_url,omitempty"`
}

// PetOfTheDayResponse represents the full API response
type PetOfTheDayResponse struct {
	GroupID     string              `json:"group_id"`
	GroupName   string              `json:"group_name"`
	Date        string              `json:"date"`
	Winners     []PetOfTheDayWinner `json:"winners"`
	HasWinners  bool                `json:"has_winners"`
	TotalPets   int                 `json:"total_pets"`
	CalculatedAt string             `json:"calculated_at"`
}

func TestGetPetOfTheDayContract(t *testing.T) {
	// This test will fail until the endpoint is implemented
	router := mux.NewRouter()

	// TODO: This will fail - endpoint not implemented yet
	// router.HandleFunc("/api/groups/{id}/pet-of-the-day", handleGetPetOfTheDay).Methods("GET")

	groupID := "550e8400-e29b-41d4-a716-446655440003"

	t.Run("should return 200 with pet of the day", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day", groupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This assertion will fail until endpoint is implemented
		assert.Equal(t, http.StatusOK, rr.Code, "Expected 200 OK status")

		var response PetOfTheDayResponse
		err = json.Unmarshal(rr.Body.Bytes(), &response)
		require.NoError(t, err, "Response should be valid JSON")

		// Contract assertions
		assert.Equal(t, groupID, response.GroupID, "group_id should match request")
		assert.NotEmpty(t, response.GroupName, "group_name should not be empty")
		assert.NotEmpty(t, response.Date, "date should not be empty")
		assert.IsType(t, []PetOfTheDayWinner{}, response.Winners, "winners should be array")
		assert.GreaterOrEqual(t, response.TotalPets, 0, "total_pets should not be negative")
		assert.NotEmpty(t, response.CalculatedAt, "calculated_at should not be empty")

		// Validate date format (should be YYYY-MM-DD)
		assert.Regexp(t, `^\d{4}-\d{2}-\d{2}$`, response.Date, "Date should be in YYYY-MM-DD format")

		// If there are winners, validate their structure
		if response.HasWinners && len(response.Winners) > 0 {
			winner := response.Winners[0]

			// Required fields
			assert.NotEmpty(t, winner.PetID, "pet_id should not be empty")
			assert.NotEmpty(t, winner.PetName, "pet_name should not be empty")
			assert.NotEmpty(t, winner.OwnerName, "owner_name should not be empty")
			assert.Greater(t, winner.FinalScore, 0, "final_score should be positive for winners")
			assert.GreaterOrEqual(t, winner.PositiveBehaviors, 0, "positive_behaviors should not be negative")
			assert.GreaterOrEqual(t, winner.NegativeBehaviors, 0, "negative_behaviors should not be negative")

			// All winners should have the same final score
			if len(response.Winners) > 1 {
				firstScore := response.Winners[0].FinalScore
				for _, w := range response.Winners {
					assert.Equal(t, firstScore, w.FinalScore, "All winners should have the same final score")
				}
			}
		}

		// Consistency check
		assert.Equal(t, len(response.Winners) > 0, response.HasWinners, "has_winners should match winners array length")
	})

	t.Run("should return 401 without authorization", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day", groupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until auth middleware is implemented
		assert.Equal(t, http.StatusUnauthorized, rr.Code, "Expected 401 Unauthorized")
	})

	t.Run("should return 403 for non-member", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day", groupID)
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
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day", nonExistentGroupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until validation is implemented
		assert.Equal(t, http.StatusNotFound, rr.Code, "Expected 404 Not Found for non-existent group")
	})

	t.Run("should return 400 for invalid group_id", func(t *testing.T) {
		url := "/api/groups/invalid-uuid/pet-of-the-day"
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until validation is implemented
		assert.Equal(t, http.StatusBadRequest, rr.Code, "Expected 400 Bad Request for invalid UUID")
	})

	t.Run("should support date query parameter", func(t *testing.T) {
		targetDate := "2025-01-15"
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day?date=%s", groupID, targetDate)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response PetOfTheDayResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			assert.Equal(t, targetDate, response.Date, "Response date should match query parameter")
		}
	})

	t.Run("should return 400 for invalid date format", func(t *testing.T) {
		invalidDate := "invalid-date"
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day?date=%s", groupID, invalidDate)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until validation is implemented
		assert.Equal(t, http.StatusBadRequest, rr.Code, "Expected 400 Bad Request for invalid date format")
	})

	t.Run("should handle future date requests", func(t *testing.T) {
		futureDate := "2030-12-31"
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day?date=%s", groupID, futureDate)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response PetOfTheDayResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// Future dates should have no winners
			assert.False(t, response.HasWinners, "Future dates should have no winners")
			assert.Empty(t, response.Winners, "Winners array should be empty for future dates")
		}
	})

	t.Run("should handle empty group gracefully", func(t *testing.T) {
		emptyGroupID := "550e8400-e29b-41d4-a716-446655440998"
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day", emptyGroupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response PetOfTheDayResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			assert.False(t, response.HasWinners, "Empty group should have no winners")
			assert.Empty(t, response.Winners, "Winners array should be empty for empty group")
			assert.Equal(t, 0, response.TotalPets, "Total pets should be 0 for empty group")
		}
	})

	t.Run("should respect user timezone for daily boundaries", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day", groupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")
		req.Header.Set("X-Timezone", "America/New_York")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response PetOfTheDayResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// Date should be calculated based on user's timezone
			assert.NotEmpty(t, response.Date, "Date should be present")
			assert.NotEmpty(t, response.CalculatedAt, "Calculated at timestamp should be present")
		}
	})

	t.Run("should handle tie-breaking rules", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day", groupID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response PetOfTheDayResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// If there are multiple winners, they should have the same negative behavior count
			if len(response.Winners) > 1 {
				firstNegatives := response.Winners[0].NegativeBehaviors
				for _, winner := range response.Winners {
					assert.Equal(t, firstNegatives, winner.NegativeBehaviors,
						"All winners should have the same number of negative behaviors (tie-breaking rule)")
				}
			}
		}
	})

	t.Run("should handle server errors gracefully", func(t *testing.T) {
		url := fmt.Sprintf("/api/groups/%s/pet-of-the-day", groupID)
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