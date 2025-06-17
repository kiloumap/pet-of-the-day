import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PawPrint } from 'lucide-react-native';
import PetCard from '../../../shared/cards/PetCard';
import { Pet } from '../../../../types';

interface MyDogsSectionProps {
    pets: Pet[];
}

const MyDogsSection: React.FC<MyDogsSectionProps> = ({ pets }) => {
    const myPets = pets.filter(pet => pet.isOwn);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <PawPrint size={20} color="#1f2937" />
                <Text style={styles.title}>Mes Chiens</Text>
            </View>
            <View style={styles.petsContainer}>
                {myPets.map(pet => (
                    <PetCard key={pet.id} pet={pet} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginLeft: 8,
    },
    petsContainer: {
        gap: 12,
    },
});

export default MyDogsSection;