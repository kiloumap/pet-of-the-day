package http_test

import (
	"bytes"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"net/http"
	"net/http/httptest"
	"pet-of-the-day/internal/pet/application/commands"
	"pet-of-the-day/internal/pet/application/queries"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/pet/infrastructure"
	pethttp "pet-of-the-day/internal/pet/interfaces/http"
	"pet-of-the-day/internal/shared/events"

	"testing"
)

func setupTestServer() (*httptest.Server, *infrastructure.MockPetRepository) {
	repo := infrastructure.NewMockPetRepository()
	eventBus := events.NewInMemoryBus()
	noAuthMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)
		})
	}

	addHandler := commands.NewAddPetHandler(repo, eventBus)
	getUserPets := queries.NewGetOwnedPetsHandler(repo)
	getPetHandler := queries.NewGetPetByIDHandler(repo)

	controller := pethttp.NewPetController(
		addHandler,
		getUserPets,
		getPetHandler,
	)

	router := mux.NewRouter()
	api := router.PathPrefix("/api").Subrouter()
	controller.RegisterRoutes(api, noAuthMiddleware)

	return httptest.NewServer(router), repo
}

func TestAddPetEndpoint_Success(t *testing.T) {
	server, _ := setupTestServer()
	defer server.Close()

	payload := map[string]string{
		"ownerID":   uuid.New().String(),
		"name":      "Arthas",
		"species":   string(domain.SpeciesDog),
		"breed":     "Mini Aussi",
		"birthDate": "2025-01-01T00:00:00Z", // Format ISO
		"photoURL":  "https://picsum.photos/200/300",
	}

	jsonPayload, _ := json.Marshal(payload)
	resp, err := http.Post(server.URL+"/api/pet/add", "application/json", bytes.NewBuffer(jsonPayload))
	assert.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(t, response, "pet_id")
	assert.Contains(t, response, "pet")

	pet := response["pet"].(map[string]interface{})
	assert.Equalf(t, "Arthas", pet["name"], "Pet name should be Arthas, %s received", pet["name"])
}
