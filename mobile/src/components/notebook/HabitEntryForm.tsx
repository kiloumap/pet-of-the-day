import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { X, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation, useAppDispatch, useAppSelector } from '@/hooks';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import {
  HabitEntry,
  NotebookEntryType,
  createNotebookEntry,
  updateNotebookEntry,
  clearError,
} from '@store/slices/notebookSlice';
import { ErrorMessage } from '@components/ui/ErrorMessage';

interface HabitEntryFormProps {
  petId: string;
  existingEntry?: HabitEntry;
  onSubmit?: (entry: HabitEntry) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export const HabitEntryForm: React.FC<HabitEntryFormProps> = ({
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
    behaviorType: existingEntry?.behaviorType || 'neutral' as const,
    frequency: existingEntry?.frequency || 'daily' as const,
    location: existingEntry?.location || '',
    context: existingEntry?.context || '',
    improvement: existingEntry?.improvement ?? false,
    severity: existingEntry?.severity || 'medium' as const,
    triggers: existingEntry?.triggers || [''],
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
    behaviorTypeContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    behaviorTypeOption: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
    },
    behaviorTypeOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    behaviorTypeIcon: {
      marginBottom: theme.spacing.xs,
    },
    behaviorTypeText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeight.medium,
      textAlign: 'center',
    },
    behaviorTypeTextActive: {
      color: theme.colors.primary,
    },
    frequencyContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      flexWrap: 'wrap',
    },
    frequencyOption: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background.secondary,
      minWidth: 80,
      alignItems: 'center',
    },
    frequencyOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    frequencyOptionText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    frequencyOptionTextActive: {
      color: theme.colors.primary,
    },
    severityContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    severityOption: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
    },
    severityOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    severityOptionText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    severityOptionTextActive: {
      color: theme.colors.primary,
    },
    improvementContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    improvementToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background.secondary,
    },
    improvementToggleActive: {
      borderColor: theme.colors.success,
      backgroundColor: theme.colors.success + '20',
    },
    improvementText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    improvementTextActive: {
      color: theme.colors.success,
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
    contextCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    contextTitle: {
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
      newErrors.title = t('validation.required', { field: t('notebook.habit.title') });
    }

    if (!formData.date) {
      newErrors.date = t('validation.required', { field: t('notebook.habit.date') });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Filter out empty values
      const validTriggers = formData.triggers.filter(t => t.trim());
      const validTags = formData.tags.filter(t => t.trim());

      const entryData: Partial<HabitEntry> = {
        type: NotebookEntryType.HABIT,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date,
        behaviorType: formData.behaviorType,
        frequency: formData.frequency,
        triggers: validTriggers.length > 0 ? validTriggers : undefined,
        location: formData.location.trim() || undefined,
        context: formData.context.trim() || undefined,
        improvement: formData.improvement,
        severity: formData.severity,
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
          type: NotebookEntryType.HABIT,
          data: entryData,
        })).unwrap();
      }

      if (onSubmit) {
        onSubmit(result as HabitEntry);
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

  const addItem = (field: 'triggers' | 'tags') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeItem = (field: 'triggers' | 'tags', index: number) => {
    const newItems = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newItems });
  };

  const updateItem = (field: 'triggers' | 'tags', index: number, value: string) => {
    const newItems = [...formData[field]];
    newItems[index] = value;
    setFormData({ ...formData, [field]: newItems });
  };

  const behaviorTypeOptions = [
    {
      value: 'positive',
      label: t('notebook.habit.behaviorType.positive'),
      icon: <TrendingUp size={24} color={formData.behaviorType === 'positive' ? theme.colors.success : theme.colors.text.tertiary} />,
      color: theme.colors.success,
    },
    {
      value: 'neutral',
      label: t('notebook.habit.behaviorType.neutral'),
      icon: <Minus size={24} color={formData.behaviorType === 'neutral' ? theme.colors.info : theme.colors.text.tertiary} />,
      color: theme.colors.info,
    },
    {
      value: 'negative',
      label: t('notebook.habit.behaviorType.negative'),
      icon: <TrendingDown size={24} color={formData.behaviorType === 'negative' ? theme.colors.error : theme.colors.text.tertiary} />,
      color: theme.colors.error,
    },
  ];

  const frequencyOptions = [
    { value: 'daily', label: t('notebook.habit.frequency.daily') },
    { value: 'weekly', label: t('notebook.habit.frequency.weekly') },
    { value: 'monthly', label: t('notebook.habit.frequency.monthly') },
    { value: 'rarely', label: t('notebook.habit.frequency.rarely') },
  ];

  const severityOptions = [
    { value: 'low', label: t('notebook.habit.severity.low') },
    { value: 'medium', label: t('notebook.habit.severity.medium') },
    { value: 'high', label: t('notebook.habit.severity.high') },
  ];

  const renderListSection = (
    title: string,
    field: 'triggers' | 'tags',
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
          <Text style={styles.sectionTitle}>{t('notebook.habit.basicInfo')}</Text>

          <Input
            label={t('notebook.habit.title')}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            error={errors.title}
            placeholder={t('notebook.habit.titlePlaceholder')}
            required
          />

          <Input
            label={t('notebook.habit.description')}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder={t('notebook.habit.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
          />

          <Input
            label={t('notebook.habit.date')}
            value={formData.date}
            onChangeText={(text) => setFormData({ ...formData, date: text })}
            error={errors.date}
            placeholder="YYYY-MM-DD"
            required
          />
        </View>

        {/* Behavior Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.habit.behaviorType.title')}</Text>
          <View style={styles.behaviorTypeContainer}>
            {behaviorTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.behaviorTypeOption,
                  formData.behaviorType === option.value && styles.behaviorTypeOptionActive,
                ]}
                onPress={() => setFormData({ ...formData, behaviorType: option.value as any })}
              >
                <View style={styles.behaviorTypeIcon}>
                  {option.icon}
                </View>
                <Text
                  style={[
                    styles.behaviorTypeText,
                    formData.behaviorType === option.value && styles.behaviorTypeTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.habit.frequency.title')}</Text>
          <View style={styles.frequencyContainer}>
            {frequencyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.frequencyOption,
                  formData.frequency === option.value && styles.frequencyOptionActive,
                ]}
                onPress={() => setFormData({ ...formData, frequency: option.value as any })}
              >
                <Text
                  style={[
                    styles.frequencyOptionText,
                    formData.frequency === option.value && styles.frequencyOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Context Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.habit.contextInfo')}</Text>

          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>{t('notebook.habit.environmentContext')}</Text>

            <Input
              label={t('notebook.habit.location')}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder={t('notebook.habit.locationPlaceholder')}
            />

            <Input
              label={t('notebook.habit.context')}
              value={formData.context}
              onChangeText={(text) => setFormData({ ...formData, context: text })}
              placeholder={t('notebook.habit.contextPlaceholder')}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Triggers */}
        {renderListSection(
          t('notebook.habit.triggers'),
          'triggers',
          t('notebook.habit.triggerPlaceholder'),
          t('notebook.habit.addTrigger')
        )}

        {/* Severity (for negative behaviors) */}
        {(formData.behaviorType === 'negative' || formData.behaviorType === 'neutral') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('notebook.habit.severity.title')}</Text>
            <View style={styles.severityContainer}>
              {severityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.severityOption,
                    formData.severity === option.value && styles.severityOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, severity: option.value as any })}
                >
                  <Text
                    style={[
                      styles.severityOptionText,
                      formData.severity === option.value && styles.severityOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Improvement Indicator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.habit.progress')}</Text>
          <View style={styles.improvementContainer}>
            <TouchableOpacity
              style={[
                styles.improvementToggle,
                formData.improvement && styles.improvementToggleActive,
              ]}
              onPress={() => setFormData({ ...formData, improvement: !formData.improvement })}
            >
              <TrendingUp
                size={20}
                color={formData.improvement ? theme.colors.success : theme.colors.text.tertiary}
              />
              <Text
                style={[
                  styles.improvementText,
                  formData.improvement && styles.improvementTextActive,
                ]}
              >
                {t('notebook.habit.showingImprovement')}
              </Text>
            </TouchableOpacity>
          </View>
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

export default HabitEntryForm;