package upload

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	"pet-of-the-day/internal/shared/errors"
)

// FileUploadConfig defines configuration for file uploads
type FileUploadConfig struct {
	MaxFileSize   int64    // Maximum file size in bytes (default: 15MB)
	AllowedTypes  []string // Allowed MIME types (default: common image types)
	UploadPath    string   // Base path for uploads (default: "./uploads")
	MaxFilesCount int      // Maximum number of files per request (default: 5)
}

// DefaultImageUploadConfig returns a default configuration for image uploads
func DefaultImageUploadConfig() FileUploadConfig {
	return FileUploadConfig{
		MaxFileSize: 15 * 1024 * 1024, // 15MB
		AllowedTypes: []string{
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
		},
		UploadPath:    "./uploads/pets",
		MaxFilesCount: 5,
	}
}

// FileUploadService handles file upload operations
type FileUploadService struct {
	config FileUploadConfig
}

// NewFileUploadService creates a new file upload service
func NewFileUploadService(config FileUploadConfig) *FileUploadService {
	return &FileUploadService{config: config}
}

// UploadedFile represents an uploaded file with metadata
type UploadedFile struct {
	Filename     string `json:"filename"`
	OriginalName string `json:"original_name"`
	Size         int64  `json:"size"`
	MimeType     string `json:"mime_type"`
	Path         string `json:"path"`
	URL          string `json:"url"`
}

// ValidateFile validates a file upload against the configured rules
func (s *FileUploadService) ValidateFile(fileHeader *multipart.FileHeader) error {
	// Check file size
	if fileHeader.Size > s.config.MaxFileSize {
		return errors.APIError{
			Code: errors.ErrCodeInvalidInput,
			Message: fmt.Sprintf("File size %d bytes exceeds maximum allowed size of %d bytes",
				fileHeader.Size, s.config.MaxFileSize),
		}
	}

	// Check file type by reading the file content
	file, err := fileHeader.Open()
	if err != nil {
		return errors.APIError{Code: errors.ErrCodeInternalServer, Message: "Failed to open uploaded file"}
	}
	defer file.Close()

	// Read the first 512 bytes to detect content type
	buffer := make([]byte, 512)
	_, err = file.Read(buffer)
	if err != nil && err != io.EOF {
		return errors.APIError{Code: errors.ErrCodeInternalServer, Message: "Failed to read file content"}
	}

	// Detect MIME type
	mimeType := http.DetectContentType(buffer)

	// Check if MIME type is allowed
	if !s.isAllowedType(mimeType) {
		return errors.APIError{
			Code: errors.ErrCodeInvalidInput,
			Message: fmt.Sprintf("File type %s is not allowed. Allowed types: %v",
				mimeType, s.config.AllowedTypes),
		}
	}

	// Validate file extension matches MIME type
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !s.isValidExtensionForMimeType(ext, mimeType) {
		return errors.APIError{
			Code: errors.ErrCodeInvalidInput,
			Message: fmt.Sprintf("File extension %s does not match detected type %s", ext, mimeType),
		}
	}

	return nil
}

// isAllowedType checks if a MIME type is in the allowed types list
func (s *FileUploadService) isAllowedType(mimeType string) bool {
	for _, allowedType := range s.config.AllowedTypes {
		if mimeType == allowedType {
			return true
		}
	}
	return false
}

// isValidExtensionForMimeType validates that file extension matches MIME type
func (s *FileUploadService) isValidExtensionForMimeType(ext, mimeType string) bool {
	validExtensions := map[string][]string{
		"image/jpeg": {".jpg", ".jpeg"},
		"image/png":  {".png"},
		"image/gif":  {".gif"},
		"image/webp": {".webp"},
	}

	if exts, exists := validExtensions[mimeType]; exists {
		for _, validExt := range exts {
			if ext == validExt {
				return true
			}
		}
		return false
	}

	// For unspecified MIME types, allow the extension
	return true
}

// FileUploadMiddleware creates middleware that validates file uploads
func FileUploadMiddleware(service *FileUploadService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Only validate multipart/form-data requests
			contentType := r.Header.Get("Content-Type")
			if !strings.Contains(contentType, "multipart/form-data") {
				next.ServeHTTP(w, r)
				return
			}

			// Parse multipart form
			err := r.ParseMultipartForm(service.config.MaxFileSize)
			if err != nil {
				errors.WriteErrorResponse(w, errors.ErrCodeInvalidInput,
					"Failed to parse multipart form: "+err.Error(), http.StatusBadRequest)
				return
			}

			// Validate each uploaded file
			fileCount := 0
			for fieldName := range r.MultipartForm.File {
				fileHeaders := r.MultipartForm.File[fieldName]
				fileCount += len(fileHeaders)

				// Check file count limit
				if fileCount > service.config.MaxFilesCount {
					errors.WriteErrorResponse(w, errors.ErrCodeInvalidInput,
						fmt.Sprintf("Too many files. Maximum allowed: %d", service.config.MaxFilesCount),
						http.StatusBadRequest)
					return
				}

				// Validate each file
				for _, fileHeader := range fileHeaders {
					if err := service.ValidateFile(fileHeader); err != nil {
						if apiErr, ok := err.(errors.APIError); ok {
							errors.WriteErrorResponse(w, apiErr.Code, apiErr.Message, http.StatusBadRequest)
						} else {
							errors.WriteErrorResponse(w, errors.ErrCodeInternalServer,
								"File validation failed", http.StatusInternalServerError)
						}
						return
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

// SingleFileUploadMiddleware creates middleware specifically for single file uploads
func SingleFileUploadMiddleware(service *FileUploadService, fieldName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Only validate multipart/form-data requests
			contentType := r.Header.Get("Content-Type")
			if !strings.Contains(contentType, "multipart/form-data") {
				next.ServeHTTP(w, r)
				return
			}

			// Parse multipart form
			err := r.ParseMultipartForm(service.config.MaxFileSize)
			if err != nil {
				errors.WriteErrorResponse(w, errors.ErrCodeInvalidInput,
					"Failed to parse multipart form: "+err.Error(), http.StatusBadRequest)
				return
			}

			// Check if the specific field exists
			fileHeaders, exists := r.MultipartForm.File[fieldName]
			if !exists {
				// No file uploaded, continue (file might be optional)
				next.ServeHTTP(w, r)
				return
			}

			// Validate single file upload
			if len(fileHeaders) > 1 {
				errors.WriteErrorResponse(w, errors.ErrCodeInvalidInput,
					"Multiple files not allowed for this upload", http.StatusBadRequest)
				return
			}

			// Validate the single file
			if err := service.ValidateFile(fileHeaders[0]); err != nil {
				if apiErr, ok := err.(errors.APIError); ok {
					errors.WriteErrorResponse(w, apiErr.Code, apiErr.Message, http.StatusBadRequest)
				} else {
					errors.WriteErrorResponse(w, errors.ErrCodeInternalServer,
						"File validation failed", http.StatusInternalServerError)
				}
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetUploadedFileInfo extracts file information from a multipart form field
func GetUploadedFileInfo(r *http.Request, fieldName string) (*multipart.FileHeader, error) {
	if r.MultipartForm == nil {
		return nil, errors.APIError{Code: errors.ErrCodeInvalidInput, Message: "No multipart form found"}
	}

	fileHeaders, exists := r.MultipartForm.File[fieldName]
	if !exists || len(fileHeaders) == 0 {
		return nil, errors.APIError{Code: errors.ErrCodeInvalidInput, Message: "No file found for field: " + fieldName}
	}

	return fileHeaders[0], nil
}