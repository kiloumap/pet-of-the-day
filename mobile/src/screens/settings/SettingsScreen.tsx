import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { changeLanguage } from '../../localization';
import { Moon, Sun, Globe } from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const { theme, colorScheme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const handleLanguageChange = async () => {
    const newLanguage = currentLanguage === 'en' ? 'fr' : 'en';
    await changeLanguage(newLanguage);
  };

  const SettingItem: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onPress: () => void;
    rightText?: string;
  }> = ({ title, description, icon, onPress, rightText }) => (
    <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.colors.background.secondary }]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          {icon}
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
            {description}
          </Text>
        </View>
      </View>
      {rightText && (
        <Text style={[styles.settingValue, { color: theme.colors.primary }]}>{rightText}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>{t('navigation.settings')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          {t('settings.appearance')}
        </Text>

        <SettingItem
          title={t('settings.theme')}
          description={t('settings.themeDescription')}
          icon={colorScheme === 'dark' ?
            <Moon size={20} color={theme.colors.primary} /> :
            <Sun size={20} color={theme.colors.primary} />
          }
          onPress={toggleTheme}
          rightText={t(`settings.${colorScheme}`)}
        />

        <SettingItem
          title={t('settings.language')}
          description={t('settings.languageDescription')}
          icon={<Globe size={20} color={theme.colors.primary} />}
          onPress={handleLanguageChange}
          rightText={currentLanguage === 'en' ? 'English' : 'Français'}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});