import { ApiError, ValidationError } from '../types/api';

export interface FormError {
  field?: string;
  message: string;
  code?: string;
}

export interface StandardError {
  message: string;
  type: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';
  code?: string;
  field?: string;
}

/**
 * Maps backend error messages to user-friendly error messages with proper field mapping
 */
export class ErrorHandler {
  private static fieldMapping: Record<string, string> = {
    'email': 'email',
    'password': 'password',
    'first_name': 'firstName',
    'last_name': 'lastName',
    'name': 'name',
    'species': 'species',
    'breed': 'breed',
    'birth_date': 'birthDate',
    'photo_url': 'photoUrl',
  };

  private static errorMessages: Record<string, string> = {
    // Backend error codes from our new API
    'EMAIL_ALREADY_EXISTS': 'errors.emailAlreadyExists',
    'INVALID_CREDENTIALS': 'errors.invalidCredentials',
    'USER_NOT_FOUND': 'errors.userNotFound',
    'PET_NOT_FOUND': 'errors.petNotFound',
    'PET_ALREADY_EXISTS': 'errors.petAlreadyExists',
    'VALIDATION_FAILED': 'errors.validationFailed',
    'INVALID_INPUT': 'errors.invalidInput',
    'MISSING_FIELD': 'errors.fieldRequired',
    'INVALID_FORMAT': 'errors.invalidFormat',
    'UNAUTHORIZED': 'errors.unauthorized',
    'INTERNAL_SERVER_ERROR': 'errors.serverError',

    // Legacy error codes (for backward compatibility)
    'email_already_exists': 'errors.emailAlreadyExists',
    'email_already_in_use': 'errors.emailAlreadyExists',
    'invalid_credentials': 'errors.invalidCredentials',
    'weak_password': 'errors.weakPassword',
    'invalid_email': 'errors.invalidEmail',
    'required_field': 'errors.fieldRequired',
    'invalid_format': 'errors.invalidFormat',
    'too_short': 'errors.tooShort',
    'too_long': 'errors.tooLong',
    'pet_not_found': 'errors.petNotFound',
    'invalid_species': 'errors.invalidSpecies',
    'server_error': 'errors.serverError',
    'network_error': 'errors.networkError',
    'unauthorized': 'errors.unauthorized',
    'forbidden': 'errors.forbidden',
  };

  /**
   * Converts API error to standardized error format
   */
  static handleApiError(error: ApiError): StandardError {
    let errorType: StandardError['type'] = 'unknown';
    let message = error.message;
    let code = error.code;
    let field: string | undefined = error.field;

    // Determine error type based on status
    if (error.status === 0) {
      errorType = 'network';
      message = 'errors.networkError';
    } else if (error.status === 401) {
      errorType = 'authentication';
      message = 'errors.unauthorized';
    } else if (error.status === 422 || error.status === 400) {
      errorType = 'validation';
    } else if (error.status >= 500) {
      errorType = 'server';
      message = 'errors.serverError';
    }

    // Use error code for mapping if available
    if (code) {
      const mappedMessage = this.errorMessages[code];
      if (mappedMessage) {
        message = mappedMessage;
      }
    } else {
      // Fallback to parsing validation errors from message
      const parsedError = this.parseValidationError(error.message);
      if (parsedError) {
        message = parsedError.message;
        field = parsedError.field || field;
        code = parsedError.code;
      }
    }

    // Map field names from backend to frontend
    if (field && this.fieldMapping[field]) {
      field = this.fieldMapping[field];
    }

    return {
      message,
      type: errorType,
      code,
      field,
    };
  }

  /**
   * Converts validation errors from API to form errors
   */
  static handleValidationErrors(error: ApiError): Record<string, string> {
    const formErrors: Record<string, string> = {};

    // Handle multiple validation errors
    if (error.validationErrors) {
      for (const validationError of error.validationErrors) {
        const mappedField = this.fieldMapping[validationError.field] || validationError.field;
        const mappedMessage = this.errorMessages[validationError.code] || validationError.message;
        formErrors[mappedField] = mappedMessage;
      }
    } else if (error.field) {
      // Handle single field error
      const mappedField = this.fieldMapping[error.field] || error.field;
      const mappedMessage = error.code ? (this.errorMessages[error.code] || error.message) : error.message;
      formErrors[mappedField] = mappedMessage;
    } else {
      // General error - show as form-level error
      formErrors._general = error.message;
    }

    return formErrors;
  }

  /**
   * Parses validation errors from backend response
   */
  private static parseValidationError(errorMessage: string): FormError | null {
    // Common patterns for validation errors
    const patterns = [
      // "Email already in use" -> { field: 'email', message: 'already_in_use' }
      /^(email|password|first_name|last_name|name|species)\s+(already\s+in\s+use|is\s+required|invalid\s+format)$/i,
      // "Email already exists" -> { field: 'email', message: 'already_exists' }
      /^(email|password|first_name|last_name|name|species)\s+(already\s+exists|is\s+invalid)$/i,
      // Backend might send: "field_name: error_message"
      /^(\w+):\s*(.+)$/,
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match) {
        const [, fieldName, errorType] = match;
        const normalizedField = this.fieldMapping[fieldName.toLowerCase()] || fieldName;
        const normalizedError = errorType.toLowerCase().replace(/\s+/g, '_');

        return {
          field: normalizedField,
          message: this.errorMessages[normalizedError] || errorMessage,
          code: normalizedError,
        };
      }
    }

    // Check for specific known errors
    const lowerMessage = errorMessage.toLowerCase();
    if (lowerMessage.includes('email') && lowerMessage.includes('already')) {
      return {
        field: 'email',
        message: 'errors.emailAlreadyExists',
        code: 'email_already_exists',
      };
    }

    if (lowerMessage.includes('invalid credentials')) {
      return {
        field: 'email',
        message: 'errors.invalidCredentials',
        code: 'invalid_credentials',
      };
    }

    return null;
  }

  /**
   * Converts error to form field errors for display in forms
   */
  static toFormErrors(error: StandardError): Record<string, string> {
    if (error.field) {
      return { [error.field]: error.message };
    }

    // For general errors, we'll show them as a general form error
    return { _general: error.message };
  }

  /**
   * Gets user-friendly error message for display
   */
  static getDisplayMessage(error: StandardError, t: (key: string) => string): string {
    return t(error.message);
  }
}