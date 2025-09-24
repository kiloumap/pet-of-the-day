import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pet } from '../types/api';

interface PetSelectorProps {
    pets: Pet[];
    selectedPet: string | null;
    onPetSelect: (petId: string) => void;
}

const PetSelector: React.FC<PetSelectorProps> = ({ pets, selectedPet, onPetSelect }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Choisir le chien</Text>
            <View style={styles.petsContainer}>
                {pets.map(pet => (
                    <TouchableOpacity
                        key={pet.id}
                        onPress={() => onPetSelect(pet.id)}
                        style={[
                            styles.petButton,
                            selectedPet === pet.id && styles.selectedPet
                        ]}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.petEmoji}>{pet.image}</Text>
                        <Text style={styles.petName}>{pet.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
        fontWeight: '500',
    },
    petsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    petButton: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        backgroundColor: 'white',
        alignItems: 'center',
        minWidth: 70,
    },
    selectedPet: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    petEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    petName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
});

export default PetSelector;