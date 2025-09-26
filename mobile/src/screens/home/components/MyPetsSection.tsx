import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PawPrint } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import PetCard from '../../../shared/cards/PetCard';
import { Pet } from '../../../types/api';
import { useTranslation } from '../../../hooks';

interface MyPetsSectionProps {
    pets: Pet[];
}

const MyPetsSection: React.FC<MyPetsSectionProps> = ({ pets }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    // Show all pets (they are already the user's pets from the API)
    const myPets = pets || [];

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
            color: theme.colors.text.primary,
            marginLeft: 8,
        },
        petsContainer: {
            gap: 12,
        },
        emptyState: {
            alignItems: 'center',
            padding: 32,
        },
        emptyText: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 8,
        },
        emptySubtext: {
            fontSize: 14,
            color: theme.colors.text.secondary,
            textAlign: 'center',
        },
    });

    if (myPets.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <PawPrint size={20} color={theme.colors.text.primary} />
                    <Text style={styles.title}>{t('pets.myPets')}</Text>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{t('pets.noPets')}</Text>
                    <Text style={styles.emptySubtext}>{t('pets.noPetsSubtitle')}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <PawPrint size={20} color={theme.colors.text.primary} />
                <Text style={styles.title}>{t('pets.myPets')}</Text>
            </View>
            <View style={styles.petsContainer}>
                {myPets.map(pet => (
                    <PetCard key={pet.id} pet={pet} />
                ))}
            </View>
        </View>
    );
};

export default MyPetsSection;