import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Clock, Award, Users } from 'lucide-react-native';
import { useTranslation } from '../hooks';
import { useTheme } from '../theme';
import { ActivityItem } from '../types/api';
import apiService from '../services/api';

interface ActivityFeedProps {
  onRefresh?: () => void;
  onActionPress?: (item: ActivityItem) => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ onRefresh, onActionPress }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      // Temporarily show empty state since the endpoint doesn't exist yet
      // TODO: Implement proper activity feed endpoint in backend
      setActivities([]);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActivities();
    setIsRefreshing(false);
    onRefresh?.();
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('common.justNow', 'À l\'instant');
    if (diffInMinutes < 60) return t('common.minutesAgo', '{{count}}min', { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('common.hoursAgo', '{{count}}h', { count: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    return t('common.daysAgo', '{{count}}j', { count: diffInDays });
  };

  const getActivityIcon = (points: number) => {
    if (points >= 10) return <Award size={16} color="#f59e0b" />;
    if (points >= 5) return <Award size={16} color="#10b981" />;
    return <Award size={16} color={theme.colors.text.secondary} />;
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={() => onActionPress?.(item)}
    >
      <View style={styles.activityIcon}>
        {getActivityIcon(item.points)}
      </View>

      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>
          <Text style={styles.petName}>{item.pet_name}</Text>
          {' • '}
          <Text style={styles.behaviorName}>{item.behavior_name}</Text>
        </Text>

        <View style={styles.activityMeta}>
          <View style={styles.groupInfo}>
            <Users size={12} color={theme.colors.text.secondary} />
            <Text style={styles.groupName}>{item.group_name}</Text>
          </View>

          <View style={styles.timeInfo}>
            <Clock size={12} color={theme.colors.text.secondary} />
            <Text style={styles.timeAgo}>{formatTimeAgo(item.recorded_at)}</Text>
          </View>
        </View>

        {item.comment && (
          <Text style={styles.comment} numberOfLines={2}>
            {item.comment}
          </Text>
        )}
      </View>

      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>+{item.points}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Award size={48} color={theme.colors.text.tertiary} />
      <Text style={styles.emptyTitle}>{t('points.noActions')}</Text>
      <Text style={styles.emptySubtitle}>{t('points.noActionsSubtitle')}</Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    activityItem: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      alignItems: 'flex-start',
    },
    activityIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    petName: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    behaviorName: {
      color: theme.colors.text.primary,
    },
    activityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    groupInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    groupName: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginLeft: 4,
    },
    timeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeAgo: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginLeft: 4,
    },
    comment: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
      marginTop: 2,
    },
    pointsBadge: {
      backgroundColor: '#dcfce7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    pointsText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#16a34a',
    },
    emptyContainer: {
      flex: 1,
    },
    emptyState: {

      paddingTop: 12,

      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingBottom: 12,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('points.recentActions')}</Text>
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.text.secondary}
          />
        }
        contentContainerStyle={activities.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

export default ActivityFeed;