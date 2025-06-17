import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import BadgeComponent from '../../shared/badges/BadgeComponent';
import PetSelector from '../../shared/PetSelector';
import BadgeDetailModal from '../../shared/modals/BadgeDetailModal';
import { BADGES, getBadgesByCategory, RARITY_ORDER } from '@/constants/badges';
import {
    selectPets,
    selectEarnedBadges,
    selectBadgeProgress
} from '@/store/petsSlice';
import { Badge } from '../../../types/badges';

type FilterType = 'all' | 'earned' | 'progress' | 'locked';
type CategoryType = 'all' | Badge['category'];
type RarityType = 'all' | Badge['rarity'];

const BadgesScreen: React.FC = () => {
    const pets = useSelector(selectPets);
    const earnedBadges = useSelector(selectEarnedBadges);
    const badgeProgress = useSelector(selectBadgeProgress);

    const [selectedPet, setSelectedPet] = useState<number | null>(
        pets.find(p => p.isOwn)?.id || null
    );
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
    const [rarityFilter, setRarityFilter] = useState<RarityType>('all');

    // État pour la modal détaillée
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    const handleBadgePress = (badge: Badge) => {
        setSelectedBadge(badge);
        setShowDetailModal(true);
    };

    if (!selectedPet || pets.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Aucun animal sélectionné</Text>
                    <Text style={styles.emptySubtext}>
                        Ajoutez vos animaux pour voir leurs badges !
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const selectedPetData = pets.find(p => p.id === selectedPet)!;
    const petEarnedBadges = earnedBadges.filter(eb => eb.petId === selectedPet);
    const petBadgeProgress = badgeProgress.filter(bp => bp.petId === selectedPet);

    // Filtrer les badges
    const getFilteredBadges = (): Badge[] => {
        let filteredBadges = [...BADGES];

        // Filtre par catégorie
        if (categoryFilter !== 'all') {
            filteredBadges = getBadgesByCategory(categoryFilter);
        }

        // Filtre par rareté
        if (rarityFilter !== 'all') {
            filteredBadges = filteredBadges.filter(b => b.rarity === rarityFilter);
        }

        // Filtre par statut
        switch (filterType) {
            case 'earned':
                filteredBadges = filteredBadges.filter(badge =>
                    petEarnedBadges.some(eb => eb.badgeId === badge.id)
                );
                break;
            case 'progress':
                filteredBadges = filteredBadges.filter(badge => {
                    const progress = petBadgeProgress.find(p => p.badgeId === badge.id);
                    return progress && progress.percentage > 0 && !progress.isCompleted;
                });
                break;
            case 'locked':
                filteredBadges = filteredBadges.filter(badge =>
                    !petEarnedBadges.some(eb => eb.badgeId === badge.id)
                );
                break;
        }

        // Trier par rareté puis par nom
        return filteredBadges.sort((a, b) => {
            const rarityDiff = RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
            if (rarityDiff !== 0) return rarityDiff;
            return a.name.localeCompare(b.name);
        });
    };

    const filteredBadges = getFilteredBadges();

    const stats = {
        total: petEarnedBadges.length,
        totalPossible: BADGES.length,
        percentage: Math.round((petEarnedBadges.length / BADGES.length) * 100),
        inProgress: petBadgeProgress.filter(p => p.percentage > 0 && !p.isCompleted).length,
    };

    const FilterButton = ({
                              title,
                              isActive,
                              onPress,
                              count
                          }: {
        title: string;
        isActive: boolean;
        onPress: () => void;
        count?: number;
    }) => (
        <TouchableOpacity
            style={[styles.filterButton, isActive && styles.activeFilter]}
            onPress={onPress}
        >
            <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                {title}
                {count !== undefined && ` (${count})`}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>🏆 Collection de Badges</Text>

                    {/* Pet Selector */}
                    <PetSelector
                        pets={pets.filter(p => p.isOwn)}
                        selectedPet={selectedPet}
                        onPetSelect={setSelectedPet}
                    />
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Badges obtenus</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.percentage}%</Text>
                        <Text style={styles.statLabel}>Complété</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.inProgress}</Text>
                        <Text style={styles.statLabel}>En progrès</Text>
                    </View>
                </View>

                {/* Filters */}
                <View style={styles.filtersSection}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Statut:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <FilterButton
                                title="Tous"
                                isActive={filterType === 'all'}
                                onPress={() => setFilterType('all')}
                                count={BADGES.length}
                            />
                            <FilterButton
                                title="Obtenus"
                                isActive={filterType === 'earned'}
                                onPress={() => setFilterType('earned')}
                                count={stats.total}
                            />
                            <FilterButton
                                title="En cours"
                                isActive={filterType === 'progress'}
                                onPress={() => setFilterType('progress')}
                                count={stats.inProgress}
                            />
                            <FilterButton
                                title="Verrouillés"
                                isActive={filterType === 'locked'}
                                onPress={() => setFilterType('locked')}
                                count={BADGES.length - stats.total}
                            />
                        </ScrollView>
                    </View>
                </View>

                {/* Badge List */}
                <View style={styles.badgesContainer}>
                    <Text style={styles.sectionTitle}>
                        {filteredBadges.length} badge{filteredBadges.length > 1 ? 's' : ''}
                    </Text>

                    {filteredBadges.length === 0 ? (
                        <View style={styles.emptyBadges}>
                            <Text style={styles.emptyBadgesText}>
                                Aucun badge dans cette catégorie
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.badgeGrid}>
                            {filteredBadges.map((badge) => {
                                const isEarned = petEarnedBadges.some(eb => eb.badgeId === badge.id);
                                const progress = petBadgeProgress.find(p => p.badgeId === badge.id);

                                return (
                                    <TouchableOpacity
                                        key={badge.id}
                                        style={styles.badgeItem}
                                        onPress={() => handleBadgePress(badge)}
                                        activeOpacity={0.7}
                                    >
                                        <BadgeComponent
                                            badge={badge}
                                            isEarned={isEarned}
                                            progress={progress}
                                            size="medium"
                                            showProgress={!isEarned}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modal détaillée */}
            {selectedBadge && (
                <BadgeDetailModal
                    visible={showDetailModal}
                    badge={selectedBadge}
                    isEarned={petEarnedBadges.some(eb => eb.badgeId === selectedBadge.id)}
                    progress={petBadgeProgress.find(p => p.badgeId === selectedBadge.id)}
                    earnedBadge={earnedBadges.find(eb => eb.badgeId === selectedBadge.id)}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedBadge(null);
                    }}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center',
    },
    filtersSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filterRow: {
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginRight: 8,
    },
    activeFilter: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    filterText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    activeFilterText: {
        color: 'white',
    },
    badgesContainer: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    badgeItem: {
        width: '48%',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
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
    emptyBadges: {
        alignItems: 'center',
        padding: 40,
    },
    emptyBadgesText: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
    },
});

export default BadgesScreen;