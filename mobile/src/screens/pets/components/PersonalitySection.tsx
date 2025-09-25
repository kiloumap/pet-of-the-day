import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Plus, X, Edit3, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

interface PersonalityTrait {
  id: string;
  name: string;
  description?: string;
  category: 'temperament' | 'behavior' | 'preference' | 'skill';
  createdAt: string;
}

interface PersonalitySectionProps {
  petId: string;
  traits: PersonalityTrait[];
  onAddTrait: (trait: Omit<PersonalityTrait, 'id' | 'createdAt'>) => Promise<void>;
  onEditTrait: (traitId: string, trait: Omit<PersonalityTrait, 'id' | 'createdAt'>) => Promise<void>;
  onRemoveTrait: (traitId: string) => Promise<void>;
  isLoading?: boolean;
  canEdit?: boolean;
}

export const PersonalitySection: React.FC<PersonalitySectionProps> = ({
  petId,
  traits,
  onAddTrait,
  onEditTrait,
  onRemoveTrait,
  isLoading = false,
  canEdit = true,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isAddingTrait, setIsAddingTrait] = useState(false);
  const [editingTraitId, setEditingTraitId] = useState<string | null>(null);
  const [traitName, setTraitName] = useState('');
  const [traitDescription, setTraitDescription] = useState('');
  const [traitCategory, setTraitCategory] = useState<PersonalityTrait['category']>('temperament');
  const [nameError, setNameError] = useState('');

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing['2xl'],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.styles.h3,
      color: theme.colors.text.primary,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.sm,
    },
    addButtonText: {
      color: theme.colors.white,
      marginLeft: theme.spacing.xs,
      fontSize: 14,
      fontWeight: '500',
    },
    traitForm: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    formTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    categorySelector: {
      marginBottom: theme.spacing.md,
    },
    categoryLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    categoryOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    categoryOption: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background.primary,
    },
    categoryOptionActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryOptionText: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    categoryOptionTextActive: {
      color: theme.colors.white,
      fontWeight: '500',
    },
    formActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'flex-end',
      marginTop: theme.spacing.md,
    },
    cancelButton: {
      backgroundColor: theme.colors.background.primary,
      borderColor: theme.colors.border,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    traitsList: {
      maxHeight: 400,
    },
    categoryGroup: {
      marginBottom: theme.spacing.lg,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
    },
    traitItem: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    traitContent: {
      flex: 1,
    },
    traitName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    traitDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      lineHeight: 18,
    },
    traitActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    actionButton: {
      padding: theme.spacing.xs,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });

  const categoryOptions: { value: PersonalityTrait['category']; label: string }[] = [
    { value: 'temperament', label: t('pets.personality.temperament') },
    { value: 'behavior', label: t('pets.personality.behavior') },
    { value: 'preference', label: t('pets.personality.preference') },
    { value: 'skill', label: t('pets.personality.skill') },
  ];

  const handleSaveTrait = async () => {
    const name = traitName.trim();

    if (!name) {
      setNameError(t('pets.validations.traitNameRequired'));
      return;
    }

    const trait = {
      name,
      description: traitDescription.trim() || undefined,
      category: traitCategory,
    };

    try {
      if (editingTraitId) {
        await onEditTrait(editingTraitId, trait);
      } else {
        await onAddTrait(trait);
      }
      resetForm();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        editingTraitId
          ? t('pets.personality.editError')
          : t('pets.personality.addError')
      );
    }
  };

  const handleRemoveTrait = (trait: PersonalityTrait) => {
    Alert.alert(
      t('pets.removeTrait'),
      t('pets.personality.removeConfirm', { name: trait.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemoveTrait(trait.id);
            } catch (error) {
              Alert.alert(t('common.error'), t('pets.personality.removeError'));
            }
          },
        },
      ]
    );
  };

  const startEditTrait = (trait: PersonalityTrait) => {
    setEditingTraitId(trait.id);
    setTraitName(trait.name);
    setTraitDescription(trait.description || '');
    setTraitCategory(trait.category);
    setIsAddingTrait(false);
  };

  const resetForm = () => {
    setIsAddingTrait(false);
    setEditingTraitId(null);
    setTraitName('');
    setTraitDescription('');
    setTraitCategory('temperament');
    setNameError('');
  };

  const groupTraitsByCategory = () => {
    const grouped = traits.reduce((acc, trait) => {
      if (!acc[trait.category]) {
        acc[trait.category] = [];
      }
      acc[trait.category].push(trait);
      return acc;
    }, {} as Record<PersonalityTrait['category'], PersonalityTrait[]>);

    return Object.entries(grouped);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('pets.personalitySection')}</Text>
        {canEdit && !isAddingTrait && !editingTraitId && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddingTrait(true)}
            testID="add-trait-button"
          >
            <Plus size={16} color={theme.colors.white} />
            <Text style={styles.addButtonText}>{t('pets.addTrait')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {(isAddingTrait || editingTraitId) && (
        <View style={styles.traitForm}>
          <Text style={styles.formTitle}>
            {editingTraitId ? t('pets.editTrait') : t('pets.addTrait')}
          </Text>

          <Input
            value={traitName}
            onChangeText={(text) => {
              setTraitName(text);
              if (nameError) setNameError('');
            }}
            placeholder={t('pets.traitName')}
            error={nameError}
            testID="trait-name-input"
          />

          <Input
            value={traitDescription}
            onChangeText={setTraitDescription}
            placeholder={t('pets.traitDescription')}
            multiline
            numberOfLines={2}
            testID="trait-description-input"
          />

          <View style={styles.categorySelector}>
            <Text style={styles.categoryLabel}>
              {t('pets.personality.category')}
            </Text>
            <View style={styles.categoryOptions}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.categoryOption,
                    traitCategory === option.value && styles.categoryOptionActive,
                  ]}
                  onPress={() => setTraitCategory(option.value)}
                  testID={`category-${option.value}`}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      traitCategory === option.value &&
                        styles.categoryOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formActions}>
            <Button
              title={t('common.cancel')}
              onPress={resetForm}
              style={styles.cancelButton}
              variant="outline"
            />
            <Button
              title={t('common.save')}
              onPress={handleSaveTrait}
              style={styles.saveButton}
              loading={isLoading}
              testID="save-trait-button"
            />
          </View>
        </View>
      )}

      {traits.length === 0 ? (
        <View style={styles.emptyState} testID="personality-empty-state">
          <Text style={styles.emptyText}>{t('pets.personality.empty')}</Text>
          <Text style={styles.emptySubtext}>
            {t('pets.personality.emptyDescription')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.traitsList} nestedScrollEnabled testID="trait-list">
          {groupTraitsByCategory().map(([category, categoryTraits]) => (
            <View key={category} style={styles.categoryGroup}>
              <Text style={styles.categoryTitle}>
                {categoryOptions.find(opt => opt.value === category)?.label}
              </Text>
              {categoryTraits.map((trait) => (
                <View key={trait.id} style={styles.traitItem}>
                  <View style={styles.traitContent}>
                    <Text style={styles.traitName}>{trait.name}</Text>
                    {trait.description && (
                      <Text style={styles.traitDescription}>
                        {trait.description}
                      </Text>
                    )}
                  </View>
                  {canEdit && (
                    <View style={styles.traitActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => startEditTrait(trait)}
                        testID={`edit-trait-${trait.id}`}
                      >
                        <Edit3 size={16} color={theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleRemoveTrait(trait)}
                        testID={`remove-trait-${trait.id}`}
                      >
                        <Trash2 size={16} color={theme.colors.status.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};