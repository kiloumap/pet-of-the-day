import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Camera } from 'lucide-react-native';
import { useTranslation } from '@/hooks';
import { useTheme } from '@/theme';

interface QuickActionsProps {
    onNoteAction: () => void;
    onPhotoMoment: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNoteAction, onPhotoMoment }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.accent }]} onPress={onNoteAction}>
                <Plus size={20} color={theme.colors.reverse} />
                <Text style={[styles.buttonText, { color: theme.colors.reverse }]}>{t('points.recordAction')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary  }]} onPress={onPhotoMoment}>
                <Camera size={20} color={theme.colors.reverse} />
                <Text style={[styles.buttonText, {color: theme.colors.reverse}]}>Photo moment</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 16,
        marginVertical: 16,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    buttonText: {
        fontWeight: '600',
    },
});

export default QuickActions;
