import React, { useState } from 'react';
import { View, StyleSheet, Modal, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { X, Mail, Users, Eye, UserCheck, UserPlus, Shield, Heart } from 'lucide-react-native';

import { Text } from '../ui/Text';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import {
  inviteCoOwner,
  hideInviteModal,
  CoOwnerType,
  InviteCoOwnerRequest,
  clearError,
} from '../../store/slices/sharingSlice';

interface CoOwnerInviteModalProps {
  visible: boolean;
  petId: string | null;
  petName?: string;
  onClose: () => void;
}

export const CoOwnerInviteModal: React.FC<CoOwnerInviteModalProps> = ({
  visible,
  petId,
  petName,
  onClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const { isInviting, error } = useAppSelector((state) => state.sharing);

  const [formData, setFormData] = useState({
    userEmail: '',
    relationshipType: CoOwnerType.VIEWER,
    message: '',
  });

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      flex: 1,
      marginRight: theme.spacing.md,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    content: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
    },
    relationshipOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
    },
    relationshipOptionSelected: {
      backgroundColor: theme.colors.primary + '10',
      borderColor: theme.colors.primary,
    },
    relationshipOptionUnselected: {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border,
    },
    relationshipIcon: {
      marginRight: theme.spacing.md,
    },
    relationshipContent: {
      flex: 1,
    },
    relationshipTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    relationshipDescription: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      lineHeight: 16,
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '20',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    footerButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    petInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.lg,
    },
    petInfoText: {
      fontSize: 14,
      color: theme.colors.text.primary,
      marginLeft: theme.spacing.sm,
    },
    permissionsInfo: {
      backgroundColor: theme.colors.info + '10',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.md,
    },
    permissionsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.info,
      marginBottom: theme.spacing.sm,
    },
    permissionsList: {
      marginLeft: theme.spacing.md,
    },
    permissionItem: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      lineHeight: 18,
      marginBottom: theme.spacing.xs,
    },
  });

  const relationshipTypeOptions = [
    {
      value: CoOwnerType.VIEWER,
      icon: <Eye size={20} color={theme.colors.info} />,
      title: t('sharing.coOwnership.types.viewer.title'),
      description: t('sharing.coOwnership.types.viewer.description'),
      permissions: [
        t('sharing.coOwnership.permissions.viewer.viewPetInfo'),
        t('sharing.coOwnership.permissions.viewer.viewNotebook'),
        t('sharing.coOwnership.permissions.viewer.noEdit'),
      ],
    },
    {
      value: CoOwnerType.CARETAKER,
      icon: <Heart size={20} color={theme.colors.warning} />,
      title: t('sharing.coOwnership.types.caretaker.title'),
      description: t('sharing.coOwnership.types.caretaker.description'),
      permissions: [
        t('sharing.coOwnership.permissions.caretaker.viewPetInfo'),
        t('sharing.coOwnership.permissions.caretaker.addEntries'),
        t('sharing.coOwnership.permissions.caretaker.editBasicInfo'),
        t('sharing.coOwnership.permissions.caretaker.noMedical'),
      ],
    },
    {
      value: CoOwnerType.CO_OWNER,
      icon: <UserCheck size={20} color={theme.colors.success} />,
      title: t('sharing.coOwnership.types.coOwner.title'),
      description: t('sharing.coOwnership.types.coOwner.description'),
      permissions: [
        t('sharing.coOwnership.permissions.coOwner.fullAccess'),
        t('sharing.coOwnership.permissions.coOwner.medicalDecisions'),
        t('sharing.coOwnership.permissions.coOwner.shareNotebook'),
        t('sharing.coOwnership.permissions.coOwner.inviteOthers'),
      ],
    },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRelationshipTypeSelect = (relationshipType: CoOwnerType) => {
    handleInputChange('relationshipType', relationshipType);
  };

  const validateForm = (): boolean => {
    if (!formData.userEmail.trim()) {
      Alert.alert(t('common.error'), t('validation.required', { field: t('sharing.userEmail') }));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.userEmail)) {
      Alert.alert(t('common.error'), t('validation.invalidEmail'));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!petId) return;

    if (!validateForm()) return;

    const request: InviteCoOwnerRequest = {
      petId,
      userEmail: formData.userEmail.trim(),
      relationshipType: formData.relationshipType,
      message: formData.message.trim() || undefined,
    };

    try {
      await dispatch(inviteCoOwner(request)).unwrap();
      Alert.alert(
        t('common.success'),
        t('sharing.success.coOwnerInvited', { email: formData.userEmail })
      );
      handleClose();
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleClose = () => {
    setFormData({
      userEmail: '',
      relationshipType: CoOwnerType.VIEWER,
      message: '',
    });
    dispatch(clearError());
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {t('sharing.coOwnership.inviteCoOwner')}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleClose}
              style={styles.closeButton}
            >
              <X size={24} color={theme.colors.text.secondary} />
            </Button>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {/* Pet Info */}
              {petName && (
                <View style={styles.petInfo}>
                  <UserPlus size={16} color={theme.colors.primary} />
                  <Text style={styles.petInfoText}>
                    {t('sharing.coOwnership.invitingCoOwnerFor', { petName })}
                  </Text>
                </View>
              )}

              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* User Email */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('sharing.userEmail')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('sharing.coOwnership.userEmailDescription')}
                </Text>
                <Input
                  value={formData.userEmail}
                  onChangeText={(value) => handleInputChange('userEmail', value)}
                  placeholder={t('sharing.placeholders.userEmail')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Mail size={16} color={theme.colors.text.secondary} />}
                />
              </View>

              {/* Relationship Type Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('sharing.coOwnership.relationshipType')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('sharing.coOwnership.relationshipDescription')}
                </Text>

                {relationshipTypeOptions.map((option) => {
                  const isSelected = formData.relationshipType === option.value;
                  return (
                    <View key={option.value}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => handleRelationshipTypeSelect(option.value)}
                        style={StyleSheet.flatten([
                          styles.relationshipOption,
                          isSelected ? styles.relationshipOptionSelected : styles.relationshipOptionUnselected,
                        ])}
                      >
                        <View style={styles.relationshipIcon}>
                          {option.icon}
                        </View>
                        <View style={styles.relationshipContent}>
                          <Text style={styles.relationshipTitle}>{option.title}</Text>
                          <Text style={styles.relationshipDescription}>{option.description}</Text>
                        </View>
                        {isSelected && (
                          <Shield size={16} color={theme.colors.primary} />
                        )}
                      </Button>

                      {isSelected && (
                        <View style={styles.permissionsInfo}>
                          <Text style={styles.permissionsTitle}>
                            {t('sharing.coOwnership.permissionsIncluded')}
                          </Text>
                          <View style={styles.permissionsList}>
                            {option.permissions.map((permission, index) => (
                              <Text key={index} style={styles.permissionItem}>
                                • {permission}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Optional Message */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('sharing.message')} {t('common.optional')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('sharing.coOwnership.messageDescription')}
                </Text>
                <Input
                  value={formData.message}
                  onChangeText={(value) => handleInputChange('message', value)}
                  placeholder={t('sharing.coOwnership.messagePlaceholder')}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              variant="outline"
              onPress={handleClose}
              style={styles.footerButton}
              disabled={isInviting}
            >
              {t('common.cancel')}
            </Button>

            <Button
              variant="primary"
              onPress={handleSubmit}
              style={styles.footerButton}
              loading={isInviting}
            >
              {t('sharing.coOwnership.sendInvite')}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};