import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { ArrowLeft, Plus, Filter, Search } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation, useAppDispatch, useAppSelector } from '@/hooks';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import {
  NotebookEntryType,
  fetchPetNotebook,
  clearError,
  clearNotebookError,
  setFilters,
  clearFilters,
  resetPagination,
} from '@store/slices/notebookSlice';

interface NotebookScreenProps {
  navigation: any;
  route: {
    params: {
      petId: string;
      petName: string;
    };
  };
}

interface TabButtonProps {
  type: NotebookEntryType | 'all';
  isActive: boolean;
  onPress: () => void;
  count: number;
}

export const NotebookScreen: React.FC<NotebookScreenProps> = ({
  navigation,
  route,
}) => {
  const { petId, petName } = route.params;
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const {
    notebooks,
    notebooksLoading,
    notebooksError,
    currentFilters,
  } = useAppSelector((state) => state.notebook);

  const [activeTab, setActiveTab] = useState<NotebookEntryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const notebook = notebooks[petId];
  const isLoading = notebooksLoading[petId] || false;
  const error = notebooksError[petId];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.xs,
      marginRight: theme.spacing.md,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    headerSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    actionButton: {
      padding: theme.spacing.sm,
    },
    searchContainer: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    tabsContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    tabsScrollView: {
      flexGrow: 0,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    tabButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    tabButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tabButtonText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    tabButtonTextActive: {
      color: theme.colors.background.primary,
    },
    tabBadge: {
      backgroundColor: theme.colors.background.tertiary,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
      minWidth: 20,
      alignItems: 'center',
    },
    tabBadgeActive: {
      backgroundColor: theme.colors.background.primary + '40',
    },
    tabBadgeText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    tabBadgeTextActive: {
      color: theme.colors.background.primary,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyIcon: {
      marginBottom: theme.spacing.md,
      opacity: 0.6,
    },
    emptyTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.relaxed,
      marginBottom: theme.spacing.lg,
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: theme.spacing.md,
    },
    loadingText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.error,
      textAlign: 'center',
      padding: theme.spacing.xl,
    },
  });

  useEffect(() => {
    // Load notebook when screen mounts
    dispatch(clearError());
    dispatch(clearNotebookError(petId));

    if (!notebook) {
      dispatch(fetchPetNotebook({ petId }));
    }
  }, [dispatch, petId, notebook]);

  useEffect(() => {
    // Update filters when tab or search changes
    dispatch(setFilters({
      petId,
      type: activeTab === 'all' ? undefined : activeTab,
    }));
  }, [dispatch, petId, activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    dispatch(clearError());
    dispatch(clearNotebookError(petId));
    dispatch(resetPagination(petId));

    try {
      await dispatch(fetchPetNotebook({ petId }));
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabPress = (type: NotebookEntryType | 'all') => {
    setActiveTab(type);
  };

  const handleAddEntry = () => {
    navigation.navigate('CreateNotebookEntry', {
      petId,
      petName,
      entryType: activeTab === 'all' ? NotebookEntryType.MEDICAL : activeTab,
    });
  };

  const handleSearchFilter = () => {
    // TODO: Implement search and filter functionality
  };

  // Get filtered entries based on active tab and search
  const getFilteredEntries = () => {
    if (!notebook) return [];

    let entries = notebook.entries;

    // Filter by type
    if (activeTab !== 'all') {
      entries = entries.filter(entry => entry.type === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      entries = entries.filter(entry =>
        entry.title.toLowerCase().includes(query) ||
        entry.description?.toLowerCase().includes(query) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Get entry counts by type
  const getEntryCounts = () => {
    if (!notebook) {
      return {
        all: 0,
        [NotebookEntryType.MEDICAL]: 0,
        [NotebookEntryType.DIET]: 0,
        [NotebookEntryType.HABIT]: 0,
        [NotebookEntryType.COMMAND]: 0,
      };
    }

    const counts = notebook.entries.reduce(
      (acc, entry) => {
        acc.all++;
        acc[entry.type] = (acc[entry.type] || 0) + 1;
        return acc;
      },
      {
        all: 0,
        [NotebookEntryType.MEDICAL]: 0,
        [NotebookEntryType.DIET]: 0,
        [NotebookEntryType.HABIT]: 0,
        [NotebookEntryType.COMMAND]: 0,
      } as Record<string, number>
    );

    return counts;
  };

  const entryCounts = getEntryCounts();
  const filteredEntries = getFilteredEntries();

  const TabButton: React.FC<TabButtonProps> = ({ type, isActive, onPress, count }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {t(`notebook.types.${type}`)}
      </Text>
      {count > 0 && (
        <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
          <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsRow}
      >
        <TabButton
          type="all"
          isActive={activeTab === 'all'}
          onPress={() => handleTabPress('all')}
          count={entryCounts.all}
        />
        <TabButton
          type={NotebookEntryType.MEDICAL}
          isActive={activeTab === NotebookEntryType.MEDICAL}
          onPress={() => handleTabPress(NotebookEntryType.MEDICAL)}
          count={entryCounts[NotebookEntryType.MEDICAL]}
        />
        <TabButton
          type={NotebookEntryType.DIET}
          isActive={activeTab === NotebookEntryType.DIET}
          onPress={() => handleTabPress(NotebookEntryType.DIET)}
          count={entryCounts[NotebookEntryType.DIET]}
        />
        <TabButton
          type={NotebookEntryType.HABIT}
          isActive={activeTab === NotebookEntryType.HABIT}
          onPress={() => handleTabPress(NotebookEntryType.HABIT)}
          count={entryCounts[NotebookEntryType.HABIT]}
        />
        <TabButton
          type={NotebookEntryType.COMMAND}
          isActive={activeTab === NotebookEntryType.COMMAND}
          onPress={() => handleTabPress(NotebookEntryType.COMMAND)}
          count={entryCounts[NotebookEntryType.COMMAND]}
        />
      </ScrollView>
    </View>
  );

  const renderStats = () => {
    if (!notebook || notebook.entries.length === 0) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{notebook.totalCount}</Text>
          <Text style={styles.statLabel}>{t('notebook.stats.totalEntries')}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {new Date(notebook.lastUpdated).toLocaleDateString()}
          </Text>
          <Text style={styles.statLabel}>{t('notebook.stats.lastEntry')}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Object.keys(entryCounts).filter(key => key !== 'all' && entryCounts[key] > 0).length}
          </Text>
          <Text style={styles.statLabel}>{t('notebook.stats.categories')}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Plus size={48} color={theme.colors.text.tertiary} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'all'
          ? t('notebook.empty.noEntries')
          : t('notebook.empty.noEntriesType', { type: t(`notebook.types.${activeTab}`) })
        }
      </Text>
      <Text style={styles.emptyDescription}>
        {t('notebook.empty.description')}
      </Text>
      <Button
        title={t('notebook.addFirstEntry')}
        onPress={handleAddEntry}
        icon={<Plus size={16} color={theme.colors.background.primary} />}
      />
    </View>
  );

  const renderContent = () => {
    if (isLoading && !notebook) {
      return <Text style={styles.loadingText}>{t('common.loading')}</Text>;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    if (filteredEntries.length === 0) {
      return renderEmptyState();
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderStats()}

        {/* TODO: Implement NotebookEntryList component */}
        <Text style={styles.loadingText}>
          {t('notebook.entriesWillAppearHere')} ({filteredEntries.length} entries)
        </Text>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          testID="back-button"
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('notebook.title')}</Text>
          <Text style={styles.headerSubtitle}>{petName}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSearchFilter}
            testID="search-button"
          >
            <Search size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddEntry}
            testID="add-entry-button"
          >
            <Plus size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('notebook.searchEntries')}
          leftIcon={<Search size={16} color={theme.colors.text.tertiary} />}
        />
      </View>

      {renderTabs()}

      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

export default NotebookScreen;