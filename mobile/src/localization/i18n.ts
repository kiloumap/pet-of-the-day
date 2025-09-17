import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './translations/en.json';
import fr from './translations/fr.json';

const LANGUAGE_STORAGE_KEY = 'app_language';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

// Function to get stored language or system language
const getInitialLanguage = async (): Promise<string> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage && ['en', 'fr'].includes(storedLanguage)) {
      return storedLanguage;
    }
  } catch (error) {
    console.warn('Failed to get stored language:', error);
  }

  // Fallback to system language or English
  const systemLanguage = 'en';
  return ['en', 'fr'].includes(systemLanguage) ? systemLanguage : 'en';
};

// Initialize i18n
const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v4',

      interpolation: {
        escapeValue: false,
      },

      react: {
        useSuspense: false,
      },
    });
};

// Function to change language and persist it
export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.warn('Failed to change language:', error);
    // Still change language even if storage fails
    await i18n.changeLanguage(language);
  }
};

// Initialize i18n on app start
initI18n();

export default i18n;