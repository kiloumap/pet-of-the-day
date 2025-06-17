import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native';
import { X, Calendar, Target, Award, Clock } from 'lucide-react-native';

import BadgeComponent from '../badges/BadgeComponent';
import { Badge, BadgeProgress, EarnedBadge } from '../../../types/badges';
import { RARITY_COLORS } from '@/constants/badges';

const { width } = Dimensions.get('window');

interface BadgeDetailModalProps {
    visible: boolean;
    badge: Badge | null;
    isEarned: boolean;
    progress?: BadgeProgress;
    earnedBadge?: EarnedBadge;
    onClose: () => void;
}

const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
                                                               visible,
                                                               badge,
                                                               isEarned,
                                                               progress,
                                                               earnedBadge,
                                                               onClose,
                                                           }) => {
    const [animationValue] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.spring(animationValue, {
                toValue: 1,
                friction: 8,
                tension: 100,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(animationValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!badge) return null;

    const rarityColor = RARITY_COLORS[badge.rarity];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getRequirementDescription = () => {
        const { requirements } = badge;

        switch (requirements.type) {
            case 'action_count':
                return `Effectuer ${requirements.count} fois cette action`;
            case 'streak':
                return `${requirements.consecutiveDays} jours consécutifs`;
            case 'points_total':
                return `Accumuler ${requirements.minPoints} points au total`;
            case 'specific_action':
                return 'Action spécifique requise';
            case 'combo':
                return `${requirements.count} actions positives en une journée`;
            default:
                return 'Critères spéciaux';
        }
    };

    const getRarityDescription = () => {
        switch (badge.rarity) {
            case 'common':
                return 'Facile à obtenir - Premiers pas';
            case 'rare':
                return 'Nécessite des efforts réguliers';
            case 'epic':
                return 'Accomplissement remarquable';
            case 'legendary':
                return 'Exploit exceptionnel !';
            default:
                return '';
        }
    };

    const scale = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
    });

    const opacity = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.container,
                    { transform: [{ scale }], opacity }
                ]}>
                    {/* Header avec badge */}
                    <View style={[styles.header, { backgroundColor: rarityColor }]}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="white" />
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <View style={styles.badgeWrapper}>
                                <BadgeComponent
                                    badge={badge}
                                    isEarned={isEarned}
                                    size="medium"
                                />
                            </View>

                            <View style={styles.titleContainer}>
                                <Text style={styles.badgeTitle}>{badge.name}</Text>
                                <Text style={styles.badgeCategory}>
                                    {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Description */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.description}>{badge.description}</Text>
                        </View>

                        {/* Rareté */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Award size={20} color={rarityColor} />
                                <Text style={styles.sectionTitle}>Rareté</Text>
                            </View>
                            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                                <Text style={styles.rarityText}>
                                    {badge.rarity.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.rarityDesc}>{getRarityDescription()}</Text>
                        </View>

                        {/* Critères */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Target size={20} color="#6b7280" />
                                <Text style={styles.sectionTitle}>Critères d'obtention</Text>
                            </View>
                            <Text style={styles.requirements}>{getRequirementDescription()}</Text>
                        </View>

                        {/* Progression */}
                        {!isEarned && progress && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Clock size={20} color="#8b5cf6" />
                                    <Text style={styles.sectionTitle}>Progression</Text>
                                </View>

                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View style={[
                                            styles.progressFill,
                                            {
                                                width: `${progress.percentage}%`,
                                                backgroundColor: rarityColor
                                            }
                                        ]} />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {progress.currentProgress} / {progress.maxProgress} ({progress.percentage.toFixed(0)}%)
                                    </Text>
                                </View>

                                {progress.nextMilestone && (
                                    <View style={styles.milestoneContainer}>
                                        <Text style={styles.milestoneLabel}>Prochaine étape :</Text>
                                        <Text style={styles.milestoneText}>{progress.nextMilestone}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Informations d'obtention */}
                        {isEarned && earnedBadge && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Calendar size={20} color="#10b981" />
                                    <Text style={styles.sectionTitle}>Obtenu le</Text>
                                </View>
                                <Text style={styles.earnedDate}>
                                    {formatDate(earnedBadge.earnedAt)}
                                </Text>

                                {earnedBadge.triggeredBy && (
                                    <View style={styles.triggerInfo}>
                                        <Text style={styles.triggerLabel}>Débloqué par :</Text>
                                        <Text style={styles.triggerText}>
                                            {earnedBadge.triggeredBy.context}
                                            {earnedBadge.triggeredBy.points && (
                                                ` (${earnedBadge.triggeredBy.points > 0 ? '+' : ''}${earnedBadge.triggeredBy.points} pts)`
                                            )}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Conseils */}
                        {!isEarned && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>💡 Conseils</Text>
                                <Text style={styles.tips}>
                                    {badge.category === 'propreté' && 'Soyez patient et cohérent. Récompensez immédiatement les bons comportements !'}
                                    {badge.category === 'éducation' && 'Utilisez des séances courtes et amusantes. La répétition est la clé !'}
                                    {badge.category === 'social' && 'Exposez progressivement votre animal à de nouvelles situations.'}
                                    {badge.category === 'comportement' && 'Restez calme et positif. Ignorez les mauvais comportements, récompensez les bons.'}
                                    {badge.category === 'streak' && 'La régularité compte plus que la perfection. Un jour à la fois !'}
                                    {badge.category === 'special' && 'Continue sur cette lancée, tu y es presque !'}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 20,
        maxWidth: 420,
        maxHeight: '85%',
        overflow: 'hidden',
    },
    header: {
        paddingTop: 40,
        paddingBottom: 20,
        //paddingHorizontal: 20,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        zIndex: 10,
    },
    headerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingTop: 16,
    },
    badgeWrapper: {
        marginBottom: 16,
        transform: [{ scale: 0.8 }],
    },
    titleContainer: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 16,
    },
    badgeTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 32,
    },
    badgeCategory: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginLeft: 8,
    },
    description: {
        fontSize: 16,
        color: '#4b5563',
        lineHeight: 24,
    },
    rarityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 8,
    },
    rarityText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    rarityDesc: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    requirements: {
        fontSize: 15,
        color: '#374151',
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#d1d5db',
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    milestoneContainer: {
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#0ea5e9',
    },
    milestoneLabel: {
        fontSize: 12,
        color: '#0369a1',
        fontWeight: '600',
        marginBottom: 4,
    },
    milestoneText: {
        fontSize: 14,
        color: '#075985',
    },
    earnedDate: {
        fontSize: 16,
        color: '#059669',
        fontWeight: '600',
        marginBottom: 12,
    },
    triggerInfo: {
        backgroundColor: '#f0fdf4',
        padding: 12,
        borderRadius: 8,
    },
    triggerLabel: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '600',
        marginBottom: 4,
    },
    triggerText: {
        fontSize: 14,
        color: '#047857',
    },
    tips: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        backgroundColor: '#fffbeb',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
});

export default BadgeDetailModal;