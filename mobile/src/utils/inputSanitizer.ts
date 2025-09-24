/**
 * Input Sanitization Utilities
 * Task T119: Validate input sanitization across all endpoints
 */

export interface SanitizationOptions {
  allowHTML?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  removeSpecialChars?: boolean;
  allowedChars?: RegExp;
  customSanitizer?: (input: string) => string;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export class InputSanitizer {
  // Basic sanitization methods
  static sanitizeString(input: string, options: SanitizationOptions = {}): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Trim whitespace
    if (options.trimWhitespace !== false) {
      sanitized = sanitized.trim();
    }

    // Apply max length
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Remove HTML if not allowed
    if (!options.allowHTML) {
      sanitized = this.stripHTML(sanitized);
    }

    // Remove special characters if specified
    if (options.removeSpecialChars) {
      sanitized = sanitized.replace(/[<>\"'&]/g, '');
    }

    // Apply allowed characters filter
    if (options.allowedChars) {
      sanitized = sanitized.replace(new RegExp(`[^${options.allowedChars.source}]`, 'g'), '');
    }

    // Apply custom sanitizer
    if (options.customSanitizer) {
      sanitized = options.customSanitizer(sanitized);
    }

    return sanitized;
  }

  static sanitizeEmail(email: string): string {
    return this.sanitizeString(email, {
      maxLength: 254,
      removeSpecialChars: false,
      allowedChars: /a-zA-Z0-9@._-/,
    }).toLowerCase();
  }

  static sanitizeName(name: string): string {
    return this.sanitizeString(name, {
      maxLength: 50,
      allowedChars: /a-zA-Z\s'-/,
    });
  }

  static sanitizePetName(name: string): string {
    return this.sanitizeString(name, {
      maxLength: 50,
      allowedChars: /a-zA-Z0-9\s'-./,
    });
  }

  static sanitizeNotebookContent(content: string): string {
    return this.sanitizeString(content, {
      maxLength: 10000,
      allowHTML: false,
      removeSpecialChars: false,
    });
  }

  static sanitizeBreed(breed: string): string {
    return this.sanitizeString(breed, {
      maxLength: 100,
      allowedChars: /a-zA-Z\s'-/,
    });
  }

  static sanitizePhoneNumber(phone: string): string {
    return this.sanitizeString(phone, {
      maxLength: 20,
      allowedChars: /0-9+()-\s/,
    });
  }

  // Advanced sanitization
  static sanitizeObject<T extends Record<string, any>>(
    obj: T,
    sanitizationRules: Partial<Record<keyof T, SanitizationOptions>>
  ): T {
    const sanitized = { ...obj };

    Object.keys(sanitizationRules).forEach(key => {
      const rule = sanitizationRules[key];
      if (rule && typeof sanitized[key] === 'string') {
        sanitized[key] = this.sanitizeString(sanitized[key], rule);
      }
    });

    return sanitized;
  }

  // Validation methods
  static validateString(value: string, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];

    // Required check
    if (rules.required && (!value || value.trim().length === 0)) {
      errors.push('This field is required');
    }

    if (value && value.length > 0) {
      // Length checks
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Minimum length is ${rules.minLength} characters`);
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Maximum length is ${rules.maxLength} characters`);
      }

      // Pattern check
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push('Invalid format');
      }

      // Custom validation
      if (rules.custom) {
        const customResult = rules.custom(value);
        if (typeof customResult === 'string') {
          errors.push(customResult);
        } else if (!customResult) {
          errors.push('Invalid value');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? value : undefined,
    };
  }

  static validateEmail(email: string): ValidationResult {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.validateString(email, {
      required: true,
      maxLength: 254,
      pattern: emailPattern,
    });
  }

  static validatePassword(password: string): ValidationResult {
    return this.validateString(password, {
      required: true,
      minLength: 8,
      maxLength: 128,
      custom: (value: string) => {
        const hasLower = /[a-z]/.test(value);
        const hasUpper = /[A-Z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        if (!hasLower) return 'Password must contain at least one lowercase letter';
        if (!hasUpper) return 'Password must contain at least one uppercase letter';
        if (!hasNumber) return 'Password must contain at least one number';
        if (!hasSpecial) return 'Password must contain at least one special character';

        return true;
      },
    });
  }

  static validatePetData(petData: {
    name?: string;
    species?: string;
    breed?: string;
    birth_date?: string;
  }): { isValid: boolean; errors: Record<string, string[]>; sanitized: any } {
    const errors: Record<string, string[]> = {};
    const sanitized: any = {};

    // Validate name
    if (petData.name !== undefined) {
      const nameResult = this.validateString(petData.name, {
        required: true,
        minLength: 1,
        maxLength: 50,
      });
      if (!nameResult.isValid) {
        errors.name = nameResult.errors;
      } else {
        sanitized.name = this.sanitizePetName(petData.name);
      }
    }

    // Validate species
    if (petData.species !== undefined) {
      const speciesResult = this.validateString(petData.species, {
        required: true,
        pattern: /^(dog|cat|other)$/,
      });
      if (!speciesResult.isValid) {
        errors.species = speciesResult.errors;
      } else {
        sanitized.species = petData.species.toLowerCase();
      }
    }

    // Validate breed
    if (petData.breed !== undefined && petData.breed.length > 0) {
      const breedResult = this.validateString(petData.breed, {
        maxLength: 100,
      });
      if (!breedResult.isValid) {
        errors.breed = breedResult.errors;
      } else {
        sanitized.breed = this.sanitizeBreed(petData.breed);
      }
    }

    // Validate birth date
    if (petData.birth_date !== undefined && petData.birth_date.length > 0) {
      const dateResult = this.validateString(petData.birth_date, {
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        custom: (value: string) => {
          const date = new Date(value);
          const now = new Date();
          if (date > now) return 'Birth date cannot be in the future';
          if (date.getFullYear() < 1900) return 'Birth date seems too old';
          return true;
        },
      });
      if (!dateResult.isValid) {
        errors.birth_date = dateResult.errors;
      } else {
        sanitized.birth_date = petData.birth_date;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized,
    };
  }

  static validateNotebookEntry(entryData: {
    title?: string;
    content?: string;
    date?: string;
    type?: string;
  }): { isValid: boolean; errors: Record<string, string[]>; sanitized: any } {
    const errors: Record<string, string[]> = {};
    const sanitized: any = {};

    // Validate title
    if (entryData.title !== undefined) {
      const titleResult = this.validateString(entryData.title, {
        required: true,
        minLength: 1,
        maxLength: 200,
      });
      if (!titleResult.isValid) {
        errors.title = titleResult.errors;
      } else {
        sanitized.title = this.sanitizeString(entryData.title);
      }
    }

    // Validate content
    if (entryData.content !== undefined) {
      const contentResult = this.validateString(entryData.content, {
        required: true,
        minLength: 1,
        maxLength: 10000,
      });
      if (!contentResult.isValid) {
        errors.content = contentResult.errors;
      } else {
        sanitized.content = this.sanitizeNotebookContent(entryData.content);
      }
    }

    // Validate date
    if (entryData.date !== undefined) {
      const dateResult = this.validateString(entryData.date, {
        required: true,
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        custom: (value: string) => {
          const date = new Date(value);
          const now = new Date();
          if (date > now) return 'Entry date cannot be in the future';
          return true;
        },
      });
      if (!dateResult.isValid) {
        errors.date = dateResult.errors;
      } else {
        sanitized.date = entryData.date;
      }
    }

    // Validate type
    if (entryData.type !== undefined) {
      const typeResult = this.validateString(entryData.type, {
        required: true,
        pattern: /^(medical|diet|habits|commands|general)$/,
      });
      if (!typeResult.isValid) {
        errors.type = typeResult.errors;
      } else {
        sanitized.type = entryData.type;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized,
    };
  }

  // Utility methods
  private static stripHTML(input: string): string {
    // Remove HTML tags
    return input.replace(/<[^>]*>/g, '');
  }

  static escapeHTML(input: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return input.replace(/[&<>"'\/]/g, (match) => escapeMap[match]);
  }

  static unescapeHTML(input: string): string {
    const unescapeMap: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
    };

    return input.replace(/&(amp|lt|gt|quot|#x27|#x2F);/g, (match) => unescapeMap[match]);
  }

  // Security checks
  static detectPotentialXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  static detectPotentialSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|\/\*|\*\/)/g,
      /(\b(OR|AND)\b.*?=.*?=)/gi,
      /(1=1|1=0)/g,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // Sanitization presets for common use cases
  static readonly PRESETS = {
    USER_INPUT: {
      maxLength: 1000,
      trimWhitespace: true,
      removeSpecialChars: false,
    },
    SEARCH_QUERY: {
      maxLength: 200,
      trimWhitespace: true,
      removeSpecialChars: true,
    },
    DISPLAY_TEXT: {
      maxLength: 2000,
      allowHTML: false,
      trimWhitespace: true,
    },
    URL_SAFE: {
      allowedChars: /a-zA-Z0-9._-/,
      maxLength: 500,
    },
  };
}

// Convenience functions
export const sanitizeUserInput = (input: string) => InputSanitizer.sanitizeString(input, InputSanitizer.PRESETS.USER_INPUT);
export const sanitizeSearchQuery = (query: string) => InputSanitizer.sanitizeString(query, InputSanitizer.PRESETS.SEARCH_QUERY);
export const sanitizeDisplayText = (text: string) => InputSanitizer.sanitizeString(text, InputSanitizer.PRESETS.DISPLAY_TEXT);

// Export default
export default InputSanitizer;