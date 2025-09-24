import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Heart, Calendar, Plus, TrendingUp, Users, Bell, BookOpen, Star } from 'lucide-react-native';

import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { PetCard } from '../../shared/cards/PetCard';
import { PetOfTheDayCard } from '../../shared/cards/PetOfTheDayCard';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { fetchPets } from '../../store/petSlice';
import { fetchPendingInvites, fetchSharedNotebooks } from '../../store/slices/sharingSlice';
import { Pet } from '../../types/api';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../navigation/TabNavigator';

interface QuickStatsProps {
  totalPets: number;
  totalPoints: number;
  sharedNotebooks: number;
  pendingInvites: number;
}

const QuickStats: React.FC<QuickStatsProps> = ({
  totalPets,
  totalPoints,
  sharedNotebooks,
  pendingInvites,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    statsContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.xs,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });

  const stats = [
    { icon: Heart, value: totalPets, label: t('home.stats.pets'), color: theme.colors.error },
    { icon: Star, value: totalPoints, label: t('home.stats.points'), color: theme.colors.warning },
    {
      icon: BookOpen,
      value: sharedNotebooks,
      label: t('home.stats.shared'),
      color: theme.colors.info,
    },
    {
      icon: Bell,
      value: pendingInvites,
      label: t('home.stats.invites'),
      color: theme.colors.success,
    },
  ];

  return (
    <View style={styles.statsContainer}>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <View key={index} style={styles.statCard}>
            <IconComponent size={20} color={stat.color} />
            <Text style={styles.statNumber}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'Home'>>();

  const { user } = useAppSelector(state => state.auth);
  const { pets } = useAppSelector(state => state.pets);
  const { sharedNotebooks, pendingInvites } = useAppSelector(state => state.sharing);

  const [refreshing, setRefreshing] = useState(false);

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
    welcomeSection: {
      marginBottom: theme.spacing.lg,
    },
    welcomeText: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    subtitleText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      lineHeight: 22,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    sectionAction: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionActionText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginRight: theme.spacing.xs,
    },
    petList: {
      flexDirection: 'row',
    },
    petCardContainer: {
      marginRight: theme.spacing.md,
      width: 280,
    },
    addPetCard: {
      width: 280,
      height: 180,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    addPetText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyState: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyStateIcon: {
      marginBottom: theme.spacing.md,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyStateDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: theme.spacing.lg,
    },
    emptyStateButton: {
      paddingHorizontal: theme.spacing.lg,
    },
    notificationCard: {
      backgroundColor: theme.colors.info + '10',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.info,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    notificationContent: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    notificationText: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      lineHeight: 16,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickActionCard: {
      width: '48%',
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    quickActionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      await Promise.all([
        dispatch(fetchPets()).unwrap(),
        dispatch(fetchPendingInvites()).unwrap(),
        dispatch(fetchSharedNotebooks()).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const handleAddPet = () => {
    // Navigate to add pet screen
    navigation.navigate('AddPet');
  };

  const handleViewAllPets = () => {
    navigation.navigate('MyPets' as never);
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
  };

  // Calculate total points from pets
  const totalPoints = pets.reduce((sum, pet) => sum + (pet.points || 0), 0);

  // Get featured pet (pet with most points or most recent)
  const featuredPet = pets.length > 0
    ? pets.reduce((prev, current) =>
        (prev.points || 0) > (current.points || 0) ? prev : current
      )
    : null;

  const quickActions = [
    {
      icon: Plus,
      title: t('home.quickActions.addEntry'),
      color: theme.colors.primary,
      action: 'addEntry',
    },
    {
      icon: Calendar,
      title: t('home.quickActions.schedule'),
      color: theme.colors.info,
      action: 'schedule',
    },
    {
      icon: Users,
      title: t('home.quickActions.shareNotebook'),
      color: theme.colors.success,
      action: 'share',
    },
    {
      icon: TrendingUp,
      title: t('home.quickActions.viewStats'),
      color: theme.colors.warning,
      action: 'stats',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            {t('home.welcome', { name: user?.first_name || 'User' })}
          </Text>
          <Text style={styles.subtitleText}>{t('home.subtitle')}</Text>
        </View>

        {/* Quick Stats */}
        <QuickStats
          totalPets={pets.length}
          totalPoints={totalPoints}
          sharedNotebooks={sharedNotebooks.length}
          pendingInvites={pendingInvites.length}
        />

        {/* Pending Invites Notification */}
        {pendingInvites.length > 0 && (
          <View style={styles.notificationCard}>
            <Bell size={20} color={theme.colors.info} />
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>
                {t('home.notifications.pendingInvites', { count: pendingInvites.length })}
              </Text>
              <Text style={styles.notificationText}>
                {t('home.notifications.pendingInvitesDescription')}
              </Text>
            </View>
          </View>
        )}

        {/* Pet of the Day */}
        {featuredPet && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.petOfTheDay')}</Text>
            </View>
            <PetOfTheDayCard pet={featuredPet} />
          </View>
        )}

        {/* My Pets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('navigation.myPets')}</Text>
            {pets.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onPress={handleViewAllPets}
                style={styles.sectionAction}
              >
                <Text style={styles.sectionActionText}>{t('common.viewAll')}</Text>
              </Button>
            )}
          </View>

          {pets.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Heart size={48} color={theme.colors.text.secondary} />
              </View>
              <Text style={styles.emptyStateTitle}>{t('home.noPets')}</Text>
              <Text style={styles.emptyStateDescription}>{t('home.noPetsDescription')}</Text>
              <Button variant="primary" onPress={handleAddPet} style={styles.emptyStateButton}>
                <Plus size={16} color={theme.colors.white} />
                <Text style={{ marginLeft: theme.spacing.sm, color: theme.colors.white }}>
                  {t('pets.addPet')}
                </Text>
              </Button>
            </View>
          ) : (
            <ScrollView
              showsHorizontalScrollIndicator={false}
              style={styles.petList}
            >
              {pets.slice(0, 5).map((pet: Pet) => (
                <View key={pet.id} style={styles.petCardContainer}>
                  <PetCard pet={pet} />
                </View>
              ))}
              <Button
                variant="ghost"
                onPress={handleAddPet}
                style={styles.addPetCard}
              >
                <Plus size={32} color={theme.colors.text.secondary} />
                <Text style={styles.addPetText}>{t('pets.addAnimal')}</Text>
              </Button>
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        {pets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.quickActions.title')}</Text>
            </View>
            <View style={styles.quickActionsContainer}>
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    onPress={() => handleQuickAction(action.action)}
                    style={styles.quickActionCard}
                  >
                    <IconComponent size={24} color={action.color} />
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                  </Button>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;