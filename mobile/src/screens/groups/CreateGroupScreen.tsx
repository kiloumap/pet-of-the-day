import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme/ThemeContext';
import { createGroup, clearError } from '../../store/groupSlice';
import { fetchPets } from '../../store/petSlice';
import { CreateGroupRequest } from '../../types/api';
import PetCheckboxSelector from '../../components/PetCheckboxSelector';
import GroupCreatedModal from '../../components/GroupCreatedModal';

type CreateGroupScreenNavigationProp = NativeStackNavigationProp<GroupsStackParamList, 'CreateGroup'>;

const CreateGroupScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<CreateGroupScreenNavigationProp>();
  const dispatch = useAppDispatch();

  const { isCreating, error } = useAppSelector((state) => state.groups);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { pets, isLoading: petsLoading } = useAppSelector((state) => state.pets);

  const [formData, setFormData] = useState<CreateGroupRequest>({
    name: '',
    description: '',
    privacy: 'private',
    pet_ids: [],
  });

  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<{
    name: string;
    invite_code: string;
    id: string;
  } | null>(null);

  // Load pets when component mounts
  useEffect(() => {
    dispatch(fetchPets() as any);
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      if (error.field === 'name') {
        setErrors(prev => ({ ...prev, name: error.message }));
      } else if (error.field === 'description') {
        setErrors(prev => ({ ...prev, description: error.message }));
      } else {
        Alert.alert(t('common.error'), error.message);
      }
      dispatch(clearError());
    }
  }, [error, dispatch, t]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('groups.validations.nameRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('groups.validations.descriptionRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (__DEV__) {
      console.log('🔍 Creating group - Auth status:', { isAuthenticated, user: user?.id });
    }

    try {
      const result = await dispatch(createGroup(formData)).unwrap();

      // Show success modal with invite code
      setCreatedGroup({
        name: result.name,
        invite_code: result.invite_code,
        id: result.id,
      });
      setShowSuccessModal(true);
    } catch (error) {
      // Error handling is done through Redux and useEffect
    }
  };

  const updateFormData = (field: keyof CreateGroupRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePetSelectionChange = (petIds: string[]) => {
    setFormData(prev => ({ ...prev, pet_ids: petIds }));
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigation.navigate('Groups');
  };

  const handleNavigateToGroup = () => {
    if (createdGroup) {
      setShowSuccessModal(false);
      navigation.navigate('GroupDetail', { groupId: createdGroup.id });
    }
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
      flex: 1,
      padding: 16,
    },
    titleSection: {
      marginBottom: 32,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      lineHeight: 24,
    },
    form: {
      flex: 1,
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
      borderColor: theme.colors.status.error,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    errorText: {
      color: theme.colors.status.error,
      fontSize: 14,
      marginTop: 4,
    },
    placeholder: {
      color: theme.colors.text.tertiary,
    },
    privacySection: {
      marginBottom: 32,
    },
    privacyOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    privacyOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    privacyContent: {
      flex: 1,
      marginLeft: 12,
    },
    privacyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    privacyDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      lineHeight: 20,
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
      color: theme.colors.reverse,
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
        <Text style={styles.headerTitle}>{t('groups.createGroup')}</Text>
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
          <View style={styles.titleSection}>
            <Text style={styles.title}>{t('groups.createGroupTitle')}</Text>
            <Text style={styles.subtitle}>{t('groups.createGroupSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('groups.groupName')}</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                placeholder={t('groups.placeholders.groupName')}
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="words"
                maxLength={50}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('groups.groupDescription')}</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder={t('groups.placeholders.description')}
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                textAlignVertical="top"
                maxLength={255}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <PetCheckboxSelector
                pets={pets}
                selectedPetIds={formData.pet_ids || []}
                onSelectionChange={handlePetSelectionChange}
                title={t('groups.selectPets')}
                selectAllByDefault={true}
                disabled={petsLoading}
              />
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.label}>{t('groups.privacy.title')}</Text>

              <TouchableOpacity
                style={[
                  styles.privacyOption,
                  formData.privacy === 'private' && styles.privacyOptionSelected,
                ]}
                onPress={() => updateFormData('privacy', 'private')}
              >
                <MaterialIcons
                  name={formData.privacy === 'private' ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={24}
                  color={formData.privacy === 'private' ? theme.colors.primary : theme.colors.text.tertiary}
                />
                <View style={styles.privacyContent}>
                  <Text style={styles.privacyTitle}>{t('groups.privacy.private')}</Text>
                  <Text style={styles.privacyDescription}>
                    {t('groups.privacy.privateDescription')}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.privacyOption,
                  formData.privacy === 'public' && styles.privacyOptionSelected,
                ]}
                onPress={() => updateFormData('privacy', 'public')}
              >
                <MaterialIcons
                  name={formData.privacy === 'public' ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={24}
                  color={formData.privacy === 'public' ? theme.colors.primary : theme.colors.text.tertiary}
                />
                <View style={styles.privacyContent}>
                  <Text style={styles.privacyTitle}>{t('groups.privacy.public')}</Text>
                  <Text style={styles.privacyDescription}>
                    {t('groups.privacy.publicDescription')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={{ padding: 16 }}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isCreating || !formData.name.trim() || !formData.description.trim()) &&
              styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isCreating || !formData.name.trim() || !formData.description.trim()}
          >
            <Text style={styles.submitButtonText}>
              {isCreating ? t('common.loading') : t('groups.createGroup')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      {createdGroup && (
        <GroupCreatedModal
          visible={showSuccessModal}
          groupName={createdGroup.name}
          inviteCode={createdGroup.invite_code}
          onClose={handleCloseSuccessModal}
          onNavigateToGroup={handleNavigateToGroup}
        />
      )}
    </SafeAreaView>
  );
};

export { CreateGroupScreen };
export default CreateGroupScreen;