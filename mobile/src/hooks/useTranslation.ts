import { useTranslation as useReactI18nextTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useReactI18nextTranslation();

  const currentLanguage = i18n.language;
  const isEnglish = currentLanguage === 'en';
  const isFrench = currentLanguage === 'fr';

  return {
    t,
    i18n,
    currentLanguage,
    isEnglish,
    isFrench,
  };
};