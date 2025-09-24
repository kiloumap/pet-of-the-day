import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckSquare, Square, Clock, Target, Award, MapPin } from 'lucide-react-native';

import { Text } from '../ui/Text';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme';
import { CommandEntry, NotebookEntryType } from '../../store/slices/notebookSlice';

interface CommandEntryFormProps {
  petId: string;
  initialEntry?: Partial<CommandEntry>;
  onSubmit: (entry: Omit<CommandEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CommandEntryForm: React.FC<CommandEntryFormProps> = ({
  petId,
  initialEntry,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    title: initialEntry?.title || '',
    description: initialEntry?.description || '',
    date: initialEntry?.date || new Date().toISOString().split('T')[0],
    command: initialEntry?.command || '',
    success: initialEntry?.success ?? false,
    attempts: initialEntry?.attempts || 1,
    duration: initialEntry?.duration?.toString() || '',
    trainingMethod: initialEntry?.trainingMethod || '',
    reward: initialEntry?.reward || '',
    difficulty: initialEntry?.difficulty || 'medium' as 'easy' | 'medium' | 'hard',
    environment: initialEntry?.environment || '',
    notes: initialEntry?.notes || '',
    tags: initialEntry?.tags || [],
  });

  const [newTag, setNewTag] = useState('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing.md,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    rowLabel: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text.primary,
      marginRight: theme.spacing.md,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    checkboxText: {
      marginLeft: theme.spacing.sm,
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
    },
    optionButtonSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    optionButtonUnselected: {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border,
    },
    optionText: {
      marginLeft: theme.spacing.xs,
      fontSize: 14,
      fontWeight: '500',
    },
    optionTextSelected: {
      color: theme.colors.white,
    },
    optionTextUnselected: {
      color: theme.colors.text.primary,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
    },
    tag: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    tagText: {
      color: theme.colors.white,
      fontSize: 12,
    },
    tagInput: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    tagInputField: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    addTagButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.lg,
    },
    button: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    halfWidth: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
  });

  const difficultyOptions = [
    { value: 'easy', label: t('notebook.command.difficulty.easy'), icon: <Target size={16} />, color: theme.colors.success },
    { value: 'medium', label: t('notebook.command.difficulty.medium'), icon: <Target size={16} />, color: theme.colors.warning },
    { value: 'hard', label: t('notebook.command.difficulty.hard'), icon: <Target size={16} />, color: theme.colors.error },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSuccess = () => {
    handleInputChange('success', !formData.success);
  };

  const handleDifficultySelect = (difficulty: 'easy' | 'medium' | 'hard') => {
    handleInputChange('difficulty', difficulty);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert(t('common.error'), t('validation.required', { field: t('notebook.command.title') }));
      return false;
    }

    if (!formData.command.trim()) {
      Alert.alert(t('common.error'), t('validation.required', { field: t('notebook.command.command') }));
      return false;
    }

    if (formData.attempts < 1) {
      Alert.alert(t('common.error'), t('notebook.command.validation.attemptsMustBePositive'));
      return false;
    }

    if (formData.duration && (isNaN(Number(formData.duration)) || Number(formData.duration) < 0)) {
      Alert.alert(t('common.error'), t('notebook.command.validation.durationMustBeNumber'));
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const entryData: Omit<CommandEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      type: NotebookEntryType.COMMAND,
      petId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: formData.date,
      command: formData.command.trim(),
      success: formData.success,
      attempts: formData.attempts,
      duration: formData.duration ? Number(formData.duration) : undefined,
      trainingMethod: formData.trainingMethod.trim() || undefined,
      reward: formData.reward.trim() || undefined,
      difficulty: formData.difficulty,
      environment: formData.environment.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    };

    onSubmit(entryData);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.command.basicInfo')}</Text>

          <Input
            label={t('notebook.command.title')}
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder={t('notebook.command.titlePlaceholder')}
            required
          />

          <Input
            label={t('notebook.command.description')}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder={t('notebook.command.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
          />

          <Input
            label={t('notebook.command.date')}
            value={formData.date}
            onChangeText={(value) => handleInputChange('date', value)}
            placeholder="YYYY-MM-DD"
            keyboardType="default"
          />
        </View>

        {/* Command Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.command.commandDetails')}</Text>

          <Input
            label={t('notebook.command.command')}
            value={formData.command}
            onChangeText={(value) => handleInputChange('command', value)}
            placeholder={t('notebook.command.commandPlaceholder')}
            required
          />

          <View style={styles.checkboxContainer}>
            <Button
              variant="ghost"
              size="sm"
              onPress={toggleSuccess}
              style={{ padding: 0 }}
            >
              {formData.success ? (
                <CheckSquare size={24} color={theme.colors.success} />
              ) : (
                <Square size={24} color={theme.colors.text.secondary} />
              )}
            </Button>
            <Text style={styles.checkboxText}>{t('notebook.command.success')}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label={t('notebook.command.attempts')}
                value={formData.attempts.toString()}
                onChangeText={(value) => handleInputChange('attempts', parseInt(value) || 1)}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <Input
                label={t('notebook.command.duration')}
                value={formData.duration}
                onChangeText={(value) => handleInputChange('duration', value)}
                placeholder={t('notebook.command.durationPlaceholder')}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Training Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.command.trainingDetails')}</Text>

          <Input
            label={t('notebook.command.trainingMethod')}
            value={formData.trainingMethod}
            onChangeText={(value) => handleInputChange('trainingMethod', value)}
            placeholder={t('notebook.command.trainingMethodPlaceholder')}
          />

          <Input
            label={t('notebook.command.reward')}
            value={formData.reward}
            onChangeText={(value) => handleInputChange('reward', value)}
            placeholder={t('notebook.command.rewardPlaceholder')}
          />

          <Text style={[styles.rowLabel, { marginBottom: theme.spacing.sm }]}>
            {t('notebook.command.difficulty.title')}
          </Text>
          <View style={styles.optionsRow}>
            {difficultyOptions.map((option) => {
              const isSelected = formData.difficulty === option.value;
              return (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  onPress={() => handleDifficultySelect(option.value as 'easy' | 'medium' | 'hard')}
                  style={[
                    styles.optionButton,
                    isSelected ? styles.optionButtonSelected : styles.optionButtonUnselected,
                  ]}
                >
                  {React.cloneElement(option.icon, {
                    color: isSelected ? theme.colors.white : option.color,
                  })}
                  <Text style={[
                    styles.optionText,
                    isSelected ? styles.optionTextSelected : styles.optionTextUnselected,
                  ]}>
                    {option.label}
                  </Text>
                </Button>
              );
            })}
          </View>

          <Input
            label={t('notebook.command.environment')}
            value={formData.environment}
            onChangeText={(value) => handleInputChange('environment', value)}
            placeholder={t('notebook.command.environmentPlaceholder')}
          />
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.command.additionalNotes')}</Text>

          <Input
            label={t('notebook.command.notes')}
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            placeholder={t('notebook.command.notesPlaceholder')}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.rowLabel}>{t('notebook.common.tags')}</Text>
          <View style={styles.tagInput}>
            <Input
              style={styles.tagInputField}
              value={newTag}
              onChangeText={setNewTag}
              placeholder={t('notebook.common.tagPlaceholder')}
            />
            <Button
              variant="outline"
              size="sm"
              onPress={addTag}
              style={styles.addTagButton}
            >
              {t('notebook.common.addTag')}
            </Button>
          </View>

          {formData.tags.length > 0 && (
            <View style={styles.tagContainer}>
              {formData.tags.map((tag, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onPress={() => removeTag(tag)}
                  style={styles.tag}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </Button>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Button
          variant="outline"
          onPress={onCancel}
          style={styles.button}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>

        <Button
          variant="primary"
          onPress={handleSubmit}
          style={styles.button}
          loading={isLoading}
        >
          {t('common.save')}
        </Button>
      </View>
    </View>
  );
};