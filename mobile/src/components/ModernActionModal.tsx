import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { X, Award } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from '@/hooks';
import {
  fetchBehaviors,
  createScoreEvent,
  filterBehaviorsBySpecies,
  setBehaviorCategory,
  clearError,
} from '@store/pointsSlice';
import { fetchPets, updatePetPoints } from '@store/petSlice';
import { Pet, Behavior } from '../types/api';
import { useTheme } from '@/theme';

interface ModernActionModalProps {
  visible: boolean;
  pets: Pet[];
  onClose: () => void;
  onSuccess?: () => void;
}

const ModernActionModal: React.FC<ModernActionModalProps> = ({
  visible,
  pets,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const {
    behaviors,
    selectedBehaviorCategory,
    isLoadingBehaviors,
    isCreatingEvent,
    error,
  } = useSelector((state: RootState) => state.points);

  const { groups, joinedGroups } = useSelector((state: RootState) => state.groups);
  const { isLoading: isLoadingPets } = useSelector((state: RootState) => state.pets);

  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [selectedBehavior, setSelectedBehavior] = useState<Behavior | null>(null);


  const behaviorCategories = useMemo(() => {
    let behaviorSource = behaviors;

    if (selectedPet && pets.length > 0) {
      const pet = pets.find(p => p.id === selectedPet);
      if (pet && pet.species) {
        behaviorSource = behaviors.filter(
          behavior => behavior.species === pet.species || behavior.species === 'both'
        );
      }
    }

    const categories = new Set(behaviorSource.map(b => b.category));
    return Array.from(categories);
  }, [behaviors, selectedPet, pets]);

  const categorizedBehaviors = useMemo(() => {
    let filteredBehaviors = behaviors;

    if (selectedPet && pets.length > 0) {
      const pet = pets.find(p => p.id === selectedPet);

      if (pet && pet.species) {
        filteredBehaviors = behaviors.filter(
          behavior => behavior.species === pet.species || behavior.species === 'both'
        );
      }
    }

    if (selectedBehaviorCategory) {
      filteredBehaviors = filteredBehaviors.filter(b => b.category === selectedBehaviorCategory);
    }

    return filteredBehaviors;
  }, [behaviors, selectedPet, pets, selectedBehaviorCategory]);

  useEffect(() => {
    if (visible) {
      dispatch(fetchBehaviors() as any);
      dispatch(fetchPets() as any);
    }
  }, [visible, dispatch]);


  const handleClose = () => {
    setSelectedPet(null);
    setComment('');
    dispatch(setBehaviorCategory(null) as any);
    dispatch(clearError() as any);
    onClose();
  };

  const handleBehaviorPress = async (behavior: Behavior) => {
    if (!selectedPet) {
      Alert.alert(t('errors.error'), t('points.validations.petRequired'));
      return;
    }

    try {
      const relevantGroups: string[] = [];

      groups.forEach(group => {
        relevantGroups.push(group.id);
      });

      joinedGroups.forEach(({ membership }) => {
        if (membership.pet_ids.includes(selectedPet)) {
          relevantGroups.push(membership.group_id);
        }
      });

      const uniqueGroups = [...new Set(relevantGroups)];

      if (uniqueGroups.length === 0) {
        Alert.alert(t('errors.error'), t('points.validations.noGroupsFound'));
        return;
      }

      const eventPromises = uniqueGroups.map(groupId => {
        const eventData = {
          pet_id: selectedPet,
          behavior_id: behavior.id,
          group_id: groupId,
          comment: comment.trim() || undefined,
        };
        return dispatch(createScoreEvent(eventData) as any).unwrap();
      });

      await Promise.all(eventPromises);

      // Update pet points in local state
      dispatch(updatePetPoints({
        petId: selectedPet,
        points: behavior.points
      }));

      Alert.alert(
        t('common.success'),
        t('points.success.actionRecordedInGroups', { count: uniqueGroups.length }),
        [{ text: t('common.ok'), onPress: handleClose }]
      );

      onSuccess?.();
    } catch (error) {
      console.error('Failed to create score event:', error);
    }
  };

  const renderPetSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('points.selectPet')}</Text>
      {isLoadingPets ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>{t('common.loading', 'Chargement des animaux...')}</Text>
        </View>
      ) : pets.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('pets.noPets', 'Aucun animal trouvé')}</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.optionsList}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.optionChip,
                  selectedPet === pet.id && styles.selectedChip,
                ]}
                onPress={() => setSelectedPet(pet.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedPet === pet.id && styles.selectedText,
                  ]}
                >
                  {pet.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );


  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('points.categories.title', 'Catégories')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.optionsList}>
          <TouchableOpacity
            style={[
              styles.optionChip,
              !selectedBehaviorCategory && styles.selectedChip,
            ]}
            onPress={() => dispatch(setBehaviorCategory(null) as any)}
          >
            <Text
              style={[
                styles.optionText,
                !selectedBehaviorCategory && styles.selectedText,
              ]}
            >
              Toutes
            </Text>
          </TouchableOpacity>
          {behaviorCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.optionChip,
                selectedBehaviorCategory === category && styles.selectedChip,
              ]}
              onPress={() => dispatch(setBehaviorCategory(category) as any)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedBehaviorCategory === category && styles.selectedText,
                ]}
              >
                {t(`points.categories.${category}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderBehaviors = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Comportements disponibles ({categorizedBehaviors.length})</Text>
        {isLoadingBehaviors ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : categorizedBehaviors.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Aucun comportement disponible pour cette espèce</Text>
          </View>
        ) : (
          <View style={styles.behaviorsGrid}>
            {categorizedBehaviors.map((behavior) => (
            <TouchableOpacity
              key={behavior.id}
              style={styles.behaviorCard}
              onPress={() => handleBehaviorPress(behavior)}
              disabled={!selectedPet || isCreatingEvent}
            >
              <View style={styles.behaviorHeader}>
                <Text style={styles.behaviorName}>{behavior.name}</Text>
                <View style={[styles.pointsBadge, {backgroundColor: behavior.points > 0 ? theme.colors.status.success : theme.colors.status.error}]}>
                  <Award size={12} color="#f59e0b" />
                  <Text style={[styles.pointsText, {color: theme.colors.reverse}]}>{behavior.points > 0 ? '+' + behavior.points : '' + behavior.points}</Text>
                </View>
              </View>
              {behavior.description && (
                <Text style={styles.behaviorDescription} numberOfLines={2}>
                  {behavior.description}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        )}
    </View>
  );

  const renderCommentInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('points.comment', 'Commentaire (optionnel)')}</Text>
      <TextInput
        style={[styles.commentInput, { borderColor: theme.colors.border, color: theme.colors.text.primary }]}
        value={comment}
        onChangeText={setComment}
        placeholder={t('points.commentPlaceholder', 'Ajouter un commentaire...')}
        placeholderTextColor={theme.colors.text.tertiary}
        multiline
        numberOfLines={3}
        maxLength={200}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('points.recordAction')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderPetSelector()}

          {selectedPet && (
            <>
              {renderCategorySelector()}
              {renderBehaviors()}
              {renderCommentInput()}
            </>
          )}

          {!selectedPet && (
            <View style={styles.placeholder}>
              <Award size={48} color="#d1d5db" />
              <Text style={styles.placeholderText}>
                Sélectionnez un animal pour commencer
              </Text>
            </View>
          )}
        </ScrollView>

        {isCreatingEvent && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Enregistrement...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  optionsList: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    gap: 6,
  },
  selectedChip: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedText: {
    color: '#ffffff',
  },
  behaviorsGrid: {
    gap: 12,
  },
  behaviorCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  behaviorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  behaviorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  behaviorDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
    textAlignVertical: 'top',
    minHeight: 80,
  },
});

export default ModernActionModal;