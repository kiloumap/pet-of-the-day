import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X, Users } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useTranslation } from '../../hooks';

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
}

interface GroupSelectionModalProps {
  visible: boolean;
  groups: Group[];
  onClose: () => void;
  onSelectGroup: (groupId: string) => void;
  title?: string;
}

const GroupSelectionModal: React.FC<GroupSelectionModalProps> = ({
  visible,
  groups,
  onClose,
  onSelectGroup,
  title,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    groupsList: {
      maxHeight: 400,
    },
    groupItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    groupIcon: {
      marginRight: theme.spacing.md,
    },
    groupInfo: {
      flex: 1,
    },
    groupName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    groupDescription: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    memberCount: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  const handleSelectGroup = (groupId: string) => {
    onSelectGroup(groupId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {title || t('groups.selectGroup')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.groupsList} showsVerticalScrollIndicator={false}>
            {groups.length > 0 ? (
              groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupItem}
                  onPress={() => handleSelectGroup(group.id)}
                >
                  <Users
                    size={24}
                    color={theme.colors.primary}
                    style={styles.groupIcon}
                  />
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.groupDescription}>
                        {group.description}
                      </Text>
                    )}
                    {group.memberCount && (
                      <Text style={styles.memberCount}>
                        {t('groups.memberCount', { count: group.memberCount })}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Users size={48} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyText}>
                  {t('groups.noGroupsAvailable')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default GroupSelectionModal;