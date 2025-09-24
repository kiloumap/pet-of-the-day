import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme/ThemeContext';
import { fetchUserGroups, clearError } from '../../store/groupSlice';
import { MaterialIcons } from '@expo/vector-icons';

const GroupsScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const {
    createdGroups,
    joinedGroups,
    isLoading,
    error,
  } = useAppSelector((state) => state.groups);

  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserGroups(user.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleRefresh = () => {
    if (user?.id) {
      dispatch(fetchUserGroups(user.id));
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup' as never);
  };

  const handleJoinGroup = () => {
    navigation.navigate('JoinGroup' as never);
  };

  const handleGroupPress = (groupId: string) => {
    navigation.navigate('GroupDetail' as never, { groupId } as never);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 16,
    },
    headerSection: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      marginBottom: 20,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.accent,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    actionButtonSecondary: {
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionButtonText: {
      color: theme.colors.reverse,
      fontWeight: '600',
      fontSize: 16,
    },
    actionButtonTextSecondary: {
      color: theme.colors.reverse,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 12,
    },
    groupCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    groupName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      flex: 1,
      marginRight: 8,
    },
    groupDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    groupMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    groupDate: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
    },
    memberCount: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.tertiary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    emptyContainer: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorContainer: {
      backgroundColor: theme.colors.status.error,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: theme.colors.text.secondary,
      textAlign: 'center',
      fontSize: 14,
    },
  });

  const hasGroups = createdGroups.length > 0 || joinedGroups.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>{t('groups.title')}</Text>
          <Text style={styles.subtitle}>{t('groups.myGroups')}</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCreateGroup}
            >
              <MaterialIcons name="add" size={20} color={theme.colors.reverse} />
              <Text style={styles.actionButtonText}>
                {t('groups.createGroup')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleJoinGroup}
            >
              <MaterialIcons name="group-add" size={20} color={theme.colors.reverse} />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                {t('groups.joinGroup')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!hasGroups ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="group"
              size={64}
              color={theme.colors.text.tertiary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>{t('groups.noGroups')}</Text>
            <Text style={styles.emptySubtitle}>{t('groups.noGroupsSubtitle')}</Text>
          </View>
        ) : (
          <>
            {createdGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('groups.createdGroups')}</Text>
                {createdGroups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupCard}
                    onPress={() => handleGroupPress(group.id)}
                  >
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <MaterialIcons
                        name="admin-panel-settings"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    {group.description && (
                      <Text style={styles.groupDescription}>{group.description}</Text>
                    )}
                    <View style={styles.groupMeta}>
                      <Text style={styles.groupDate}>
                        {t('common.addedOn')} {formatDate(group.created_at)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {joinedGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('groups.joinedGroups')}</Text>
                {joinedGroups.map(({ group, membership }) => (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupCard}
                    onPress={() => handleGroupPress(group.id)}
                  >
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <MaterialIcons
                        name="group"
                        size={20}
                        color={theme.colors.text.secondary}
                      />
                    </View>
                    {group.description && (
                      <Text style={styles.groupDescription}>{group.description}</Text>
                    )}
                    <View style={styles.groupMeta}>
                      <Text style={styles.groupDate}>
                        {t('common.addedOn')} {formatDate(membership.joined_at)}
                      </Text>
                      {membership.pet_ids && (
                        <Text style={styles.memberCount}>
                          {membership.pet_ids.length} {t('pets.myPets').toLowerCase()}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export { GroupsScreen };
export default GroupsScreen;