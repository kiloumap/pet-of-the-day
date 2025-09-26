package contract

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// BehaviorResponse represents the expected API response structure
type BehaviorResponse struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Description        string `json:"description"`
	Category           string `json:"category"`
	PointValue         int    `json:"point_value"`
	MinIntervalMinutes int    `json:"min_interval_minutes"`
	Species            string `json:"species"`
	Icon               string `json:"icon"`
	IsActive           bool   `json:"is_active"`
	CreatedAt          string `json:"created_at"`
	UpdatedAt          string `json:"updated_at"`
}

// BehaviorsListResponse represents the full API response
type BehaviorsListResponse struct {
	Behaviors []BehaviorResponse `json:"behaviors"`
}

func TestGetBehaviorsContract(t *testing.T) {
	// This test will fail until the endpoint is implemented
	router := mux.NewRouter()

	// TODO: This will fail - endpoint not implemented yet
	// router.HandleFunc("/api/behaviors", handleGetBehaviors).Methods("GET")

	t.Run("should return 200 with behaviors list", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/behaviors", nil)
		require.NoError(t, err)

		// Add authorization header (will be required)
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This assertion will fail until endpoint is implemented
		assert.Equal(t, http.StatusOK, rr.Code, "Expected 200 OK status")

		var response BehaviorsListResponse
		err = json.Unmarshal(rr.Body.Bytes(), &response)
		require.NoError(t, err, "Response should be valid JSON")

		// Contract assertions
		assert.IsType(t, []BehaviorResponse{}, response.Behaviors, "behaviors should be array")

		if len(response.Behaviors) > 0 {
			behavior := response.Behaviors[0]

			// Required fields
			assert.NotEmpty(t, behavior.ID, "id should not be empty")
			assert.NotEmpty(t, behavior.Name, "name should not be empty")
			assert.NotEmpty(t, behavior.Category, "category should not be empty")
			assert.NotZero(t, behavior.PointValue, "point_value should not be zero")
			assert.Greater(t, behavior.MinIntervalMinutes, 0, "min_interval_minutes should be positive")
			assert.NotEmpty(t, behavior.Species, "species should not be empty")
			assert.NotEmpty(t, behavior.CreatedAt, "created_at should not be empty")
			assert.NotEmpty(t, behavior.UpdatedAt, "updated_at should not be empty")

			// Enum validations
			validCategories := []string{"potty_training", "feeding", "social", "training", "play"}
			assert.Contains(t, validCategories, behavior.Category, "category should be valid enum")

			validSpecies := []string{"dog", "cat", "both"}
			assert.Contains(t, validSpecies, behavior.Species, "species should be valid enum")

			// Point value range
			assert.GreaterOrEqual(t, behavior.PointValue, -10, "point_value should be >= -10")
			assert.LessOrEqual(t, behavior.PointValue, 10, "point_value should be <= 10")

			// Interval range
			assert.GreaterOrEqual(t, behavior.MinIntervalMinutes, 5, "min_interval_minutes should be >= 5")
			assert.LessOrEqual(t, behavior.MinIntervalMinutes, 1440, "min_interval_minutes should be <= 1440")
		}
	})

	t.Run("should return 401 without authorization", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/behaviors", nil)
		require.NoError(t, err)

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// This will fail until auth middleware is implemented
		assert.Equal(t, http.StatusUnauthorized, rr.Code, "Expected 401 Unauthorized")
	})

	t.Run("should return only active behaviors", func(t *testing.T) {
		req, err := http.NewRequest("GET", "/api/behaviors", nil)
		require.NoError(t, err)
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusOK {
			var response BehaviorsListResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			require.NoError(t, err)

			// All returned behaviors should be active
			for _, behavior := range response.Behaviors {
				assert.True(t, behavior.IsActive, "All returned behaviors should be active")
			}
		}
	})

	t.Run("should handle server errors gracefully", func(t *testing.T) {
		// This tests error handling when database is unavailable
		req, err := http.NewRequest("GET", "/api/behaviors", nil)
		require.NoError(t, err)
		req.Header.Set("Authorization", "Bearer valid-jwt-token")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		// Should return proper error structure
		if rr.Code >= 500 {
			var errorResponse map[string]interface{}
			err = json.Unmarshal(rr.Body.Bytes(), &errorResponse)
			require.NoError(t, err, "Error response should be valid JSON")

			assert.Contains(t, errorResponse, "error", "Error response should contain error field")
		}
	})
}