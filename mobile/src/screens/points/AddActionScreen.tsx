import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme/ThemeContext';
import {
  fetchBehaviors,
  createScoreEvent,
  clearError,
  filterBehaviorsBySpecies,
  setBehaviorCategory,
} from '../../store/pointsSlice';
import { Behavior, CreateScoreEventRequest } from '../../types/api';
import Dropdown from '../../components/ui/Dropdown';

type AddActionScreenRouteProp = RouteProp<{ AddAction: { groupId: string; petId?: string } }, 'AddAction'>;

const AddActionScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<AddActionScreenRouteProp>();
  const dispatch = useAppDispatch();

  const { groupId, petId: routePetId } = route.params;

  const {
    behaviors,
    availableBehaviors,
    isLoadingBehaviors,
    isCreatingEvent,
    error,
    selectedBehaviorCategory,
  } = useAppSelector((state) => state.points);

  const { pets } = useAppSelector((state) => state.pets);

  const [selectedPetId, setSelectedPetId] = useState<string>(routePetId || '');
  const [selectedBehaviorId, setSelectedBehaviorId] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [actionDate, setActionDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [errors, setErrors] = useState<{
    pet?: string;
    behavior?: string;
    comment?: string;
  }>({});

  useEffect(() => {
    dispatch(fetchBehaviors());
  }, [dispatch]);

  useEffect(() => {
    if (selectedPetId && pets.length > 0) {
      const selectedPet = pets.find(pet => pet.id === selectedPetId);
      if (selectedPet) {
        dispatch(filterBehaviorsBySpecies(selectedPet.species as 'dog' | 'cat'));
      }
    }
  }, [selectedPetId, pets, dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error.message);
      dispatch(clearError());
    }
  }, [error, dispatch, t]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!selectedPetId) {
      newErrors.pet = t('points.validations.petRequired');
    }

    if (!selectedBehaviorId) {
      newErrors.behavior = t('points.validations.behaviorRequired');
    }

    if (comment.length > 255) {
      newErrors.comment = t('points.validations.commentTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const requestData: CreateScoreEventRequest = {
        pet_id: selectedPetId,
        behavior_id: selectedBehaviorId,
        group_id: groupId,
        comment: comment.trim() || undefined,
        action_date: actionDate,
      };

      await dispatch(createScoreEvent(requestData)).unwrap();

      Alert.alert(
        t('common.success'),
        t('points.success.actionRecorded'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      // Error handling is done through Redux and useEffect
    }
  };

  const selectedBehavior = behaviors.find(b => b.id === selectedBehaviorId);
  const selectedPet = pets.find(p => p.id === selectedPetId);

  const petOptions = pets.map(pet => ({
    label: pet.name,
    value: pet.id,
    icon: pet.species === 'dog' ? 'pets' : 'pets',
  }));

  const categories = Array.from(new Set(availableBehaviors.map(b => b.category)));
  const filteredBehaviors = selectedBehaviorCategory
    ? availableBehaviors.filter(b => b.category === selectedBehaviorCategory)
    : availableBehaviors;

  const getBehaviorIcon = (category: string) => {
    switch (category) {
      case 'hygiene': return 'clean-hands';
      case 'play': return 'sports-tennis';
      case 'training': return 'school';
      case 'socialization': return 'group';
      case 'care': return 'healing';
      case 'behavior': return 'psychology';
      default: return 'star';
    }
  };

  const getPointsColor = (points: number) => {
    return points > 0 ? theme.colors.success : theme.colors.error;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 12,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text.primary,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      marginTop: 4,
    },
    categoryFilters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    categoryChip: {
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    categoryChipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryChipText: {
      fontSize: 14,
      color: theme.colors.text.primary,
    },
    categoryChipTextSelected: {
      color: theme.colors.text.inverse,
    },
    behaviorsList: {
      gap: 8,
    },
    behaviorCard: {
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    behaviorCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    behaviorIcon: {
      width: 40,
      height: 40,
      backgroundColor: theme.colors.background.tertiary,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    behaviorInfo: {
      flex: 1,
    },
    behaviorName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    behaviorDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    behaviorPoints: {
      fontSize: 16,
      fontWeight: 'bold',
      alignItems: 'center',
    },
    summaryCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 'auto',
      marginBottom: 20,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.text.tertiary,
    },
    submitButtonText: {
      color: theme.colors.text.inverse,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('points.addAction')}</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('points.selectPet')}</Text>
              <Dropdown
                options={petOptions}
                selectedValue={selectedPetId}
                onSelect={setSelectedPetId}
                placeholder={t('points.selectPet')}
                error={errors.pet}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('points.actionDate')}</Text>
              <TextInput
                style={[styles.input, errors.behavior && styles.inputError]}
                value={actionDate}
                onChangeText={setActionDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('points.selectBehavior')}</Text>

            <View style={styles.categoryFilters}>
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  !selectedBehaviorCategory && styles.categoryChipSelected,
                ]}
                onPress={() => dispatch(setBehaviorCategory(null))}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    !selectedBehaviorCategory && styles.categoryChipTextSelected,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedBehaviorCategory === category && styles.categoryChipSelected,
                  ]}
                  onPress={() => dispatch(setBehaviorCategory(category))}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedBehaviorCategory === category && styles.categoryChipTextSelected,
                    ]}
                  >
                    {t(`points.categories.${category}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.behaviorsList}>
              {filteredBehaviors.map((behavior) => (
                <TouchableOpacity
                  key={behavior.id}
                  style={[
                    styles.behaviorCard,
                    selectedBehaviorId === behavior.id && styles.behaviorCardSelected,
                  ]}
                  onPress={() => setSelectedBehaviorId(behavior.id)}
                >
                  <View style={styles.behaviorIcon}>
                    <MaterialIcons
                      name={getBehaviorIcon(behavior.category)}
                      size={20}
                      color={theme.colors.text.secondary}
                    />
                  </View>
                  <View style={styles.behaviorInfo}>
                    <Text style={styles.behaviorName}>{behavior.name}</Text>
                    {behavior.description && (
                      <Text style={styles.behaviorDescription}>{behavior.description}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.behaviorPoints,
                      { color: getPointsColor(behavior.points) }
                    ]}
                  >
                    {behavior.points > 0 ? '+' : ''}{behavior.points} {t('common.points')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.behavior && (
              <Text style={styles.errorText}>{errors.behavior}</Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('points.addComment')}</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.comment && styles.inputError]}
                value={comment}
                onChangeText={setComment}
                placeholder="Optional comment about this action..."
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                textAlignVertical="top"
                maxLength={255}
              />
              {errors.comment && (
                <Text style={styles.errorText}>{errors.comment}</Text>
              )}
            </View>
          </View>

          {selectedPet && selectedBehavior && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pet:</Text>
                <Text style={styles.summaryValue}>{selectedPet.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Action:</Text>
                <Text style={styles.summaryValue}>{selectedBehavior.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Points:</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: getPointsColor(selectedBehavior.points) }
                  ]}
                >
                  {selectedBehavior.points > 0 ? '+' : ''}{selectedBehavior.points}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>{actionDate}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={{ padding: 16 }}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isCreatingEvent || !selectedPetId || !selectedBehaviorId) &&
              styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isCreatingEvent || !selectedPetId || !selectedBehaviorId}
          >
            <Text style={styles.submitButtonText}>
              {isCreatingEvent ? t('common.loading') : t('points.recordAction')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddActionScreen;