import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react-native';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useTranslation } from '@/hooks';
import { useTheme } from '@/theme';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

const ProfileEditScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      });
    }
  }, [user]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    headerTitle: {
      ...theme.typography.styles.h2,
      color: theme.colors.text.primary,
    },
    scrollView: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    section: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: theme.spacing.sm,
    },
    inputContainer: {
      marginBottom: theme.spacing.md,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    requiredLabel: {
      color: theme.colors.status.error,
    },
    saveButtonContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      minHeight: 48,
    },
    disabledButton: {
      backgroundColor: theme.colors.text.tertiary,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('profile.validation.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('profile.validation.lastNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('profile.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('profile.validation.emailInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // TODO: Implement updateProfile async thunk in authSlice
      // await dispatch(updateProfile({
      //   first_name: formData.firstName,
      //   last_name: formData.lastName,
      //   email: formData.email,
      // })).unwrap();

      // Mock success for now
      Alert.alert(
        t('common.success'),
        t('profile.updateSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormChanged = () => {
    if (!user) return false;
    return (
      formData.firstName !== user.first_name ||
      formData.lastName !== user.last_name ||
      formData.email !== user.email
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            testID="back-button"
          >
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.editProfile')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <UserIcon size={20} color={theme.colors.primary} style={styles.sectionIcon} />
            {t('profile.personalInfo')}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {t('profile.firstName')}
              <Text style={styles.requiredLabel}> *</Text>
            </Text>
            <Input
              value={formData.firstName}
              onChangeText={(value) => handleFieldChange('firstName', value)}
              placeholder={t('profile.firstNamePlaceholder')}
              error={errors.firstName}
              testID="first-name-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {t('profile.lastName')}
              <Text style={styles.requiredLabel}> *</Text>
            </Text>
            <Input
              value={formData.lastName}
              onChangeText={(value) => handleFieldChange('lastName', value)}
              placeholder={t('profile.lastNamePlaceholder')}
              error={errors.lastName}
              testID="last-name-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {t('profile.email')}
              <Text style={styles.requiredLabel}> *</Text>
            </Text>
            <Input
              value={formData.email}
              onChangeText={(value) => handleFieldChange('email', value)}
              placeholder={t('profile.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              testID="email-input"
            />
          </View>
        </View>
      </ScrollView>

      <Text style={styles.infoText}>{t('profile.editInfo')}</Text>

      <View style={styles.saveButtonContainer}>
        <Button
          title={t('profile.saveChanges')}
          onPress={handleSave}
          style={StyleSheet.flatten([
            styles.saveButton,
            (!isFormChanged() || isSaving) && styles.disabledButton,
          ])}
          loading={isSaving}
          disabled={!isFormChanged() || isSaving || isLoading}
          testID="save-changes-button"
        >
          <Save size={16} color={theme.colors.white} />
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default ProfileEditScreen;