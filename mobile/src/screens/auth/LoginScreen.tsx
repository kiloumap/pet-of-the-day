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
import { useTheme } from '@/theme';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { LanguageSwitcher } from '@components/ui/LanguageSwitcher';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { loginUser, clearError } from '@store/authSlice';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert(t('auth.loginError'), error.message);
    }
  }, [error, t]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    dispatch(loginUser(formData));
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      marginBottom: theme.spacing['4xl'],
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
      marginBottom: theme.spacing['3xl'],
    },
    footer: {
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    registerText: {
      ...theme.typography.styles.body,
      color: theme.colors.text.secondary,
    },
    registerLink: {
      ...theme.typography.styles.body,
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    languageSwitcher: {
      position: 'absolute',
      top: theme.spacing.xl,
      right: theme.spacing.lg,
      zIndex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <LanguageSwitcher variant="compact" style={styles.languageSwitcher} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.loginTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.loginSubtitle')}
            </Text>
          </View>

          <View style={styles.form}>
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
              placeholder={t('auth.placeholders.password')}
              value={formData.password}
              onChangeText={(value) => handleFieldChange('password', value)}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title={t('auth.loginButton')}
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.registerText}>
              {t('auth.noAccount')}{' '}
              <Text
                style={styles.registerLink}
                onPress={() => navigation.navigate('Register')}
              >
                {t('auth.createAccountLink')}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};