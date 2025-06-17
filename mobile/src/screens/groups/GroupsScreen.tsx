import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Settings } from 'lucide-react-native';
import { useSelector } from 'react-redux';

import { selectGroups, selectPets } from '../../store/petsSlice';

const GroupsScreen: React.FC = () => {
    const groups = useSelector(selectGroups);
    const pets = useSelector(selectPets);

    const topPets = [...pets]
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.screenTitle}>Mes Groupes</Text>

                <View style={styles.groupsContainer}>
                    {groups.map(group => (
                        <View key={group.id} style={styles.groupCard}>
                            <View style={styles.groupHeader}>
                                <View style={styles.groupInfo}>
                                    <View style={styles.groupIcon}>
                                        <Users size={24} color="white" />
                                    </View>
                                    <View>
                                        <Text style={styles.groupName}>{group.name}</Text>
                                        <Text style={styles.groupMembers}>{group.members} membres</Text>
                                    </View>
                                </View>
                                <TouchableOpacity>
                                    <Settings size={20} color="#3b82f6" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.leaderboard}>
                                <Text style={styles.leaderboardTitle}>Top du jour</Text>
                                {topPets.map((pet, index) => (
                                    <View key={pet.id} style={styles.leaderboardItem}>
                                        <View style={styles.leaderboardLeft}>
                                            <View style={styles.rankBadge}>
                                                <Text style={styles.rankText}>{index + 1}</Text>
                                            </View>
                                            <Text style={styles.petEmoji}>{pet.image}</Text>
                                            <Text style={styles.petName}>{pet.name}</Text>
                                        </View>
                                        <Text style={styles.petPoints}>{pet.points}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>

                {groups.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Aucun groupe trouvé</Text>
                        <Text style={styles.emptySubtext}>
                            Créez ou rejoignez un groupe pour commencer !
                        </Text>
                    </View>
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
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 24,
    },
    groupsContainer: {
        gap: 16,
    },
    groupCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    groupInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupIcon: {
        width: 48,
        height: 48,
        backgroundColor: '#8b5cf6',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    groupMembers: {
        fontSize: 14,
        color: '#6b7280',
    },
    leaderboard: {
        marginTop: 8,
    },
    leaderboardTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    leaderboardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankBadge: {
        width: 24,
        height: 24,
        backgroundColor: '#f59e0b',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    petEmoji: {
        fontSize: 18,
        marginRight: 12,
    },
    petName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
    },
    petPoints: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
    },
});

export default GroupsScreen;