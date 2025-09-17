import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { addPet, clearError } from '../../store/petSlice';

interface AddPetScreenProps {
  navigation: any;
}

export const AddPetScreen: React.FC<AddPetScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isAdding, error } = useAppSelector((state) => state.pets);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    birth_date: '',
    photo_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
    }
  }, [error]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('auth.validations.firstNameRequired');
    }

    if (!formData.species.trim()) {
      newErrors.species = t('pets.validations.speciesRequired');
    }

    if (formData.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.birth_date)) {
      newErrors.birth_date =t('pets.validations.dateFormatInvalid');
    }

    if (formData.photo_url && !/^https?:\/\/.+/.test(formData.photo_url)) {
      newErrors.photo_url = t('pets.validations.photoUrlInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPet = async () => {
    if (!validateForm()) return;

    // Remove empty optional fields
    const petData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value.trim() !== '') {
        acc[key as keyof typeof formData] = value.trim();
      }
      return acc;
    }, {} as Partial<typeof formData>);

    try {
      await dispatch(addPet(petData as any)).unwrap();
      Alert.alert(
        t('common.success'),
        t('pets.addSuccess'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      // Error is already handled by Redux and shown in useEffect
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: theme.spacing.padding.screen,
    },
    header: {
      marginBottom: theme.spacing['3xl'],
    },
    title: {
      ...theme.typography.styles.h2,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.styles.body,
      color: theme.colors.text.secondary,
    },
    form: {
      marginBottom: theme.spacing.xl,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.styles.h4,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    helperText: {
      ...theme.typography.styles.caption,
      color: theme.colors.text.tertiary,
      fontStyle: 'italic',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    cancelButton: {
      flex: 1,
    },
    addButton: {
      flex: 2,
    },
  });

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('pets.addPetTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('pets.addPetSubtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('pets.basicInfo')}</Text>

              <Input
                label={`${t('pets.name')} *`}
                placeholder={t('pets.placeholders.petName')}
                value={formData.name}
                onChangeText={(value) => handleFieldChange('name', value)}
                error={errors.name}
              />

              <Input
                label={`${t('pets.species')} *`}
                placeholder={t('pets.placeholders.species')}
                value={formData.species}
                onChangeText={(value) => handleFieldChange('species', value)}
                error={errors.species}
              />

              <Input
                label={`${t('pets.breed')} ${t('common.optional')} *`}
                placeholder={t('pets.placeholders.breed')}
                value={formData.breed}
                onChangeText={(value) => handleFieldChange('breed', value)}
                error={errors.breed}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('pets.additionalInfo')}</Text>

              <Input
                label={`${t('pets.birthDate')} ${t('common.optional')} *`}
                placeholder="2020-01-15"
                value={formData.birth_date}
                onChangeText={(value) => handleFieldChange('birth_date', value)}
                error={errors.birth_date}
              />
              <Text style={styles.helperText}>
                {t('common.dateFormat')}
              </Text>

              <Input
                label="URL de la photo (optionnel)"
                placeholder="https://example.com/photo.jpg"
                value={formData.photo_url}
                onChangeText={(value) => handleFieldChange('photo_url', value)}
                error={errors.photo_url}
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>
                {t('pets.photoUrlHelp')}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={t('common.add')}
                onPress={() => navigation.goBack()}
                variant="outline"
                style={styles.cancelButton}
              />

              <Button
                title="Ajouter"
                onPress={handleAddPet}
                loading={isAdding}
                disabled={isAdding}
                style={styles.addButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};