package http

import (
	"encoding/json"
	"log"
	"net/http"
	"pet-of-the-day/internal/pet/application/commands"
	"pet-of-the-day/internal/pet/application/queries"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/shared/auth"
	sharederrors "pet-of-the-day/internal/shared/errors"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type Controller struct {
	addHandler    *commands.AddPetHandler
	updateHandler *commands.UpdatePetHandler
	deleteHandler *commands.DeletePetHandler
	getOwnedPets  *queries.GetOwnedPetsHandler
	getPetHandler *queries.GetPetByIDHandler
}

func NewPetController(
	addHandler *commands.AddPetHandler,
	updateHandler *commands.UpdatePetHandler,
	deleteHandler *commands.DeletePetHandler,
	getOwnedPets *queries.GetOwnedPetsHandler,
	getPetHandler *queries.GetPetByIDHandler,
) *Controller {
	return &Controller{
		addHandler:    addHandler,
		updateHandler: updateHandler,
		deleteHandler: deleteHandler,
		getOwnedPets:  getOwnedPets,
		getPetHandler: getPetHandler,
	}
}

func (c *Controller) RegisterRoutes(router *mux.Router, authMiddleware func(http.Handler) http.Handler) {
	// Protected routes
	protected := router.NewRoute().Subrouter()
	protected.Use(authMiddleware)
	protected.HandleFunc("/pets", c.AddPet).Methods(http.MethodPost, http.MethodOptions)
	protected.HandleFunc("/pets", c.GetOwnedPets).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/pets/{id}", c.GetPetById).Methods(http.MethodGet, http.MethodOptions)
	protected.HandleFunc("/pets/{id}", c.UpdatePet).Methods(http.MethodPut, http.MethodOptions)
	protected.HandleFunc("/pets/{id}", c.DeletePet).Methods(http.MethodDelete, http.MethodOptions)
}

func (c *Controller) AddPet(w http.ResponseWriter, r *http.Request) {
	// Handle OPTIONS request
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	var cmd commands.AddPet
	ownerID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		log.Printf("User ID not found in context: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		http.Error(w, sharederrors.ErrInvalidRequestBody.Error(), http.StatusBadRequest)
		return
	}

	// Validate required fields
	var validationErrors []sharederrors.ValidationError
	if cmd.Name == "" {
		validationErrors = append(validationErrors, sharederrors.NewRequiredFieldError("name"))
	}
	if cmd.Species == "" {
		validationErrors = append(validationErrors, sharederrors.NewRequiredFieldError("species"))
	}

	if len(validationErrors) > 0 {
		sharederrors.WriteValidationErrorResponse(w, validationErrors)
		return
	}

	result, err := c.addHandler.Handle(r.Context(), cmd, ownerID)
	if err != nil {
		c.handleError(w, err)
		return
	}

	response := map[string]interface{}{
		"pet_id": result.PetId,
		"pet": map[string]interface{}{
			"name":      result.Pet.Name(),
			"species":   result.Pet.Species(),
			"breed":     result.Pet.Breed(),
			"birthDate": result.Pet.BirthDate(),
			"photoUrl":  result.Pet.PhotoUrl(),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
		return
	}
}

func (c *Controller) GetPetById(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	petID, err := uuid.Parse(vars["id"])

	if err != nil {
		http.Error(w, domain.ErrPetNotFound.Error(), http.StatusBadRequest)
		return
	}

	query := queries.GetPetById{PetID: petID}

	result, err := c.getPetHandler.Handle(r.Context(), query)
	if err != nil {
		c.handleError(w, err)
		return
	}

	response := map[string]interface{}{
		"id":           result.ID,
		"name":         result.Name,
		"species":      result.Species,
		"breed":        result.Breed,
		"birth_date":   result.BirthDate,
		"photo_url":    result.PhotoURL,
		"created_at":   result.CreatedAt,
		"owner_id":     result.OwnerID,
		"co_owner_ids": result.CoOwnerIDs,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
		return
	}
}

func (c *Controller) GetOwnedPets(w http.ResponseWriter, r *http.Request) {
	UserID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		log.Printf("User ID not found in context: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := queries.GetOwnedPets{UserID: UserID}

	pets, err := c.getOwnedPets.Handle(r.Context(), query)
	if err != nil {
		c.handleError(w, err)
		return
	}

	petResponses := make([]map[string]interface{}, len(pets.Pets))
	for i, pet := range pets.Pets {
		petResponses[i] = map[string]interface{}{
			"id":         pet.ID(),
			"name":       pet.Name(),
			"species":    pet.Species(),
			"breed":      pet.Breed(),
			"birth_date": pet.BirthDate(),
			"photo_url":  pet.PhotoUrl(),
			"owner_id":   pet.OwnerID(),
			"created_at": pet.CreatedAt(),
			"updated_at": pet.UpdatedAt(),
		}
	}

	response := map[string]interface{}{
		"count": len(pets.Pets),
		"pets":  petResponses,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
		return
	}
}

func (c *Controller) UpdatePet(w http.ResponseWriter, r *http.Request) {
	// Handle OPTIONS request
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "PUT, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	vars := mux.Vars(r)
	petID, err := uuid.Parse(vars["id"])
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid pet ID", http.StatusBadRequest)
		return
	}

	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		log.Printf("User ID not found in context: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Name      *string `json:"name,omitempty"`
		Species   *string `json:"species,omitempty"`
		Breed     *string `json:"breed,omitempty"`
		BirthDate *string `json:"birth_date,omitempty"`
		PhotoURL  *string `json:"photo_url,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidInput, "Invalid JSON", http.StatusBadRequest)
		return
	}

	cmd := commands.UpdatePetCommand{
		PetID:     petID,
		UserID:    userID,
		Name:      req.Name,
		Species:   req.Species,
		Breed:     req.Breed,
		BirthDate: req.BirthDate,
		PhotoURL:  req.PhotoURL,
	}

	result, err := c.updateHandler.Handle(r.Context(), cmd)
	if err != nil {
		c.handleError(w, err)
		return
	}

	response := map[string]interface{}{
		"id":         result.Pet.ID(),
		"name":       result.Pet.Name(),
		"species":    result.Pet.Species(),
		"breed":      result.Pet.Breed(),
		"birth_date": result.Pet.BirthDate(),
		"photo_url":  result.Pet.PhotoURL(),
		"created_at": result.Pet.CreatedAt(),
		"updated_at": result.Pet.UpdatedAt(),
		"owner_id":   result.Pet.OwnerID(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
		return
	}
}

func (c *Controller) DeletePet(w http.ResponseWriter, r *http.Request) {
	// Handle OPTIONS request
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	vars := mux.Vars(r)
	petID, err := uuid.Parse(vars["id"])
	if err != nil {
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInvalidFormat, "Invalid pet ID", http.StatusBadRequest)
		return
	}

	userID, err := auth.GetUserIDFromContext(r.Context())
	if err != nil {
		log.Printf("User ID not found in context: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	cmd := commands.DeletePetCommand{
		PetID:  petID,
		UserID: userID,
	}

	err = c.deleteHandler.Handle(r.Context(), cmd)
	if err != nil {
		c.handleError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (c *Controller) handleError(w http.ResponseWriter, err error) {
	switch err {
	case domain.ErrPetNotFound:
		apiErr := sharederrors.NewPetNotFoundError()
		sharederrors.WriteErrorResponse(w, apiErr.Code, apiErr.Message, http.StatusNotFound)
	case domain.ErrPetInvalidName:
		sharederrors.WriteFieldErrorResponse(w, sharederrors.ErrCodeInvalidInput, "Invalid pet name", "name", http.StatusBadRequest)
	case domain.ErrPetInvalidSpecies:
		sharederrors.WriteFieldErrorResponse(w, sharederrors.ErrCodeInvalidInput, "Invalid species", "species", http.StatusBadRequest)
	case domain.ErrPetAlreadyExist:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodePetAlreadyExists, "Pet already exists", http.StatusConflict)
	default:
		sharederrors.WriteErrorResponse(w, sharederrors.ErrCodeInternalServer, "Internal server error", http.StatusInternalServerError)
	}
}
