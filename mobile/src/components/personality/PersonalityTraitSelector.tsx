import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { X, Plus, Search } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation, useAppDispatch, useAppSelector } from '@/hooks';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import {
  PersonalityTrait,
  PersonalityCategory,
  TraitIntensity,
  fetchAvailableTraits,
  addPersonalityTrait,
  clearError
} from '@store/slices/personalitySlice';

interface PersonalityTraitSelectorProps {
  petId: string;
  visible: boolean;
  onClose: () => void;
  onTraitAdded?: (trait: PersonalityTrait, intensity: TraitIntensity, notes?: string) => void;
}

export const PersonalityTraitSelector: React.FC<PersonalityTraitSelectorProps> = ({
  petId,
  visible,
  onClose,
  onTraitAdded,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const {
    availableTraits,
    availableTraitsLoading,
    availableTraitsError,
    profiles,
    isAdding,
    operationError,
  } = useAppSelector((state) => state.personality);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PersonalityCategory | 'all'>('all');
  const [selectedTrait, setSelectedTrait] = useState<PersonalityTrait | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<TraitIntensity>(TraitIntensity.MEDIUM);
  const [notes, setNotes] = useState('');
  const [showTraitDetails, setShowTraitDetails] = useState(false);

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      marginTop: 50,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    searchContainer: {
      marginBottom: theme.spacing.md,
    },
    categoriesContainer: {
      marginBottom: theme.spacing.md,
    },
    categoriesLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    categoriesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    categoryChip: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    categoryChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryChipText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    categoryChipTextActive: {
      color: theme.colors.background.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    traitsContainer: {
      flex: 1,
    },
    traitCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    traitHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    traitName: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
      flex: 1,
    },
    traitCategory: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      backgroundColor: theme.colors.background.tertiary,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
      textTransform: 'capitalize',
    },
    traitDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.lineHeight.relaxed,
      marginBottom: theme.spacing.sm,
    },
    addButton: {
      alignSelf: 'flex-end',
    },
    detailsModal: {
      backgroundColor: theme.colors.background.primary,
      margin: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      maxHeight: '80%',
    },
    detailsTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    intensityContainer: {
      marginBottom: theme.spacing.md,
    },
    intensityLabel: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    intensityOptions: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    intensityOption: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    intensityOptionActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    intensityOptionText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    intensityOptionTextActive: {
      color: theme.colors.background.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    notesContainer: {
      marginBottom: theme.spacing.md,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
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

  // Load available traits when modal opens
  useEffect(() => {
    if (visible && availableTraits.length === 0 && !availableTraitsLoading) {
      dispatch(fetchAvailableTraits());
    }
  }, [visible, availableTraits.length, availableTraitsLoading, dispatch]);

  // Clear errors when modal opens
  useEffect(() => {
    if (visible) {
      dispatch(clearError());
    }
  }, [visible, dispatch]);

  // Filter traits based on search and category
  const filteredTraits = availableTraits.filter(trait => {
    const matchesSearch = trait.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trait.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || trait.category === selectedCategory;

    // Check if trait is already added to the pet
    const petProfile = profiles[petId];
    const alreadyAdded = petProfile?.traits.some(petTrait => petTrait.traitId === trait.id);

    return matchesSearch && matchesCategory && !alreadyAdded;
  });

  const categories = [
    { key: 'all', label: t('personality.categories.all') },
    { key: PersonalityCategory.ENERGY, label: t('personality.categories.energy') },
    { key: PersonalityCategory.SOCIABILITY, label: t('personality.categories.sociability') },
    { key: PersonalityCategory.TRAINING, label: t('personality.categories.training') },
    { key: PersonalityCategory.BEHAVIOR, label: t('personality.categories.behavior') },
    { key: PersonalityCategory.CARE, label: t('personality.categories.care') },
  ];

  const intensityOptions = [
    { value: TraitIntensity.LOW, label: t('personality.intensity.low') },
    { value: TraitIntensity.MEDIUM, label: t('personality.intensity.medium') },
    { value: TraitIntensity.HIGH, label: t('personality.intensity.high') },
  ];

  const handleTraitSelect = (trait: PersonalityTrait) => {
    setSelectedTrait(trait);
    setSelectedIntensity(TraitIntensity.MEDIUM);
    setNotes('');
    setShowTraitDetails(true);
  };

  const handleAddTrait = async () => {
    if (!selectedTrait) return;

    try {
      await dispatch(addPersonalityTrait({
        petId,
        traitId: selectedTrait.id,
        intensity: selectedIntensity,
        notes: notes.trim() || undefined,
      })).unwrap();

      // Call callback if provided
      if (onTraitAdded) {
        onTraitAdded(selectedTrait, selectedIntensity, notes.trim() || undefined);
      }

      // Close modals and reset state
      setShowTraitDetails(false);
      setSelectedTrait(null);
      setNotes('');

      Alert.alert(
        t('personality.success.traitAdded'),
        t('personality.success.traitAddedMessage', { traitName: selectedTrait.name })
      );
    } catch (error) {
      // Error is handled by the reducer
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTrait(null);
    setNotes('');
    setShowTraitDetails(false);
    onClose();
  };

  const renderTraitCard = (trait: PersonalityTrait) => (
    <View key={trait.id} style={styles.traitCard}>
      <View style={styles.traitHeader}>
        <Text style={styles.traitName}>{trait.name}</Text>
        <Text style={styles.traitCategory}>{t(`personality.categories.${trait.category}`)}</Text>
      </View>
      <Text style={styles.traitDescription}>{trait.description}</Text>
      <Button
        title={t('common.add')}
        onPress={() => handleTraitSelect(trait)}
        variant="secondary"
        size="small"
        style={styles.addButton}
        disabled={isAdding}
      />
    </View>
  );

  const renderContent = () => {
    if (availableTraitsLoading) {
      return <Text style={styles.loadingText}>{t('common.loading')}</Text>;
    }

    if (availableTraitsError) {
      return <Text style={styles.errorText}>{availableTraitsError}</Text>;
    }

    if (filteredTraits.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedCategory !== 'all'
              ? t('personality.noTraitsFound')
              : t('personality.allTraitsAdded')
            }
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.traitsContainer} showsVerticalScrollIndicator={false}>
        {filteredTraits.map(renderTraitCard)}
      </ScrollView>
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('personality.addTrait')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                testID="close-button"
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.searchContainer}>
                <Input
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('personality.searchTraits')}
                  leftIcon={<Search size={16} color={theme.colors.text.tertiary} />}
                />
              </View>

              <View style={styles.categoriesContainer}>
                <Text style={styles.categoriesLabel}>{t('personality.categories.title')}</Text>
                <View style={styles.categoriesRow}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryChip,
                        selectedCategory === category.key && styles.categoryChipActive,
                      ]}
                      onPress={() => setSelectedCategory(category.key as PersonalityCategory | 'all')}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategory === category.key && styles.categoryChipTextActive,
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {renderContent()}
            </View>
          </View>
        </View>
      </Modal>

      {/* Trait Details Modal */}
      <Modal visible={showTraitDetails} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.detailsModal}>
            <Text style={styles.detailsTitle}>{selectedTrait?.name}</Text>

            <View style={styles.intensityContainer}>
              <Text style={styles.intensityLabel}>{t('personality.intensity.title')}</Text>
              <View style={styles.intensityOptions}>
                {intensityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.intensityOption,
                      selectedIntensity === option.value && styles.intensityOptionActive,
                    ]}
                    onPress={() => setSelectedIntensity(option.value)}
                  >
                    <Text
                      style={[
                        styles.intensityOptionText,
                        selectedIntensity === option.value && styles.intensityOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.notesContainer}>
              <Input
                value={notes}
                onChangeText={setNotes}
                label={t('personality.notes')}
                placeholder={t('personality.notesPlaceholder')}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {operationError && (
              <Text style={styles.errorText}>{operationError}</Text>
            )}

            <View style={styles.buttonsContainer}>
              <Button
                title={t('common.cancel')}
                onPress={() => setShowTraitDetails(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title={t('common.add')}
                onPress={handleAddTrait}
                loading={isAdding}
                disabled={isAdding}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default PersonalityTraitSelector;