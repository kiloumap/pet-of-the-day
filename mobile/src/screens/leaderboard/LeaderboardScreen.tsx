import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Trophy, Medal, Award } from 'lucide-react-native';

import { selectPets } from '@store/petsSlice';
import { EmptyStateManager } from '@components/EmptyStateManager';

const LeaderboardScreen: React.FC = () => {
    const pets = useSelector(selectPets);

    // Trier les pets par points (décroissant)
    const sortedPets = [...pets].sort((a, b) => (b.points || 0) - (a.points || 0));

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy size={24} color="#fbbf24" />;
            case 2:
                return <Medal size={24} color="#94a3b8" />;
            case 3:
                return <Award size={24} color="#f97316" />;
            default:
                return null;
        }
    };

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return styles.firstPlace;
            case 2:
                return styles.secondPlace;
            case 3:
                return styles.thirdPlace;
            default:
                return styles.defaultPlace;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>🏆 Classement du jour</Text>

                <View style={styles.leaderboardContainer}>
                    {sortedPets.map((pet, index) => {
                        const rank = index + 1;
                        return (
                            <View key={pet.id} style={[styles.petCard, getRankStyle(rank)]}>
                                <View style={styles.leftSection}>
                                    <View style={styles.rankContainer}>
                                        {getRankIcon(rank) || (
                                            <View style={styles.rankBadge}>
                                                <Text style={styles.rankText}>{rank}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.petEmoji}>{pet.image}</Text>
                                    <View style={styles.petInfo}>
                                        <Text style={styles.petName}>{pet.name}</Text>
                                        <Text style={styles.petBreed}>{pet.breed}</Text>
                                        {pet.isOwn && (
                                            <Text style={styles.ownPetBadge}>Mon chien</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.rightSection}>
                                    <Text style={styles.points}>{pet.points}</Text>
                                    <Text style={styles.pointsLabel}>points</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {sortedPets.length === 0 && (
                    <EmptyStateManager
                        type="daily-leaderboard"
                        title="Aucun classement disponible"
                        description="Ajoutez vos animaux et enregistrez des actions pour voir le classement du jour !"
                        actionLabel="Ajouter un animal"
                        showAction={true}
                        onActionPress={() => console.log('Navigate to add pet')}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 24,
        textAlign: 'center',
    },
    leaderboardContainer: {
        gap: 12,
    },
    petCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    firstPlace: {
        borderColor: '#fbbf24',
        backgroundColor: '#fffbeb',
    },
    secondPlace: {
        borderColor: '#94a3b8',
        backgroundColor: '#f8fafc',
    },
    thirdPlace: {
        borderColor: '#f97316',
        backgroundColor: '#fff7ed',
    },
    defaultPlace: {
        borderColor: '#e5e7eb',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankContainer: {
        width: 40,
        alignItems: 'center',
        marginRight: 12,
    },
    rankBadge: {
        width: 32,
        height: 32,
        backgroundColor: '#6b7280',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    petEmoji: {
        fontSize: 32,
        marginRight: 16,
    },
    petInfo: {
        flex: 1,
    },
    petName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    petBreed: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    ownPetBadge: {
        fontSize: 12,
        color: '#3b82f6',
        fontWeight: '500',
        marginTop: 4,
    },
    rightSection: {
        alignItems: 'center',
    },
    points: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    pointsLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
});

export default LeaderboardScreen;