import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Check, X, Eye, EyeOff, Users, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Button } from '@components/ui/Button';

interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  senderName: string;
  senderEmail: string;
  sentAt: string;
  expiresAt: string;
  message?: string;
  groupMemberCount?: number;
}

interface InvitationInterfaceProps {
  invitations: GroupInvitation[];
  onAcceptInvitation: (invitationId: string) => Promise<void>;
  onDeclineInvitation: (invitationId: string) => Promise<void>;
  onDismissInvitation: (invitationId: string) => void;
  isLoading?: boolean;
}

export const InvitationInterface: React.FC<InvitationInterfaceProps> = ({
  invitations,
  onAcceptInvitation,
  onDeclineInvitation,
  onDismissInvitation,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [expandedInvitation, setExpandedInvitation] = useState<string | null>(null);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      ...theme.typography.styles.h2,
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    invitationsList: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    invitationCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.spacing.md,
      marginVertical: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    invitationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
    },
    invitationInfo: {
      flex: 1,
    },
    groupName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs / 2,
    },
    senderInfo: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs / 2,
    },
    timeInfo: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
    },
    expandButton: {
      padding: theme.spacing.sm,
    },
    invitationDetails: {
      padding: theme.spacing.md,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    detailIcon: {
      marginRight: theme.spacing.sm,
    },
    detailText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    message: {
      backgroundColor: theme.colors.background.tertiary,
      padding: theme.spacing.md,
      borderRadius: theme.spacing.sm,
      marginVertical: theme.spacing.sm,
    },
    messageText: {
      fontSize: 14,
      color: theme.colors.text.primary,
      fontStyle: 'italic',
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    acceptButton: {
      flex: 1,
      backgroundColor: theme.colors.success,
    },
    declineButton: {
      flex: 1,
      backgroundColor: theme.colors.status.error,
    },
    dismissButton: {
      paddingHorizontal: theme.spacing.lg,
    },
    dismissButtonText: {
      fontSize: 14,
      color: theme.colors.text.tertiary,
    },
    expiringBadge: {
      backgroundColor: theme.colors.warning + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: 12,
      marginTop: theme.spacing.xs,
    },
    expiringText: {
      fontSize: 12,
      color: theme.colors.warning,
      fontWeight: '500',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing['3xl'],
    },
    emptyIcon: {
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return t('invitations.justNow');
    } else if (diffInHours < 24) {
      return t('invitations.hoursAgo', { hours: diffInHours });
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return t('invitations.daysAgo', { days: diffInDays });
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffInHours = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24 && diffInHours > 0;
  };

  const handleAcceptInvitation = async (invitation: GroupInvitation) => {
    Alert.alert(
      t('invitations.acceptConfirm'),
      t('invitations.acceptMessage', { groupName: invitation.groupName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('invitations.accept'),
          onPress: async () => {
            setProcessingInvitation(invitation.id);
            try {
              await onAcceptInvitation(invitation.id);
              Alert.alert(
                t('common.success'),
                t('invitations.acceptedSuccess', { groupName: invitation.groupName })
              );
            } catch (error) {
              Alert.alert(t('common.error'), t('invitations.error'));
            } finally {
              setProcessingInvitation(null);
            }
          },
        },
      ]
    );
  };

  const handleDeclineInvitation = async (invitation: GroupInvitation) => {
    Alert.alert(
      t('invitations.declineConfirm'),
      t('invitations.declineMessage', { groupName: invitation.groupName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('invitations.decline'),
          style: 'destructive',
          onPress: async () => {
            setProcessingInvitation(invitation.id);
            try {
              await onDeclineInvitation(invitation.id);
              Alert.alert(
                t('common.success'),
                t('invitations.declinedSuccess', { groupName: invitation.groupName })
              );
            } catch (error) {
              Alert.alert(t('common.error'), t('invitations.error'));
            } finally {
              setProcessingInvitation(null);
            }
          },
        },
      ]
    );
  };

  const toggleExpanded = (invitationId: string) => {
    setExpandedInvitation(
      expandedInvitation === invitationId ? null : invitationId
    );
  };

  if (invitations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('invitations.title')}</Text>
          <Text style={styles.subtitle}>{t('invitations.description')}</Text>
        </View>
        <View style={styles.emptyState} testID="invitations-empty-state">
          <Users size={48} color={theme.colors.text.tertiary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>{t('invitations.noInvitations')}</Text>
          <Text style={styles.emptyText}>
            {t('invitations.noInvitationsDescription')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('invitations.title')}</Text>
        <Text style={styles.subtitle}>
          {t('invitations.pendingCount', { count: invitations.length })}
        </Text>
      </View>

      <ScrollView style={styles.invitationsList} showsVerticalScrollIndicator={false}>
        {invitations.map((invitation) => {
          const isExpanded = expandedInvitation === invitation.id;
          const isProcessing = processingInvitation === invitation.id;
          const expiringSoon = isExpiringSoon(invitation.expiresAt);

          return (
            <View key={invitation.id} style={styles.invitationCard}>
              <TouchableOpacity
                style={styles.invitationHeader}
                onPress={() => toggleExpanded(invitation.id)}
                testID={`invitation-${invitation.id}`}
              >
                <View style={styles.invitationInfo}>
                  <Text style={styles.groupName}>{invitation.groupName}</Text>
                  <Text style={styles.senderInfo}>
                    {t('invitations.fromUser', { name: invitation.senderName })}
                  </Text>
                  <Text style={styles.timeInfo}>
                    {formatTimeAgo(invitation.sentAt)}
                  </Text>
                  {expiringSoon && (
                    <View style={styles.expiringBadge}>
                      <Text style={styles.expiringText}>
                        {t('invitations.expiringSoon')}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => toggleExpanded(invitation.id)}
                >
                  {isExpanded ? (
                    <EyeOff size={20} color={theme.colors.text.secondary} />
                  ) : (
                    <Eye size={20} color={theme.colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.invitationDetails}>
                  <View style={styles.detailRow}>
                    <Users
                      size={16}
                      color={theme.colors.text.tertiary}
                      style={styles.detailIcon}
                    />
                    <Text style={styles.detailText}>
                      {t('invitations.memberCount', {
                        count: invitation.groupMemberCount || 0,
                      })}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Calendar
                      size={16}
                      color={theme.colors.text.tertiary}
                      style={styles.detailIcon}
                    />
                    <Text style={styles.detailText}>
                      {t('invitations.expiresOn', {
                        date: new Date(invitation.expiresAt).toLocaleDateString(),
                      })}
                    </Text>
                  </View>

                  {invitation.message && (
                    <View style={styles.message}>
                      <Text style={styles.messageText}>{invitation.message}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.actions}>
                <Button
                  title={t('invitations.accept')}
                  onPress={() => handleAcceptInvitation(invitation)}
                  style={styles.acceptButton}
                  loading={isProcessing}
                  disabled={isLoading || isProcessing}
                  testID={`accept-invitation-${invitation.id}`}
                >
                  <Check size={16} color={theme.colors.white} />
                </Button>

                <Button
                  title={t('invitations.decline')}
                  onPress={() => handleDeclineInvitation(invitation)}
                  style={styles.declineButton}
                  variant="outline"
                  loading={isProcessing}
                  disabled={isLoading || isProcessing}
                  testID={`decline-invitation-${invitation.id}`}
                >
                  <X size={16} color={theme.colors.status.error} />
                </Button>
              </View>

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => onDismissInvitation(invitation.id)}
                disabled={isLoading || isProcessing}
                testID={`dismiss-invitation-${invitation.id}`}
              >
                <Text style={styles.dismissButtonText}>
                  {t('invitations.dismiss')}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default InvitationInterface;