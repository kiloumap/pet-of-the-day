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
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ErrorMessage } from '@components/ui/ErrorMessage';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { clearError } from '@store/authSlice';
import { ErrorHandler } from '@utils/errorHandler';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface PasswordResetScreenProps {
  navigation: any;
}

export const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    backButton: {
      padding: theme.spacing.xs,
      marginRight: theme.spacing.md,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
      justifyContent: 'center',
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    icon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    description: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.relaxed,
      marginBottom: theme.spacing.xl,
    },
    form: {
      gap: theme.spacing.md,
    },
    submitButton: {
      marginTop: theme.spacing.md,
    },
    successContainer: {
      alignItems: 'center',
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    successTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.success,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    successDescription: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.relaxed,
      marginBottom: theme.spacing.xl,
    },
    backToLoginButton: {
      backgroundColor: theme.colors.background.secondary,
    },
  });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const formErrors = ErrorHandler.handleValidationErrors(error);

      if (formErrors._general) {
        setGeneralError(formErrors._general);
        setErrors({});
      } else {
        setErrors(formErrors);
        setGeneralError('');
      }
    } else {
      setErrors({});
      setGeneralError('');
    }
  }, [error]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = t('validation.required', { field: t('auth.email') });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t('validation.invalidEmail');
    }

    setErrors(newErrors);
    setGeneralError('');
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // TODO: Implement password reset API call when backend endpoint is ready
      // await dispatch(resetPassword({ email: email.trim() })).unwrap();

      // For now, simulate success after validation
      setTimeout(() => {
        setEmailSent(true);
      }, 1000);

    } catch (error) {
      // Error handling is done through useEffect monitoring the error state
      console.log('Password reset error:', error);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const renderResetForm = () => (
    <>
      <View style={styles.iconContainer}>
        <View style={styles.icon}>
          <Mail size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>{t('auth.resetPassword')}</Text>
        <Text style={styles.description}>
          {t('auth.resetPasswordDescription')}
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
          testID="email-input"
        />

        {generalError ? (
          <ErrorMessage message={generalError} />
        ) : null}

        <Button
          title={t('auth.sendResetLink')}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!email.trim() || isLoading}
          style={styles.submitButton}
          testID="submit-button"
        />

        <Button
          title={t('auth.backToLogin')}
          onPress={handleBackToLogin}
          variant="secondary"
          style={styles.backToLoginButton}
          testID="back-to-login-button"
        />
      </View>
    </>
  );

  const renderSuccessMessage = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Mail size={32} color={theme.colors.success} />
      </View>
      <Text style={styles.successTitle}>{t('auth.resetEmailSent')}</Text>
      <Text style={styles.successDescription}>
        {t('auth.resetEmailSentDescription', { email })}
      </Text>

      <Button
        title={t('auth.backToLogin')}
        onPress={handleBackToLogin}
        style={styles.submitButton}
        testID="back-to-login-success-button"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          testID="back-button"
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {emailSent ? t('auth.emailSent') : t('auth.resetPassword')}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.scrollContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {emailSent ? renderSuccessMessage() : renderResetForm()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PasswordResetScreen;