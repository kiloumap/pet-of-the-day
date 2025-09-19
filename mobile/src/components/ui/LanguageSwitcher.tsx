import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { changeLanguage } from '../../localization';
import { Globe } from 'lucide-react-native';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  style?: any;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  style
}) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const handleLanguageChange = async () => {
    const newLanguage = currentLanguage === 'en' ? 'fr' : 'en';
    await changeLanguage(newLanguage);
  };

  const getLanguageText = () => {
    return currentLanguage === 'en' ? 'EN' : 'FR';
  };

  const getLanguageLabel = () => {
    return currentLanguage === 'en' ? 'English' : 'Français';
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    compactButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    fullButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    iconContainer: {
      marginRight: 8,
    },
    compactText: {
      color: theme.colors.text.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    fullText: {
      color: theme.colors.text.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    fullLabel: {
      color: theme.colors.text.secondary,
      fontSize: 12,
      marginTop: 2,
    },
  });

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactButton, style]}
        onPress={handleLanguageChange}
      >
        <Globe size={16} color={theme.colors.text.secondary} style={styles.iconContainer} />
        <Text style={styles.compactText}>{getLanguageText()}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.fullButton}
        onPress={handleLanguageChange}
      >
        <Globe size={20} color={theme.colors.text.secondary} style={styles.iconContainer} />
        <View>
          <Text style={styles.fullText}>{getLanguageText()}</Text>
          <Text style={styles.fullLabel}>{getLanguageLabel()}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};