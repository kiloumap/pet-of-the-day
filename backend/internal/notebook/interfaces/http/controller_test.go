package http_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
)

// setupNotebookTestServer creates a test server for notebook endpoints
// This will initially fail until we implement the notebook controller
func setupNotebookTestServer() *httptest.Server {
	router := mux.NewRouter()
	_ = router.PathPrefix("/api").Subrouter()

	// TODO: Register notebook routes when controller is implemented
	// For now, this will return 404 for all notebook endpoints

	return httptest.NewServer(router)
}

// Contract Tests for Notebook API - These MUST FAIL initially (TDD)

func TestGetPetNotebookEndpoint_NotImplemented(t *testing.T) {
	server := setupNotebookTestServer()
	defer server.Close()

	petID := uuid.New()

	resp, err := http.Get(server.URL + "/api/pets/" + petID.String() + "/notebook")
	assert.NoError(t, err)
	defer resp.Body.Close()

	// This test MUST fail initially (404) until we implement the endpoint
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// TODO: Update this test when notebook endpoint is implemented
	// Expected successful response:
	// assert.Equal(t, http.StatusOK, resp.StatusCode)
	//
	// var response struct {
	// 	Success bool `json:"success"`
	// 	Data    struct {
	// 		ID              string `json:"id"`
	// 		PetID           string `json:"pet_id"`
	// 		PetName         string `json:"pet_name"`
	// 		EntryCount      int    `json:"entry_count"`
	// 		LastEntryDate   string `json:"last_entry_date,omitempty"`
	// 		CanEdit         bool   `json:"can_edit"`
	// 		CanShare        bool   `json:"can_share"`
	// 		Entries         []interface{} `json:"entries"`
	// 	} `json:"data"`
	// }
	//
	// err = json.NewDecoder(resp.Body).Decode(&response)
	// assert.NoError(t, err)
	// assert.True(t, response.Success)
}

func TestPostNotebookEntryEndpoint_NotImplemented(t *testing.T) {
	server := setupNotebookTestServer()
	defer server.Close()

	petID := uuid.New()

	requestBody := map[string]interface{}{
		"entry_type":     "medical",
		"title":          "Annual Checkup",
		"content":        "Routine veterinary examination",
		"date_occurred":  "2025-09-20",
		"specialized_data": map[string]interface{}{
			"veterinarian_name": "Dr. Smith",
			"treatment_type":    "checkup",
		},
	}

	jsonBody, _ := json.Marshal(requestBody)

	resp, err := http.Post(
		server.URL+"/api/pets/"+petID.String()+"/notebook/entries",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)
	assert.NoError(t, err)
	defer resp.Body.Close()

	// This test MUST fail initially (404) until we implement the endpoint
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// TODO: Update this test when endpoint is implemented
	// Expected successful response:
	// assert.Equal(t, http.StatusCreated, resp.StatusCode)
}

func TestPutNotebookEntryEndpoint_NotImplemented(t *testing.T) {
	server := setupNotebookTestServer()
	defer server.Close()

	petID := uuid.New()
	entryID := uuid.New()

	requestBody := map[string]interface{}{
		"entry_type":    "medical",
		"title":         "Updated Checkup",
		"content":       "Updated examination notes",
		"date_occurred": "2025-09-20",
	}

	jsonBody, _ := json.Marshal(requestBody)

	req, _ := http.NewRequest("PUT",
		server.URL+"/api/pets/"+petID.String()+"/notebook/entries/"+entryID.String(),
		bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	assert.NoError(t, err)
	defer resp.Body.Close()

	// This test MUST fail initially (404) until we implement the endpoint
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// TODO: Update this test when endpoint is implemented
	// Expected successful response:
	// assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestDeleteNotebookEntryEndpoint_NotImplemented(t *testing.T) {
	server := setupNotebookTestServer()
	defer server.Close()

	petID := uuid.New()
	entryID := uuid.New()

	req, _ := http.NewRequest("DELETE",
		server.URL+"/api/pets/"+petID.String()+"/notebook/entries/"+entryID.String(),
		nil)

	client := &http.Client{}
	resp, err := client.Do(req)
	assert.NoError(t, err)
	defer resp.Body.Close()

	// This test MUST fail initially (404) until we implement the endpoint
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// TODO: Update this test when endpoint is implemented
	// Expected successful response:
	// assert.Equal(t, http.StatusNoContent, resp.StatusCode)
}

func TestGetNotebookSharingEndpoint_NotImplemented(t *testing.T) {
	server := setupNotebookTestServer()
	defer server.Close()

	petID := uuid.New()

	resp, err := http.Get(server.URL + "/api/pets/" + petID.String() + "/notebook/share")
	assert.NoError(t, err)
	defer resp.Body.Close()

	// This test MUST fail initially (404) until we implement the endpoint
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// TODO: Update this test when sharing endpoint is implemented
	// Expected successful response:
	// assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestPostNotebookSharingEndpoint_NotImplemented(t *testing.T) {
	server := setupNotebookTestServer()
	defer server.Close()

	petID := uuid.New()

	requestBody := map[string]interface{}{
		"user_email":       "friend@example.com",
		"permission_level": "read_only",
	}

	jsonBody, _ := json.Marshal(requestBody)

	resp, err := http.Post(
		server.URL+"/api/pets/"+petID.String()+"/notebook/share",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)
	assert.NoError(t, err)
	defer resp.Body.Close()

	// This test MUST fail initially (404) until we implement the endpoint
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// TODO: Update this test when sharing endpoint is implemented
	// Expected successful response:
	// assert.Equal(t, http.StatusCreated, resp.StatusCode)
}

func TestDeleteNotebookSharingEndpoint_NotImplemented(t *testing.T) {
	server := setupNotebookTestServer()
	defer server.Close()

	petID := uuid.New()
	userID := uuid.New()

	req, _ := http.NewRequest("DELETE",
		server.URL+"/api/pets/"+petID.String()+"/notebook/share/"+userID.String(),
		nil)

	client := &http.Client{}
	resp, err := client.Do(req)
	assert.NoError(t, err)
	defer resp.Body.Close()

	// This test MUST fail initially (404) until we implement the endpoint
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// TODO: Update this test when sharing endpoint is implemented
	// Expected successful response:
	// assert.Equal(t, http.StatusNoContent, resp.StatusCode)
}