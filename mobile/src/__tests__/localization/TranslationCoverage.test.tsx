import enTranslations from '../../localization/translations/en.json';
import frTranslations from '../../localization/translations/fr.json';

describe('TranslationCoverage', () => {
  // Helper function to flatten nested objects into dot notation keys
  const flattenKeys = (obj: any, prefix = ''): string[] => {
    const keys: string[] = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          keys.push(...flattenKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
    }
    return keys;
  };

  // Helper function to check if a key exists in nested object
  const hasNestedKey = (obj: any, key: string): boolean => {
    const parts = key.split('.');
    let current = obj;
    for (const part of parts) {
      if (current[part] === undefined) {
        return false;
      }
      current = current[part];
    }
    return current !== undefined && current !== null && current !== '';
  };

  const enKeys = flattenKeys(enTranslations);
  const frKeys = flattenKeys(frTranslations);

  describe('Translation Key Coverage', () => {
    it('should have matching keys between English and French translations', () => {
      const missingInFrench = enKeys.filter(key => !frKeys.includes(key));
      const missingInEnglish = frKeys.filter(key => !enKeys.includes(key));

      if (missingInFrench.length > 0) {
        console.warn('Keys missing in French translations:', missingInFrench);
      }

      if (missingInEnglish.length > 0) {
        console.warn('Keys missing in English translations:', missingInEnglish);
      }

      // This test should FAIL initially if translations are incomplete
      expect(missingInFrench).toHaveLength(0);
      expect(missingInEnglish).toHaveLength(0);
    });

    it('should not have empty translation values in English', () => {
      const emptyKeys: string[] = [];

      enKeys.forEach(key => {
        const parts = key.split('.');
        let current = enTranslations;
        for (const part of parts) {
          current = (current as any)[part];
        }
        if (!current || current.toString().trim() === '') {
          emptyKeys.push(key);
        }
      });

      if (emptyKeys.length > 0) {
        console.warn('Empty English translation keys:', emptyKeys);
      }

      // This test should FAIL if there are empty translations
      expect(emptyKeys).toHaveLength(0);
    });

    it('should not have empty translation values in French', () => {
      const emptyKeys: string[] = [];

      frKeys.forEach(key => {
        const parts = key.split('.');
        let current = frTranslations;
        for (const part of parts) {
          current = (current as any)[part];
        }
        if (!current || current.toString().trim() === '') {
          emptyKeys.push(key);
        }
      });

      if (emptyKeys.length > 0) {
        console.warn('Empty French translation keys:', emptyKeys);
      }

      // This test should FAIL if there are empty French translations
      expect(emptyKeys).toHaveLength(0);
    });
  });

  describe('Profile Section Translation Coverage', () => {
    // These tests should FAIL initially because profile translations are missing
    const requiredProfileKeys = [
      'profile.title',
      'profile.editProfile',
      'profile.personalInfo',
      'profile.accountInfo',
      'profile.name',
      'profile.email',
      'profile.password',
      'profile.changePassword',
      'profile.currentPassword',
      'profile.newPassword',
      'profile.confirmPassword',
      'profile.profilePicture',
      'profile.updateSuccess',
      'profile.passwordChangeSuccess',
      'profile.validations.nameRequired',
      'profile.validations.emailRequired',
      'profile.validations.emailInvalid',
      'profile.validations.passwordTooShort',
      'profile.validations.passwordsDoNotMatch',
      'profile.validations.currentPasswordRequired',
      'profile.placeholders.enterName',
      'profile.placeholders.enterEmail',
      'profile.placeholders.currentPassword',
      'profile.placeholders.newPassword',
      'profile.placeholders.confirmPassword',
      'profile.settings',
      'profile.myPets',
      'profile.dailyStats',
      'profile.pointsToday',
      'profile.totalPoints',
      'profile.actionsRecorded',
      'profile.noPets',
      'profile.generalSettings',
      'profile.customizeApp',
      'profile.notifications',
      'profile.manageDailyAlerts',
      'profile.privacy',
      'profile.controlData',
      'profile.helpSupport',
      'profile.faqContact',
    ];

    it('should have all required profile keys in English', () => {
      const missingKeys = requiredProfileKeys.filter(key => !hasNestedKey(enTranslations, key));

      if (missingKeys.length > 0) {
        console.warn('Missing profile keys in English:', missingKeys);
      }

      // This test should FAIL initially because many profile keys are missing
      expect(missingKeys).toHaveLength(0);
    });

    it('should have all required profile keys in French', () => {
      const missingKeys = requiredProfileKeys.filter(key => !hasNestedKey(frTranslations, key));

      if (missingKeys.length > 0) {
        console.warn('Missing profile keys in French:', missingKeys);
      }

      // This test should FAIL initially because many profile keys are missing
      expect(missingKeys).toHaveLength(0);
    });
  });

  describe('Pet Detail Section Translation Coverage', () => {
    // These tests should FAIL initially because pet detail translations are missing
    const requiredPetDetailKeys = [
      'pets.notesSection',
      'pets.coOwnersSection',
      'pets.personalitySection',
      'pets.addNote',
      'pets.editNote',
      'pets.deleteNote',
      'pets.noteDeleteConfirm',
      'pets.addCoOwner',
      'pets.removeCoOwner',
      'pets.coOwnerEmail',
      'pets.inviteCoOwner',
      'pets.coOwnerInvited',
      'pets.personalityTraits',
      'pets.addTrait',
      'pets.removeTrait',
      'pets.traitName',
      'pets.traitDescription',
      'pets.notes.placeholder',
      'pets.notes.empty',
      'pets.coOwners.empty',
      'pets.personality.empty',
      'pets.sections.notes',
      'pets.sections.coOwners',
      'pets.sections.personality',
    ];

    it('should have all required pet detail keys in English', () => {
      const missingKeys = requiredPetDetailKeys.filter(key => !hasNestedKey(enTranslations, key));

      if (missingKeys.length > 0) {
        console.warn('Missing pet detail keys in English:', missingKeys);
      }

      // This test should FAIL initially because pet detail sections don't exist yet
      expect(missingKeys).toHaveLength(0);
    });

    it('should have all required pet detail keys in French', () => {
      const missingKeys = requiredPetDetailKeys.filter(key => !hasNestedKey(frTranslations, key));

      if (missingKeys.length > 0) {
        console.warn('Missing pet detail keys in French:', missingKeys);
      }

      // This test should FAIL initially because pet detail sections don't exist yet
      expect(missingKeys).toHaveLength(0);
    });
  });

  describe('Invitation Management Translation Coverage', () => {
    // These tests should FAIL initially because invitation translations are missing
    const requiredInvitationKeys = [
      'invitations.pending',
      'invitations.accept',
      'invitations.decline',
      'invitations.dismiss',
      'invitations.acceptConfirm',
      'invitations.declineConfirm',
      'invitations.accepted',
      'invitations.declined',
      'invitations.dismissed',
      'invitations.fromGroup',
      'invitations.invitedBy',
      'invitations.groupName',
      'invitations.acceptedSuccess',
      'invitations.declinedSuccess',
      'invitations.error',
      'invitations.noInvitations',
      'invitations.loading',
      'invitations.title',
      'invitations.description',
    ];

    it('should have all required invitation keys in English', () => {
      const missingKeys = requiredInvitationKeys.filter(key => !hasNestedKey(enTranslations, key));

      if (missingKeys.length > 0) {
        console.warn('Missing invitation keys in English:', missingKeys);
      }

      // This test should FAIL initially because invitation functionality doesn't exist yet
      expect(missingKeys).toHaveLength(0);
    });

    it('should have all required invitation keys in French', () => {
      const missingKeys = requiredInvitationKeys.filter(key => !hasNestedKey(frTranslations, key));

      if (missingKeys.length > 0) {
        console.warn('Missing invitation keys in French:', missingKeys);
      }

      // This test should FAIL initially because invitation functionality doesn't exist yet
      expect(missingKeys).toHaveLength(0);
    });
  });

  describe('Empty State Translation Coverage', () => {
    // These tests should FAIL initially because empty state translations are missing
    const requiredEmptyStateKeys = [
      'emptyStates.leaderboard.title',
      'emptyStates.leaderboard.description',
      'emptyStates.leaderboard.action',
      'emptyStates.pets.title',
      'emptyStates.pets.description',
      'emptyStates.pets.action',
      'emptyStates.groups.title',
      'emptyStates.groups.description',
      'emptyStates.groups.action',
      'emptyStates.notes.title',
      'emptyStates.notes.description',
      'emptyStates.coOwners.title',
      'emptyStates.coOwners.description',
      'emptyStates.personality.title',
      'emptyStates.personality.description',
    ];

    it('should have all required empty state keys in English', () => {
      const missingKeys = requiredEmptyStateKeys.filter(key => !hasNestedKey(enTranslations, key));

      if (missingKeys.length > 0) {
        console.warn('Missing empty state keys in English:', missingKeys);
      }

      // This test should FAIL initially because empty states aren't implemented yet
      expect(missingKeys).toHaveLength(0);
    });

    it('should have all required empty state keys in French', () => {
      const missingKeys = requiredEmptyStateKeys.filter(key => !hasNestedKey(frTranslations, key));

      if (missingKeys.length > 0) {
        console.warn('Missing empty state keys in French:', missingKeys);
      }

      // This test should FAIL initially because empty states aren't implemented yet
      expect(missingKeys).toHaveLength(0);
    });
  });

  describe('Translation Quality', () => {
    it('should have properly formatted interpolation variables', () => {
      const invalidInterpolations: string[] = [];

      // Check English translations for proper {{variable}} format
      enKeys.forEach(key => {
        const parts = key.split('.');
        let current = enTranslations;
        for (const part of parts) {
          current = (current as any)[part];
        }
        const value = current.toString();

        // Check for malformed interpolations
        const malformedMatches = value.match(/\{[^{].*?[^}]\}/g) || value.match(/\{\{[^}]+\}\}/g);
        if (malformedMatches && malformedMatches.some(match => !match.match(/^\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}$/))) {
          invalidInterpolations.push(`${key}: ${value}`);
        }
      });

      if (invalidInterpolations.length > 0) {
        console.warn('Invalid interpolation formats in English:', invalidInterpolations);
      }

      expect(invalidInterpolations).toHaveLength(0);
    });

    it('should have consistent interpolation variables between languages', () => {
      const inconsistentInterpolations: string[] = [];

      enKeys.forEach(key => {
        if (!hasNestedKey(frTranslations, key)) return;

        const enParts = key.split('.');
        let enCurrent = enTranslations;
        for (const part of enParts) {
          enCurrent = (enCurrent as any)[part];
        }

        const frParts = key.split('.');
        let frCurrent = frTranslations;
        for (const part of frParts) {
          frCurrent = (frCurrent as any)[part];
        }

        const enValue = enCurrent.toString();
        const frValue = frCurrent.toString();

        const enInterpolations = enValue.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g) || [];
        const frInterpolations = frValue.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g) || [];

        if (enInterpolations.length !== frInterpolations.length ||
            !enInterpolations.every(interp => frInterpolations.includes(interp))) {
          inconsistentInterpolations.push(`${key}: EN(${enInterpolations.join(', ')}) vs FR(${frInterpolations.join(', ')})`);
        }
      });

      if (inconsistentInterpolations.length > 0) {
        console.warn('Inconsistent interpolations between languages:', inconsistentInterpolations);
      }

      expect(inconsistentInterpolations).toHaveLength(0);
    });

    it('should not have duplicate translation values', () => {
      const duplicateValues: { [key: string]: string[] } = {};

      // Check for duplicate English values
      enKeys.forEach(key => {
        const parts = key.split('.');
        let current = enTranslations;
        for (const part of parts) {
          current = (current as any)[part];
        }
        const value = current.toString().toLowerCase().trim();

        if (!duplicateValues[value]) {
          duplicateValues[value] = [];
        }
        duplicateValues[value].push(key);
      });

      const duplicates = Object.entries(duplicateValues)
        .filter(([value, keys]) => keys.length > 1 && value !== '')
        .map(([value, keys]) => ({ value, keys }));

      if (duplicates.length > 0) {
        console.warn('Duplicate translation values found:', duplicates);
      }

      // Allow some common duplicates like "OK", "Cancel", etc.
      const allowedDuplicates = ['ok', 'cancel', 'save', 'loading...', 'error'];
      const problematicDuplicates = duplicates.filter(dup =>
        !allowedDuplicates.includes(dup.value.toLowerCase())
      );

      expect(problematicDuplicates).toHaveLength(0);
    });
  });

  describe('Missing Translation Detection', () => {
    it('should detect all translation keys used in components but missing from translation files', () => {
      // This would be a more complex test that scans component files for t() usage
      // For now, we'll just ensure the key structure is consistent

      const commonMissingKeys = [
        'common.unsavedChanges',
        'common.discardChanges',
        'common.saveChanges',
        'common.confirmAction',
        'common.processing',
        'common.tryAgain',
        'common.refresh',
        'common.noData',
        'common.loadMore',
        'common.selectAll',
        'common.deselectAll',
      ];

      const missingCommonKeys = commonMissingKeys.filter(key => !hasNestedKey(enTranslations, key));

      if (missingCommonKeys.length > 0) {
        console.warn('Missing common translation keys:', missingCommonKeys);
      }

      // This test should FAIL initially because common keys are missing
      expect(missingCommonKeys).toHaveLength(0);
    });

    it('should have translations for all error messages', () => {
      const requiredErrorKeys = [
        'errors.network',
        'errors.serverError',
        'errors.unauthorized',
        'errors.forbidden',
        'errors.notFound',
        'errors.timeout',
        'errors.generic',
        'errors.validation.required',
        'errors.validation.invalid',
        'errors.validation.tooShort',
        'errors.validation.tooLong',
        'errors.validation.format',
      ];

      const missingErrorKeys = requiredErrorKeys.filter(key => !hasNestedKey(enTranslations, key));

      if (missingErrorKeys.length > 0) {
        console.warn('Missing error translation keys:', missingErrorKeys);
      }

      // This test should FAIL initially because error translations are incomplete
      expect(missingErrorKeys).toHaveLength(0);
    });
  });
});