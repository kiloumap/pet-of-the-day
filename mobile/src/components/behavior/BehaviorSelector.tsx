import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';

import { useTranslation } from '../../hooks';
import { useTheme } from '../../theme';
import { Behavior, BehaviorCategory } from '../../types/behavior';

const { width: screenWidth } = Dimensions.get('window');

interface BehaviorSelectorProps {
  behaviors: Behavior[];
  selectedBehaviorId?: string;
  onBehaviorSelect: (behaviorId: string) => void;
  filterByCategory?: BehaviorCategory;
  showPointValues?: boolean;
  allowMultiSelect?: boolean;
  selectedBehaviorIds?: string[];
}

const BehaviorSelector: React.FC<BehaviorSelectorProps> = ({
  behaviors,
  selectedBehaviorId,
  onBehaviorSelect,
  filterByCategory,
  showPointValues = true,
  allowMultiSelect = false,
  selectedBehaviorIds = [],
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<BehaviorCategory | 'all'>('all');

  // Filter and group behaviors
  const { categories, filteredBehaviors } = useMemo(() => {
    let filtered = behaviors.filter(behavior => behavior.isActive);
    
    if (filterByCategory) {
      filtered = filtered.filter(behavior => behavior.category === filterByCategory);
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(behavior => behavior.category === selectedCategory);
    }

    // Get unique categories
    const categorySet = new Set(behaviors.map(b => b.category));
    const categories = Array.from(categorySet);

    return {
      categories,
      filteredBehaviors: filtered,
    };
  }, [behaviors, filterByCategory, selectedCategory]);

  // Group behaviors by category for display
  const behaviorsByCategory = useMemo(() => {
    const grouped: { [key: string]: Behavior[] } = {};
    
    filteredBehaviors.forEach(behavior => {
      if (!grouped[behavior.category]) {
        grouped[behavior.category] = [];
      }
      grouped[behavior.category].push(behavior);
    });

    // Sort behaviors within each category by point value (positive first, then negative)
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        if (a.pointValue > 0 && b.pointValue <= 0) return -1;
        if (a.pointValue <= 0 && b.pointValue > 0) return 1;
        if (a.pointValue > 0 && b.pointValue > 0) return b.pointValue - a.pointValue;
        if (a.pointValue <= 0 && b.pointValue <= 0) return a.pointValue - b.pointValue;
        return 0;
      });
    });

    return grouped;
  }, [filteredBehaviors]);

  const handleBehaviorPress = (behavior: Behavior) => {
    if (allowMultiSelect) {
      // Handle multi-select logic (if needed in the future)
      return;
    }
    
    if (selectedBehaviorId === behavior.id) {
      // Deselect if already selected
      onBehaviorSelect('');
    } else {
      onBehaviorSelect(behavior.id);
    }
  };

  const getBehaviorIcon = (behavior: Behavior) => {
    return behavior.icon || '🐾';
  };

  const getCategoryDisplayName = (category: BehaviorCategory) => {
    return t(`behavior.categories.${category}`, category);
  };

  const getCategoryColor = (category: BehaviorCategory) => {
    switch (category) {
      case 'potty_training':
        return theme.colors.warning;
      case 'training':
        return theme.colors.info;
      case 'social':
        return theme.colors.success;
      case 'health':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const isSelected = (behaviorId: string) => {
    return allowMultiSelect 
      ? selectedBehaviorIds.includes(behaviorId)
      : selectedBehaviorId === behaviorId;
  };

  const renderBehaviorItem = ({ item: behavior }: { item: Behavior }) => {
    const selected = isSelected(behavior.id);
    const pointValue = behavior.pointValue;
    const isPositive = pointValue > 0;
    const categoryColor = getCategoryColor(behavior.category);

    return (
      <TouchableOpacity
        style={[
          styles.behaviorCard,
          { 
            backgroundColor: selected 
              ? categoryColor + '20' 
              : theme.colors.background.secondary,
            borderColor: selected ? categoryColor : 'transparent',
          }
        ]}
        onPress={() => handleBehaviorPress(behavior)}
        activeOpacity={0.7}
      >
        <View style={styles.behaviorHeader}>
          <Text style={styles.behaviorIcon}>
            {getBehaviorIcon(behavior)}
          </Text>
          {showPointValues && (
            <View style={[
              styles.pointBadge,
              { 
                backgroundColor: isPositive ? theme.colors.success : theme.colors.error,
              }
            ]}>
              <Text style={styles.pointText}>
                {isPositive ? '+' : ''}{pointValue}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[
          styles.behaviorName,
          { color: theme.colors.text.primary }
        ]}>
          {behavior.name}
        </Text>
        
        <Text style={[
          styles.behaviorDescription,
          { color: theme.colors.text.secondary }
        ]}>
          {behavior.description}
        </Text>

        <View style={styles.behaviorFooter}>
          <View style={[
            styles.categoryTag,
            { backgroundColor: categoryColor + '20' }
          ]}>
            <Text style={[
              styles.categoryText,
              { color: categoryColor }
            ]}>
              {getCategoryDisplayName(behavior.category)}
            </Text>
          </View>
          
          {behavior.minIntervalMinutes > 0 && (
            <Text style={[
              styles.intervalText,
              { color: theme.colors.text.tertiary }
            ]}>
              {t('behavior.interval', { 
                minutes: behavior.minIntervalMinutes 
              })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategorySection = (category: BehaviorCategory) => {
    const categoryBehaviors = behaviorsByCategory[category];
    if (!categoryBehaviors || categoryBehaviors.length === 0) return null;

    const categoryColor = getCategoryColor(category);

    return (
      <View key={category} style={styles.categorySection}>
        <View style={[
          styles.categoryHeader,
          { backgroundColor: categoryColor + '10' }
        ]}>
          <Text style={[
            styles.categoryTitle,
            { color: categoryColor }
          ]}>
            {getCategoryDisplayName(category)}
          </Text>
          <Text style={[
            styles.categoryCount,
            { color: theme.colors.text.secondary }
          ]}>
            {categoryBehaviors.length} {t('behavior.behaviors')}
          </Text>
        </View>
        
        <View style={styles.behaviorsGrid}>
          {categoryBehaviors.map((behavior) => (
            <View key={behavior.id} style={styles.behaviorItemWrapper}>
              {renderBehaviorItem({ item: behavior })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    categoryFilters: {
      marginBottom: theme.spacing.md,
    },
    filterScroll: {
      paddingHorizontal: theme.spacing.xs,
    },
    filterButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginHorizontal: theme.spacing.xs,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary + '20',
      borderColor: theme.colors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.secondary,
    },
    filterButtonTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    categorySection: {
      marginBottom: theme.spacing.lg,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: 8,
      marginBottom: theme.spacing.sm,
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    categoryCount: {
      fontSize: 14,
      fontWeight: '500',
    },
    behaviorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
    },
    behaviorItemWrapper: {
      width: screenWidth / 2 - theme.spacing.md - theme.spacing.xs,
      marginHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    behaviorCard: {
      padding: theme.spacing.md,
      borderRadius: 12,
      borderWidth: 2,
      minHeight: 140,
    },
    behaviorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    behaviorIcon: {
      fontSize: 24,
    },
    pointBadge: {
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 30,
      alignItems: 'center',
    },
    pointText: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: '700',
    },
    behaviorName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    behaviorDescription: {
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },
    behaviorFooter: {
      marginTop: theme.spacing.sm,
    },
    categoryTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: 6,
      marginBottom: theme.spacing.xs,
    },
    categoryText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    intervalText: {
      fontSize: 11,
      fontStyle: 'italic',
    },
    emptyState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
    },
  });

  if (filteredBehaviors.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {t('behavior.selector.empty.title')}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          {t('behavior.selector.empty.message')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Filters (only show if not filtering by specific category) */}
      {!filterByCategory && categories.length > 1 && (
        <View style={styles.categoryFilters}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
            data={[{ key: 'all', label: t('behavior.categories.all') }, ...categories.map(cat => ({ key: cat, label: getCategoryDisplayName(cat) }))]}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedCategory === item.key && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedCategory(item.key as BehaviorCategory | 'all')}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedCategory === item.key && styles.filterButtonTextActive,
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Behaviors by Category */}
      <FlatList
        data={Object.keys(behaviorsByCategory)}
        keyExtractor={(category) => category}
        renderItem={({ item: category }) => renderCategorySection(category as BehaviorCategory)}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default BehaviorSelector;
