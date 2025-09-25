import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { X, Plus, Calendar, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation, useAppDispatch, useAppSelector } from '@/hooks';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Dropdown, DropdownOption } from '@components/ui/Dropdown';
import {
  MedicalEntry,
  NotebookEntryType,
  createNotebookEntry,
  updateNotebookEntry,
  clearError,
} from '@store/slices/notebookSlice';
import { ErrorMessage } from '@components/ui/ErrorMessage';

interface MedicalEntryFormProps {
  petId: string;
  existingEntry?: MedicalEntry;
  onSubmit?: (entry: MedicalEntry) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
}

export const MedicalEntryForm: React.FC<MedicalEntryFormProps> = ({
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
    vetName: existingEntry?.vetName || '',
    symptoms: existingEntry?.symptoms || [''],
    diagnosis: existingEntry?.diagnosis || '',
    treatment: existingEntry?.treatment || '',
    nextAppointment: existingEntry?.nextAppointment || '',
    severity: existingEntry?.severity || 'low' as const,
    status: existingEntry?.status || 'ongoing' as const,
    tags: existingEntry?.tags || [''],
  });

  const [medications, setMedications] = useState<Medication[]>(
    existingEntry?.medications || [
      { name: '', dosage: '', frequency: '', startDate: '', endDate: '' }
    ]
  );

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
    symptomsContainer: {
      gap: theme.spacing.sm,
    },
    symptomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    symptomInput: {
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
    medicationCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    medicationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    medicationTitle: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
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
    statusContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    statusOption: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
    },
    statusOptionActive: {
      borderColor: theme.colors.success,
      backgroundColor: theme.colors.success + '20',
    },
    statusOptionText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    statusOptionTextActive: {
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
  });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('validation.required', { field: t('notebook.medical.title') });
    }

    if (!formData.date) {
      newErrors.date = t('validation.required', { field: t('notebook.medical.date') });
    }

    // Validate symptoms - at least one non-empty
    const validSymptoms = formData.symptoms.filter(s => s.trim());
    if (validSymptoms.length === 0) {
      newErrors.symptoms = t('notebook.medical.validation.symptomsRequired');
    }

    // Validate medications if any are partially filled
    medications.forEach((med, index) => {
      if (med.name.trim() || med.dosage.trim() || med.frequency.trim()) {
        if (!med.name.trim()) {
          newErrors[`medication_${index}_name`] = t('validation.required', {
            field: t('notebook.medical.medicationName')
          });
        }
        if (!med.dosage.trim()) {
          newErrors[`medication_${index}_dosage`] = t('validation.required', {
            field: t('notebook.medical.dosage')
          });
        }
        if (!med.frequency.trim()) {
          newErrors[`medication_${index}_frequency`] = t('validation.required', {
            field: t('notebook.medical.frequency')
          });
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Filter out empty values
      const validSymptoms = formData.symptoms.filter(s => s.trim());
      const validTags = formData.tags.filter(t => t.trim());
      const validMedications = medications.filter(m =>
        m.name.trim() && m.dosage.trim() && m.frequency.trim()
      );

      const entryData: Partial<MedicalEntry> = {
        type: NotebookEntryType.MEDICAL,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date,
        vetName: formData.vetName.trim() || undefined,
        symptoms: validSymptoms,
        diagnosis: formData.diagnosis.trim() || undefined,
        treatment: formData.treatment.trim() || undefined,
        medications: validMedications,
        nextAppointment: formData.nextAppointment || undefined,
        severity: formData.severity,
        status: formData.status,
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
          type: NotebookEntryType.MEDICAL,
          data: entryData,
        })).unwrap();
      }

      if (onSubmit) {
        onSubmit(result as MedicalEntry);
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

  const addSymptom = () => {
    setFormData({ ...formData, symptoms: [...formData.symptoms, ''] });
  };

  const removeSymptom = (index: number) => {
    const newSymptoms = formData.symptoms.filter((_, i) => i !== index);
    setFormData({ ...formData, symptoms: newSymptoms });
  };

  const updateSymptom = (index: number, value: string) => {
    const newSymptoms = [...formData.symptoms];
    newSymptoms[index] = value;
    setFormData({ ...formData, symptoms: newSymptoms });
  };

  const addTag = () => {
    setFormData({ ...formData, tags: [...formData.tags, ''] });
  };

  const removeTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({ ...formData, tags: newTags });
  };

  const updateTag = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData({ ...formData, tags: newTags });
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', startDate: '', endDate: '' }]);
  };

  const removeMedication = (index: number) => {
    const newMedications = medications.filter((_, i) => i !== index);
    setMedications(newMedications);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const newMedications = [...medications];
    newMedications[index] = { ...newMedications[index], [field]: value };
    setMedications(newMedications);
  };

  const severityOptions = [
    { value: 'low', label: t('notebook.medical.severity.low'), color: theme.colors.success },
    { value: 'medium', label: t('notebook.medical.severity.medium'), color: theme.colors.warning },
    { value: 'high', label: t('notebook.medical.severity.high'), color: theme.colors.error },
  ];

  const statusOptions = [
    { value: 'ongoing', label: t('notebook.medical.status.ongoing') },
    { value: 'resolved', label: t('notebook.medical.status.resolved') },
    { value: 'monitoring', label: t('notebook.medical.status.monitoring') },
  ];

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
          <Text style={styles.sectionTitle}>{t('notebook.medical.basicInfo')}</Text>

          <Input
            label={t('notebook.medical.title')}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            error={errors.title}
            placeholder={t('notebook.medical.titlePlaceholder')}
            required
          />

          <Input
            label={t('notebook.medical.description')}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder={t('notebook.medical.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
          />

          <View style={styles.row}>
            <View style={styles.column}>
              <Input
                label={t('notebook.medical.date')}
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                error={errors.date}
                placeholder="YYYY-MM-DD"
                required
              />
            </View>
            <View style={styles.column}>
              <Input
                label={t('notebook.medical.vetName')}
                value={formData.vetName}
                onChangeText={(text) => setFormData({ ...formData, vetName: text })}
                placeholder={t('notebook.medical.vetNamePlaceholder')}
              />
            </View>
          </View>
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.medical.symptoms')}</Text>

          <View style={styles.symptomsContainer}>
            {formData.symptoms.map((symptom, index) => (
              <View key={index} style={styles.symptomRow}>
                <Input
                  style={styles.symptomInput}
                  value={symptom}
                  onChangeText={(text) => updateSymptom(index, text)}
                  placeholder={t('notebook.medical.symptomPlaceholder')}
                  error={index === 0 ? errors.symptoms : undefined}
                />
                {formData.symptoms.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeSymptom(index)}
                  >
                    <X size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addSymptom}>
              <Plus size={16} color={theme.colors.primary} />
              <Text style={styles.addButtonText}>{t('notebook.medical.addSymptom')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Diagnosis & Treatment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.medical.diagnosisTreatment')}</Text>

          <Input
            label={t('notebook.medical.diagnosis')}
            value={formData.diagnosis}
            onChangeText={(text) => setFormData({ ...formData, diagnosis: text })}
            placeholder={t('notebook.medical.diagnosisPlaceholder')}
            multiline
            numberOfLines={3}
          />

          <Input
            label={t('notebook.medical.treatment')}
            value={formData.treatment}
            onChangeText={(text) => setFormData({ ...formData, treatment: text })}
            placeholder={t('notebook.medical.treatmentPlaceholder')}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.medical.medications')}</Text>

          {medications.map((medication, index) => (
            <View key={index} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <Text style={styles.medicationTitle}>
                  {t('notebook.medical.medication')} {index + 1}
                </Text>
                {medications.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeMedication(index)}
                    style={styles.removeButton}
                  >
                    <X size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <Input
                label={t('notebook.medical.medicationName')}
                value={medication.name}
                onChangeText={(text) => updateMedication(index, 'name', text)}
                placeholder={t('notebook.medical.medicationNamePlaceholder')}
                error={errors[`medication_${index}_name`]}
              />

              <View style={styles.row}>
                <View style={styles.column}>
                  <Input
                    label={t('notebook.medical.dosage')}
                    value={medication.dosage}
                    onChangeText={(text) => updateMedication(index, 'dosage', text)}
                    placeholder={t('notebook.medical.dosagePlaceholder')}
                    error={errors[`medication_${index}_dosage`]}
                  />
                </View>
                <View style={styles.column}>
                  <Input
                    label={t('notebook.medical.frequency')}
                    value={medication.frequency}
                    onChangeText={(text) => updateMedication(index, 'frequency', text)}
                    placeholder={t('notebook.medical.frequencyPlaceholder')}
                    error={errors[`medication_${index}_frequency`]}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.column}>
                  <Input
                    label={t('notebook.medical.startDate')}
                    value={medication.startDate}
                    onChangeText={(text) => updateMedication(index, 'startDate', text)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={styles.column}>
                  <Input
                    label={t('notebook.medical.endDate')}
                    value={medication.endDate || ''}
                    onChangeText={(text) => updateMedication(index, 'endDate', text)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addMedication}>
            <Plus size={16} color={theme.colors.primary} />
            <Text style={styles.addButtonText}>{t('notebook.medical.addMedication')}</Text>
          </TouchableOpacity>
        </View>

        {/* Severity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.medical.severity.title')}</Text>
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

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.medical.status.title')}</Text>
          <View style={styles.statusContainer}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusOption,
                  formData.status === option.value && styles.statusOptionActive,
                ]}
                onPress={() => setFormData({ ...formData, status: option.value as any })}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    formData.status === option.value && styles.statusOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notebook.medical.additionalInfo')}</Text>

          <Input
            label={t('notebook.medical.nextAppointment')}
            value={formData.nextAppointment}
            onChangeText={(text) => setFormData({ ...formData, nextAppointment: text })}
            placeholder="YYYY-MM-DD"
          />

          {/* Tags */}
          <Text style={[styles.sectionTitle, { marginTop: theme.spacing.md }]}>
            {t('notebook.common.tags')}
          </Text>
          <View style={styles.symptomsContainer}>
            {formData.tags.map((tag, index) => (
              <View key={index} style={styles.symptomRow}>
                <Input
                  style={styles.symptomInput}
                  value={tag}
                  onChangeText={(text) => updateTag(index, text)}
                  placeholder={t('notebook.common.tagPlaceholder')}
                />
                {formData.tags.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeTag(index)}
                  >
                    <X size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addTag}>
              <Plus size={16} color={theme.colors.primary} />
              <Text style={styles.addButtonText}>{t('notebook.common.addTag')}</Text>
            </TouchableOpacity>
          </View>
        </View>
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

export default MedicalEntryForm;