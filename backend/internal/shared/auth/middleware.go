package auth

import (
	"context"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"

	petDomain "pet-of-the-day/internal/pet/domain"
	userDomain "pet-of-the-day/internal/user/domain"
	"pet-of-the-day/internal/shared/errors"
)

// PetOwnershipChecker defines the interface for checking pet ownership and co-ownership
type PetOwnershipChecker interface {
	// IsOwnerOrCoOwner checks if a user is either the primary owner or a co-owner of a pet
	IsOwnerOrCoOwner(ctx context.Context, userID, petID uuid.UUID) (bool, error)
	// IsOwner checks if a user is the primary owner of a pet
	IsOwner(ctx context.Context, userID, petID uuid.UUID) (bool, error)
	// HasCoOwnershipAccess checks if a user has co-ownership access to a pet
	HasCoOwnershipAccess(ctx context.Context, userID, petID uuid.UUID) (bool, error)
}

// AuthorizationService provides authorization checking capabilities
type AuthorizationService struct {
	petRepo        petDomain.Repository
	coOwnershipRepo userDomain.CoOwnershipRepository
}

// NewAuthorizationService creates a new authorization service
func NewAuthorizationService(petRepo petDomain.Repository, coOwnershipRepo userDomain.CoOwnershipRepository) *AuthorizationService {
	return &AuthorizationService{
		petRepo:        petRepo,
		coOwnershipRepo: coOwnershipRepo,
	}
}

// IsOwnerOrCoOwner checks if a user is either the primary owner or a co-owner of a pet
func (a *AuthorizationService) IsOwnerOrCoOwner(ctx context.Context, userID, petID uuid.UUID) (bool, error) {
	// Check if user is the primary owner
	isOwner, err := a.IsOwner(ctx, userID, petID)
	if err != nil {
		return false, err
	}
	if isOwner {
		return true, nil
	}

	// Check if user is a co-owner
	hasCoOwnership, err := a.coOwnershipRepo.HasActiveCoOwnership(ctx, petID, userID)
	if err != nil {
		return false, err
	}

	return hasCoOwnership, nil
}

// IsOwner checks if a user is the primary owner of a pet
func (a *AuthorizationService) IsOwner(ctx context.Context, userID, petID uuid.UUID) (bool, error) {
	pet, err := a.petRepo.FindByID(ctx, petID)
	if err != nil {
		if err == petDomain.ErrPetNotFound {
			return false, nil
		}
		return false, err
	}

	return pet.OwnerID() == userID, nil
}

// HasCoOwnershipAccess checks if a user has co-ownership access to a pet
func (a *AuthorizationService) HasCoOwnershipAccess(ctx context.Context, userID, petID uuid.UUID) (bool, error) {
	return a.coOwnershipRepo.HasActiveCoOwnership(ctx, petID, userID)
}

// RequirePetOwnershipMiddleware creates middleware that requires pet ownership or co-ownership
func RequirePetOwnershipMiddleware(authService *AuthorizationService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract user ID from context (assumes AuthMiddleware has already run)
			userID, err := GetUserIDFromContext(r.Context())
			if err != nil {
				errors.WriteErrorResponse(w, errors.ErrCodeUnauthorized, "User authentication required", http.StatusUnauthorized)
				return
			}

			// Extract pet ID from URL parameters
			vars := mux.Vars(r)
			petIDStr, exists := vars["petID"]
			if !exists {
				// If no petID in route, let the handler deal with it
				next.ServeHTTP(w, r)
				return
			}

			petID, err := uuid.Parse(petIDStr)
			if err != nil {
				errors.WriteErrorResponse(w, errors.ErrCodeInvalidInput, "Invalid pet ID format", http.StatusBadRequest)
				return
			}

			// Check if user has ownership or co-ownership access
			hasAccess, err := authService.IsOwnerOrCoOwner(r.Context(), userID, petID)
			if err != nil {
				errors.WriteErrorResponse(w, errors.ErrCodeInternalServer, "Failed to check pet access", http.StatusInternalServerError)
				return
			}

			if !hasAccess {
				errors.WriteErrorResponse(w, errors.ErrCodeUnauthorized, "Access denied: not pet owner or co-owner", http.StatusForbidden)
				return
			}

			// Add pet ID to context for use in handlers
			ctx := context.WithValue(r.Context(), "petID", petID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequirePetOwnerMiddleware creates middleware that requires primary pet ownership (no co-owners)
func RequirePetOwnerMiddleware(authService *AuthorizationService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract user ID from context (assumes AuthMiddleware has already run)
			userID, err := GetUserIDFromContext(r.Context())
			if err != nil {
				errors.WriteErrorResponse(w, errors.ErrCodeUnauthorized, "User authentication required", http.StatusUnauthorized)
				return
			}

			// Extract pet ID from URL parameters
			vars := mux.Vars(r)
			petIDStr, exists := vars["petID"]
			if !exists {
				// If no petID in route, let the handler deal with it
				next.ServeHTTP(w, r)
				return
			}

			petID, err := uuid.Parse(petIDStr)
			if err != nil {
				errors.WriteErrorResponse(w, errors.ErrCodeInvalidInput, "Invalid pet ID format", http.StatusBadRequest)
				return
			}

			// Check if user is the primary owner (not just co-owner)
			isOwner, err := authService.IsOwner(r.Context(), userID, petID)
			if err != nil {
				errors.WriteErrorResponse(w, errors.ErrCodeInternalServer, "Failed to check pet ownership", http.StatusInternalServerError)
				return
			}

			if !isOwner {
				errors.WriteErrorResponse(w, errors.ErrCodeUnauthorized, "Access denied: primary pet owner required", http.StatusForbidden)
				return
			}

			// Add pet ID to context for use in handlers
			ctx := context.WithValue(r.Context(), "petID", petID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetPetIDFromContext extracts pet ID from request context
func GetPetIDFromContext(ctx context.Context) (uuid.UUID, error) {
	petID, ok := ctx.Value("petID").(uuid.UUID)
	if !ok {
		return uuid.Nil, errors.APIError{
			Code:    errors.ErrCodeInternalServer,
			Message: "Pet ID not found in context",
		}
	}
	return petID, nil
}