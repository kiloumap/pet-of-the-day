import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Edit3, Trash2, Plus, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation, useAppDispatch } from '@/hooks';
import { Button } from '@components/ui/Button';
import {
  PetPersonalityTrait,
  PersonalityCategory,
  TraitIntensity,
  updatePersonalityTrait,
  removePersonalityTrait,
  clearError,
} from '@store/slices/personalitySlice';

interface PersonalityTraitDisplayProps {
  petId: string;
  traits: PetPersonalityTrait[];
  isLoading?: boolean;
  error?: string | null;
  onAddTrait?: () => void;
  onTraitUpdated?: (trait: PetPersonalityTrait) => void;
  onTraitRemoved?: (traitId: string) => void;
  editable?: boolean;
}

interface TraitCardProps {
  trait: PetPersonalityTrait;
  onEdit?: (trait: PetPersonalityTrait) => void;
  onRemove?: (trait: PetPersonalityTrait) => void;
  editable?: boolean;
}

export const PersonalityTraitDisplay: React.FC<PersonalityTraitDisplayProps> = ({
  petId,
  traits,
  isLoading = false,
  error,
  onAddTrait,
  onTraitUpdated,
  onTraitRemoved,
  editable = true,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [editingTrait, setEditingTrait] = useState<PetPersonalityTrait | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<TraitIntensity>(TraitIntensity.MEDIUM);
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    traitsList: {
      flex: 1,
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
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.relaxed,
      marginBottom: theme.spacing.lg,
    },
    categoryGroup: {
      marginBottom: theme.spacing.lg,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    categoryTitle: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      textTransform: 'capitalize',
    },
    categoryCount: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.tertiary,
      backgroundColor: theme.colors.background.tertiary,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
      marginLeft: theme.spacing.xs,
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '10',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    errorText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.error,
      textAlign: 'center',
    },
    loadingText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      padding: theme.spacing.xl,
    },
  });

  // Group traits by category
  const groupedTraits = traits.reduce((groups, trait) => {
    const category = trait.trait.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(trait);
    return groups;
  }, {} as Record<PersonalityCategory, PetPersonalityTrait[]>);

  const handleEditTrait = (trait: PetPersonalityTrait) => {
    setEditingTrait(trait);
    setSelectedIntensity(trait.intensity);
    setEditNotes(trait.notes || '');
  };

  const handleUpdateTrait = async () => {
    if (!editingTrait) return;

    setIsUpdating(true);
    try {
      await dispatch(updatePersonalityTrait({
        petId,
        traitId: editingTrait.traitId,
        intensity: selectedIntensity,
        notes: editNotes.trim() || undefined,
      })).unwrap();

      const updatedTrait: PetPersonalityTrait = {
        ...editingTrait,
        intensity: selectedIntensity,
        notes: editNotes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      if (onTraitUpdated) {
        onTraitUpdated(updatedTrait);
      }

      setEditingTrait(null);
      Alert.alert(
        t('personality.success.traitUpdated'),
        t('personality.success.traitUpdatedMessage', { traitName: editingTrait.trait.name })
      );
    } catch (error) {
      // Error handled by the reducer
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveTrait = (trait: PetPersonalityTrait) => {
    Alert.alert(
      t('personality.confirmRemove.title'),
      t('personality.confirmRemove.message', { traitName: trait.trait.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removePersonalityTrait({
                petId,
                traitId: trait.traitId,
              })).unwrap();

              if (onTraitRemoved) {
                onTraitRemoved(trait.traitId);
              }

              Alert.alert(
                t('personality.success.traitRemoved'),
                t('personality.success.traitRemovedMessage', { traitName: trait.trait.name })
              );
            } catch (error) {
              // Error handled by the reducer
            }
          },
        },
      ]
    );
  };

  const TraitCard: React.FC<TraitCardProps> = ({ trait, onEdit, onRemove, editable }) => {
    const intensityColors = {
      [TraitIntensity.LOW]: theme.colors.warning,
      [TraitIntensity.MEDIUM]: theme.colors.info,
      [TraitIntensity.HIGH]: theme.colors.success,
    };

    const cardStyles = StyleSheet.create({
      card: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.xs,
      },
      traitName: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        flex: 1,
        marginRight: theme.spacing.sm,
      },
      actionsContainer: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
      },
      actionButton: {
        padding: theme.spacing.xs,
      },
      description: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: theme.typography.lineHeight.relaxed,
        marginBottom: theme.spacing.sm,
      },
      intensityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
      },
      intensityLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.tertiary,
        marginRight: theme.spacing.xs,
      },
      intensityBadge: {
        backgroundColor: intensityColors[trait.intensity],
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
      },
      intensityText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.background.primary,
        fontWeight: theme.typography.fontWeight.medium,
        textTransform: 'capitalize',
      },
      notes: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
        marginTop: theme.spacing.xs,
        paddingTop: theme.spacing.xs,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      },
      updatedAt: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.tertiary,
        textAlign: 'right',
        marginTop: theme.spacing.xs,
      },
    });

    return (
      <View style={cardStyles.card}>
        <View style={cardStyles.cardHeader}>
          <Text style={cardStyles.traitName}>{trait.trait.name}</Text>
          {editable && (
            <View style={cardStyles.actionsContainer}>
              <TouchableOpacity
                style={cardStyles.actionButton}
                onPress={() => onEdit?.(trait)}
                testID={`edit-trait-${trait.traitId}`}
              >
                <Edit3 size={16} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={cardStyles.actionButton}
                onPress={() => onRemove?.(trait)}
                testID={`remove-trait-${trait.traitId}`}
              >
                <Trash2 size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={cardStyles.description}>{trait.trait.description}</Text>

        <View style={cardStyles.intensityContainer}>
          <Text style={cardStyles.intensityLabel}>{t('personality.intensity.title')}:</Text>
          <View style={cardStyles.intensityBadge}>
            <Text style={cardStyles.intensityText}>
              {t(`personality.intensity.${trait.intensity}`)}
            </Text>
          </View>
        </View>

        {trait.notes && <Text style={cardStyles.notes}>{trait.notes}</Text>}

        <Text style={cardStyles.updatedAt}>
          {t('common.addedOn')} {new Date(trait.createdAt).toLocaleDateString()}
          {trait.updatedAt !== trait.createdAt &&
            ` • ${t('common.lastUpdated')} ${new Date(trait.updatedAt).toLocaleDateString()}`
          }
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <AlertCircle size={48} color={theme.colors.text.tertiary} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>{t('personality.noTraits')}</Text>
      <Text style={styles.emptyDescription}>{t('personality.noTraitsDescription')}</Text>
      {editable && onAddTrait && (
        <Button
          title={t('personality.addFirstTrait')}
          onPress={onAddTrait}
          icon={<Plus size={16} color={theme.colors.background.primary} />}
        />
      )}
    </View>
  );

  const renderTraitGroups = () => {
    const categories = Object.keys(groupedTraits) as PersonalityCategory[];

    return (
      <ScrollView style={styles.traitsList} showsVerticalScrollIndicator={false}>
        {categories.map((category) => {
          const categoryTraits = groupedTraits[category];
          return (
            <View key={category} style={styles.categoryGroup}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>
                  {t(`personality.categories.${category}`)}
                </Text>
                <Text style={styles.categoryCount}>{categoryTraits.length}</Text>
              </View>
              {categoryTraits.map((trait) => (
                <TraitCard
                  key={trait.traitId}
                  trait={trait}
                  onEdit={handleEditTrait}
                  onRemove={handleRemoveTrait}
                  editable={editable}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  if (isLoading) {
    return <Text style={styles.loadingText}>{t('common.loading')}</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('personality.title')}</Text>
        {editable && onAddTrait && traits.length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={onAddTrait}>
            <Plus size={20} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontWeight: theme.typography.fontWeight.medium }}>
              {t('common.add')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {traits.length === 0 ? renderEmptyState() : renderTraitGroups()}
    </View>
  );
};

export default PersonalityTraitDisplay;