import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Trophy,
  Users,
  Calendar,
  Star,
  Medal,
  Award,
  TrendingUp,
  BarChart3,
  Search,
  Plus
} from 'lucide-react-native';
import { useTranslation } from '@/hooks';
import { useTheme } from '@/theme';
import { Button } from '@components/ui/Button';

export type EmptyStateType =
  | 'leaderboard'
  | 'daily-leaderboard'
  | 'weekly-leaderboard'
  | 'monthly-leaderboard'
  | 'group-leaderboard'
  | 'no-data'
  | 'no-groups'
  | 'no-pets'
  | 'search-results';

interface EmptyStateManagerProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  showAction?: boolean;
}

export const EmptyStateManager: React.FC<EmptyStateManagerProps> = ({
  type,
  title,
  description,
  actionLabel,
  onActionPress,
  showAction = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const getEmptyStateConfig = () => {
    switch (type) {
      case 'leaderboard':
        return {
          icon: Trophy,
          title: title || t('leaderboard.empty.title'),
          description: description || t('leaderboard.empty.description'),
          actionLabel: actionLabel || t('leaderboard.empty.action'),
        };
      case 'daily-leaderboard':
        return {
          icon: Calendar,
          title: title || t('leaderboard.daily.empty.title'),
          description: description || t('leaderboard.daily.empty.description'),
          actionLabel: actionLabel || t('leaderboard.daily.empty.action'),
        };
      case 'weekly-leaderboard':
        return {
          icon: Star,
          title: title || t('leaderboard.weekly.empty.title'),
          description: description || t('leaderboard.weekly.empty.description'),
          actionLabel: actionLabel || t('leaderboard.weekly.empty.action'),
        };
      case 'monthly-leaderboard':
        return {
          icon: Medal,
          title: title || t('leaderboard.monthly.empty.title'),
          description: description || t('leaderboard.monthly.empty.description'),
          actionLabel: actionLabel || t('leaderboard.monthly.empty.action'),
        };
      case 'group-leaderboard':
        return {
          icon: Users,
          title: title || t('leaderboard.group.empty.title'),
          description: description || t('leaderboard.group.empty.description'),
          actionLabel: actionLabel || t('leaderboard.group.empty.action'),
        };
      case 'no-data':
        return {
          icon: BarChart3,
          title: title || t('common.noData'),
          description: description || t('common.noDataDescription'),
          actionLabel: actionLabel || t('common.refresh'),
        };
      case 'no-groups':
        return {
          icon: Users,
          title: title || t('groups.empty.title'),
          description: description || t('groups.empty.description'),
          actionLabel: actionLabel || t('groups.empty.action'),
        };
      case 'no-pets':
        return {
          icon: Plus,
          title: title || t('pets.empty.title'),
          description: description || t('pets.empty.description'),
          actionLabel: actionLabel || t('pets.empty.action'),
        };
      case 'search-results':
        return {
          icon: Search,
          title: title || t('search.empty.title'),
          description: description || t('search.empty.description'),
          actionLabel: actionLabel || t('search.empty.action'),
        };
      default:
        return {
          icon: TrendingUp,
          title: title || t('common.noContent'),
          description: description || t('common.noContentDescription'),
          actionLabel: actionLabel || t('common.tryAgain'),
        };
    }
  };

  const config = getEmptyStateConfig();
  const IconComponent = config.icon;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing['3xl'],
      minHeight: 200,
    },
    iconContainer: {
      width: 80,
      height: 80,
      backgroundColor: theme.colors.primary + '15',
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xl,
    },
    title: {
      ...theme.typography.styles.h3,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    description: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: theme.spacing.xl,
      maxWidth: 300,
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      minHeight: 48,
    },
    actionButtonText: {
      color: theme.colors.white,
      fontWeight: '600',
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container} testID={`empty-state-${type}`}>
      <View style={styles.iconContainer}>
        <IconComponent
          size={40}
          color={theme.colors.primary}
          testID={`empty-state-icon-${type}`}
        />
      </View>

      <Text style={styles.title}>{config.title}</Text>

      <Text style={styles.description}>{config.description}</Text>

      {showAction && onActionPress && (
        <Button
          title={config.actionLabel}
          onPress={onActionPress}
          style={styles.actionButton}
          textStyle={styles.actionButtonText}
          testID={`empty-state-action-${type}`}
        />
      )}
    </View>
  );
};

export default EmptyStateManager;