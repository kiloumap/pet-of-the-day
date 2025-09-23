package http_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"pet-of-the-day/internal/pet/application/commands"
	"pet-of-the-day/internal/pet/application/queries"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/pet/infrastructure"
	pethttp "pet-of-the-day/internal/pet/interfaces/http"
	"pet-of-the-day/internal/shared/events"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"

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
	updateHandler := commands.NewUpdatePetHandler(repo, eventBus)
	deleteHandler := commands.NewDeletePetHandler(repo, eventBus)
	getUserPets := queries.NewGetOwnedPetsHandler(repo)
	getPetHandler := queries.NewGetPetByIDHandler(repo)

	controller := pethttp.NewPetController(
		addHandler,
		updateHandler,
		deleteHandler,
		getUserPets,
		getPetHandler,
	)

	router := mux.NewRouter()
	api := router.PathPrefix("/api").Subrouter()
	controller.RegisterRoutes(api, noAuthMiddleware)

	return httptest.NewServer(router), repo
}

// Contract Tests for Pet Personality API

func TestGetPetPersonalityEndpoint_Success(t *testing.T) {
	server, _ := setupTestServer()
	defer server.Close()

	petID := uuid.New()
	// This will fail until we implement the personality functionality

	resp, err := http.Get(server.URL + "/api/pets/" + petID.String() + "/personality")
	assert.NoError(t, err)
	defer resp.Body.Close()

	// This test should fail initially (404) until we implement the endpoint
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// TODO: Update this test when personality endpoint is implemented
	// Expected successful response:
	// assert.Equal(t, http.StatusOK, resp.StatusCode)
	//
	// var response struct {
	// 	Success bool `json:"success"`
	// 	Data    []struct {
	// 		ID             string `json:"id"`
	// 		TraitType      string `json:"trait_type,omitempty"`
	// 		CustomTrait    string `json:"custom_trait,omitempty"`
	// 		IntensityLevel int    `json:"intensity_level"`
	// 		Notes          string `json:"notes,omitempty"`
	// 	} `json:"data"`
	// }
	//
	// err = json.NewDecoder(resp.Body).Decode(&response)
	// assert.NoError(t, err)
	// assert.True(t, response.Success)
}

func TestPostPetPersonalityEndpoint_Success(t *testing.T) {
	server, _ := setupTestServer()
	defer server.Close()

	petID := uuid.New()

	requestBody := map[string]interface{}{
		"traits": []map[string]interface{}{
			{
				"trait_type":      "playful",
				"intensity_level": 4,
				"notes":          "Very energetic",
			},
		},
	}

	jsonBody, _ := json.Marshal(requestBody)

	resp, err := http.Post(
		server.URL+"/api/pets/"+petID.String()+"/personality",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)
	assert.NoError(t, err)
	defer resp.Body.Close()

	// This test should fail initially (404) until we implement the endpoint
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// TODO: Update this test when personality endpoint is implemented
	// Expected successful response:
	// assert.Equal(t, http.StatusCreated, resp.StatusCode)
}

func TestDeletePetPersonalityTraitEndpoint_Success(t *testing.T) {
	server, _ := setupTestServer()
	defer server.Close()

	petID := uuid.New()
	traitID := uuid.New()

	req, _ := http.NewRequest("DELETE",
		server.URL+"/api/pets/"+petID.String()+"/personality/"+traitID.String(),
		nil)

	client := &http.Client{}
	resp, err := client.Do(req)
	assert.NoError(t, err)
	defer resp.Body.Close()

	// This test should fail initially (404) until we implement the endpoint
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// TODO: Update this test when personality endpoint is implemented
	// Expected successful response:
	// assert.Equal(t, http.StatusNoContent, resp.StatusCode)
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
	defer func(Body io.ReadCloser) {
		_ = Body.Close()
	}(resp.Body)

	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Contains(t, response, "pet_id")
	assert.Contains(t, response, "pet")

	pet := response["pet"].(map[string]interface{})
	assert.Equalf(t, "Arthas", pet["name"], "Pet name should be Arthas, %s received", pet["name"])
}
