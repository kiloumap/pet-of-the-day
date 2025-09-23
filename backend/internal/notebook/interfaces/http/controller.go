package http

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/gorilla/mux"

	"pet-of-the-day/internal/notebook/application/commands"
	"pet-of-the-day/internal/notebook/application/queries"
	"pet-of-the-day/internal/notebook/domain"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/errors"
)

// NotebookController handles HTTP requests for pet notebooks
type NotebookController struct {
	createEntryHandler     *commands.CreateNotebookEntryHandler
	updateEntryHandler     *commands.UpdateNotebookEntryHandler
	deleteEntryHandler     *commands.DeleteNotebookEntryHandler
	shareHandler           *commands.ShareNotebookHandler
	revokeShareHandler     *commands.RevokeNotebookShareHandler
	getEntriesHandler      *queries.GetNotebookEntriesHandler
	getEntryHandler        *queries.GetNotebookEntryHandler
	getSharedHandler       *queries.GetSharedNotebooksHandler
	getSharingHandler      *queries.GetNotebookSharingHandler
}

// NewNotebookController creates a new controller
func NewNotebookController(
	createEntryHandler *commands.CreateNotebookEntryHandler,
	updateEntryHandler *commands.UpdateNotebookEntryHandler,
	deleteEntryHandler *commands.DeleteNotebookEntryHandler,
	shareHandler *commands.ShareNotebookHandler,
	revokeShareHandler *commands.RevokeNotebookShareHandler,
	getEntriesHandler *queries.GetNotebookEntriesHandler,
	getEntryHandler *queries.GetNotebookEntryHandler,
	getSharedHandler *queries.GetSharedNotebooksHandler,
	getSharingHandler *queries.GetNotebookSharingHandler,
) *NotebookController {
	return &NotebookController{
		createEntryHandler: createEntryHandler,
		updateEntryHandler: updateEntryHandler,
		deleteEntryHandler: deleteEntryHandler,
		shareHandler:       shareHandler,
		revokeShareHandler: revokeShareHandler,
		getEntriesHandler:  getEntriesHandler,
		getEntryHandler:    getEntryHandler,
		getSharedHandler:   getSharedHandler,
		getSharingHandler:  getSharingHandler,
	}
}

// RegisterRoutes registers the controller routes
func (c *NotebookController) RegisterRoutes(router *mux.Router, authMiddleware func(http.Handler) http.Handler) {
	// Notebook entry routes
	router.Handle("/api/pets/{petId}/notebook", authMiddleware(http.HandlerFunc(c.GetNotebookEntries))).Methods("GET")
	router.Handle("/api/pets/{petId}/notebook", authMiddleware(http.HandlerFunc(c.CreateNotebookEntry))).Methods("POST")
	router.Handle("/api/pets/{petId}/notebook/{entryId}", authMiddleware(http.HandlerFunc(c.GetNotebookEntry))).Methods("GET")
	router.Handle("/api/pets/{petId}/notebook/{entryId}", authMiddleware(http.HandlerFunc(c.UpdateNotebookEntry))).Methods("PUT")
	router.Handle("/api/pets/{petId}/notebook/{entryId}", authMiddleware(http.HandlerFunc(c.DeleteNotebookEntry))).Methods("DELETE")

	// Notebook sharing routes
	router.Handle("/api/pets/{petId}/notebook/sharing", authMiddleware(http.HandlerFunc(c.GetNotebookSharing))).Methods("GET")
	router.Handle("/api/pets/{petId}/notebook/sharing", authMiddleware(http.HandlerFunc(c.ShareNotebook))).Methods("POST")
	router.Handle("/api/pets/{petId}/notebook/sharing/{shareId}", authMiddleware(http.HandlerFunc(c.RevokeNotebookShare))).Methods("DELETE")

	// Shared notebooks list
	router.Handle("/api/users/shared-notebooks", authMiddleware(http.HandlerFunc(c.GetSharedNotebooks))).Methods("GET")
}

// GetNotebookEntries handles GET /api/pets/{petId}/notebook
func (c *NotebookController) GetNotebookEntries(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder implementation that returns 404
	// TODO: Implement when application layer is ready
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Notebook entries not implemented yet",
	})
}

// CreateNotebookEntry handles POST /api/pets/{petId}/notebook
func (c *NotebookController) CreateNotebookEntry(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder implementation that returns 404
	// TODO: Implement when application layer is ready
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Create notebook entry not implemented yet",
	})
}

// GetNotebookEntry handles GET /api/pets/{petId}/notebook/{entryId}
func (c *NotebookController) GetNotebookEntry(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder implementation that returns 404
	// TODO: Implement when application layer is ready
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Get notebook entry not implemented yet",
	})
}

// UpdateNotebookEntry handles PUT /api/pets/{petId}/notebook/{entryId}
func (c *NotebookController) UpdateNotebookEntry(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder implementation that returns 404
	// TODO: Implement when application layer is ready
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Update notebook entry not implemented yet",
	})
}

// DeleteNotebookEntry handles DELETE /api/pets/{petId}/notebook/{entryId}
func (c *NotebookController) DeleteNotebookEntry(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder implementation that returns 404
	// TODO: Implement when application layer is ready
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Delete notebook entry not implemented yet",
	})
}

// GetNotebookSharing handles GET /api/pets/{petId}/notebook/sharing
func (c *NotebookController) GetNotebookSharing(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder implementation that returns 404
	// TODO: Implement when application layer is ready
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Get notebook sharing not implemented yet",
	})
}

// ShareNotebook handles POST /api/pets/{petId}/notebook/sharing
func (c *NotebookController) ShareNotebook(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder implementation that returns 404
	// TODO: Implement when application layer is ready
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Share notebook not implemented yet",
	})
}

// RevokeNotebookShare handles DELETE /api/pets/{petId}/notebook/sharing/{shareId}
func (c *NotebookController) RevokeNotebookShare(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder implementation that returns 404
	// TODO: Implement when application layer is ready
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Revoke notebook share not implemented yet",
	})
}

// GetSharedNotebooks handles GET /api/users/shared-notebooks
func (c *NotebookController) GetSharedNotebooks(w http.ResponseWriter, r *http.Request) {
	// This is a placeholder implementation that returns 404
	// TODO: Implement when application layer is ready
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Get shared notebooks not implemented yet",
	})
}