import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Camera } from 'lucide-react-native';

interface QuickActionsProps {
    onNoteAction: () => void;
    onPhotoMoment: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNoteAction, onPhotoMoment }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={[styles.button, styles.blueButton]} onPress={onNoteAction}>
                <Plus size={20} color="white" />
                <Text style={styles.buttonText}>Noter action</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.purpleButton]} onPress={onPhotoMoment}>
                <Camera size={20} color="white" />
                <Text style={styles.buttonText}>Photo moment</Text>
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
    blueButton: {
        backgroundColor: '#3b82f6',
    },
    purpleButton: {
        backgroundColor: '#8b5cf6',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
});

export default QuickActions;
