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
import { NotesSection } from './components/NotesSection';
import { CoOwnersSection } from './components/CoOwnersSection';
import { PersonalitySection } from './components/PersonalitySection';

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

  // Mock data for sections - In real implementation, this would come from API
  const [petNotes, setPetNotes] = useState([
    {
      id: '1',
      content: 'Loves playing fetch in the park',
      createdAt: '2023-01-15T10:30:00Z',
      updatedAt: '2023-01-15T10:30:00Z',
    },
    {
      id: '2',
      content: 'Needs medication at 8 AM daily',
      createdAt: '2023-01-20T08:00:00Z',
      updatedAt: '2023-01-20T08:00:00Z',
    }
  ]);

  const [coOwners, setCoOwners] = useState([
    {
      id: '1',
      email: 'jane.doe@example.com',
      name: 'Jane Doe',
      status: 'active' as const,
      addedAt: '2023-01-10T00:00:00Z',
    }
  ]);

  const [personalityTraits, setPersonalityTraits] = useState([
    {
      id: '1',
      name: 'Playful',
      description: 'Loves to play with toys and other dogs',
      category: 'temperament' as const,
      createdAt: '2023-01-10T00:00:00Z',
    },
    {
      id: '2',
      name: 'Good with children',
      category: 'behavior' as const,
      createdAt: '2023-01-10T00:00:00Z',
    }
  ]);

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
      const formErrors = ErrorHandler.handleValidationErrors(error as any);
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

  // Notes section handlers
  const handleAddNote = async (content: string) => {
    const newNote = {
      id: Date.now().toString(),
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPetNotes(prev => [...prev, newNote]);
  };

  const handleEditNote = async (noteId: string, content: string) => {
    setPetNotes(prev =>
      prev.map(note =>
        note.id === noteId
          ? { ...note, content, updatedAt: new Date().toISOString() }
          : note
      )
    );
  };

  const handleDeleteNote = async (noteId: string) => {
    setPetNotes(prev => prev.filter(note => note.id !== noteId));
  };

  // Co-owners section handlers
  const handleInviteCoOwner = async (email: string) => {
    const newCoOwner = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0], // Simple name extraction
      status: 'pending' as const,
      addedAt: new Date().toISOString(),
    };
    setCoOwners((prev: any) => [...prev, newCoOwner]);
  };

  const handleRemoveCoOwner = async (coOwnerId: string) => {
    setCoOwners(prev => prev.filter(coOwner => coOwner.id !== coOwnerId));
  };

  // Personality section handlers
  const handleAddTrait = async (trait: any) => {
    const newTrait = {
      id: Date.now().toString(),
      ...trait,
      createdAt: new Date().toISOString(),
    };
    setPersonalityTraits(prev => [...prev, newTrait]);
  };

  const handleEditTrait = async (traitId: string, trait: any) => {
    setPersonalityTraits(prev =>
      prev.map(t =>
        t.id === traitId ? { ...t, ...trait } : t
      )
    );
  };

  const handleRemoveTrait = async (traitId: string) => {
    setPersonalityTraits(prev => prev.filter(trait => trait.id !== traitId));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      paddingTop: theme.spacing.md,
      borderBottomLeftRadius: theme.spacing.lg,
      borderBottomRightRadius: theme.spacing.lg,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    backButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      padding: theme.spacing.sm,
      borderRadius: theme.spacing.md,
      marginLeft: -theme.spacing.xs,
    },
    headerContent: {
      alignItems: 'center',
    },
    petName: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.white,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    petSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    quickStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.white,
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: theme.spacing.xs,
    },
    headerActions: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    actionButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      padding: theme.spacing.sm,
      borderRadius: theme.spacing.md,
    },
    floatingActions: {
      position: 'absolute',
      right: theme.spacing.lg,
      top: -theme.spacing.xl,
      flexDirection: 'row',
      gap: theme.spacing.sm,
      zIndex: 10,
    },
    floatingButton: {
      backgroundColor: theme.colors.white,
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    editButton: {
      backgroundColor: theme.colors.primary,
    },
    deleteButton: {
      backgroundColor: theme.colors.status.error,
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContainer: {
      paddingTop: theme.spacing.xl + theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    section: {
      backgroundColor: theme.colors.background.secondary,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      borderRadius: theme.spacing.lg,
      padding: theme.spacing.xl,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.border + '40',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary + '30',
    },
    infoRow: {
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '20',
    },
    lastInfoRow: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    value: {
      fontSize: 16,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.sm,
      lineHeight: 22,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      marginTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.sm,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.colors.background.tertiary,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    saveButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.lg,
      minHeight: 52,
    },
    dangerButton: {
      backgroundColor: theme.colors.status.error,
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      borderRadius: theme.spacing.lg,
      minHeight: 48,
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
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.white} />
          </TouchableOpacity>
          {!isEditing && (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleEditToggle}>
                <Edit3 size={20} color={theme.colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Trash2 size={20} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.petName}>
            {isEditing ? t('pets.editPet') : selectedPet.name}
          </Text>
          {!isEditing && (
            <>
              <Text style={styles.petSubtitle}>
                {t(`pets.${selectedPet.species}`)} • {selectedPet.breed || t('common.notSpecified')}
              </Text>
              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selectedPet.points || 0}</Text>
                  <Text style={styles.statLabel}>{t('home.stats.points')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{petNotes.length}</Text>
                  <Text style={styles.statLabel}>{t('pets.notes')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{coOwners.length}</Text>
                  <Text style={styles.statLabel}>{t('pets.coOwners')}</Text>
                </View>
              </View>
            </>
          )}
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

            <View style={[styles.infoRow, styles.lastInfoRow]}>
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
                <Text style={styles.value}>{formatDate(selectedPet.birth_date || '')}</Text>
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

            <View style={[styles.infoRow, styles.lastInfoRow]}>
              <Text style={styles.label}>{t('common.addedOn')}</Text>
              <Text style={styles.value}>{formatDate(selectedPet.created_at)}</Text>
            </View>
          </View>

          {/* New sections - only show when not editing */}
          {!isEditing && (
            <>
              <NotesSection
                petId={petId}
                notes={petNotes}
                onAddNote={handleAddNote}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                isLoading={isLoading}
                canEdit={true}
              />

              <CoOwnersSection
                petId={petId}
                coOwners={coOwners}
                onInviteCoOwner={handleInviteCoOwner}
                onRemoveCoOwner={handleRemoveCoOwner}
                isLoading={isLoading}
                canManage={true}
              />

              <PersonalitySection
                petId={petId}
                traits={personalityTraits}
                onAddTrait={handleAddTrait}
                onEditTrait={handleEditTrait}
                onRemoveTrait={handleRemoveTrait}
                isLoading={isLoading}
                canEdit={true}
              />
            </>
          )}

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
              style={styles.dangerButton}
              variant="outline"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};