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
import { registerUser, clearError } from '../../store/authSlice';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.navigate('MainApp');
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    if (error) {
      Alert.alert(t('auth.errors.loginError'), error);
    }
  }, [error]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('auth.validation.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('auth.validation.lastNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.validation.emailRequired');

    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.validation.emailInvalid');
    }

    if (!formData.password.trim()) {
      newErrors.password = t('auth.validation.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.validation.passwordMinLength');
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t('auth.validation.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const { confirmPassword, ...registerData } = formData;
    dispatch(registerUser(registerData));
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
      justifyContent: 'center',
      padding: theme.spacing.padding.screen,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing['3xl'],
    },
    title: {
      ...theme.typography.styles.h1,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.styles.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    form: {
      marginBottom: theme.spacing.xl,
    },
    nameRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    nameInput: {
      flex: 1,
    },
    footer: {
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    loginText: {
      ...theme.typography.styles.body,
      color: theme.colors.text.secondary,
    },
    loginLink: {
      ...theme.typography.styles.body,
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.medium,
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
            <Text style={styles.title}>{t('auth.registerButton')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.loginSubtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.nameRow}>
              <Input
                label={t('auth.firstName')}
                placeholder={t('auth.placeholders.firstName')}
                value={formData.firstName}
                onChangeText={(value) => handleFieldChange('firstName', value)}
                error={errors.firstName}
                style={styles.nameInput}
              />

              <Input
                  label={t('auth.lastName')}
                  placeholder={t('auth.placeholders.lastName')}
                value={formData.lastName}
                onChangeText={(value) => handleFieldChange('lastName', value)}
                error={errors.lastName}
                style={styles.nameInput}
              />
            </View>

            <Input
              label={t('auth.email')}
              placeholder={t('auth.placeholders.email')}
              value={formData.email}
              onChangeText={(value) => handleFieldChange('email', value)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label={t('auth.password')}
              placeholder={t('auth.placeholders.choosePassword')}
              value={formData.password}
              onChangeText={(value) => handleFieldChange('password', value)}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label={t('auth.confirmPassword')}
              placeholder={t('auth.placeholders.repeatPassword')}
              value={formData.confirmPassword}
              onChangeText={(value) => handleFieldChange('confirmPassword', value)}
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title="Créer le compte"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.loginText}>
              {t('auth.hasAccount')}{' '}
              <Text
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                {t('auth.signInLink')}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};