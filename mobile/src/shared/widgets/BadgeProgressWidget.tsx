import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { ChevronRight, Award } from 'lucide-react-native';

import BadgeComponent from '../badges/BadgeComponent';
import { BADGES, RARITY_COLORS } from '@/constants/badges';
import {
    selectPets,
    selectBadgeProgress,
    selectEarnedBadges
} from '@/store/petsSlice';

interface BadgeProgressWidgetProps {
    onViewAll?: () => void;
}

const BadgeProgressWidget: React.FC<BadgeProgressWidgetProps> = ({ onViewAll }) => {
    const pets = useSelector(selectPets);
    const badgeProgress = useSelector(selectBadgeProgress);
    const earnedBadges = useSelector(selectEarnedBadges);

    const myPet = pets.find(p => p.isOwn);
    if (!myPet) return null;

    // Badges en cours de progression (pas encore obtenus mais avec du progrès)
    const inProgressBadges = badgeProgress
        .filter(p =>
            p.petId === myPet.id &&
            p.percentage > 0 &&
            !p.isCompleted &&
            !earnedBadges.some(eb => eb.badgeId === p.badgeId)
        )
        .sort((a, b) => b.percentage - a.percentage) // Trier par progression décroissante
        .slice(0, 3); // Top 3

    // Badges récemment obtenus
    const recentBadges = earnedBadges
        .filter(eb => eb.petId === myPet.id)
        .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
        .slice(0, 2); // 2 plus récents

    if (inProgressBadges.length === 0 && recentBadges.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Award size={20} color="#8b5cf6" />
                    <Text style={styles.title}>Progression des badges</Text>
                </View>
                {onViewAll && (
                    <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>Voir tout</Text>
                        <ChevronRight size={16} color="#8b5cf6" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Badges récemment obtenus */}
            {recentBadges.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎉 Récemment obtenus</Text>
                    <View style={styles.badgeList}>
                        {recentBadges.map(earnedBadge => {
                            const badge = BADGES.find(b => b.id === earnedBadge.badgeId);
                            if (!badge) return null;

                            return (
                                <View key={earnedBadge.badgeId} style={styles.recentBadgeItem}>
                                    <BadgeComponent
                                        badge={badge}
                                        isEarned={true}
                                        size="small"
                                    />
                                    <View style={styles.recentBadgeInfo}>
                                        <Text style={styles.recentBadgeName}>{badge.name}</Text>
                                        <Text style={styles.recentBadgeDate}>
                                            {new Date(earnedBadge.earnedAt).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Badges en progression */}
            {inProgressBadges.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎯 En cours</Text>
                    <View style={styles.progressList}>
                        {inProgressBadges.map(progress => {
                            const badge = BADGES.find(b => b.id === progress.badgeId);
                            if (!badge) return null;

                            const rarityColor = RARITY_COLORS[badge.rarity];

                            return (
                                <View key={progress.badgeId} style={styles.progressItem}>
                                    <View style={styles.progressBadge}>
                                        <BadgeComponent
                                            badge={badge}
                                            isEarned={false}
                                            progress={progress}
                                            size="small"
                                        />
                                    </View>

                                    <View style={styles.progressInfo}>
                                        <Text style={styles.progressBadgeName} numberOfLines={1}>
                                            {badge.name}
                                        </Text>

                                        <View style={styles.progressBarContainer}>
                                            <View style={styles.progressBar}>
                                                <View style={[
                                                    styles.progressFill,
                                                    {
                                                        width: `${progress.percentage}%`,
                                                        backgroundColor: rarityColor
                                                    }
                                                ]} />
                                            </View>
                                            <Text style={styles.progressPercentage}>
                                                {Math.round(progress.percentage)}%
                                            </Text>
                                        </View>

                                        {progress.nextMilestone && (
                                            <Text style={styles.nextMilestone} numberOfLines={1}>
                                                {progress.nextMilestone}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginLeft: 8,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 14,
        color: '#8b5cf6',
        fontWeight: '500',
        marginRight: 4,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    badgeList: {
        flexDirection: 'row',
        gap: 12,
    },
    recentBadgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 8,
        flex: 1,
    },
    recentBadgeInfo: {
        marginLeft: 8,
        flex: 1,
    },
    recentBadgeName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1f2937',
    },
    recentBadgeDate: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 2,
    },
    progressList: {
        gap: 12,
    },
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
    },
    progressBadge: {
        marginRight: 12,
    },
    progressInfo: {
        flex: 1,
    },
    progressBadgeName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#e5e7eb',
        borderRadius: 3,
        overflow: 'hidden',
        marginRight: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressPercentage: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        minWidth: 35,
        textAlign: 'right',
    },
    nextMilestone: {
        fontSize: 11,
        color: '#8b5cf6',
        fontStyle: 'italic',
    },
});

export default BadgeProgressWidget;