import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation, useAppDispatch, useAppSelector } from '@/hooks';
import { PersonalityTraitDisplay } from '@components/personality/PersonalityTraitDisplay';
import { PersonalityTraitSelector } from '@components/personality/PersonalityTraitSelector';
import {
  fetchPetPersonalityProfile,
  fetchAvailableTraits,
  clearError,
  clearProfileError,
  PetPersonalityTrait,
} from '@store/slices/personalitySlice';
import { ErrorMessage } from '@components/ui/ErrorMessage';

interface PersonalityManagementScreenProps {
  navigation: any;
  route: {
    params: {
      petId: string;
      petName: string;
    };
  };
}

export const PersonalityManagementScreen: React.FC<PersonalityManagementScreenProps> = ({
  navigation,
  route,
}) => {
  const { petId, petName } = route.params;
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const {
    profiles,
    profilesLoading,
    profilesError,
    availableTraits,
    availableTraitsLoading,
    operationError,
  } = useAppSelector((state) => state.personality);

  const [showTraitSelector, setShowTraitSelector] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const profile = profiles[petId];
  const isLoading = profilesLoading[petId] || false;
  const error = profilesError[petId] || operationError;

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
    addButton: {
      padding: theme.spacing.sm,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    errorContainer: {
      marginBottom: theme.spacing.md,
    },
    loadingText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      padding: theme.spacing.xl,
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
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
    personalityContent: {
      flex: 1,
    },
    lastUpdated: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
      padding: theme.spacing.sm,
    },
  });

  useEffect(() => {
    // Load personality profile and available traits when screen mounts
    dispatch(clearError());
    dispatch(clearProfileError(petId));

    if (!profile) {
      dispatch(fetchPetPersonalityProfile(petId));
    }

    if (availableTraits.length === 0 && !availableTraitsLoading) {
      dispatch(fetchAvailableTraits());
    }
  }, [dispatch, petId, profile, availableTraits.length, availableTraitsLoading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    dispatch(clearError());
    dispatch(clearProfileError(petId));

    try {
      await Promise.all([
        dispatch(fetchPetPersonalityProfile(petId)),
        dispatch(fetchAvailableTraits()),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddTrait = () => {
    setShowTraitSelector(true);
  };

  const handleTraitAdded = (trait: any, intensity: any, notes?: string) => {
    // The trait will be automatically added to the profile by the reducer
    // This callback is mainly for UI feedback
  };

  const handleTraitUpdated = (trait: PetPersonalityTrait) => {
    // The trait will be automatically updated in the profile by the reducer
    // This callback is mainly for UI feedback
  };

  const handleTraitRemoved = (traitId: string) => {
    // The trait will be automatically removed from the profile by the reducer
    // This callback is mainly for UI feedback
  };

  const renderStats = () => {
    if (!profile) return null;

    const traits = profile.traits;
    const totalTraits = traits.length;

    // Count traits by category
    const categoryCount = traits.reduce((count, trait) => {
      const category = trait.trait.category;
      count[category] = (count[category] || 0) + 1;
      return count;
    }, {} as Record<string, number>);

    const mostCommonCategory = Object.entries(categoryCount).reduce(
      (max, [category, count]) => (count > max.count ? { category, count } : max),
      { category: '', count: 0 }
    );

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalTraits}</Text>
          <Text style={styles.statLabel}>{t('personality.stats.totalTraits')}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Object.keys(categoryCount).length}</Text>
          <Text style={styles.statLabel}>{t('personality.stats.categories')}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {mostCommonCategory.category
              ? t(`personality.categories.${mostCommonCategory.category}`)
              : '-'
            }
          </Text>
          <Text style={styles.statLabel}>{t('personality.stats.dominantCategory')}</Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading && !profile) {
      return <Text style={styles.loadingText}>{t('common.loading')}</Text>;
    }

    return (
      <ScrollView
        style={styles.personalityContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderStats()}

        <PersonalityTraitDisplay
          petId={petId}
          traits={profile?.traits || []}
          isLoading={isLoading}
          error={error}
          onAddTrait={handleAddTrait}
          onTraitUpdated={handleTraitUpdated}
          onTraitRemoved={handleTraitRemoved}
          editable={true}
        />

        {profile && (
          <Text style={styles.lastUpdated}>
            {t('common.lastUpdated')}: {new Date(profile.lastUpdated).toLocaleString()}
          </Text>
        )}
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
          <Text style={styles.headerTitle}>{t('personality.title')}</Text>
          <Text style={styles.headerSubtitle}>{petName}</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddTrait}
          testID="add-trait-button"
        >
          <Plus size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={error} />
          </View>
        )}

        {renderContent()}
      </View>

      <PersonalityTraitSelector
        petId={petId}
        visible={showTraitSelector}
        onClose={() => setShowTraitSelector(false)}
        onTraitAdded={handleTraitAdded}
      />
    </SafeAreaView>
  );
};

export default PersonalityManagementScreen;