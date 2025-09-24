import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Camera, Upload, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/theme';
import { useTranslation } from '@/hooks';
import { Button } from '@components/ui/Button';

interface PetPhotoUploadProps {
  value?: string; // Current photo URL
  onPhotoSelected: (photoUri: string) => void;
  onPhotoRemoved: () => void;
  disabled?: boolean;
  maxSize?: number; // Max file size in MB (default: 15MB)
  error?: string;
}

export const PetPhotoUpload: React.FC<PetPhotoUploadProps> = ({
  value,
  onPhotoSelected,
  onPhotoRemoved,
  disabled = false,
  maxSize = 15,
  error,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      marginVertical: theme.spacing.md,
    },
    photoContainer: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 2,
      borderColor: error ? theme.colors.error : theme.colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
      overflow: 'hidden',
      position: 'relative',
    },
    photo: {
      width: '100%',
      height: '100%',
      borderRadius: 75,
    },
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderIcon: {
      marginBottom: theme.spacing.xs,
      opacity: 0.6,
    },
    placeholderText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      maxWidth: 120,
    },
    removeButton: {
      position: 'absolute',
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      backgroundColor: theme.colors.error,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    button: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.background.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    buttonText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    disabledButton: {
      opacity: 0.5,
      backgroundColor: theme.colors.background.tertiary,
      borderColor: theme.colors.border,
    },
    disabledButtonText: {
      color: theme.colors.text.tertiary,
    },
    errorText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    sizeHint: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 75,
    },
    uploadingText: {
      color: theme.colors.background.primary,
      fontSize: theme.typography.fontSize.sm,
      marginTop: theme.spacing.xs,
    },
  });

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('pets.permissions.cameraTitle'),
          t('pets.permissions.cameraMessage')
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('pets.permissions.galleryTitle'),
          t('pets.permissions.galleryMessage')
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return false;
    }
  };

  const validateImage = (imageUri: string, fileSize?: number): boolean => {
    // Check file size (convert from bytes to MB)
    if (fileSize && fileSize > maxSize * 1024 * 1024) {
      Alert.alert(
        t('pets.upload.fileTooLarge'),
        t('pets.upload.fileTooLargeMessage', { maxSize })
      );
      return false;
    }

    // Check if it's a valid image format (basic check by extension)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = validExtensions.some(ext =>
      imageUri.toLowerCase().includes(ext)
    );

    if (!hasValidExtension) {
      Alert.alert(
        t('pets.upload.invalidFormat'),
        t('pets.upload.invalidFormatMessage')
      );
      return false;
    }

    return true;
  };

  const handleImagePicked = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets || result.assets.length === 0) {
      setIsUploading(false);
      return;
    }

    const asset = result.assets[0];
    const { uri, fileSize } = asset;

    // Validate the image
    if (!validateImage(uri, fileSize)) {
      setIsUploading(false);
      return;
    }

    try {
      // For now, just pass the local URI
      // In a real implementation, you would upload to your server here
      onPhotoSelected(uri);
    } catch (error) {
      console.error('Error handling image:', error);
      Alert.alert(
        t('pets.upload.uploadError'),
        t('pets.upload.uploadErrorMessage')
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    if (disabled || isUploading) return;

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setIsUploading(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile photos
        quality: 0.8, // Compress to reduce file size
      });

      await handleImagePicked(result);
    } catch (error) {
      console.error('Error taking photo:', error);
      setIsUploading(false);
      Alert.alert(
        t('pets.upload.cameraError'),
        t('pets.upload.cameraErrorMessage')
      );
    }
  };

  const handleSelectFromGallery = async () => {
    if (disabled || isUploading) return;

    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    setIsUploading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.8, // Compress to reduce file size
      });

      await handleImagePicked(result);
    } catch (error) {
      console.error('Error selecting photo:', error);
      setIsUploading(false);
      Alert.alert(
        t('pets.upload.galleryError'),
        t('pets.upload.galleryErrorMessage')
      );
    }
  };

  const showPhotoOptions = () => {
    if (disabled || isUploading) return;

    Alert.alert(
      t('pets.upload.selectPhoto'),
      t('pets.upload.selectPhotoMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('pets.upload.camera'), onPress: handleTakePhoto },
        { text: t('pets.upload.gallery'), onPress: handleSelectFromGallery },
      ]
    );
  };

  const handleRemovePhoto = () => {
    if (disabled) return;

    Alert.alert(
      t('pets.upload.removePhoto'),
      t('pets.upload.removePhotoMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: onPhotoRemoved },
      ]
    );
  };

  const renderPhotoContainer = () => {
    if (value) {
      return (
        <View style={styles.photoContainer}>
          <Image source={{ uri: value }} style={styles.photo} resizeMode="cover" />
          {!disabled && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemovePhoto}
              testID="remove-photo-button"
            >
              <X size={12} color={theme.colors.background.primary} />
            </TouchableOpacity>
          )}
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <Upload size={24} color={theme.colors.background.primary} />
              <Text style={styles.uploadingText}>{t('pets.upload.uploading')}</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={showPhotoOptions}
        disabled={disabled || isUploading}
        testID="photo-upload-container"
      >
        {isUploading ? (
          <View style={styles.uploadingOverlay}>
            <Upload size={24} color={theme.colors.primary} />
            <Text style={styles.uploadingText}>{t('pets.upload.uploading')}</Text>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Camera size={32} color={theme.colors.text.secondary} style={styles.placeholderIcon} />
            <Text style={styles.placeholderText}>{t('pets.upload.addPhoto')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderPhotoContainer()}

      {!value && !disabled && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, disabled && styles.disabledButton]}
            onPress={handleTakePhoto}
            disabled={disabled || isUploading}
            testID="camera-button"
          >
            <Camera size={16} color={disabled ? theme.colors.text.tertiary : theme.colors.primary} />
            <Text style={[styles.buttonText, disabled && styles.disabledButtonText]}>
              {t('pets.upload.camera')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, disabled && styles.disabledButton]}
            onPress={handleSelectFromGallery}
            disabled={disabled || isUploading}
            testID="gallery-button"
          >
            <Upload size={16} color={disabled ? theme.colors.text.tertiary : theme.colors.primary} />
            <Text style={[styles.buttonText, disabled && styles.disabledButtonText]}>
              {t('pets.upload.gallery')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.sizeHint}>
        {t('pets.upload.sizeHint', { maxSize })}
      </Text>
    </View>
  );
};

export default PetPhotoUpload;