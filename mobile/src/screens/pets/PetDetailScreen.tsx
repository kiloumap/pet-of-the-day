import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Dropdown, DropdownOption } from '@components/ui/Dropdown';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { fetchPetById, updatePet, deletePet, clearError, clearSelectedPet } from '@store/petSlice';
import { getSpeciesOptions } from '@utils/speciesLocalization';
import { ErrorMessage } from "@components/ui/ErrorMessage";
import { ErrorHandler } from "@utils/errorHandler";

interface PetDetailScreenProps {
  navigation: any;
  route: {
    params: {
      petId: string;
    };
  };
}

export const PetDetailScreen: React.FC<PetDetailScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { selectedPet, isLoading, error } = useAppSelector((state) => state.pets);
  const { petId } = route.params;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    birth_date: '',
    photo_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');

  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchPetById(petId));

    return () => {
      dispatch(clearSelectedPet());
    };
  }, [dispatch, petId]);

  useEffect(() => {
    if (selectedPet) {
      setFormData({
        name: selectedPet.name || '',
        species: selectedPet.species || '',
        breed: selectedPet.breed || '',
        birth_date: selectedPet.birth_date || '',
        photo_url: selectedPet.photo_url || '',
      });
    }
  }, [selectedPet]);

  useEffect(() => {
    if (error) {
      const formErrors = ErrorHandler.handleValidationErrors(error);
      if (formErrors._general) {
        setGeneralError(formErrors._general);
      } else {
        setErrors(formErrors);
      }
    }
  }, [error]);

  const speciesOptions: DropdownOption[] = getSpeciesOptions(t);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('pets.validations.nameRequired');
    }

    if (!formData.species.trim()) {
      newErrors.species = t('pets.validations.speciesRequired');
    }

    if (formData.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.birth_date)) {
      newErrors.birth_date = t('pets.validations.dateFormatInvalid');
    }

    if (formData.photo_url && !/^https?:\/\/.+/.test(formData.photo_url)) {
      newErrors.photo_url = t('pets.validations.photoUrlInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Remove empty optional fields
    const petData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value.trim() !== '') {
        acc[key as keyof typeof formData] = value.trim();
      }
      return acc;
    }, {} as Partial<typeof formData>);

    try {
      await dispatch(updatePet({ petId, ...petData } as any)).unwrap();
      setIsEditing(false);
      Alert.alert(t('common.success'), t('pets.updateSuccess'));
    } catch (error) {
      // Error is already handled by Redux and shown in useEffect
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('pets.deleteConfirmTitle'),
      t('pets.deleteConfirmMessage', { name: selectedPet?.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deletePet(petId)).unwrap();
              navigation.goBack();
            } catch (error) {
              // Error is already handled by Redux
            }
          },
        },
      ]
    );
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data when canceling edit
      if (selectedPet) {
        setFormData({
          name: selectedPet.name || '',
          species: selectedPet.species || '',
          breed: selectedPet.breed || '',
          birth_date: selectedPet.birth_date || '',
          photo_url: selectedPet.photo_url || '',
        });
      }
      setErrors({});
      setGeneralError('');
    }
    setIsEditing(!isEditing);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('common.notSpecified');
    return new Date(dateString).toLocaleDateString();
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
      padding: theme.spacing.padding.screen,
      paddingBottom: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.sm,
      marginLeft: -theme.spacing.sm,
    },
    headerTitle: {
      ...theme.typography.styles.h2,
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: 'center',
      marginRight: theme.spacing.xl,
    },
    headerActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      padding: theme.spacing.sm,
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContainer: {
      padding: theme.spacing.padding.screen,
    },
    section: {
      marginBottom: theme.spacing['2xl'],
    },
    sectionTitle: {
      ...theme.typography.styles.h3,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.lg,
    },
    infoRow: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      ...theme.typography.styles.label,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    value: {
      ...theme.typography.styles.body,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.sm,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.colors.background.secondary,
    },
    saveButton: {
      flex: 1,
    },
    deleteButton: {
      backgroundColor: theme.colors.status.error,
      marginTop: theme.spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...theme.typography.styles.body,
      color: theme.colors.text.secondary,
    },
  });

  if (isLoading || !selectedPet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? t('pets.editPet') : selectedPet.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditToggle}>
            <Edit3 size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Trash2 size={20} color={theme.colors.status.error} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {generalError ? <ErrorMessage message={generalError} /> : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('pets.basicInfo')}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('pets.name')}</Text>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChangeText={(value) => handleFieldChange('name', value)}
                  placeholder={t('pets.placeholders.petName')}
                  error={errors.name}
                  maxLength={50}
                />
              ) : (
                <Text style={styles.value}>{selectedPet.name}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('pets.species')}</Text>
              {isEditing ? (
                <Dropdown
                  label={`${t('pets.species')} *`}
                  value={formData.species}
                  onSelect={(value) => handleFieldChange('species', value)}
                  options={speciesOptions}
                  placeholder={t('pets.placeholders.species')}
                  error={errors.species}
                />
              ) : (
                <Text style={styles.value}>{t(`pets.${selectedPet.species}`)}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('pets.breed')}</Text>
              {isEditing ? (
                <Input
                  value={formData.breed}
                  onChangeText={(value) => handleFieldChange('breed', value)}
                  placeholder={t('pets.placeholders.breed')}
                  error={errors.breed}
                  maxLength={50}
                />
              ) : (
                <Text style={styles.value}>{selectedPet.breed || t('common.notSpecified')}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('pets.birthDate')}</Text>
              {isEditing ? (
                <Input
                  value={formData.birth_date}
                  onChangeText={(value) => handleFieldChange('birth_date', value)}
                  placeholder="YYYY-MM-DD"
                  error={errors.birth_date}
                  helpText={t('pets.dateFormatHelp')}
                />
              ) : (
                <Text style={styles.value}>{formatDate(selectedPet.birth_date)}</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('pets.additionalInfo')}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('pets.photoUrl')}</Text>
              {isEditing ? (
                <Input
                  value={formData.photo_url}
                  onChangeText={(value) => handleFieldChange('photo_url', value)}
                  placeholder={t('pets.placeholders.photoUrl')}
                  error={errors.photo_url}
                  helpText={t('pets.photoUrlHelp')}
                />
              ) : (
                <Text style={styles.value}>{selectedPet.photo_url || t('common.notSpecified')}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('common.addedOn')}</Text>
              <Text style={styles.value}>{formatDate(selectedPet.created_at)}</Text>
            </View>
          </View>

          {isEditing && (
            <View style={styles.buttonContainer}>
              <Button
                title={t('common.cancel')}
                onPress={handleEditToggle}
                style={styles.cancelButton}
                variant="outline"
              />
              <Button
                title={t('common.save')}
                onPress={handleSave}
                style={styles.saveButton}
                loading={isLoading}
              />
            </View>
          )}

          {!isEditing && (
            <Button
              title={t('pets.deletePet')}
              onPress={handleDelete}
              style={styles.deleteButton}
              variant="outline"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};