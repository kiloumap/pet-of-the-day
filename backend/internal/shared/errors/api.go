package errors

import (
	"encoding/json"
	"net/http"
)

// ErrorCode represents a standardized error code
type ErrorCode string

const (
	// Authentication errors
	ErrCodeUnauthorized       ErrorCode = "UNAUTHORIZED"
	ErrCodeInvalidCredentials ErrorCode = "INVALID_CREDENTIALS"
	ErrCodeTokenExpired       ErrorCode = "TOKEN_EXPIRED"

	// Validation errors
	ErrCodeValidationFailed ErrorCode = "VALIDATION_FAILED"
	ErrCodeInvalidInput     ErrorCode = "INVALID_INPUT"
	ErrCodeMissingField     ErrorCode = "MISSING_FIELD"
	ErrCodeInvalidFormat    ErrorCode = "INVALID_FORMAT"

	// Business logic errors
	ErrCodeEmailAlreadyExists ErrorCode = "EMAIL_ALREADY_EXISTS"
	ErrCodeUserNotFound       ErrorCode = "USER_NOT_FOUND"
	ErrCodePetNotFound        ErrorCode = "PET_NOT_FOUND"
	ErrCodePetAlreadyExists   ErrorCode = "PET_ALREADY_EXISTS"

	// Server errors
	ErrCodeInternalServer     ErrorCode = "INTERNAL_SERVER_ERROR"
	ErrCodeServiceUnavailable ErrorCode = "SERVICE_UNAVAILABLE"
)

// APIError represents a standardized API error response
type APIError struct {
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
	Field   string    `json:"field,omitempty"`
	Details string    `json:"details,omitempty"`
}

// Error implements the error interface
func (e APIError) Error() string {
	return e.Message
}

// ValidationError represents a field-specific validation error
type ValidationError struct {
	Field   string    `json:"field"`
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
}

// ValidationErrors represents multiple validation errors
type ValidationErrors struct {
	Code    ErrorCode         `json:"code"`
	Message string            `json:"message"`
	Errors  []ValidationError `json:"errors"`
}

// Error implements the error interface
func (v ValidationErrors) Error() string {
	return v.Message
}

// WriteErrorResponse writes a standardized error response
func WriteErrorResponse(w http.ResponseWriter, code ErrorCode, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	apiError := APIError{
		Code:    code,
		Message: message,
	}

	json.NewEncoder(w).Encode(apiError)
}

// WriteFieldErrorResponse writes a field-specific error response
func WriteFieldErrorResponse(w http.ResponseWriter, code ErrorCode, message, field string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	apiError := APIError{
		Code:    code,
		Message: message,
		Field:   field,
	}

	json.NewEncoder(w).Encode(apiError)
}

// WriteValidationErrorResponse writes multiple validation errors
func WriteValidationErrorResponse(w http.ResponseWriter, errors []ValidationError) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)

	validationErrors := ValidationErrors{
		Code:    ErrCodeValidationFailed,
		Message: "Validation failed",
		Errors:  errors,
	}

	json.NewEncoder(w).Encode(validationErrors)
}

// Common error creators
func NewEmailAlreadyExistsError() APIError {
	return APIError{
		Code:    ErrCodeEmailAlreadyExists,
		Message: "Email already in use",
		Field:   "email",
	}
}

func NewInvalidCredentialsError() APIError {
	return APIError{
		Code:    ErrCodeInvalidCredentials,
		Message: "Invalid email or password",
	}
}

func NewUserNotFoundError() APIError {
	return APIError{
		Code:    ErrCodeUserNotFound,
		Message: "User not found",
	}
}

func NewPetNotFoundError() APIError {
	return APIError{
		Code:    ErrCodePetNotFound,
		Message: "Pet not found",
	}
}

func NewValidationError(field, message string) ValidationError {
	return ValidationError{
		Field:   field,
		Code:    ErrCodeInvalidInput,
		Message: message,
	}
}

func NewRequiredFieldError(field string) ValidationError {
	return ValidationError{
		Field:   field,
		Code:    ErrCodeMissingField,
		Message: field + " is required",
	}
}
