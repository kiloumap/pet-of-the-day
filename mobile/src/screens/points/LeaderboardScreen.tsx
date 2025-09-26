import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme/ThemeContext';
import {
  fetchGroupLeaderboard,
  clearError,
  setLeaderboardPeriod,
} from '../../store/pointsSlice';
import { LeaderboardEntry } from '../../types/api';
import { getLocalizedSpecies } from '../../utils/speciesLocalization';
import { EmptyStateManager } from '../../components/EmptyStateManager';

type LeaderboardScreenRouteProp = RouteProp<{ Leaderboard: { groupId: string } }, 'Leaderboard'>;

const LeaderboardScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<LeaderboardScreenRouteProp>();
  const dispatch = useAppDispatch();

  const { groupId } = route.params;

  const {
    dailyLeaderboard,
    weeklyLeaderboard,
    leaderboardPeriod,
    isLoadingLeaderboard,
    error,
    currentPeriodStart,
    currentPeriodEnd,
  } = useAppSelector((state) => state.points);

  const { currentGroup } = useAppSelector((state) => state.groups);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupLeaderboard({ groupId, period: leaderboardPeriod }));
    }
  }, [dispatch, groupId, leaderboardPeriod]);

  useEffect(() => {
    if (error) {
      // Handle error silently for now, could show toast
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRefresh = () => {
    if (groupId) {
      dispatch(fetchGroupLeaderboard({ groupId, period: leaderboardPeriod }));
    }
  };

  const handlePeriodChange = (period: 'daily' | 'weekly') => {
    dispatch(setLeaderboardPeriod(period));
    dispatch(fetchGroupLeaderboard({ groupId, period }));
  };

  const handleAddAction = () => {
    (navigation as any).navigate('AddAction', { groupId });
  };

  const currentLeaderboard = leaderboardPeriod === 'daily' ? dailyLeaderboard : weeklyLeaderboard;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return theme.colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContainer: {
      flexGrow: 1,
    },
    contentContainer: {
      padding: 16,
    },
    titleSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderRadius: 8,
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    periodButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    periodButtonTextActive: {
      color: theme.colors.reverse,
    },
    periodInfo: {
      alignItems: 'center',
      marginBottom: 20,
    },
    periodDates: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    podiumSection: {
      marginBottom: 32,
    },
    podium: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginBottom: 20,
      height: 120,
    },
    podiumPlace: {
      alignItems: 'center',
      marginHorizontal: 8,
      flex: 1,
    },
    podiumBar: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    podiumBarFirst: {
      height: 80,
      backgroundColor: '#FFD70030',
      borderColor: '#FFD700',
    },
    podiumBarSecond: {
      height: 60,
      backgroundColor: '#C0C0C030',
      borderColor: '#C0C0C0',
    },
    podiumBarThird: {
      height: 40,
      backgroundColor: '#CD7F3230',
      borderColor: '#CD7F32',
    },
    podiumRank: {
      fontSize: 24,
      marginBottom: 4,
    },
    podiumPetName: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: 2,
    },
    podiumPoints: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      fontWeight: '500',
    },
    fullRankingSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 16,
    },
    rankingList: {
      gap: 8,
    },
    rankingItem: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    rankingItemTop3: {
      borderWidth: 2,
    },
    rankingRank: {
      width: 40,
      alignItems: 'center',
      marginRight: 12,
    },
    rankingRankText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    rankingRankEmoji: {
      fontSize: 24,
    },
    petAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.background.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    petInfo: {
      flex: 1,
    },
    petName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    petOwner: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    petSpecies: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
    },
    pointsSection: {
      alignItems: 'flex-end',
    },
    points: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    actionsCount: {
      fontSize: 12,
      color: theme.colors.text.secondary,
    },
    emptyState: {
      alignItems: 'center',
      padding: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    addActionButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    addActionButtonText: {
      color: theme.colors.reverse,
      fontSize: 16,
      fontWeight: '600',
    },
    fabButton: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
  });

  const topThree = currentLeaderboard?.slice(0, 3) || [];
  const restOfRanking = currentLeaderboard?.slice(3) || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('points.leaderboard')}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingLeaderboard}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {leaderboardPeriod === 'daily' ? t('points.petOfTheDay') : t('points.petOfTheWeek')}
          </Text>
          <Text style={styles.subtitle}>
            {currentGroup?.name || 'Group Leaderboard'}
          </Text>
        </View>

        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              leaderboardPeriod === 'daily' && styles.periodButtonActive,
            ]}
            onPress={() => handlePeriodChange('daily')}
          >
            <Text
              style={[
                styles.periodButtonText,
                leaderboardPeriod === 'daily' && styles.periodButtonTextActive,
              ]}
            >
              {t('points.dailyLeaderboard')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              leaderboardPeriod === 'weekly' && styles.periodButtonActive,
            ]}
            onPress={() => handlePeriodChange('weekly')}
          >
            <Text
              style={[
                styles.periodButtonText,
                leaderboardPeriod === 'weekly' && styles.periodButtonTextActive,
              ]}
            >
              {t('points.weeklyLeaderboard')}
            </Text>
          </TouchableOpacity>
        </View>

        {currentPeriodStart && currentPeriodEnd && (
          <View style={styles.periodInfo}>
            <Text style={styles.periodDates}>
              {formatDate(currentPeriodStart)} - {formatDate(currentPeriodEnd)}
            </Text>
          </View>
        )}

        {!currentLeaderboard || currentLeaderboard.length === 0 ? (
          <EmptyStateManager
            type="group-leaderboard"
            title={t('points.noActions')}
            description={t('points.noActionsSubtitle')}
            actionLabel={t('points.addAction')}
            showAction={true}
            onActionPress={handleAddAction}
          />
        ) : (
          <>
            {topThree.length > 0 && (
              <View style={styles.podiumSection}>
                <View style={styles.podium}>
                  {/* Second place */}
                  {topThree[1] && (
                    <View style={styles.podiumPlace}>
                      <View style={[styles.podiumBar, styles.podiumBarSecond]}>
                        <Text style={styles.podiumRank}>🥈</Text>
                        <Text style={styles.podiumPetName} numberOfLines={1}>
                          {topThree[1].pet_name}
                        </Text>
                        <Text style={styles.podiumPoints}>
                          {topThree[1].total_points} {t('common.points')}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* First place */}
                  {topThree[0] && (
                    <View style={styles.podiumPlace}>
                      <View style={[styles.podiumBar, styles.podiumBarFirst]}>
                        <Text style={styles.podiumRank}>🥇</Text>
                        <Text style={styles.podiumPetName} numberOfLines={1}>
                          {topThree[0].pet_name}
                        </Text>
                        <Text style={styles.podiumPoints}>
                          {topThree[0].total_points} {t('common.points')}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Third place */}
                  {topThree[2] && (
                    <View style={styles.podiumPlace}>
                      <View style={[styles.podiumBar, styles.podiumBarThird]}>
                        <Text style={styles.podiumRank}>🥉</Text>
                        <Text style={styles.podiumPetName} numberOfLines={1}>
                          {topThree[2].pet_name}
                        </Text>
                        <Text style={styles.podiumPoints}>
                          {topThree[2].total_points} {t('common.points')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.fullRankingSection}>
              <Text style={styles.sectionTitle}>Full Ranking</Text>
              <View style={styles.rankingList}>
                {(currentLeaderboard || []).map((entry) => (
                  <View
                    key={entry.pet_id}
                    style={[
                      styles.rankingItem,
                      entry.rank <= 3 && styles.rankingItemTop3,
                      { borderColor: entry.rank <= 3 ? getRankColor(entry.rank) : theme.colors.border }
                    ]}
                  >
                    <View style={styles.rankingRank}>
                      {entry.rank <= 3 ? (
                        <Text style={styles.rankingRankEmoji}>
                          {getRankIcon(entry.rank)}
                        </Text>
                      ) : (
                        <Text
                          style={[
                            styles.rankingRankText,
                            { color: theme.colors.text.secondary }
                          ]}
                        >
                          {entry.rank}
                        </Text>
                      )}
                    </View>

                    <View style={styles.petAvatar}>
                      <MaterialIcons
                        name={entry.species === 'dog' ? 'pets' : 'pets'}
                        size={24}
                        color={theme.colors.text.secondary}
                      />
                    </View>

                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>{entry.pet_name}</Text>
                      <Text style={styles.petOwner}>{entry.owner_name}</Text>
                      <Text style={styles.petSpecies}>
                        {getLocalizedSpecies(entry.species, t)}
                      </Text>
                    </View>

                    <View style={styles.pointsSection}>
                      <Text style={styles.points}>
                        {entry.total_points}
                      </Text>
                      <Text style={styles.actionsCount}>
                        {entry.actions_count} {t('points.actionsCount').toLowerCase()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {currentLeaderboard.length > 0 && (
        <TouchableOpacity style={styles.fabButton} onPress={handleAddAction}>
          <MaterialIcons name="add" size={24} color={theme.colors.reverse} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default LeaderboardScreen;