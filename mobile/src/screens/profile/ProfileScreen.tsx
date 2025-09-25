import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useTranslation } from '@/hooks';
import { useTheme } from '@/theme';
import { logout } from '../../store/authSlice';

const ProfileScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { petTotalPoints } = useAppSelector((state) => state.points);

    const handleLogout = () => {
        dispatch(logout());
    };

    const MenuItem = ({
                          icon,
                          title,
                          subtitle,
                          onPress,
                          showChevron = true
                      }: {
        icon: React.ReactNode;
        title: string;
        subtitle?: string;
        onPress: () => void;
        showChevron?: boolean;
    }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                    {icon}
                </View>
                <View style={styles.menuItemText}>
                    <Text style={styles.menuTitle}>{title}</Text>
                    {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {showChevron && <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.tertiary} />}
        </TouchableOpacity>
    );

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background.primary,
        },
        scrollView: {
            flex: 1,
            padding: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 24,
        },
        section: {
            backgroundColor: theme.colors.background.secondary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: theme.colors.shadow,
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
        },
        statsContainer: {
            flexDirection: 'row',
            gap: 12,
        },
        statCard: {
            flex: 1,
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
        },
        statNumber: {
            fontSize: 24,
            fontWeight: 'bold',
        },
        statLabel: {
            fontSize: 12,
            marginTop: 4,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        menuItemLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        iconContainer: {
            width: 40,
            height: 40,
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        menuItemText: {
            flex: 1,
        },
        menuTitle: {
            fontSize: 16,
            fontWeight: '500',
            color: theme.colors.text.primary,
        },
        menuSubtitle: {
            fontSize: 14,
            color: theme.colors.text.secondary,
            marginTop: 2,
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>{t('profile.title')}</Text>


                {/* Statistiques rapides */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{t('profile.dailyStats')}</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>0</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>{t('profile.actionsRecorded')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>
                                {Object.values(petTotalPoints).reduce((sum, points) => sum + points, 0)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>{t('profile.totalPoints')}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{t('profile.settings')}</Text>

                    <MenuItem
                        icon={<MaterialIcons name="settings" size={20} color={theme.colors.text.secondary} />}
                        title={t('profile.generalSettings')}
                        subtitle={t('profile.customizeApp')}
                        onPress={() => console.log('Settings')}
                    />

                    <MenuItem
                        icon={<MaterialIcons name="notifications" size={20} color={theme.colors.text.secondary} />}
                        title={t('profile.notifications')}
                        subtitle={t('profile.manageDailyAlerts')}
                        onPress={() => console.log('Notifications')}
                    />

                    <MenuItem
                        icon={<MaterialIcons name="security" size={20} color={theme.colors.text.secondary} />}
                        title={t('profile.privacy')}
                        subtitle={t('profile.controlData')}
                        onPress={() => console.log('Privacy')}
                    />

                    <MenuItem
                        icon={<MaterialIcons name="help" size={20} color={theme.colors.text.secondary} />}
                        title={t('profile.helpSupport')}
                        subtitle={t('profile.faqContact')}
                        onPress={() => console.log('Help')}
                    />

                    <MenuItem
                        icon={<MaterialIcons name="logout" size={20} color={theme.colors.status.error} />}
                        title={t('profile.logout')}
                        onPress={handleLogout}
                        showChevron={false}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;