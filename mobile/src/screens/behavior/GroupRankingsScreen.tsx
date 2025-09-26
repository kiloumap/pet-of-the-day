import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  Alert,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useTranslation } from '../../hooks';
import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import {
  fetchGroupRankings,
  fetchPetOfTheDay,
  selectGroupRankings,
  selectPetOfTheDay,
  selectRankingsLoading,
} from '../../store/behaviorSlice';
import { selectCurrentGroup } from '../../store/groupSlice';

import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import GroupRankings from '../../components/behavior/GroupRankings';
import PetOfTheDayCard from '../../shared/cards/PetOfTheDayCard';

type GroupRankingsScreenRouteProp = RouteProp<RootStackParamList, 'GroupRankings'>;
type GroupRankingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GroupRankings'>;

const { width: screenWidth } = Dimensions.get('window');

interface GroupRankingsScreenProps {}

const GroupRankingsScreen: React.FC<GroupRankingsScreenProps> = () => {
  const navigation = useNavigation<GroupRankingsScreenNavigationProp>();
  const route = useRoute<GroupRankingsScreenRouteProp>();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const theme = useTheme();

  // Redux state
  const currentGroup = useAppSelector(selectCurrentGroup);
  const rankings = useAppSelector(selectGroupRankings);
  const petOfTheDay = useAppSelector(selectPetOfTheDay);
  const isLoading = useAppSelector(selectRankingsLoading);

  // Local state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // Screen focus effect
  useFocusEffect(
    useCallback(() => {
      loadRankingsData();
    }, [selectedDate, currentGroup])
  );

  // Auto-refresh for real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRealTimeEnabled && isDateToday(selectedDate)) {
      interval = setInterval(() => {
        loadRankingsData(false); // Silent refresh
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedDate, isRealTimeEnabled]);

  const loadRankingsData = async (showLoading = true) => {
    if (!currentGroup) return;

    try {
      const dateString = formatDateForAPI(selectedDate);
      
      await Promise.all([
        dispatch(fetchGroupRankings({
          groupId: currentGroup.id,
          date: dateString,
        })).unwrap(),
        dispatch(fetchPetOfTheDay({
          groupId: currentGroup.id,
          date: formatDateForAPI(getPreviousDay(selectedDate)), // Pet of the Day is for previous day
        })).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load rankings data:', error);
      // Don't show alert for silent refreshes
      if (showLoading) {
        Alert.alert(
          t('rankings.errors.loadFailed.title'),
          t('rankings.errors.loadFailed.message')
        );
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRankingsData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleLogBehavior = () => {
    navigation.navigate('BehaviorLog');
  };

  const handlePetPress = (petId: string) => {
    navigation.navigate('PetProfile', { petId });
  };

  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getPreviousDay = (date: Date) => {
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    return previousDay;
  };

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('rankings.dates.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('rankings.dates.yesterday');
    } else {
      return date.toLocaleDateString();
    }
  };

  const canNavigateToNextDay = () => {
    const today = new Date();
    return selectedDate < today;
  };

  const navigateToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);
  };

  const navigateToNextDay = () => {
    if (canNavigateToNextDay()) {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedDate(nextDay);
    }
  };

  const navigateToToday = () => {
    setSelectedDate(new Date());
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContainer: {
      padding: theme.spacing.md,
    },
    header: {
      marginBottom: theme.spacing.lg,
    },
    dateNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.md,
      borderRadius: 12,
      marginBottom: theme.spacing.md,
    },
    dateButton: {
      padding: theme.spacing.sm,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '20',
      minWidth: 40,
      alignItems: 'center',
    },
    dateButtonDisabled: {
      backgroundColor: theme.colors.background.tertiary,
    },
    dateButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    dateButtonTextDisabled: {
      color: theme.colors.text.secondary,
    },
    currentDate: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text.primary,
      textAlign: 'center',
      flex: 1,
    },
    todayButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    todayButtonText: {
      color: theme.colors.white,
      fontSize: 14,
      fontWeight: '600',
    },
    realTimeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.md,
      borderRadius: 12,
      marginBottom: theme.spacing.lg,
    },
    realTimeText: {
      fontSize: 16,
      color: theme.colors.text.primary,
      flex: 1,
    },
    petOfTheDaySection: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    rankingsSection: {
      flex: 1,
    },
    actionButton: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    emptyState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateText: {
      fontSize: 18,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.md,
      fontSize: 16,
    },
  });

  if (isLoading && rankings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>
          {t('rankings.loading.rankings')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>
            {currentGroup?.name ? 
              t('rankings.title', { groupName: currentGroup.name }) : 
              t('rankings.titleGeneric')
            }
          </Text>
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <Button
            title="‹"
            onPress={navigateToPreviousDay}
            style={styles.dateButton}
            textStyle={styles.dateButtonText}
            variant="secondary"
            size="small"
          />
          
          <Text style={styles.currentDate}>
            {formatDisplayDate(selectedDate)}
          </Text>
          
          <Button
            title="›"
            onPress={navigateToNextDay}
            disabled={!canNavigateToNextDay()}
            style={[
              styles.dateButton,
              !canNavigateToNextDay() && styles.dateButtonDisabled
            ]}
            textStyle={[
              styles.dateButtonText,
              !canNavigateToNextDay() && styles.dateButtonTextDisabled
            ]}
            variant="secondary"
            size="small"
          />
        </View>

        {/* Today Button (if not viewing today) */}
        {!isDateToday(selectedDate) && (
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
            <Button
              title={t('rankings.goToToday')}
              onPress={navigateToToday}
              variant="outline"
              size="small"
            />
          </View>
        )}

        {/* Real-time Toggle (only for today) */}
        {isDateToday(selectedDate) && (
          <View style={styles.realTimeToggle}>
            <Text style={styles.realTimeText}>
              {t('rankings.realTimeUpdates')}
            </Text>
            <Button
              title={isRealTimeEnabled ? t('common.on') : t('common.off')}
              onPress={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              variant={isRealTimeEnabled ? 'primary' : 'secondary'}
              size="small"
            />
          </View>
        )}

        {/* Pet of the Day Section */}
        {petOfTheDay && (
          <View style={styles.petOfTheDaySection}>
            <Text style={styles.sectionTitle}>
              {t('rankings.petOfTheDay.title')}
            </Text>
            <PetOfTheDayCard
              petOfTheDay={petOfTheDay}
              onPress={() => handlePetPress(petOfTheDay.petId)}
            />
          </View>
        )}

        {/* Rankings Section */}
        <View style={styles.rankingsSection}>
          <Text style={styles.sectionTitle}>
            {t('rankings.currentRankings')}
          </Text>
          
          {rankings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {t('rankings.empty.title')}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {t('rankings.empty.message')}
              </Text>
              <Button
                title={t('rankings.empty.action')}
                onPress={handleLogBehavior}
                variant="primary"
              />
            </View>
          ) : (
            <GroupRankings
              rankings={rankings}
              onPetPress={handlePetPress}
              showAnimation={isDateToday(selectedDate) && isRealTimeEnabled}
            />
          )}
        </View>

        {/* Action Button */}
        <View style={styles.actionButton}>
          <Button
            title={t('rankings.logNewBehavior')}
            onPress={handleLogBehavior}
            variant="primary"
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default GroupRankingsScreen;
