import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plus, Search, Filter, Calendar, User, FileText, Heart, Zap, Target, MoreVertical, Edit, Trash2 } from 'lucide-react-native';

import { Text } from '../ui/Text';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme';
import { NotebookEntry, NotebookEntryType } from '../../store/slices/notebookSlice';

interface NotebookEntryListProps {
  entries: NotebookEntry[];
  selectedType: NotebookEntryType | 'all';
  onTypeFilter: (type: NotebookEntryType | 'all') => void;
  onAddEntry: (type: NotebookEntryType) => void;
  onEditEntry: (entry: NotebookEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  isLoading?: boolean;
}

export const NotebookEntryList: React.FC<NotebookEntryListProps> = ({
  entries,
  selectedType,
  onTypeFilter,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchInput: {
      marginBottom: theme.spacing.md,
    },
    filterRow: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
    },
    filterButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      marginRight: theme.spacing.sm,
      borderWidth: 1,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterButtonInactive: {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '500',
    },
    filterTextActive: {
      color: theme.colors.white,
    },
    filterTextInactive: {
      color: theme.colors.text.primary,
    },
    addButtonRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.background.secondary,
    },
    addButtonText: {
      marginLeft: theme.spacing.xs,
      fontSize: 12,
      color: theme.colors.text.primary,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: theme.spacing.md,
    },
    entryCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginVertical: theme.spacing.sm,
      borderLeftWidth: 4,
    },
    entryCardMedical: {
      borderLeftColor: theme.colors.error,
    },
    entryCardDiet: {
      borderLeftColor: theme.colors.success,
    },
    entryCardHabit: {
      borderLeftColor: theme.colors.warning,
    },
    entryCardCommand: {
      borderLeftColor: theme.colors.info,
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    entryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      flex: 1,
      marginRight: theme.spacing.md,
    },
    entryMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    entryType: {
      fontSize: 12,
      fontWeight: '500',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      marginRight: theme.spacing.sm,
    },
    entryTypeMedical: {
      backgroundColor: theme.colors.error + '20',
      color: theme.colors.error,
    },
    entryTypeDiet: {
      backgroundColor: theme.colors.success + '20',
      color: theme.colors.success,
    },
    entryTypeHabit: {
      backgroundColor: theme.colors.warning + '20',
      color: theme.colors.warning,
    },
    entryTypeCommand: {
      backgroundColor: theme.colors.info + '20',
      color: theme.colors.info,
    },
    entryDate: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginLeft: theme.spacing.sm,
    },
    entryDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      lineHeight: 20,
      marginBottom: theme.spacing.sm,
    },
    entryDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    entryDetail: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    entryDetailText: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginLeft: theme.spacing.xs,
    },
    entryTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
    },
    tag: {
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    tagText: {
      fontSize: 10,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    actionsMenu: {
      position: 'absolute',
      right: 0,
      top: 30,
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
      zIndex: 1000,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minWidth: 120,
    },
    actionButtonText: {
      marginLeft: theme.spacing.sm,
      fontSize: 14,
      color: theme.colors.text.primary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyStateDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const typeIcons = {
    [NotebookEntryType.MEDICAL]: Heart,
    [NotebookEntryType.DIET]: Zap,
    [NotebookEntryType.HABIT]: FileText,
    [NotebookEntryType.COMMAND]: Target,
  };

  const typeColors = {
    [NotebookEntryType.MEDICAL]: theme.colors.error,
    [NotebookEntryType.DIET]: theme.colors.success,
    [NotebookEntryType.HABIT]: theme.colors.warning,
    [NotebookEntryType.COMMAND]: theme.colors.info,
  };

  const filteredEntries = useMemo(() => {
    let filtered = entries;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(entry => entry.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(query) ||
        entry.description?.toLowerCase().includes(query) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, selectedType, searchQuery]);

  const typeFilters = [
    { key: 'all' as const, label: t('notebook.types.all') },
    { key: NotebookEntryType.MEDICAL, label: t('notebook.types.medical') },
    { key: NotebookEntryType.DIET, label: t('notebook.types.diet') },
    { key: NotebookEntryType.HABIT, label: t('notebook.types.habit') },
    { key: NotebookEntryType.COMMAND, label: t('notebook.types.command') },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getEntryCardStyle = (type: NotebookEntryType) => {
    switch (type) {
      case NotebookEntryType.MEDICAL:
        return [styles.entryCard, styles.entryCardMedical];
      case NotebookEntryType.DIET:
        return [styles.entryCard, styles.entryCardDiet];
      case NotebookEntryType.HABIT:
        return [styles.entryCard, styles.entryCardHabit];
      case NotebookEntryType.COMMAND:
        return [styles.entryCard, styles.entryCardCommand];
      default:
        return styles.entryCard;
    }
  };

  const getEntryTypeStyle = (type: NotebookEntryType) => {
    switch (type) {
      case NotebookEntryType.MEDICAL:
        return [styles.entryType, styles.entryTypeMedical];
      case NotebookEntryType.DIET:
        return [styles.entryType, styles.entryTypeDiet];
      case NotebookEntryType.HABIT:
        return [styles.entryType, styles.entryTypeHabit];
      case NotebookEntryType.COMMAND:
        return [styles.entryType, styles.entryTypeCommand];
      default:
        return styles.entryType;
    }
  };

  const handleDeleteEntry = (entryId: string, title: string) => {
    Alert.alert(
      t('common.delete'),
      t('Are you sure you want to delete "{{title}}"? This action cannot be undone.', { title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => onDeleteEntry(entryId),
        },
      ]
    );
  };

  const renderEntry = ({ item: entry }: { item: NotebookEntry }) => {
    const IconComponent = typeIcons[entry.type];

    return (
      <View style={getEntryCardStyle(entry.type)}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTitle}>{entry.title}</Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setShowActions(showActions === entry.id ? null : entry.id)}
            style={{ padding: theme.spacing.xs }}
          >
            <MoreVertical size={16} color={theme.colors.text.secondary} />
          </Button>

          {showActions === entry.id && (
            <View style={styles.actionsMenu}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  setShowActions(null);
                  onEditEntry(entry);
                }}
                style={styles.actionButton}
              >
                <Edit size={14} color={theme.colors.text.primary} />
                <Text style={styles.actionButtonText}>{t('common.edit')}</Text>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  setShowActions(null);
                  handleDeleteEntry(entry.id, entry.title);
                }}
                style={styles.actionButton}
              >
                <Trash2 size={14} color={theme.colors.error} />
                <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                  {t('common.delete')}
                </Text>
              </Button>
            </View>
          )}
        </View>

        <View style={styles.entryMeta}>
          <View style={getEntryTypeStyle(entry.type)}>
            <Text style={[styles.entryType, getEntryTypeStyle(entry.type)]}>
              {t(`notebook.types.${entry.type}`)}
            </Text>
          </View>
          <IconComponent size={12} color={theme.colors.text.secondary} />
          <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
        </View>

        {entry.description && (
          <Text style={styles.entryDescription} numberOfLines={2}>
            {entry.description}
          </Text>
        )}

        <View style={styles.entryDetails}>
          {entry.type === NotebookEntryType.MEDICAL && (
            <>
              {entry.vetName && (
                <View style={styles.entryDetail}>
                  <User size={12} color={theme.colors.text.secondary} />
                  <Text style={styles.entryDetailText}>{entry.vetName}</Text>
                </View>
              )}
              {entry.severity && (
                <View style={styles.entryDetail}>
                  <Text style={[styles.entryDetailText, { fontWeight: '500' }]}>
                    {t(`notebook.medical.severity.${entry.severity}`)}
                  </Text>
                </View>
              )}
            </>
          )}

          {entry.type === NotebookEntryType.DIET && (
            <>
              {entry.mealTime && (
                <View style={styles.entryDetail}>
                  <Text style={styles.entryDetailText}>
                    {t(`notebook.diet.mealTime.${entry.mealTime}`)}
                  </Text>
                </View>
              )}
              {entry.calories && (
                <View style={styles.entryDetail}>
                  <Text style={styles.entryDetailText}>{entry.calories} cal</Text>
                </View>
              )}
            </>
          )}

          {entry.type === NotebookEntryType.HABIT && (
            <>
              {entry.behaviorType && (
                <View style={styles.entryDetail}>
                  <Text style={styles.entryDetailText}>
                    {t(`notebook.habit.behaviorType.${entry.behaviorType}`)}
                  </Text>
                </View>
              )}
              {entry.frequency && (
                <View style={styles.entryDetail}>
                  <Text style={styles.entryDetailText}>
                    {t(`notebook.habit.frequency.${entry.frequency}`)}
                  </Text>
                </View>
              )}
            </>
          )}

          {entry.type === NotebookEntryType.COMMAND && (
            <>
              <View style={styles.entryDetail}>
                <Text style={styles.entryDetailText}>
                  {entry.command}
                </Text>
              </View>
              <View style={styles.entryDetail}>
                <Text style={[
                  styles.entryDetailText,
                  { color: entry.success ? theme.colors.success : theme.colors.error }
                ]}>
                  {entry.success ? '✓' : '✗'} {entry.attempts} attempts
                </Text>
              </View>
            </>
          )}
        </View>

        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.entryTags}>
            {entry.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FileText size={48} color={theme.colors.text.secondary} />
      <Text style={styles.emptyStateTitle}>
        {selectedType === 'all'
          ? t('notebook.empty.noEntries')
          : t('notebook.empty.noEntriesType', { type: t(`notebook.types.${selectedType}`) })
        }
      </Text>
      <Text style={styles.emptyStateDescription}>
        {t('notebook.empty.description')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with search and filters */}
      <View style={styles.header}>
        <Input
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('notebook.searchEntries')}
          leftIcon={<Search size={16} color={theme.colors.text.secondary} />}
        />

        <View style={styles.filterRow}>
          {typeFilters.map((filter) => {
            const isActive = filter.key === selectedType;
            return (
              <Button
                key={filter.key}
                variant="ghost"
                size="sm"
                onPress={() => onTypeFilter(filter.key)}
                style={[
                  styles.filterButton,
                  isActive ? styles.filterButtonActive : styles.filterButtonInactive,
                ]}
              >
                <Text style={[
                  styles.filterText,
                  isActive ? styles.filterTextActive : styles.filterTextInactive,
                ]}>
                  {filter.label}
                </Text>
              </Button>
            );
          })}
        </View>
      </View>

      {/* Quick add buttons */}
      <View style={styles.addButtonRow}>
        {Object.values(NotebookEntryType).map((type) => {
          const IconComponent = typeIcons[type];
          return (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              onPress={() => onAddEntry(type)}
              style={styles.addButton}
            >
              <IconComponent size={16} color={typeColors[type]} />
              <Text style={[styles.addButtonText, { color: typeColors[type] }]}>
                {t(`notebook.types.${type}`)}
              </Text>
            </Button>
          );
        })}
      </View>

      {/* Entry list */}
      {filteredEntries.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={filteredEntries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={() => {
            // Handle refresh if needed
          }}
        />
      )}
    </View>
  );
};