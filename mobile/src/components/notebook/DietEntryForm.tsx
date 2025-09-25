import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation, useAppDispatch, useAppSelector } from '@/hooks';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import {
  DietEntry,
  NotebookEntryType,
  createNotebookEntry,
  updateNotebookEntry,
  clearError,
} from '@store/slices/notebookSlice';
import { ErrorMessage } from '@components/ui/ErrorMessage';

interface DietEntryFormProps {
  petId: string;
  existingEntry?: DietEntry;
  onSubmit?: (entry: DietEntry) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export const DietEntryForm: React.FC<DietEntryFormProps> = ({
  petId,
  existingEntry,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { isCreating, isUpdating, operationError } = useAppSelector((state) => state.notebook);

  const [formData, setFormData] = useState({
    title: existingEntry?.title || '',
    description: existingEntry?.description || '',
    date: existingEntry?.date || new Date().toISOString().split('T')[0],
    foodBrand: existingEntry?.foodBrand || '',
    foodType: existingEntry?.foodType || '',
    quantity: existingEntry?.quantity?.toString() || '',
    unit: existingEntry?.unit || 'g',
    calories: existingEntry?.calories?.toString() || '',
    notes: existingEntry?.notes || '',
    mealTime: existingEntry?.mealTime || 'breakfast' as const,
    ingredients: existingEntry?.ingredients || [''],
    allergies: existingEntry?.allergies || [''],
    tags: existingEntry?.tags || [''],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContent: {
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    column: {
      flex: 1,
    },
    listContainer: {
      gap: theme.spacing.sm,
    },
    listItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    listItemInput: {
      flex: 1,
    },
    removeButton: {
      padding: theme.spacing.xs,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
      marginTop: theme.spacing.sm,
    },
    addButtonText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary,
      marginLeft: theme.spacing.xs,
    },
    mealTimeContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      flexWrap: 'wrap',
    },
    mealTimeOption: {
      flex: 1,
      minWidth: 80,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
    },
    mealTimeOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    mealTimeOptionText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeight.medium,
      textAlign: 'center',
    },
    mealTimeOptionTextActive: {
      color: theme.colors.primary,
    },
    unitContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    unitOption: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background.secondary,
    },
    unitOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    unitOptionText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    unitOptionTextActive: {
      color: theme.colors.primary,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    errorContainer: {
      marginBottom: theme.spacing.md,
    },
    nutritionCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    nutritionTitle: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
  });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('validation.required', { field: t('notebook.diet.title') });
    }

    if (!formData.date) {
      newErrors.date = t('validation.required', { field: t('notebook.diet.date') });
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = t('validation.required', { field: t('notebook.diet.quantity') });
    } else if (isNaN(Number(formData.quantity))) {
      newErrors.quantity = t('notebook.diet.validation.quantityMustBeNumber');
    } else if (Number(formData.quantity) <= 0) {
      newErrors.quantity = t('notebook.diet.validation.quantityMustBePositive');
    }

    if (formData.calories.trim() && isNaN(Number(formData.calories))) {
      newErrors.calories = t('notebook.diet.validation.caloriesMustBeNumber');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Filter out empty values
      const validIngredients = formData.ingredients.filter(i => i.trim());
      const validAllergies = formData.allergies.filter(a => a.trim());
      const validTags = formData.tags.filter(t => t.trim());

      const entryData: Partial<DietEntry> = {
        type: NotebookEntryType.DIET,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date,
        foodBrand: formData.foodBrand.trim() || undefined,
        foodType: formData.foodType.trim() || undefined,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        calories: formData.calories.trim() ? Number(formData.calories) : undefined,
        ingredients: validIngredients.length > 0 ? validIngredients : undefined,
        allergies: validAllergies.length > 0 ? validAllergies : undefined,
        notes: formData.notes.trim() || undefined,
        mealTime: formData.mealTime,
        tags: validTags.length > 0 ? validTags : undefined,
      };

      let result;
      if (isEditing && existingEntry) {
        result = await dispatch(updateNotebookEntry({
          entryId: existingEntry.id,
          data: entryData,
        })).unwrap();
      } else {
        result = await dispatch(createNotebookEntry({
          petId,
          type: NotebookEntryType.DIET,
          data: entryData,
        })).unwrap();
      }

      if (onSubmit) {
        onSubmit(result as DietEntry);
      }

      Alert.alert(
        t('notebook.success.title'),
        isEditing
          ? t('notebook.success.entryUpdated')
          : t('notebook.success.entryCreated')
      );
    } catch (error) {
      // Error handled by reducer
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = (field: 'ingredients' | 'allergies' | 'tags') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeItem = (field: 'ingredients' | 'allergies' | 'tags', index: number) => {
    const newItems = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newItems });
  };

  const updateItem = (field: 'ingredients' | 'allergies' | 'tags', index: number, value: string) => {
    const newItems = [...formData[field]];
    newItems[index] = value;
    setFormData({ ...formData, [field]: newItems });
  };

  const mealTimeOptions = [
    { value: 'breakfast', label: t('notebook.diet.mealTime.breakfast') },
    { value: 'lunch', label: t('notebook.diet.mealTime.lunch') },
    { value: 'dinner', label: t('notebook.diet.mealTime.dinner') },
    { value: 'snack', label: t('notebook.diet.mealTime.snack') },
  ];

  const unitOptions = [
    { value: 'g', label: 'g' },
    { value: 'kg', label: 'kg' },
    { value: 'ml', label: 'ml' },
    { value: 'l', label: 'l' },
    { value: 'cups', label: t('notebook.diet.units.cups') },
    { value: 'pieces', label: t('notebook.diet.units.pieces') },
  ];

  const renderListSection = (
    title: string,
    field: 'ingredients' | 'allergies' | 'tags',
    placeholder: string,
    addButtonText: string
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.listContainer}>
        {formData[field].map((item, index) => (
          <View key={index} style={styles.listItemRow}>
            <Input
              style={styles.listItemInput}
              value={item}
              onChangeText={(text) => updateItem(field, index, text)}
              placeholder={placeholder}
            />
            {formData[field].length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(field, index)}
              >
                <X size={20} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={() => addItem(field)}>
          <Plus size={16} color={theme.colors.primary} />
          <Text style={styles.addButtonText}>{addButtonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        {operationError && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={operationError} />
          </View>
        )}

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.diet.basicInfo')}</Text>

          <Input
            label={t('notebook.diet.title')}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            error={errors.title}
            placeholder={t('notebook.diet.titlePlaceholder')}
            required
          />

          <Input
            label={t('notebook.diet.description')}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder={t('notebook.diet.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
          />

          <Input
            label={t('notebook.diet.date')}
            value={formData.date}
            onChangeText={(text) => setFormData({ ...formData, date: text })}
            error={errors.date}
            placeholder="YYYY-MM-DD"
            required
          />
        </View>

        {/* Meal Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.diet.mealTime.title')}</Text>
          <View style={styles.mealTimeContainer}>
            {mealTimeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.mealTimeOption,
                  formData.mealTime === option.value && styles.mealTimeOptionActive,
                ]}
                onPress={() => setFormData({ ...formData, mealTime: option.value as any })}
              >
                <Text
                  style={[
                    styles.mealTimeOptionText,
                    formData.mealTime === option.value && styles.mealTimeOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Food Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.diet.foodDetails')}</Text>

          <View style={styles.row}>
            <View style={styles.column}>
              <Input
                label={t('notebook.diet.foodBrand')}
                value={formData.foodBrand}
                onChangeText={(text) => setFormData({ ...formData, foodBrand: text })}
                placeholder={t('notebook.diet.foodBrandPlaceholder')}
              />
            </View>
            <View style={styles.column}>
              <Input
                label={t('notebook.diet.foodType')}
                value={formData.foodType}
                onChangeText={(text) => setFormData({ ...formData, foodType: text })}
                placeholder={t('notebook.diet.foodTypePlaceholder')}
              />
            </View>
          </View>
        </View>

        {/* Quantity & Nutrition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.diet.quantityNutrition')}</Text>

          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>{t('notebook.diet.quantityUnit')}</Text>

            <Input
              label={t('notebook.diet.quantity')}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              error={errors.quantity}
              placeholder={t('notebook.diet.quantityPlaceholder')}
              keyboardType="numeric"
              required
            />

            <Text style={styles.sectionTitle}>{t('notebook.diet.unit')}</Text>
            <View style={styles.unitContainer}>
              {unitOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.unitOption,
                    formData.unit === option.value && styles.unitOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, unit: option.value })}
                >
                  <Text
                    style={[
                      styles.unitOptionText,
                      formData.unit === option.value && styles.unitOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label={t('notebook.diet.calories')}
              value={formData.calories}
              onChangeText={(text) => setFormData({ ...formData, calories: text })}
              error={errors.calories}
              placeholder={t('notebook.diet.caloriesPlaceholder')}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Ingredients */}
        {renderListSection(
          t('notebook.diet.ingredients'),
          'ingredients',
          t('notebook.diet.ingredientPlaceholder'),
          t('notebook.diet.addIngredient')
        )}

        {/* Allergies */}
        {renderListSection(
          t('notebook.diet.allergies'),
          'allergies',
          t('notebook.diet.allergyPlaceholder'),
          t('notebook.diet.addAllergy')
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.diet.additionalNotes')}</Text>
          <Input
            label={t('notebook.diet.notes')}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder={t('notebook.diet.notesPlaceholder')}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Tags */}
        {renderListSection(
          t('notebook.common.tags'),
          'tags',
          t('notebook.common.tagPlaceholder'),
          t('notebook.common.addTag')
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          title={t('common.cancel')}
          onPress={onCancel || (() => {})}
          variant="secondary"
          style={{ flex: 1 }}
          disabled={isSubmitting}
        />
        <Button
          title={isEditing ? t('common.save') : t('common.add')}
          onPress={handleSubmit}
          loading={isSubmitting || isCreating || isUpdating}
          disabled={isSubmitting || isCreating || isUpdating}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
};

export default DietEntryForm;