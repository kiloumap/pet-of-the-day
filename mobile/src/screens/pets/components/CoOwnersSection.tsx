import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Plus, UserMinus, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

interface CoOwner {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  addedAt: string;
}

interface CoOwnersSectionProps {
  petId: string;
  coOwners: CoOwner[];
  onInviteCoOwner: (email: string) => Promise<void>;
  onRemoveCoOwner: (coOwnerId: string) => Promise<void>;
  isLoading?: boolean;
  canManage?: boolean;
}

export const CoOwnersSection: React.FC<CoOwnersSectionProps> = ({
  petId,
  coOwners,
  onInviteCoOwner,
  onRemoveCoOwner,
  isLoading = false,
  canManage = true,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isInviting, setIsInviting] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing['2xl'],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.styles.h3,
      color: theme.colors.text.primary,
    },
    inviteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.sm,
    },
    inviteButtonText: {
      color: theme.colors.white,
      marginLeft: theme.spacing.xs,
      fontSize: 14,
      fontWeight: '500',
    },
    inviteForm: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    inviteFormTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    formActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'flex-end',
      marginTop: theme.spacing.sm,
    },
    cancelButton: {
      backgroundColor: theme.colors.background.primary,
      borderColor: theme.colors.border,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
    },
    coOwnersList: {
      maxHeight: 300,
    },
    coOwnerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    coOwnerInfo: {
      flex: 1,
    },
    coOwnerName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    coOwnerEmail: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: 12,
      marginTop: theme.spacing.xs / 2,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    activeStatus: {
      backgroundColor: theme.colors.success + '20',
    },
    activeStatusText: {
      color: theme.colors.success,
    },
    pendingStatus: {
      backgroundColor: theme.colors.warning + '20',
    },
    pendingStatusText: {
      color: theme.colors.warning,
    },
    inactiveStatus: {
      backgroundColor: theme.colors.text.tertiary + '20',
    },
    inactiveStatusText: {
      color: theme.colors.text.tertiary,
    },
    removeButton: {
      padding: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInviteCoOwner = async () => {
    const email = emailInput.trim();

    if (!email) {
      setEmailError(t('pets.validations.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(t('pets.validations.emailInvalid'));
      return;
    }

    // Check if email is already a co-owner
    if (coOwners.some(coOwner => coOwner.email.toLowerCase() === email.toLowerCase())) {
      setEmailError(t('pets.coOwners.alreadyCoOwner'));
      return;
    }

    try {
      await onInviteCoOwner(email);
      setEmailInput('');
      setEmailError('');
      setIsInviting(false);
      Alert.alert(t('common.success'), t('pets.coOwnerInvited', { email }));
    } catch (error) {
      Alert.alert(t('common.error'), t('pets.coOwners.inviteError'));
    }
  };

  const handleRemoveCoOwner = (coOwner: CoOwner) => {
    Alert.alert(
      t('pets.removeCoOwner'),
      t('pets.coOwners.removeConfirm', { name: coOwner.name || coOwner.email }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemoveCoOwner(coOwner.id);
            } catch (error) {
              Alert.alert(t('common.error'), t('pets.coOwners.removeError'));
            }
          },
        },
      ]
    );
  };

  const cancelInvite = () => {
    setIsInviting(false);
    setEmailInput('');
    setEmailError('');
  };

  const getStatusStyle = (status: CoOwner['status']) => {
    switch (status) {
      case 'active':
        return [styles.statusBadge, styles.activeStatus];
      case 'pending':
        return [styles.statusBadge, styles.pendingStatus];
      case 'inactive':
        return [styles.statusBadge, styles.inactiveStatus];
    }
  };

  const getStatusTextStyle = (status: CoOwner['status']) => {
    switch (status) {
      case 'active':
        return [styles.statusText, styles.activeStatusText];
      case 'pending':
        return [styles.statusText, styles.pendingStatusText];
      case 'inactive':
        return [styles.statusText, styles.inactiveStatusText];
    }
  };

  const getStatusText = (status: CoOwner['status']) => {
    switch (status) {
      case 'active':
        return t('pets.coOwners.active');
      case 'pending':
        return t('pets.coOwners.pending');
      case 'inactive':
        return t('pets.coOwners.inactive');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('pets.coOwnersSection')}</Text>
        {canManage && !isInviting && (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => setIsInviting(true)}
            testID="add-co-owner-button"
          >
            <Plus size={16} color={theme.colors.white} />
            <Text style={styles.inviteButtonText}>{t('pets.addCoOwner')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isInviting && (
        <View style={styles.inviteForm}>
          <Text style={styles.inviteFormTitle}>{t('pets.inviteCoOwner')}</Text>
          <Input
            value={emailInput}
            onChangeText={setEmailInput}
            placeholder={t('pets.coOwnerEmail')}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
            testID="co-owner-email-input"
          />
          <View style={styles.formActions}>
            <Button
              title={t('common.cancel')}
              onPress={cancelInvite}
              style={styles.cancelButton}
              variant="outline"
            />
            <Button
              title={t('common.send')}
              onPress={handleInviteCoOwner}
              style={styles.sendButton}
              loading={isLoading}
              testID="send-invite-button"
            />
          </View>
        </View>
      )}

      {coOwners.length === 0 ? (
        <View style={styles.emptyState} testID="co-owners-empty-state">
          <Mail size={32} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyText}>{t('pets.coOwners.empty')}</Text>
          <Text style={styles.emptySubtext}>
            {t('pets.coOwners.emptyDescription')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.coOwnersList} nestedScrollEnabled testID="co-owner-list">
          {coOwners.map((coOwner) => (
            <View key={coOwner.id} style={styles.coOwnerItem}>
              <View style={styles.coOwnerInfo}>
                <Text style={styles.coOwnerName}>
                  {coOwner.name || t('pets.coOwners.unnamed')}
                </Text>
                <Text style={styles.coOwnerEmail}>{coOwner.email}</Text>
                <View style={getStatusStyle(coOwner.status)}>
                  <Text style={getStatusTextStyle(coOwner.status)}>
                    {getStatusText(coOwner.status)}
                  </Text>
                </View>
              </View>
              {canManage && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveCoOwner(coOwner)}
                  testID={`remove-co-owner-${coOwner.id}`}
                >
                  <UserMinus size={18} color={theme.colors.status.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};