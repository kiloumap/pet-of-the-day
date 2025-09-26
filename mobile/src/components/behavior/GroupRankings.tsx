import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from '../../hooks';
import Text from '../ui/Text';

interface PetRanking {
  position: number;
  pet_id: string;
  pet_name: string;
  owner_name: string;
  total_points: number;
  negative_behavior_count: number;
  last_behavior_logged_at?: string;
}

interface GroupRankingsProps {
  rankings: PetRanking[];
  loading?: boolean;
  groupName?: string;
  date?: string;
}

const GroupRankings: React.FC<GroupRankingsProps> = ({
  rankings,
  loading = false,
  groupName,
  date,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginVertical: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
    },
    date: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    rankingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    position: {
      width: 40,
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      textAlign: 'center',
    },
    petInfo: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    petName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    ownerName: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
    points: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      textAlign: 'right',
      minWidth: 60,
    },
    emptyState: {
      textAlign: 'center',
      color: theme.colors.text.secondary,
      fontSize: 16,
      paddingVertical: theme.spacing.lg,
    },
  });

  const renderRankingItem = ({ item }: { item: PetRanking }) => (
    <View style={styles.rankingItem}>
      <Text style={styles.position}>#{item.position}</Text>
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.pet_name}</Text>
        <Text style={styles.ownerName}>{t('behavior.ownedBy', { owner: item.owner_name })}</Text>
      </View>
      <Text style={styles.points}>
        {item.total_points > 0 ? '+' : ''}{item.total_points}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {groupName ? t('behavior.groupRankings', { group: groupName }) : t('behavior.rankings')}
        </Text>
        {date && <Text style={styles.date}>{date}</Text>}
      </View>

      {rankings.length === 0 ? (
        <Text style={styles.emptyState}>
          {loading ? t('common.loading') : t('behavior.noRankingsYet')}
        </Text>
      ) : (
        <FlatList
          data={rankings}
          renderItem={renderRankingItem}
          keyExtractor={(item) => item.pet_id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default GroupRankings;