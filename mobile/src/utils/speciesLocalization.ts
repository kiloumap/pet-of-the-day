/**
 * Utility functions for species localization
 */

/**
 * Translates backend species value to localized display text
 * @param species - Backend species value (e.g., "dog", "cat")
 * @param t - Translation function from i18n
 * @returns Localized species name (e.g., "Chien", "Chat", "Dog", "Cat")
 */
export const getLocalizedSpecies = (species: string, t: (key: string) => string): string => {
  if (!species) return '';

  const speciesKey = `pets.species.${species.toLowerCase()}`;
  const translated = t(speciesKey);

  // If translation key doesn't exist, return capitalized species
  return translated !== speciesKey ? translated : species.charAt(0).toUpperCase() + species.slice(1).toLowerCase();
};

/**
 * Gets all available species options with localized labels
 * @param t - Translation function from i18n
 * @returns Array of species options for dropdowns
 */
export const getSpeciesOptions = (t: (key: string) => string) => [
  { label: t('pets.dog'), value: 'dog' },
  { label: t('pets.cat'), value: 'cat' },
];

/**
 * Validates if a species value is supported
 * @param species - Species value to validate
 * @returns True if species is supported
 */
export const isValidSpecies = (species: string): boolean => {
  const validSpecies = ['dog', 'cat'];
  return validSpecies.includes(species.toLowerCase());
};