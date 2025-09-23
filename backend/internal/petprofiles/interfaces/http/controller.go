package http

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/gorilla/mux"

	"pet-of-the-day/internal/petprofiles/application/commands"
	"pet-of-the-day/internal/petprofiles/application/queries"
	"pet-of-the-day/internal/petprofiles/domain"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/errors"
)

// PetProfilesController handles HTTP requests for pet personality traits
type PetProfilesController struct {
	addHandler    *commands.AddPersonalityTraitHandler
	updateHandler *commands.UpdatePersonalityTraitHandler
	deleteHandler *commands.DeletePersonalityTraitHandler
	getHandler    *queries.GetPetPersonalityHandler
	getTraitHandler *queries.GetPersonalityTraitHandler
}

// NewPetProfilesController creates a new controller
func NewPetProfilesController(
	addHandler *commands.AddPersonalityTraitHandler,
	updateHandler *commands.UpdatePersonalityTraitHandler,
	deleteHandler *commands.DeletePersonalityTraitHandler,
	getHandler *queries.GetPetPersonalityHandler,
	getTraitHandler *queries.GetPersonalityTraitHandler,
) *PetProfilesController {
	return &PetProfilesController{
		addHandler:      addHandler,
		updateHandler:   updateHandler,
		deleteHandler:   deleteHandler,
		getHandler:      getHandler,
		getTraitHandler: getTraitHandler,
	}
}

// RegisterRoutes registers the controller routes
func (c *PetProfilesController) RegisterRoutes(router *mux.Router, authMiddleware func(http.Handler) http.Handler) {
	// Pet personality routes
	router.Handle("/api/pets/{petId}/personality", authMiddleware(http.HandlerFunc(c.GetPetPersonality))).Methods("GET")
	router.Handle("/api/pets/{petId}/personality", authMiddleware(http.HandlerFunc(c.AddPersonalityTrait))).Methods("POST")
	router.Handle("/api/pets/{petId}/personality/{traitId}", authMiddleware(http.HandlerFunc(c.UpdatePersonalityTrait))).Methods("PUT")
	router.Handle("/api/pets/{petId}/personality/{traitId}", authMiddleware(http.HandlerFunc(c.DeletePersonalityTrait))).Methods("DELETE")
}

// GetPetPersonality handles GET /api/pets/{petId}/personality
func (c *PetProfilesController) GetPetPersonality(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	petID, err := uuid.Parse(vars["petId"])
	if err != nil {
		errors.WriteErrorResponse(w, errors.NewValidationError("invalid pet ID"))
		return
	}

	// TODO: Add authorization check - user must be owner, co-owner, or have shared access

	query := &queries.GetPetPersonalityQuery{
		PetID: petID,
	}

	traits, err := c.getHandler.Handle(r.Context(), query)
	if err != nil {
		errors.WriteErrorResponse(w, err)
		return
	}

	// Convert to response DTOs
	responses := make([]domain.PersonalityTraitResponse, len(traits))
	for i, trait := range traits {
		responses[i] = trait.ToResponse()
	}

	response := domain.PetPersonalityListResponse{
		Traits: responses,
		Total:  len(responses),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// AddPersonalityTrait handles POST /api/pets/{petId}/personality
func (c *PetProfilesController) AddPersonalityTrait(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	petID, err := uuid.Parse(vars["petId"])
	if err != nil {
		errors.WriteErrorResponse(w, errors.NewValidationError("invalid pet ID"))
		return
	}

	// Get user from context
	claims, ok := r.Context().Value(auth.ClaimsKey).(*auth.Claims)
	if !ok {
		errors.WriteErrorResponse(w, errors.NewAuthenticationError("missing authentication"))
		return
	}

	// Parse request body
	var request domain.AddPersonalityTraitRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		errors.WriteErrorResponse(w, errors.NewValidationError("invalid request body"))
		return
	}

	// Validate request
	if request.IntensityLevel < 1 || request.IntensityLevel > 5 {
		errors.WriteErrorResponse(w, errors.NewValidationError("intensity_level must be between 1 and 5"))
		return
	}

	if request.TraitType == nil && request.CustomTrait == nil {
		errors.WriteErrorResponse(w, errors.NewValidationError("either trait_type or custom_trait must be provided"))
		return
	}

	if request.TraitType != nil && request.CustomTrait != nil {
		errors.WriteErrorResponse(w, errors.NewValidationError("cannot specify both trait_type and custom_trait"))
		return
	}

	// TODO: Add authorization check - user must be owner or co-owner

	cmd := &commands.AddPersonalityTraitCommand{
		PetID:          petID,
		TraitType:      request.TraitType,
		CustomTrait:    request.CustomTrait,
		IntensityLevel: request.IntensityLevel,
		Notes:          request.Notes,
		AddedBy:        claims.UserID,
	}

	trait, err := c.addHandler.Handle(r.Context(), cmd)
	if err != nil {
		errors.WriteErrorResponse(w, err)
		return
	}

	response := trait.ToResponse()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// UpdatePersonalityTrait handles PUT /api/pets/{petId}/personality/{traitId}
func (c *PetProfilesController) UpdatePersonalityTrait(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	petID, err := uuid.Parse(vars["petId"])
	if err != nil {
		errors.WriteErrorResponse(w, errors.NewValidationError("invalid pet ID"))
		return
	}

	traitID, err := uuid.Parse(vars["traitId"])
	if err != nil {
		errors.WriteErrorResponse(w, errors.NewValidationError("invalid trait ID"))
		return
	}

	// Get user from context
	claims, ok := r.Context().Value(auth.ClaimsKey).(*auth.Claims)
	if !ok {
		errors.WriteErrorResponse(w, errors.NewAuthenticationError("missing authentication"))
		return
	}

	// Parse request body
	var request domain.UpdatePersonalityTraitRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		errors.WriteErrorResponse(w, errors.NewValidationError("invalid request body"))
		return
	}

	// Validate intensity level if provided
	if request.IntensityLevel != nil && (*request.IntensityLevel < 1 || *request.IntensityLevel > 5) {
		errors.WriteErrorResponse(w, errors.NewValidationError("intensity_level must be between 1 and 5"))
		return
	}

	// TODO: Add authorization check - user must be owner or co-owner

	cmd := &commands.UpdatePersonalityTraitCommand{
		TraitID:        traitID,
		IntensityLevel: request.IntensityLevel,
		Notes:          request.Notes,
		UpdatedBy:      claims.UserID,
	}

	trait, err := c.updateHandler.Handle(r.Context(), cmd)
	if err != nil {
		errors.WriteErrorResponse(w, err)
		return
	}

	response := trait.ToResponse()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// DeletePersonalityTrait handles DELETE /api/pets/{petId}/personality/{traitId}
func (c *PetProfilesController) DeletePersonalityTrait(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	petID, err := uuid.Parse(vars["petId"])
	if err != nil {
		errors.WriteErrorResponse(w, errors.NewValidationError("invalid pet ID"))
		return
	}

	traitID, err := uuid.Parse(vars["traitId"])
	if err != nil {
		errors.WriteErrorResponse(w, errors.NewValidationError("invalid trait ID"))
		return
	}

	// Get user from context
	claims, ok := r.Context().Value(auth.ClaimsKey).(*auth.Claims)
	if !ok {
		errors.WriteErrorResponse(w, errors.NewAuthenticationError("missing authentication"))
		return
	}

	// TODO: Add authorization check - user must be owner or co-owner

	cmd := &commands.DeletePersonalityTraitCommand{
		TraitID:   traitID,
		DeletedBy: claims.UserID,
	}

	err = c.deleteHandler.Handle(r.Context(), cmd)
	if err != nil {
		errors.WriteErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}