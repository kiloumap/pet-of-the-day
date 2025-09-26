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

// DailyScoreBreakdown represents the breakdown of daily score
type DailyScoreBreakdown struct {
	BehaviorID        string `json:"behavior_id"`
	BehaviorName      string `json:"behavior_name"`
	Count             int    `json:"count"`
	PointsPerInstance int    `json:"points_per_instance"`
	TotalPoints       int    `json:"total_points"`
}

// DailyScoreResponse represents the full API response
type DailyScoreResponse struct {
	PetID             string                 `json:"pet_id"`
	PetName           string                 `json:"pet_name"`
	Date              string                 `json:"date"`
	TotalScore        int                    `json:"total_score"`
	PositiveBehaviors int                    `json:"positive_behaviors"`
	NegativeBehaviors int                    `json:"negative_behaviors"`
	Breakdown         []DailyScoreBreakdown  `json:"breakdown"`
	CalculatedAt      string                 `json:"calculated_at"`
	UserTimezone      string                 `json:"user_timezone"`
}

func TestGetDailyScoreContract(t *testing.T) {
	// This test will fail until the endpoint is implemented
	router := mux.NewRouter()

	// TODO: This will fail - endpoint not implemented yet
	// router.HandleFunc("/api/pets/{id}/daily-score", handleGetPetDailyScore).Methods("GET")

	petID := "550e8400-e29b-41d4-a716-446655440001"

	t.Run("should return 200 with pet daily score", func(t *testing.T) {
		url := fmt.Sprintf("/api/pets/%s/daily-score", petID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This assertion will fail until endpoint is implemented
		assert.Equal(t, http.StatusOK, rr.Code, "Expected 200 OK status")

		var response DailyScoreResponse
		err = json.Unmarshal(rr.Body.Bytes(), &response)
		require.NoError(t, err, "Response should be valid JSON")

		// Contract assertions
		assert.Equal(t, petID, response.PetID, "pet_id should match request")
		assert.NotEmpty(t, response.PetName, "pet_name should not be empty")
		assert.NotEmpty(t, response.Date, "date should not be empty")
		assert.GreaterOrEqual(t, response.PositiveBehaviors, 0, "positive_behaviors should not be negative")
		assert.GreaterOrEqual(t, response.NegativeBehaviors, 0, "negative_behaviors should not be negative")
		assert.IsType(t, []DailyScoreBreakdown{}, response.Breakdown, "breakdown should be array")
		assert.NotEmpty(t, response.CalculatedAt, "calculated_at should not be empty")
		assert.NotEmpty(t, response.UserTimezone, "user_timezone should not be empty")

		// Validate date format (should be YYYY-MM-DD)
		assert.Regexp(t, `^\d{4}-\d{2}-\d{2}$`, response.Date, "Date should be in YYYY-MM-DD format")

		// Validate breakdown consistency
		calculatedTotal := 0
		for _, breakdown := range response.Breakdown {
			assert.NotEmpty(t, breakdown.BehaviorID, "behavior_id should not be empty")
			assert.NotEmpty(t, breakdown.BehaviorName, "behavior_name should not be empty")
			assert.Greater(t, breakdown.Count, 0, "count should be positive")
			assert.NotZero(t, breakdown.PointsPerInstance, "points_per_instance should not be zero")
			assert.Equal(t, breakdown.Count*breakdown.PointsPerInstance, breakdown.TotalPoints,
				"total_points should equal count * points_per_instance")
			calculatedTotal += breakdown.TotalPoints
		}

		assert.Equal(t, calculatedTotal, response.TotalScore, "total_score should match sum of breakdown")
	})

	t.Run("should return 401 without authorization", func(t *testing.T) {
		url := fmt.Sprintf("/api/pets/%s/daily-score", petID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until auth middleware is implemented
		assert.Equal(t, http.StatusUnauthorized, rr.Code, "Expected 401 Unauthorized")
	})

	t.Run("should return 403 for unauthorized pet", func(t *testing.T) {
		unauthorizedPetID := "550e8400-e29b-41d4-a716-446655440999"
		url := fmt.Sprintf("/api/pets/%s/daily-score", unauthorizedPetID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until authorization is implemented
		assert.Equal(t, http.StatusForbidden, rr.Code, "Expected 403 Forbidden for unauthorized pet")
	})

	t.Run("should return 404 for non-existent pet", func(t *testing.T) {
		nonExistentPetID := "550e8400-e29b-41d4-a716-446655440998"
		url := fmt.Sprintf("/api/pets/%s/daily-score", nonExistentPetID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until validation is implemented
		assert.Equal(t, http.StatusNotFound, rr.Code, "Expected 404 Not Found for non-existent pet")
	})

	t.Run("should return 400 for invalid pet_id", func(t *testing.T) {
		url := "/api/pets/invalid-uuid/daily-score"
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
		url := fmt.Sprintf("/api/pets/%s/daily-score?date=%s", petID, targetDate)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response DailyScoreResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			assert.Equal(t, targetDate, response.Date, "Response date should match query parameter")
		}
	})

	t.Run("should return 400 for invalid date format", func(t *testing.T) {
		invalidDate := "invalid-date"
		url := fmt.Sprintf("/api/pets/%s/daily-score?date=%s", petID, invalidDate)
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
		url := fmt.Sprintf("/api/pets/%s/daily-score?date=%s", petID, futureDate)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response DailyScoreResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// Future dates should have zero scores
			assert.Equal(t, 0, response.TotalScore, "Future dates should have zero score")
			assert.Equal(t, 0, response.PositiveBehaviors, "Future dates should have zero positive behaviors")
			assert.Equal(t, 0, response.NegativeBehaviors, "Future dates should have zero negative behaviors")
			assert.Empty(t, response.Breakdown, "Future dates should have empty breakdown")
		}
	})

	t.Run("should respect user timezone for daily boundaries", func(t *testing.T) {
		url := fmt.Sprintf("/api/pets/%s/daily-score", petID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")
		req.Header.Set("X-Timezone", "America/New_York")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response DailyScoreResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// Timezone should be reflected in response
			assert.Equal(t, "America/New_York", response.UserTimezone, "User timezone should match header")
			assert.NotEmpty(t, response.Date, "Date should be calculated based on timezone")
		}
	})

	t.Run("should handle pet with no behavior logs", func(t *testing.T) {
		petWithNoBehaviors := "550e8400-e29b-41d4-a716-446655440997"
		url := fmt.Sprintf("/api/pets/%s/daily-score", petWithNoBehaviors)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response DailyScoreResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			assert.Equal(t, 0, response.TotalScore, "Pet with no behaviors should have zero score")
			assert.Equal(t, 0, response.PositiveBehaviors, "Pet with no behaviors should have zero positive behaviors")
			assert.Equal(t, 0, response.NegativeBehaviors, "Pet with no behaviors should have zero negative behaviors")
			assert.Empty(t, response.Breakdown, "Pet with no behaviors should have empty breakdown")
		}
	})

	t.Run("should calculate positive and negative behavior counts correctly", func(t *testing.T) {
		url := fmt.Sprintf("/api/pets/%s/daily-score", petID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response DailyScoreResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// Count positive and negative behaviors from breakdown
			calculatedPositive := 0
			calculatedNegative := 0

			for _, breakdown := range response.Breakdown {
				if breakdown.PointsPerInstance > 0 {
					calculatedPositive += breakdown.Count
				} else if breakdown.PointsPerInstance < 0 {
					calculatedNegative += breakdown.Count
				}
			}

			assert.Equal(t, calculatedPositive, response.PositiveBehaviors,
				"Positive behaviors count should match breakdown")
			assert.Equal(t, calculatedNegative, response.NegativeBehaviors,
				"Negative behaviors count should match breakdown")
		}
	})

	t.Run("should group same behaviors in breakdown", func(t *testing.T) {
		url := fmt.Sprintf("/api/pets/%s/daily-score", petID)
		req, err := http.NewRequest("GET", url, nil)
		require.NoError(t, err)

		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response DailyScoreResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// Each behavior should appear only once in breakdown
			behaviorIDs := make(map[string]bool)
			for _, breakdown := range response.Breakdown {
				assert.False(t, behaviorIDs[breakdown.BehaviorID],
					"Each behavior should appear only once in breakdown")
				behaviorIDs[breakdown.BehaviorID] = true
			}
		}
	})

	t.Run("should handle server errors gracefully", func(t *testing.T) {
		url := fmt.Sprintf("/api/pets/%s/daily-score", petID)
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