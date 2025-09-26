import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Search, Users, BookOpen, Calendar, Eye, Edit, UserCheck, Heart } from 'lucide-react-native';

import { Text } from '../../components/ui/Text';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import {
  fetchSharedNotebooks,
  fetchPendingInvites,
  acceptCoOwnerInvite,
  rejectCoOwnerInvite,
  SharedNotebook,
  CoOwnerRelationship,
  SharePermission,
  RelationshipStatus,
} from '../../store/slices/sharingSlice';

export const SharedNotebooksScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const {
    sharedNotebooks,
    pendingInvites,
    myCoOwnedPets,
    isLoading,
    error,
  } = useAppSelector((state) => state.sharing);

  const [activeTab, setActiveTab] = useState<'shared' | 'pending' | 'owned'>('shared');
  const [searchQuery, setSearchQuery] = useState('');
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
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    searchContainer: {
      marginBottom: theme.spacing.md,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.xs,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabInactive: {
      backgroundColor: 'transparent',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
    },
    tabTextActive: {
      color: theme.colors.white,
    },
    tabTextInactive: {
      color: theme.colors.text.secondary,
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
    notebookCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderLeftWidth: 4,
    },
    sharedNotebookCard: {
      borderLeftColor: theme.colors.info,
    },
    coOwnedNotebookCard: {
      borderLeftColor: theme.colors.success,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    petInfo: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    petName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    petBreed: {
      fontSize: 14,
      color: theme.colors.text.secondary,
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
    permissionBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      marginLeft: theme.spacing.sm,
    },
    permissionBadgeViewOnly: {
      backgroundColor: theme.colors.info + '20',
    },
    permissionBadgeEdit: {
      backgroundColor: theme.colors.warning + '20',
    },
    permissionBadgeAdmin: {
      backgroundColor: theme.colors.success + '20',
    },
    permissionText: {
      fontSize: 10,
      fontWeight: '500',
    },
    permissionTextViewOnly: {
      color: theme.colors.info,
    },
    permissionTextEdit: {
      color: theme.colors.warning,
    },
    permissionTextAdmin: {
      color: theme.colors.success,
    },
    cardDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
    inviteCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.warning,
    },
    inviteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    inviteInfo: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    inviteTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    inviteFrom: {
      fontSize: 12,
      color: theme.colors.text.secondary,
    },
    inviteActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: theme.spacing.sm,
    },
    inviteButton: {
      marginLeft: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchSharedNotebooks()).unwrap(),
        dispatch(fetchPendingInvites()).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load shared notebooks data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptInvite = async (relationshipId: string) => {
    try {
      await dispatch(acceptCoOwnerInvite({ relationshipId })).unwrap();
    } catch (error) {
      console.error('Failed to accept invite:', error);
    }
  };

  const handleRejectInvite = async (relationshipId: string) => {
    try {
      await dispatch(rejectCoOwnerInvite(relationshipId)).unwrap();
    } catch (error) {
      console.error('Failed to reject invite:', error);
    }
  };

  const getPermissionBadgeStyle = (permission: SharePermission) => {
    switch (permission) {
      case SharePermission.VIEW_ONLY:
        return [styles.permissionBadge, styles.permissionBadgeViewOnly];
      case SharePermission.EDIT:
        return [styles.permissionBadge, styles.permissionBadgeEdit];
      case SharePermission.ADMIN:
        return [styles.permissionBadge, styles.permissionBadgeAdmin];
    }
  };

  const getPermissionTextStyle = (permission: SharePermission) => {
    switch (permission) {
      case SharePermission.VIEW_ONLY:
        return [styles.permissionText, styles.permissionTextViewOnly];
      case SharePermission.EDIT:
        return [styles.permissionText, styles.permissionTextEdit];
      case SharePermission.ADMIN:
        return [styles.permissionText, styles.permissionTextAdmin];
    }
  };

  const getPermissionIcon = (permission: SharePermission) => {
    switch (permission) {
      case SharePermission.VIEW_ONLY:
        return <Eye size={12} color={theme.colors.info} />;
      case SharePermission.EDIT:
        return <Edit size={12} color={theme.colors.warning} />;
      case SharePermission.ADMIN:
        return <UserCheck size={12} color={theme.colors.success} />;
    }
  };

  const getPermissionLabel = (permission: SharePermission) => {
    return t(`sharing.permissions.${permission.replace('_', '')}.title`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const filteredSharedNotebooks = sharedNotebooks.filter(notebook =>
    notebook.petName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingInvites = pendingInvites.filter(invite =>
    invite.user?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invite.user?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCoOwnedPets = myCoOwnedPets.filter(pet =>
    pet.petName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSharedNotebook = ({ item }: { item: SharedNotebook }) => {
    const userShare = item.shares[0]; // Assuming current user's share is first
    const hasPermission = userShare?.permission || SharePermission.VIEW_ONLY;

    return (
      <View style={[styles.notebookCard, styles.sharedNotebookCard]}>
        <View style={styles.cardHeader}>
          <Heart size={20} color={theme.colors.info} />
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{item.petName}</Text>
            {item.pet?.breed && (
              <Text style={styles.petBreed}>{item.pet.breed}</Text>
            )}
          </View>
          <View style={getPermissionBadgeStyle(hasPermission)}>
            <Text style={getPermissionTextStyle(hasPermission)}>
              {getPermissionLabel(hasPermission)}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <BookOpen size={12} color={theme.colors.text.secondary} />
            <Text style={styles.metaText}>
              {item.totalEntries} {t('notebook.entries')}
            </Text>
          </View>
          {item.lastEntryDate && (
            <View style={styles.metaItem}>
              <Calendar size={12} color={theme.colors.text.secondary} />
              <Text style={styles.metaText}>
                {formatDate(item.lastEntryDate)}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Users size={12} color={theme.colors.text.secondary} />
            <Text style={styles.metaText}>
              {item.shares.length} {t('sharing.shared')}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>
          {t('sharing.sharedWith')} {item.shares.length === 1 ? t('sharing.person') : t('sharing.people')}
        </Text>
      </View>
    );
  };

  const renderPendingInvite = ({ item }: { item: CoOwnerRelationship }) => (
    <View style={styles.inviteCard}>
      <View style={styles.inviteHeader}>
        <Users size={20} color={theme.colors.warning} />
        <View style={styles.inviteInfo}>
          <Text style={styles.inviteTitle}>
            {t('sharing.coOwnership.inviteFrom')} {item.user?.firstName} {item.user?.lastName}
          </Text>
          <Text style={styles.inviteFrom}>
            {t('sharing.coOwnership.relationshipType')}: {t(`sharing.coOwnership.types.${item.relationshipType}.title`)}
          </Text>
        </View>
      </View>

      <Text style={styles.cardDescription}>
        {t('sharing.coOwnership.invitedOn')} {formatDate(item.invitedAt)}
      </Text>

      <View style={styles.inviteActions}>
        <Button
          variant="outline"
          size="sm"
          onPress={() => handleRejectInvite(item.id)}
          style={styles.inviteButton}
        >
          {t('sharing.coOwnership.rejectInvite')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={() => handleAcceptInvite(item.id)}
          style={styles.inviteButton}
        >
          {t('sharing.coOwnership.acceptInvite')}
        </Button>
      </View>
    </View>
  );

  const renderCoOwnedPet = ({ item }: { item: SharedNotebook }) => (
    <View style={[styles.notebookCard, styles.coOwnedNotebookCard]}>
      <View style={styles.cardHeader}>
        <Heart size={20} color={theme.colors.success} />
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{item.petName}</Text>
          {item.pet?.breed && (
            <Text style={styles.petBreed}>{item.pet.breed}</Text>
          )}
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <BookOpen size={12} color={theme.colors.text.secondary} />
          <Text style={styles.metaText}>
            {item.totalEntries} {t('notebook.entries')}
          </Text>
        </View>
        {item.lastEntryDate && (
          <View style={styles.metaItem}>
            <Calendar size={12} color={theme.colors.text.secondary} />
            <Text style={styles.metaText}>
              {formatDate(item.lastEntryDate)}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.cardDescription}>
        {t('sharing.coOwnership.managePet', { petName: item.petName })}
      </Text>
    </View>
  );

  const renderEmptyState = (type: 'shared' | 'pending' | 'owned') => {
    const config = {
      shared: {
        icon: <BookOpen size={48} color={theme.colors.text.secondary} />,
        title: t('sharing.empty.noSharedNotebooks'),
        description: t('sharing.empty.noSharedNotebooksDescription'),
      },
      pending: {
        icon: <Users size={48} color={theme.colors.text.secondary} />,
        title: t('sharing.empty.noPendingInvites'),
        description: t('sharing.empty.noPendingInvitesDescription'),
      },
      owned: {
        icon: <Heart size={48} color={theme.colors.text.secondary} />,
        title: t('sharing.empty.noCoOwnedPets'),
        description: t('sharing.empty.noCoOwnedPetsDescription'),
      },
    };

    const { icon, title, description } = config[type];

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyStateIcon}>
          {icon}
        </View>
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyStateDescription}>{description}</Text>
      </View>
    );
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'shared':
        return filteredSharedNotebooks;
      case 'pending':
        return filteredPendingInvites;
      case 'owned':
        return filteredCoOwnedPets;
    }
  };

  const getCurrentRenderItem = () => {
    switch (activeTab) {
      case 'shared':
        return renderSharedNotebook;
      case 'pending':
        return renderPendingInvite;
      case 'owned':
        return renderCoOwnedPet;
    }
  };

  const currentData = getCurrentData();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('sharing.sharedNotebooks')}</Text>

        <View style={styles.searchContainer}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('sharing.searchPlaceholder')}
            leftIcon={<Search size={16} color={theme.colors.text.secondary} />}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setActiveTab('shared')}
            style={[styles.tab, activeTab === 'shared' ? styles.tabActive : styles.tabInactive] as any}
          >
            <Text style={[styles.tabText, activeTab === 'shared' ? styles.tabTextActive : styles.tabTextInactive]}>
              {t('sharing.tabs.shared')}
            </Text>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onPress={() => setActiveTab('pending')}
            style={[styles.tab, activeTab === 'pending' ? styles.tabActive : styles.tabInactive] as any}
          >
            <Text style={[styles.tabText, activeTab === 'pending' ? styles.tabTextActive : styles.tabTextInactive]}>
              {t('sharing.tabs.pending')} {pendingInvites.length > 0 && `(${pendingInvites.length})`}
            </Text>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onPress={() => setActiveTab('owned')}
            style={[styles.tab, activeTab === 'owned' ? styles.tabActive : styles.tabInactive] as any}
          >
            <Text style={[styles.tabText, activeTab === 'owned' ? styles.tabTextActive : styles.tabTextInactive]}>
              {t('sharing.tabs.coOwned')}
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
        {currentData.length === 0 && !isLoading ? (
          renderEmptyState(activeTab)
        ) : (
          <FlatList<any>
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={currentData}
            renderItem={getCurrentRenderItem()}
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
    </View>
  );
};