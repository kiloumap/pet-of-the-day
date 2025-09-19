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
import { MaterialIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme/ThemeContext';
import { acceptInvitation, clearError } from '../../store/groupSlice';
import { AcceptInvitationRequest } from '../../types/api';

const JoinGroupScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { isJoining, error } = useAppSelector((state) => state.groups);

  const [inviteCode, setInviteCode] = useState('');
  const [codeError, setCodeError] = useState<string>('');

  useEffect(() => {
    if (error) {
      if (error.field === 'invite_code') {
        setCodeError(error.message);
      } else {
        Alert.alert(t('common.error'), error.message);
      }
      dispatch(clearError());
    }
  }, [error, dispatch, t]);

  const validateForm = (): boolean => {
    if (!inviteCode.trim()) {
      setCodeError(t('groups.validations.codeRequired'));
      return false;
    }

    if (inviteCode.length < 6) {
      setCodeError('Invite code must be at least 6 characters');
      return false;
    }

    setCodeError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const requestData: AcceptInvitationRequest = {
        invite_code: inviteCode.trim().toUpperCase(),
      };

      const result = await dispatch(acceptInvitation(requestData)).unwrap();

      Alert.alert(
        t('common.success'),
        t('groups.success.groupJoined'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      // Error handling is done through Redux and useEffect
    }
  };

  const handleCodeChange = (text: string) => {
    // Format code as uppercase and remove spaces
    const formatted = text.replace(/\s/g, '').toUpperCase();
    setInviteCode(formatted);
    if (codeError) {
      setCodeError('');
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
      alignItems: 'center',
    },
    icon: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      lineHeight: 24,
      textAlign: 'center',
    },
    form: {
      flex: 1,
    },
    inputGroup: {
      marginBottom: 32,
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
      paddingVertical: 16,
      fontSize: 18,
      color: theme.colors.text.primary,
      textAlign: 'center',
      fontWeight: '600',
      letterSpacing: 2,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
    helpText: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
    infoBox: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      padding: 16,
      marginBottom: 32,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    infoText: {
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
      color: theme.colors.text.inverse,
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
        <Text style={styles.headerTitle}>{t('groups.joinGroup')}</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.titleSection}>
            <MaterialIcons
              name="group-add"
              size={64}
              color={theme.colors.primary}
              style={styles.icon}
            />
            <Text style={styles.title}>{t('groups.joinGroupTitle')}</Text>
            <Text style={styles.subtitle}>{t('groups.joinGroupSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('groups.inviteCode')}</Text>
              <TextInput
                style={[styles.input, codeError && styles.inputError]}
                value={inviteCode}
                onChangeText={handleCodeChange}
                placeholder={t('groups.placeholders.inviteCode')}
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
              />
              {codeError ? (
                <Text style={styles.errorText}>{codeError}</Text>
              ) : (
                <Text style={styles.helpText}>
                  Enter the invitation code shared by a group member
                </Text>
              )}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>How to join a group</Text>
              <Text style={styles.infoText}>
                Ask a group member or administrator to share their group's invitation code with you.
                Enter the code above to join the group and start sharing your pets!
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={{ padding: 16 }}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isJoining || !inviteCode.trim()) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isJoining || !inviteCode.trim()}
          >
            <Text style={styles.submitButtonText}>
              {isJoining ? t('common.loading') : t('groups.joinGroup')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default JoinGroupScreen;