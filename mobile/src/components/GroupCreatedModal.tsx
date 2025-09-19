import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { CheckCircle, Copy, Share2, Users } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from '../hooks';

interface GroupCreatedModalProps {
  visible: boolean;
  groupName: string;
  inviteCode: string;
  onClose: () => void;
  onNavigateToGroup?: () => void;
}

const GroupCreatedModal: React.FC<GroupCreatedModalProps> = ({
  visible,
  groupName,
  inviteCode,
  onClose,
  onNavigateToGroup,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert(t('common.error'), 'Impossible de copier le code');
    }
  };

  const shareInviteCode = async () => {
    try {
      const message = `Rejoignez mon groupe "${groupName}" sur Pet of the Day !\n\nCode d'invitation : ${inviteCode}`;

      await Share.share({
        message,
        title: `Invitation au groupe ${groupName}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleViewGroup = () => {
    onNavigateToGroup?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <CheckCircle size={64} color="#10b981" />
          </View>

          <Text style={styles.title}>Groupe créé !</Text>
          <Text style={styles.subtitle}>
            Votre groupe "{groupName}" a été créé avec succès.
          </Text>

          <View style={styles.inviteSection}>
            <View style={styles.inviteHeader}>
              <Users size={20} color="#374151" />
              <Text style={styles.inviteTitle}>Code d'invitation</Text>
            </View>

            <Text style={styles.inviteDescription}>
              Partagez ce code avec vos amis pour les inviter à rejoindre votre groupe
            </Text>

            <View style={styles.codeContainer}>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={copyToClipboard}
              >
                <Copy size={20} color={copied ? '#10b981' : '#6b7280'} />
                <Text style={[styles.copyText, copied && styles.copiedText]}>
                  {copied ? 'Copié !' : 'Copier'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareInviteCode}
            >
              <Share2 size={20} color="#3b82f6" />
              <Text style={styles.shareButtonText}>Partager</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleViewGroup}
            >
              <Text style={styles.primaryButtonText}>Voir le groupe</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  inviteSection: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  inviteDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  inviteCode: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  copiedText: {
    color: '#10b981',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default GroupCreatedModal;