import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, Bell, Palette, Globe, Shield, HelpCircle, LogOut, ChevronRight, Camera } from 'lucide-react-native';

import { Text } from '@components/ui/Text';
import { Button } from '@components/ui/Button';
import { useTranslation } from '@/hooks';
import { useTheme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@hooks/reduxHooks';
import { logout } from '../../store/authSlice';
import { changeLanguage } from '@/localization';

interface SettingItemProps {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon: IconComponent,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    settingIcon: {
      marginRight: theme.spacing.md,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginBottom: subtitle ? theme.spacing.xs : 0,
    },
    settingSubtitle: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    settingRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return (
    <Button
      variant="ghost"
      onPress={onPress || (() => {})}
      style={styles.settingItem}
    >
      <IconComponent size={20} color={theme.colors.text.secondary} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && (
          <ChevronRight size={16} color={theme.colors.text.secondary} />
        )}
      </View>
    </Button>
  );
};

export const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const currentLanguage = i18n.language;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    profileSection: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: theme.spacing.md,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.background.secondary,
    },
    userName: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    logoutButton: {
      marginTop: theme.spacing.xl,
      backgroundColor: theme.colors.error + '10',
      borderColor: theme.colors.error,
      borderWidth: 1,
    },
    logoutButtonText: {
      color: theme.colors.error,
      fontWeight: '500',
    },
  });

  const handleChangeAvatar = () => {
    console.log('Change avatar');
  };

  const handleNotificationSettings = () => {
    console.log('Notification settings');
  };

  const handleLanguageSettings = async () => {
    const newLanguage = currentLanguage === 'en' ? 'fr' : 'en';
    await changeLanguage(newLanguage);
  };

  const handlePrivacyPolicy = () => {
    console.log('Privacy policy');
  };

  const handleHelp = () => {
    console.log('Help');
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout.confirm.title'),
      t('settings.logout.confirm.message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout.title'),
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ],
    );
  };

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : t('settings.profile.guest');
  const email = user?.email || '';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {(user as any)?.avatarUrl ? (
              <Image source={{ uri: (user as any).avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <User size={32} color={theme.colors.primary} />
              </View>
            )}
            <Button
              variant="primary"
              size="sm"
              onPress={handleChangeAvatar}
              style={styles.cameraButton}
            >
              <Camera size={16} color={theme.colors.white} />
            </Button>
          </View>
          <Text style={styles.userName}>{fullName}</Text>
          {email && <Text style={styles.userEmail}>{email}</Text>}
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>{t('settings.sections.account')}</Text>
        <SettingItem
          icon={Bell}
          title={t('settings.notifications.title')}
          subtitle={t('settings.notifications.description')}
          onPress={handleNotificationSettings}
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.text.secondary}
            />
          }
          showChevron={false}
        />

        {/* Appearance */}
        <Text style={styles.sectionTitle}>{t('settings.sections.appearance')}</Text>
        <SettingItem
          icon={Palette}
          title={t('settings.theme.title')}
          subtitle={isDarkMode ? t('settings.theme.dark') : t('settings.theme.light')}
          onPress={toggleTheme}
          rightElement={
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={isDarkMode ? theme.colors.primary : theme.colors.text.secondary}
            />
          }
          showChevron={false}
        />
        <SettingItem
          icon={Globe}
          title={t('settings.language.title')}
          subtitle={t('settings.language.current')}
          onPress={handleLanguageSettings}
          rightElement={
            <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '500' }}>
              {currentLanguage === 'en' ? 'English' : 'Français'}
            </Text>
          }
        />

        {/* Support */}
        <Text style={styles.sectionTitle}>{t('settings.sections.support')}</Text>
        <SettingItem
          icon={Shield}
          title={t('settings.privacy.title')}
          subtitle={t('settings.privacy.description')}
          onPress={handlePrivacyPolicy}
        />
        <SettingItem
          icon={HelpCircle}
          title={t('settings.help.title')}
          subtitle={t('settings.help.description')}
          onPress={handleHelp}
        />

        {/* Logout */}
        <Button
          variant="ghost"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <LogOut size={20} color={theme.colors.error} />
          <Text style={[styles.logoutButtonText, { marginLeft: theme.spacing.sm }]}>
            {t('settings.logout.title')}
          </Text>
        </Button>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;