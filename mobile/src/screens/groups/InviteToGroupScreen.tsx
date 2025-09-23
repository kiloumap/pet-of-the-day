import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Mail, Share, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ErrorHandler } from '../../utils/errorHandler';
import { inviteToGroup, clearError } from '../../store/groupSlice';
import { GroupsStackParamList } from '../../navigation/MainNavigator';

type InviteToGroupScreenRouteProp = RouteProp<GroupsStackParamList, 'InviteToGroup'>;

const InviteToGroupScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<InviteToGroupScreenRouteProp>();
  const dispatch = useAppDispatch();

  const { groupId, groupName } = route.params;

  const { currentGroupInvitations, isInviting, error } = useAppSelector((state) => state.groups);

  const [email, setEmail] = useState('');
  const [inviteType, setInviteType] = useState<'email' | 'code'>('email');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [lastCreatedInvite, setLastCreatedInvite] = useState<string | null>(null);

  React.useEffect(() => {
    if (error) {
      const formErrors = ErrorHandler.handleValidationErrors(error);
      if (formErrors._general) {
        setGeneralError(formErrors._general);
      } else {
        setErrors(formErrors);
      }
    }
  }, [error]);

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (inviteType === 'email') {
      if (!email.trim()) {
        newErrors.email = t('invitations.validations.emailRequired');
      } else if (!validateEmail(email.trim())) {
        newErrors.email = t('invitations.validations.emailInvalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendInvitation = async () => {
    if (inviteType === 'email' && !validateForm()) return;

    try {
      const inviteData = inviteType === 'email'
        ? { invitee_email: email.trim(), invite_type: 'email' as const }
        : { invite_type: 'code' as const };

      const result = await dispatch(inviteToGroup({
        groupId,
        data: inviteData
      })).unwrap();

      if (result.invite_code) {
        setLastCreatedInvite(result.invite_code);
      }

      if (inviteType === 'email') {
        Alert.alert(
          t('common.success'),
          t('invitations.success.emailSent', { email: email.trim() }),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          t('common.success'),
          t('invitations.success.codeGenerated')
        );
      }

      setEmail('');
      setErrors({});
      setGeneralError('');
    } catch (error) {
      // Error is already handled by Redux and shown in useEffect
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'email') {
      setEmail(value);
    }

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleCopyInviteCode = async () => {
    const codeInvitation = currentGroupInvitations.find(inv => inv.invite_type === 'code');
    const inviteCode = lastCreatedInvite || codeInvitation?.invite_code;

    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert(t('common.success'), t('invitations.success.codeCopied'));
    }
  };

  const getExistingInviteCode = () => {
    const codeInvitation = currentGroupInvitations.find(inv => inv.invite_type === 'code');
    return lastCreatedInvite || codeInvitation?.invite_code;
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
    keyboardAvoid: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
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
    optionContainer: {
      marginBottom: theme.spacing.xl,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    optionButtonSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    optionIcon: {
      marginRight: theme.spacing.md,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      ...theme.typography.styles.h4,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    optionDescription: {
      ...theme.typography.styles.body,
      color: theme.colors.text.secondary,
    },
    formContainer: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    inputContainer: {
      marginBottom: theme.spacing.lg,
    },
    codeContainer: {
      backgroundColor: theme.colors.background.tertiary,
      borderRadius: 8,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
    },
    codeTitle: {
      ...theme.typography.styles.h4,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    codeText: {
      ...theme.typography.styles.h2,
      color: theme.colors.primary,
      fontFamily: 'monospace',
      letterSpacing: 2,
      marginBottom: theme.spacing.md,
    },
    codeActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    codeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      gap: theme.spacing.xs,
    },
    codeButtonSecondary: {
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    codeButtonText: {
      ...theme.typography.styles.button,
      color: theme.colors.reverse,
    },
    codeButtonTextSecondary: {
      color: theme.colors.text.primary,
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
    sendButton: {
      flex: 1,
    },
    infoBox: {
      backgroundColor: theme.colors.background.tertiary,
      borderRadius: 8,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    infoText: {
      ...theme.typography.styles.caption,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });

  const existingCode = getExistingInviteCode();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('invitations.inviteToGroup')}</Text>
        <View style={{ width: theme.spacing.xl }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {generalError ? <ErrorMessage message={generalError} /> : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('invitations.chooseMethod')}</Text>

            <View style={styles.optionContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  inviteType === 'email' && styles.optionButtonSelected,
                ]}
                onPress={() => setInviteType('email')}
              >
                <View style={styles.optionIcon}>
                  <Mail size={24} color={inviteType === 'email' ? theme.colors.primary : theme.colors.text.secondary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{t('invitations.sendByEmail')}</Text>
                  <Text style={styles.optionDescription}>{t('invitations.emailDescription')}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  inviteType === 'code' && styles.optionButtonSelected,
                ]}
                onPress={() => setInviteType('code')}
              >
                <View style={styles.optionIcon}>
                  <Share size={24} color={inviteType === 'code' ? theme.colors.primary : theme.colors.text.secondary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{t('invitations.generateCode')}</Text>
                  <Text style={styles.optionDescription}>{t('invitations.codeDescription')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {inviteType === 'email' && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Input
                  label={t('invitations.recipientEmail')}
                  value={email}
                  onChangeText={(value) => handleFieldChange('email', value)}
                  placeholder={t('invitations.placeholders.email')}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  {t('invitations.emailInfo', { groupName })}
                </Text>
              </View>
            </View>
          )}

          {inviteType === 'code' && existingCode && (
            <View style={styles.codeContainer}>
              <Text style={styles.codeTitle}>{t('invitations.existingCode')}</Text>
              <Text style={styles.codeText}>{existingCode}</Text>
              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={[styles.codeButton, styles.codeButtonSecondary]}
                  onPress={handleCopyInviteCode}
                >
                  <Copy size={16} color={theme.colors.text.primary} />
                  <Text style={[styles.codeButtonText, styles.codeButtonTextSecondary]}>
                    {t('invitations.copyCode')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title={t('common.cancel')}
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              variant="outline"
            />
            <Button
              title={
                inviteType === 'email'
                  ? t('invitations.sendInvitation')
                  : existingCode
                    ? t('invitations.generateNewCode')
                    : t('invitations.generateCode')
              }
              onPress={handleSendInvitation}
              style={styles.sendButton}
              loading={isInviting}
              disabled={inviteType === 'email' && !email.trim()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default InviteToGroupScreen;