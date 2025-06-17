import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pet } from '../../../types';

interface PetCardProps {
    pet: Pet;
    onPress?: () => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onPress }) => {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    <Text style={styles.emoji}>{pet.image}</Text>
                    <View style={styles.textContainer}>
                        <Text style={styles.name}>{pet.name}</Text>
                        <Text style={styles.breed}>{pet.breed}</Text>
                    </View>
                </View>
                <View style={styles.rightSection}>
                    <Text style={styles.points}>{pet.points}</Text>
                    <Text style={styles.pointsLabel}>points aujourd'hui</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginVertical: 6,
        marginHorizontal: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    emoji: {
        fontSize: 32,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    breed: {
        fontSize: 14,
        color: '#6b7280',
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    points: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    pointsLabel: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
});

export default PetCard;