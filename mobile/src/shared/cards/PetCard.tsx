import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from '../../hooks';
import { Pet } from '../../types/api';

interface PetCardProps {
    pet: Pet;
    onPress?: () => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onPress }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    // Use default points if not set
    const displayPoints = pet.points ?? 0;

    const styles = StyleSheet.create({
        container: {
            backgroundColor: theme.colors.background.secondary,
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
            borderColor: theme.colors.border,
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
            color: theme.colors.text.primary,
            marginBottom: 2,
        },
        breed: {
            fontSize: 14,
            color: theme.colors.text.secondary,
        },
        rightSection: {
            alignItems: 'flex-end',
        },
        points: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.primary,
        },
        pointsLabel: {
            fontSize: 12,
            color: theme.colors.text.tertiary,
            marginTop: 2,
        },
    });

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    <Text style={styles.emoji}>🐕</Text>
                    <View style={styles.textContainer}>
                        <Text style={styles.name}>{pet.name}</Text>
                        <Text style={styles.breed}>{pet.breed}</Text>
                    </View>
                </View>
                <View style={styles.rightSection}>
                    <Text style={styles.points}>{displayPoints}</Text>
                    <Text style={styles.pointsLabel}>{t('points.todayPoints')}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export { PetCard };
export default PetCard;