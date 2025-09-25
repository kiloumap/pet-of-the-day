import React, { useState } from 'react';
import { View, StyleSheet, Modal, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { X, Mail, Shield, Eye, Edit, UserCheck, Share2 } from 'lucide-react-native';

import { Text } from '../ui/Text';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import {
  shareNotebook,
  hideShareModal,
  SharePermission,
  ShareNotebookRequest,
  clearError,
  NotebookShare,
} from '../../store/slices/sharingSlice';

interface ShareNotebookModalProps {
  visible: boolean;
  notebookId: string | null;
  petName?: string;
  currentShares?: NotebookShare[];
  onClose: () => void;
}

export const ShareNotebookModal: React.FC<ShareNotebookModalProps> = ({
  visible,
  notebookId,
  petName,
  currentShares = [],
  onClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const { isSharing, error } = useAppSelector((state) => state.sharing);

  const [formData, setFormData] = useState({
    userEmail: '',
    permission: SharePermission.VIEW_ONLY,
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
    permissionOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
    },
    permissionOptionSelected: {
      backgroundColor: theme.colors.primary + '10',
      borderColor: theme.colors.primary,
    },
    permissionOptionUnselected: {
      backgroundColor: theme.colors.background.secondary,
      borderColor: theme.colors.border,
    },
    permissionIcon: {
      marginRight: theme.spacing.md,
    },
    permissionContent: {
      flex: 1,
    },
    permissionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    permissionDescription: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      lineHeight: 16,
    },
    currentSharesSection: {
      marginBottom: theme.spacing.lg,
    },
    shareItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    shareItemContent: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    shareItemName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    shareItemEmail: {
      fontSize: 12,
      color: theme.colors.text.secondary,
    },
    permissionBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.primary + '20',
    },
    permissionBadgeText: {
      fontSize: 10,
      fontWeight: '500',
      color: theme.colors.primary,
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
  });

  const permissionOptions = [
    {
      value: SharePermission.VIEW_ONLY,
      icon: <Eye size={20} color={theme.colors.info} />,
      title: t('sharing.permissions.viewOnly.title'),
      description: t('sharing.permissions.viewOnly.description'),
    },
    {
      value: SharePermission.EDIT,
      icon: <Edit size={20} color={theme.colors.warning} />,
      title: t('sharing.permissions.edit.title'),
      description: t('sharing.permissions.edit.description'),
    },
    {
      value: SharePermission.ADMIN,
      icon: <UserCheck size={20} color={theme.colors.error} />,
      title: t('sharing.permissions.admin.title'),
      description: t('sharing.permissions.admin.description'),
    },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionSelect = (permission: SharePermission) => {
    handleInputChange('permission', permission);
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

    // Check if user is already shared with
    const existingShare = currentShares.find(share =>
      share.user?.email.toLowerCase() === formData.userEmail.toLowerCase()
    );
    if (existingShare) {
      Alert.alert(t('common.error'), t('sharing.errors.userAlreadyShared'));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!notebookId) return;

    if (!validateForm()) return;

    const request: ShareNotebookRequest = {
      notebookId,
      userEmail: formData.userEmail.trim(),
      permission: formData.permission,
      message: formData.message.trim() || undefined,
    };

    try {
      await dispatch(shareNotebook(request)).unwrap();
      Alert.alert(t('common.success'), t('sharing.success.notebookShared', { email: formData.userEmail }));
      handleClose();
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleClose = () => {
    setFormData({
      userEmail: '',
      permission: SharePermission.VIEW_ONLY,
      message: '',
    });
    dispatch(clearError());
    onClose();
  };

  const getPermissionLabel = (permission: SharePermission): string => {
    switch (permission) {
      case SharePermission.VIEW_ONLY:
        return t('sharing.permissions.viewOnly.title');
      case SharePermission.EDIT:
        return t('sharing.permissions.edit.title');
      case SharePermission.ADMIN:
        return t('sharing.permissions.admin.title');
      default:
        return permission;
    }
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
              {t('sharing.shareNotebook')}
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
                  <Share2 size={16} color={theme.colors.primary} />
                  <Text style={styles.petInfoText}>
                    {t('sharing.sharingNotebookFor', { petName })}
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
                  {t('sharing.userEmailDescription')}
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

              {/* Permission Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('sharing.selectPermission')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('sharing.permissionDescription')}
                </Text>

                {permissionOptions.map((option) => {
                  const isSelected = formData.permission === option.value;
                  return (
                    <Button
                      key={option.value}
                      variant="ghost"
                      size="sm"
                      onPress={() => handlePermissionSelect(option.value)}
                      style={StyleSheet.flatten([
                        styles.permissionOption,
                        isSelected ? styles.permissionOptionSelected : styles.permissionOptionUnselected,
                      ])}
                    >
                      <View style={styles.permissionIcon}>
                        {option.icon}
                      </View>
                      <View style={styles.permissionContent}>
                        <Text style={styles.permissionTitle}>{option.title}</Text>
                        <Text style={styles.permissionDescription}>{option.description}</Text>
                      </View>
                      {isSelected && (
                        <Shield size={16} color={theme.colors.primary} />
                      )}
                    </Button>
                  );
                })}
              </View>

              {/* Optional Message */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('sharing.message')} {t('common.optional')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('sharing.messageDescription')}
                </Text>
                <Input
                  value={formData.message}
                  onChangeText={(value) => handleInputChange('message', value)}
                  placeholder={t('sharing.placeholders.message')}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Current Shares */}
              {currentShares.length > 0 && (
                <View style={styles.currentSharesSection}>
                  <Text style={styles.sectionTitle}>{t('sharing.currentShares')}</Text>
                  {currentShares.map((share) => (
                    <View key={share.id} style={styles.shareItem}>
                      <View style={styles.shareItemContent}>
                        <Text style={styles.shareItemName}>
                          {share.user?.firstName} {share.user?.lastName}
                        </Text>
                        <Text style={styles.shareItemEmail}>{share.user?.email}</Text>
                      </View>
                      <View style={styles.permissionBadge}>
                        <Text style={styles.permissionBadgeText}>
                          {getPermissionLabel(share.permission)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              variant="outline"
              onPress={handleClose}
              style={styles.footerButton}
              disabled={isSharing}
            >
              {t('common.cancel')}
            </Button>

            <Button
              variant="primary"
              onPress={handleSubmit}
              style={styles.footerButton}
              loading={isSharing}
            >
              {t('sharing.shareNotebook')}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};