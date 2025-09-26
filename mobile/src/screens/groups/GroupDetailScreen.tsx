import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ArrowLeft, Edit3, Trash2, Copy, Share as ShareIcon } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dropdown, DropdownOption } from '../../components/ui/Dropdown';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ErrorHandler } from '../../utils/errorHandler';
import {
  fetchGroup,
  fetchGroupMembers,
  updateGroup,
  deleteGroup,
  leaveGroup,
  updateMembershipPets,
  clearError,
  clearCurrentGroup,
} from '../../store/groupSlice';
import { fetchPets } from '../../store/petSlice';
import { GroupsStackParamList } from '../../navigation/MainNavigator';
import PetCheckboxSelector from '../../components/PetCheckboxSelector';

type GroupDetailScreenRouteProp = RouteProp<GroupsStackParamList, 'GroupDetail'>;

const GroupDetailScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<GroupDetailScreenRouteProp>();
  const dispatch = useAppDispatch();

  const { groupId } = route.params;

  const {
    currentGroup,
    currentGroupMembers,
    currentGroupInvitations,
    isCreator,
    userMembership,
    isLoading,
    isLeaving,
    isUpdatingPets,
    error,
  } = useAppSelector((state) => state.groups);

  const { pets } = useAppSelector((state) => state.pets);
  const { user } = useAppSelector((state) => state.auth);

  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPets, setIsEditingPets] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'private' as 'private' | 'public',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
      dispatch(fetchGroupMembers(groupId));
    }

    // Fetch user's pets
    dispatch(fetchPets());

    return () => {
      dispatch(clearCurrentGroup());
    };
  }, [dispatch, groupId]);

  useEffect(() => {
    if (userMembership?.pet_ids) {
      setSelectedPetIds(userMembership.pet_ids);
    }
  }, [userMembership]);

  useEffect(() => {
    if (currentGroup) {
      setFormData({
        name: currentGroup.name || '',
        description: currentGroup.description || '',
        privacy: currentGroup.privacy === 'public' ? 'public' : 'private',
      });
    }
  }, [currentGroup]);

  useEffect(() => {
    if (error) {
      const formErrors = ErrorHandler.handleValidationErrors(error);
      if (formErrors._general) {
        setGeneralError(formErrors._general);
      } else {
        setErrors(formErrors);
      }
    }
  }, [error]);

  const handleRefresh = () => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
      dispatch(fetchGroupMembers(groupId));
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      t('groups.leaveGroup'),
      'Are you sure you want to leave this group?',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('groups.leaveGroup'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(leaveGroup(groupId)).unwrap();
              Alert.alert(
                t('common.success'),
                t('groups.success.groupLeft'),
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
          },
        },
      ]
    );
  };

  const privacyOptions: DropdownOption[] = [
    { value: 'private', label: t('groups.privacy.private') },
    { value: 'public', label: t('groups.privacy.public') },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('groups.validations.nameRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('groups.validations.descriptionRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !currentGroup) return;

    try {
      await dispatch(updateGroup({
        groupId: currentGroup.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        privacy: formData.privacy,
      })).unwrap();
      setIsEditing(false);
      Alert.alert(t('common.success'), t('groups.success.groupUpdated'));
    } catch (error) {
      // Error is already handled by Redux and shown in useEffect
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('groups.deleteConfirmTitle'),
      t('groups.deleteConfirmMessage', { name: currentGroup?.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteGroup(groupId)).unwrap();
              navigation.navigate('Groups' as never);
            } catch (error) {
              // Error is already handled by Redux
            }
          },
        },
      ]
    );
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data when canceling edit
      if (currentGroup) {
        setFormData({
          name: currentGroup.name || '',
          description: currentGroup.description || '',
          privacy: currentGroup.privacy === 'public' ? 'public' : 'private',
        });
      }
      setErrors({});
      setGeneralError('');
    }
    setIsEditing(!isEditing);
  };

  const handlePetSelectionChange = (petIds: string[]) => {
    setSelectedPetIds(petIds);
  };

  const handleSavePets = async () => {
    if (!currentGroup) return;

    try {
      await dispatch(updateMembershipPets({
        groupId: currentGroup.id,
        pet_ids: selectedPetIds,
      })).unwrap();

      setIsEditingPets(false);
      Alert.alert(
        t('common.success'),
        t('groups.success.petsUpdated')
      );
    } catch (error) {
      // Error handling is done through Redux and useEffect
    }
  };

  const handleEditPetsToggle = () => {
    if (isEditingPets) {
      // Reset to original pet selection
      if (userMembership?.pet_ids) {
        setSelectedPetIds(userMembership.pet_ids);
      }
    }
    setIsEditingPets(!isEditingPets);
  };

  const handleViewLeaderboard = () => {
    (navigation as any).navigate('Leaderboard', { groupId });
  };

  const handleAddAction = () => {
    (navigation as any).navigate('AddAction', { groupId });
  };

  const handleCopyInviteCode = async () => {
    const codeInvitation = currentGroupInvitations.find(inv => inv.invite_type === 'code');
    if (codeInvitation?.invite_code) {
      await Clipboard.setStringAsync(codeInvitation.invite_code);
      Alert.alert(t('common.success'), t('groups.inviteCodeCopied'));
    }
  };

  const handleShareInviteCode = async () => {
    const codeInvitation = currentGroupInvitations.find(inv => inv.invite_type === 'code');
    if (codeInvitation?.invite_code) {
      try {
        await Share.share({
          message: t('groups.shareInviteMessage', {
            groupName: currentGroup?.name,
            inviteCode: codeInvitation.invite_code
          }),
          title: t('groups.shareInviteTitle'),
        });
      } catch (error) {
        console.error('Error sharing invite code:', error);
        Alert.alert(t('common.error'), t('common.genericError'));
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
    headerActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      padding: theme.spacing.sm,
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 16,
    },
    groupInfoSection: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    groupName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      flex: 1,
      marginRight: 12,
    },
    adminBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    adminText: {
      color: theme.colors.reverse,
      fontSize: 12,
      fontWeight: '600',
    },
    groupDescription: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      lineHeight: 24,
      marginBottom: 16,
    },
    groupMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaItem: {
      alignItems: 'center',
    },
    metaValue: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    metaLabel: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    section: {
      marginBottom: theme.spacing['2xl'],
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      ...theme.typography.styles.h3,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.lg,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    saveButtonText: {
      color: theme.colors.reverse,
      fontSize: 14,
      fontWeight: '600',
    },
    petCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    petCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    petInfo: {
      flex: 1,
      marginLeft: 12,
    },
    petName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    petSpecies: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
    memberCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    memberInfo: {
      flex: 1,
      marginLeft: 12,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    memberDate: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    petCount: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.tertiary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    emptyState: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    leaveButton: {
      backgroundColor: theme.colors.status.error,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 16,
    },
    leaveButtonText: {
      color: theme.colors.reverse,
      fontSize: 16,
      fontWeight: '600',
    },
    pointsActions: {
      gap: 12,
    },
    pointsButton: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pointsButtonContent: {
      flex: 1,
      marginLeft: 12,
    },
    pointsButtonTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    pointsButtonSubtitle: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    infoRow: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      ...theme.typography.styles.label,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    value: {
      ...theme.typography.styles.body,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.sm,
    },
    helpText: {
      ...theme.typography.styles.caption,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
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
    saveButtonSecondary: {
      flex: 1,
    },
    petActionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    petIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    speciesEmoji: {
      fontSize: 20,
    },
    emptySubtext: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginTop: 4,
    },
    inviteSection: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inviteCodeContainer: {
      backgroundColor: theme.colors.background.tertiary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inviteCodeText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      flex: 1,
      fontFamily: 'monospace',
      letterSpacing: 2,
    },
    inviteActions: {
      flexDirection: 'row',
      gap: 12,
    },
    inviteButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    inviteButtonSecondary: {
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inviteButtonText: {
      color: theme.colors.reverse,
      fontSize: 14,
      fontWeight: '600',
    },
    inviteButtonTextSecondary: {
      color: theme.colors.text.primary,
    },
  });

  if (!currentGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: theme.colors.text.secondary }}>Loading group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? t('groups.editGroup') : currentGroup.name}
        </Text>
        {isCreator && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => (navigation as any).navigate('InviteToGroup', { groupId, groupName: currentGroup.name })}
            >
              <MaterialIcons name="person-add" size={20} color={theme.colors.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleEditToggle}>
              <Edit3 size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Trash2 size={20} color={theme.colors.status.error} />
            </TouchableOpacity>
          </View>
        )}
        {!isCreator && <View style={styles.headerButton} />}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {generalError ? <ErrorMessage message={generalError} /> : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('groups.basicInfo')}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('groups.groupName')}</Text>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChangeText={(value) => handleFieldChange('name', value)}
                  placeholder={t('groups.placeholders.groupName')}
                  error={errors.name}
                  maxLength={100}
                />
              ) : (
                <Text style={styles.value}>{currentGroup.name}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('groups.groupDescription')}</Text>
              {isEditing ? (
                <Input
                  value={formData.description}
                  onChangeText={(value) => handleFieldChange('description', value)}
                  placeholder={t('groups.placeholders.description')}
                  error={errors.description}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              ) : (
                <Text style={styles.value}>{currentGroup.description}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('groups.privacy.title')}</Text>
              {isEditing ? (
                <Dropdown
                  value={formData.privacy}
                  onSelect={(value) => handleFieldChange('privacy', value)}
                  options={privacyOptions}
                  placeholder={t('groups.privacy.title')}
                  error={errors.privacy}
                />
              ) : (
                <View>
                  <Text style={styles.value}>{t(`groups.privacy.${currentGroup.privacy}`)}</Text>
                  <Text style={styles.helpText}>
                    {t(`groups.privacy.${currentGroup.privacy}Description`)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('groups.members')}</Text>
              <Text style={styles.value}>{currentGroupMembers.length}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('common.addedOn')}</Text>
              <Text style={styles.value}>{formatDate(currentGroup.created_at)}</Text>
            </View>

            {isCreator && isEditing && (
              <View style={styles.buttonContainer}>
                <Button
                  title={t('common.cancel')}
                  onPress={handleEditToggle}
                  style={styles.cancelButton}
                  variant="outline"
                />
                <Button
                  title={t('common.save')}
                  onPress={handleSave}
                  style={styles.saveButton}
                  loading={isLoading}
                />
              </View>
            )}
          </View>

          {currentGroupInvitations.length > 0 && (
            <View style={styles.inviteSection}>
              <Text style={styles.sectionTitle}>{t('groups.inviteCode')}</Text>
              {currentGroupInvitations
                .filter(inv => inv.invite_type === 'code')
                .map((invitation) => (
                  <View key={invitation.id}>
                    <View style={styles.inviteCodeContainer}>
                      <Text style={styles.inviteCodeText}>
                        {invitation.invite_code}
                      </Text>
                    </View>
                    <View style={styles.inviteActions}>
                      <TouchableOpacity
                        style={[styles.inviteButton, styles.inviteButtonSecondary]}
                        onPress={handleCopyInviteCode}
                      >
                        <Copy size={16} color={theme.colors.text.primary} />
                        <Text style={[styles.inviteButtonText, styles.inviteButtonTextSecondary]}>
                          {t('groups.copyCode')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inviteButton}
                        onPress={handleShareInviteCode}
                      >
                        <ShareIcon size={16} color={theme.colors.reverse} />
                        <Text style={styles.inviteButtonText}>
                          {t('groups.shareCode')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          )}

        {userMembership && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points & Competition</Text>

            <View style={styles.pointsActions}>
              <TouchableOpacity
                style={styles.pointsButton}
                onPress={handleViewLeaderboard}
              >
                <MaterialIcons name="emoji-events" size={24} color={theme.colors.primary} />
                <View style={styles.pointsButtonContent}>
                  <Text style={styles.pointsButtonTitle}>Leaderboard</Text>
                  <Text style={styles.pointsButtonSubtitle}>See who's leading</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.tertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pointsButton}
                onPress={handleAddAction}
              >
                <MaterialIcons name="add-circle" size={24} color={theme.colors.success} />
                <View style={styles.pointsButtonContent}>
                  <Text style={styles.pointsButtonTitle}>Record Action</Text>
                  <Text style={styles.pointsButtonSubtitle}>Add points for your pets</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {userMembership && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('groups.manageMyPets')}</Text>
              {isEditingPets ? (
                <View style={styles.petActionButtons}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.colors.text.secondary }]}
                    onPress={handleEditPetsToggle}
                  >
                    <Text style={styles.saveButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { opacity: isUpdatingPets ? 0.6 : 1 }]}
                    onPress={handleSavePets}
                    disabled={isUpdatingPets}
                  >
                    <Text style={styles.saveButtonText}>
                      {isUpdatingPets ? t('common.loading') : t('common.save')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.saveButton} onPress={handleEditPetsToggle}>
                  <Text style={styles.saveButtonText}>{t('common.edit')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditingPets ? (
              <PetCheckboxSelector
                pets={pets}
                selectedPetIds={selectedPetIds}
                onSelectionChange={handlePetSelectionChange}
                title=""
                disabled={isUpdatingPets}
              />
            ) : (
              <View>
                {selectedPetIds.length > 0 ? (
                  <View>
                    {pets
                      .filter(pet => selectedPetIds.includes(pet.id))
                      .map((pet) => (
                        <View key={pet.id} style={styles.petCard}>
                          <View style={styles.petIcon}>
                            <Text style={styles.speciesEmoji}>
                              {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'}
                            </Text>
                          </View>
                          <View style={styles.petInfo}>
                            <Text style={styles.petName}>{pet.name}</Text>
                            <Text style={styles.petSpecies}>
                              {pet.species === 'dog' ? 'Chien' : pet.species === 'cat' ? 'Chat' : pet.species}
                              {pet.breed && ` • ${pet.breed}`}
                            </Text>
                          </View>
                        </View>
                      ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                      {t('groups.noPetsInGroup')}
                    </Text>
                    <Text style={styles.emptySubtext}>
                      {t('groups.addPetsToGroup')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('groups.members')}</Text>
          {currentGroupMembers.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <MaterialIcons name="person" size={24} color={theme.colors.text.secondary} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.user_id === user?.id ? 'You' : `User ${member.user_id}`}
                </Text>
                <Text style={styles.memberDate}>
                  Joined {formatDate(member.joined_at)}
                </Text>
              </View>
              {member.pet_ids && member.pet_ids.length > 0 && (
                <Text style={styles.petCount}>
                  {member.pet_ids.length} {member.pet_ids.length === 1 ? 'pet' : 'pets'}
                </Text>
              )}
            </View>
          ))}
        </View>

        {userMembership && !isCreator && (
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveGroup}
            disabled={isLeaving}
          >
            <Text style={styles.leaveButtonText}>
              {isLeaving ? t('common.loading') : t('groups.leaveGroup')}
            </Text>
          </TouchableOpacity>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export { GroupDetailScreen };
export default GroupDetailScreen;