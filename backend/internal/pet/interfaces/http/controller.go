package http

import (
	"encoding/json"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"pet-of-the-day/internal/pet/application/commands"
	"pet-of-the-day/internal/pet/application/queries"
	"pet-of-the-day/internal/pet/domain"
	"pet-of-the-day/internal/shared/auth"
	sharederrors "pet-of-the-day/internal/shared/errors"
)

type Controller struct {
	addHandler    *commands.AddPetHandler
	getOwnedPets  *queries.GetOwnedPetsHandler
	getPetHandler *queries.GetPetByIDHandler
}

func NewPetController(
	addHandler *commands.AddPetHandler,
	getOwnedPets *queries.GetOwnedPetsHandler,
	getPetHandler *queries.GetPetByIDHandler,
) *Controller {
	return &Controller{
		addHandler:    addHandler,
		getOwnedPets:  getOwnedPets,
		getPetHandler: getPetHandler,
	}
}

func (c *Controller) RegisterRoutes(router *mux.Router, authMiddleware func(http.Handler) http.Handler) {
	// Protected routes
	protected := router.NewRoute().Subrouter()
	protected.Use(authMiddleware)
	protected.HandleFunc("/pets", c.AddPet).Methods(http.MethodPost)
	protected.HandleFunc("/pets", c.GetOwnedPets).Methods(http.MethodGet)
	protected.HandleFunc("/pets/{id}", c.GetPetById).Methods(http.MethodGet)
}

func (c *Controller) AddPet(w http.ResponseWriter, r *http.Request) {
	var cmd commands.AddPet
	ownerID, _ := auth.GetUserIDFromContext(r.Context())

	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, sharederrors.ErrInvalidRequestBody.Error(), http.StatusBadRequest)
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
	UserID, _ := auth.GetUserIDFromContext(r.Context())

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

func (c *Controller) handleError(w http.ResponseWriter, err error) {
	switch err {
	case domain.ErrPetNotFound:
		http.Error(w, "Pet not found", http.StatusNotFound) // ← Corriger
	case domain.ErrPetInvalidName:
		http.Error(w, "Invalid pet name", http.StatusBadRequest) // ← Corriger
	case domain.ErrPetInvalidSpecies:
		http.Error(w, "Invalid species", http.StatusBadRequest) // ← Corriger
	case domain.ErrPetAlreadyExist:
		http.Error(w, "Pet already exists", http.StatusConflict) // ← Corriger
	default:
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}
