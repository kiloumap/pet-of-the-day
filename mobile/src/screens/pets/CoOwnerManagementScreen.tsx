import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plus, Users, UserPlus, MoreVertical, Edit, Trash2, Mail, Calendar, Shield } from 'lucide-react-native';

import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import {
  fetchCoOwnerRelationships,
  revokeCoOwnerRelationship,
  showInviteModal,
  CoOwnerRelationship,
  CoOwnerType,
  RelationshipStatus,
} from '../../store/slices/sharingSlice';
import { CoOwnerInviteModal } from '../../components/sharing/CoOwnerInviteModal';

interface CoOwnerManagementScreenProps {
  route: {
    params: {
      petId: string;
      petName: string;
      petBreed?: string;
      petPhotoUrl?: string;
    };
  };
  navigation: any;
}

export const CoOwnerManagementScreen: React.FC<CoOwnerManagementScreenProps> = ({
  route,
  navigation,
}) => {
  const { petId, petName, petBreed, petPhotoUrl } = route.params;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const {
    coOwnerRelationships,
    isLoading,
    error,
    inviteModalVisible,
    selectedPetId,
  } = useAppSelector((state) => state.sharing);

  const [showActions, setShowActions] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    petInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    petInfoContent: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    petName: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    petBreed: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    headerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    inviteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    inviteButtonText: {
      marginLeft: theme.spacing.xs,
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },
    relationshipCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderLeftWidth: 4,
    },
    acceptedCard: {
      borderLeftColor: theme.colors.success,
    },
    pendingCard: {
      borderLeftColor: theme.colors.warning,
    },
    rejectedCard: {
      borderLeftColor: theme.colors.error,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    userInfo: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    moreButton: {
      padding: theme.spacing.xs,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    metaText: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginLeft: theme.spacing.xs,
    },
    relationshipBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      alignSelf: 'flex-start',
    },
    coOwnerBadge: {
      backgroundColor: theme.colors.success + '20',
    },
    viewerBadge: {
      backgroundColor: theme.colors.info + '20',
    },
    caretakerBadge: {
      backgroundColor: theme.colors.warning + '20',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '500',
    },
    coOwnerBadgeText: {
      color: theme.colors.success,
    },
    viewerBadgeText: {
      color: theme.colors.info,
    },
    caretakerBadgeText: {
      color: theme.colors.warning,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      marginLeft: theme.spacing.sm,
    },
    acceptedStatusBadge: {
      backgroundColor: theme.colors.success + '20',
    },
    pendingStatusBadge: {
      backgroundColor: theme.colors.warning + '20',
    },
    rejectedStatusBadge: {
      backgroundColor: theme.colors.error + '20',
    },
    statusText: {
      fontSize: 10,
      fontWeight: '500',
    },
    acceptedStatusText: {
      color: theme.colors.success,
    },
    pendingStatusText: {
      color: theme.colors.warning,
    },
    rejectedStatusText: {
      color: theme.colors.error,
    },
    actionsMenu: {
      position: 'absolute',
      right: 0,
      top: 30,
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
      zIndex: 1000,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minWidth: 150,
    },
    actionButtonText: {
      marginLeft: theme.spacing.sm,
      fontSize: 14,
      color: theme.colors.text.primary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyStateIcon: {
      marginBottom: theme.spacing.md,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyStateDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: theme.spacing.lg,
    },
    emptyStateButton: {
      paddingHorizontal: theme.spacing.lg,
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '20',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      margin: theme.spacing.md,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      textAlign: 'center',
    },
  });

  useEffect(() => {
    if (petId) {
      loadCoOwnerRelationships();
    }
  }, [petId]);

  const loadCoOwnerRelationships = async () => {
    try {
      await dispatch(fetchCoOwnerRelationships(petId)).unwrap();
    } catch (error) {
      console.error('Failed to load co-owner relationships:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCoOwnerRelationships();
    setRefreshing(false);
  };

  const handleInviteCoOwner = () => {
    dispatch(showInviteModal(petId));
  };

  const handleRevokeRelationship = (relationship: CoOwnerRelationship) => {
    Alert.alert(
      t('sharing.coOwnership.revokeAccess'),
      t('sharing.coOwnership.confirmRevoke', {
        name: `${relationship.user?.firstName} ${relationship.user?.lastName}`,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('sharing.coOwnership.revokeAccess'),
          style: 'destructive',
          onPress: () => revokeRelationship(relationship.id),
        },
      ]
    );
  };

  const revokeRelationship = async (relationshipId: string) => {
    try {
      await dispatch(revokeCoOwnerRelationship({ relationshipId })).unwrap();
      setShowActions(null);
    } catch (error) {
      console.error('Failed to revoke co-owner relationship:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getRelationshipBadgeStyle = (type: CoOwnerType) => {
    switch (type) {
      case CoOwnerType.CO_OWNER:
        return [styles.relationshipBadge, styles.coOwnerBadge];
      case CoOwnerType.VIEWER:
        return [styles.relationshipBadge, styles.viewerBadge];
      case CoOwnerType.CARETAKER:
        return [styles.relationshipBadge, styles.caretakerBadge];
    }
  };

  const getRelationshipBadgeTextStyle = (type: CoOwnerType) => {
    switch (type) {
      case CoOwnerType.CO_OWNER:
        return [styles.badgeText, styles.coOwnerBadgeText];
      case CoOwnerType.VIEWER:
        return [styles.badgeText, styles.viewerBadgeText];
      case CoOwnerType.CARETAKER:
        return [styles.badgeText, styles.caretakerBadgeText];
    }
  };

  const getStatusBadgeStyle = (status: RelationshipStatus) => {
    switch (status) {
      case RelationshipStatus.ACCEPTED:
        return [styles.statusBadge, styles.acceptedStatusBadge];
      case RelationshipStatus.PENDING:
        return [styles.statusBadge, styles.pendingStatusBadge];
      case RelationshipStatus.REJECTED:
        return [styles.statusBadge, styles.rejectedStatusBadge];
    }
  };

  const getStatusBadgeTextStyle = (status: RelationshipStatus) => {
    switch (status) {
      case RelationshipStatus.ACCEPTED:
        return [styles.statusText, styles.acceptedStatusText];
      case RelationshipStatus.PENDING:
        return [styles.statusText, styles.pendingStatusText];
      case RelationshipStatus.REJECTED:
        return [styles.statusText, styles.rejectedStatusText];
    }
  };

  const getCardStyle = (status: RelationshipStatus) => {
    switch (status) {
      case RelationshipStatus.ACCEPTED:
        return [styles.relationshipCard, styles.acceptedCard];
      case RelationshipStatus.PENDING:
        return [styles.relationshipCard, styles.pendingCard];
      case RelationshipStatus.REJECTED:
        return [styles.relationshipCard, styles.rejectedCard];
    }
  };

  const renderRelationship = ({ item }: { item: CoOwnerRelationship }) => (
    <View style={getCardStyle(item.status)}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.user?.firstName} {item.user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{item.user?.email}</Text>
        </View>

        <Button
          variant="ghost"
          size="sm"
          onPress={() => setShowActions(showActions === item.id ? null : item.id)}
          style={styles.moreButton}
        >
          <MoreVertical size={16} color={theme.colors.text.secondary} />
        </Button>

        {showActions === item.id && item.status === RelationshipStatus.ACCEPTED && (
          <View style={styles.actionsMenu}>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                setShowActions(null);
                // Handle edit relationship type
              }}
              style={styles.actionButton}
            >
              <Edit size={14} color={theme.colors.text.primary} />
              <Text style={styles.actionButtonText}>{t('common.edit')}</Text>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                setShowActions(null);
                handleRevokeRelationship(item);
              }}
              style={styles.actionButton}
            >
              <Trash2 size={14} color={theme.colors.error} />
              <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                {t('sharing.coOwnership.revokeAccess')}
              </Text>
            </Button>
          </View>
        )}
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Users size={12} color={theme.colors.text.secondary} />
          <Text style={styles.metaText}>
            {formatDate(item.invitedAt)}
          </Text>
        </View>
        {item.acceptedAt && (
          <View style={styles.metaItem}>
            <Calendar size={12} color={theme.colors.text.secondary} />
            <Text style={styles.metaText}>
              {t('common.accepted')} {formatDate(item.acceptedAt)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardMeta}>
        <View style={getRelationshipBadgeStyle(item.relationshipType)}>
          <Text style={getRelationshipBadgeTextStyle(item.relationshipType)}>
            {t(`sharing.coOwnership.types.${item.relationshipType}.title`)}
          </Text>
        </View>
        <View style={getStatusBadgeStyle(item.status)}>
          <Text style={getStatusBadgeTextStyle(item.status)}>
            {t(`sharing.status.${item.status}`)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Users size={48} color={theme.colors.text.secondary} />
      </View>
      <Text style={styles.emptyStateTitle}>
        {t('sharing.coOwnership.noCoOwners')}
      </Text>
      <Text style={styles.emptyStateDescription}>
        {t('sharing.coOwnership.noCoOwnersDescription', { petName })}
      </Text>
      <Button
        variant="primary"
        onPress={handleInviteCoOwner}
        style={styles.emptyStateButton}
      >
        <UserPlus size={16} color={theme.colors.white} />
        <Text style={{ marginLeft: theme.spacing.sm, color: theme.colors.white }}>
          {t('sharing.coOwnership.inviteCoOwner')}
        </Text>
      </Button>
    </View>
  );

  // Filter relationships for this pet
  const petRelationships = coOwnerRelationships.filter(rel => rel.petId === petId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.petInfo}>
          <Shield size={24} color={theme.colors.primary} />
          <View style={styles.petInfoContent}>
            <Text style={styles.petName}>{petName}</Text>
            {petBreed && <Text style={styles.petBreed}>{petBreed}</Text>}
          </View>
        </View>

        <View style={styles.headerActions}>
          <Text style={styles.sectionTitle}>
            {t('sharing.coOwnership.coOwners')}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={handleInviteCoOwner}
            style={styles.inviteButton}
          >
            <Plus size={16} color={theme.colors.primary} />
            <Text style={styles.inviteButtonText}>
              {t('sharing.coOwnership.invite')}
            </Text>
          </Button>
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {petRelationships.length === 0 && !isLoading ? (
          renderEmptyState()
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={petRelationships}
            renderItem={renderRelationship}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}
      </View>

      {/* Co-Owner Invite Modal */}
      <CoOwnerInviteModal
        visible={inviteModalVisible}
        petId={selectedPetId}
        petName={petName}
        onClose={() => dispatch({ type: 'sharing/hideInviteModal' })}
      />
    </View>
  );
};