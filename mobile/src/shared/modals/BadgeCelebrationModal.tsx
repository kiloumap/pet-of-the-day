import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import BadgeComponent from '../badges/BadgeComponent';
import { BADGES } from '@/constants/badges';
import {
    selectShowBadgeModal,
    selectNewlyEarnedBadges,
    dismissBadgeModal
} from '@/store/petsSlice';

const { width, height } = Dimensions.get('window');

// Composant Confetti
const ConfettiPiece: React.FC<{
    animationValue: Animated.Value;
    index: number;
    rarity: string;
}> = ({ animationValue, index, rarity }) => {
    const colors = {
        common: ['#6b7280', '#9ca3af', '#d1d5db'],
        rare: ['#3b82f6', '#60a5fa', '#93c5fd'],
        epic: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
        legendary: ['#f59e0b', '#fbbf24', '#fcd34d', '#ef4444', '#f87171']
    };

    const confettiColors = colors[rarity as keyof typeof colors] || colors.common;
    const color = confettiColors[index % confettiColors.length];

    const translateY = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, height + 100],
    });

    const translateX = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, (Math.random() - 0.5) * 200],
    });

    const rotate = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `${720 + Math.random() * 360}deg`],
    });

    const opacity = animationValue.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [1, 1, 0],
    });

    return (
        <Animated.View
            style={[
                styles.confettiPiece,
                {
                    backgroundColor: color,
                    left: Math.random() * width,
                    transform: [
                        { translateY },
                        { translateX },
                        { rotate },
                    ],
                    opacity,
                }
            ]}
        />
    );
};

// Composant Firework pour legendary
const Firework: React.FC<{
    animationValue: Animated.Value;
    index: number;
}> = ({ animationValue, index }) => {
    const scale = animationValue.interpolate({
        inputRange: [0, 0.3, 0.6, 1],
        outputRange: [0, 2, 1.5, 0],
    });

    const opacity = animationValue.interpolate({
        inputRange: [0, 0.2, 0.4, 1],
        outputRange: [0, 1, 0.8, 0],
    });

    return (
        <Animated.View
            style={[
                styles.firework,
                {
                    left: Math.random() * (width - 60),
                    top: Math.random() * (height * 0.3) + 100,
                    transform: [{ scale }],
                    opacity,
                }
            ]}
        >
            <Text style={styles.fireworkEmoji}>✨</Text>
        </Animated.View>
    );
};

const BadgeCelebrationModal: React.FC = () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(selectShowBadgeModal);
    const newBadges = useSelector(selectNewlyEarnedBadges);

    const [animationValue] = useState(new Animated.Value(0));
    const [confettiAnimation] = useState(new Animated.Value(0));
    const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

    useEffect(() => {
        if (isVisible && newBadges.length > 0) {
            const currentBadge = BADGES.find(b => b.id === newBadges[currentBadgeIndex]?.badgeId);

            // Haptic feedback selon la rareté
            if (currentBadge) {
                switch (currentBadge.rarity) {
                    case 'common':
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        break;
                    case 'rare':
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        break;
                    case 'epic':
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        break;
                    case 'legendary':
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
                        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
                        break;
                }
            }

            // Animation d'entrée
            Animated.sequence([
                Animated.timing(animationValue, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                // Animation de rebond
                Animated.spring(animationValue, {
                    toValue: 1.1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(animationValue, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            // Animation des confettis
            Animated.loop(
                Animated.timing(confettiAnimation, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                { iterations: 3 }
            ).start();
        }
    }, [isVisible, newBadges, currentBadgeIndex]);

    const handleClose = () => {
        Animated.timing(animationValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            dispatch(dismissBadgeModal());
            setCurrentBadgeIndex(0);
            confettiAnimation.setValue(0);
        });
    };

    const handleNextBadge = () => {
        if (currentBadgeIndex < newBadges.length - 1) {
            setCurrentBadgeIndex(currentBadgeIndex + 1);
            // Reset animations pour le nouveau badge
            animationValue.setValue(0);
            confettiAnimation.setValue(0);
        } else {
            handleClose();
        }
    };

    if (!isVisible || newBadges.length === 0) return null;

    const currentEarnedBadge = newBadges[currentBadgeIndex];
    const currentBadge = BADGES.find(b => b.id === currentEarnedBadge.badgeId);

    if (!currentBadge) return null;

    const scale = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
    });

    const opacity = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    // Nombre de confettis selon la rareté
    const confettiCount = {
        common: 15,
        rare: 25,
        epic: 40,
        legendary: 60
    }[currentBadge.rarity];

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                {/* Confettis */}
                {Array.from({ length: confettiCount }).map((_, index) => (
                    <ConfettiPiece
                        key={`confetti-${index}`}
                        animationValue={confettiAnimation}
                        index={index}
                        rarity={currentBadge.rarity}
                    />
                ))}

                {/* Feux d'artifice pour legendary */}
                {currentBadge.rarity === 'legendary' && Array.from({ length: 8 }).map((_, index) => (
                    <Firework
                        key={`firework-${index}`}
                        animationValue={confettiAnimation}
                        index={index}
                    />
                ))}

                <Animated.View style={[
                    styles.container,
                    { transform: [{ scale }], opacity }
                ]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.congratsText}>
                            {currentBadge.rarity === 'legendary' ? '🎆 LÉGENDAIRE ! 🎆' : '🎉 Félicitations ! 🎉'}
                        </Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Badge Display */}
                    <View style={styles.badgeContainer}>
                        <View style={styles.badgeWrapper}>
                            <BadgeComponent
                                badge={currentBadge}
                                isEarned={true}
                                size="large"
                            />
                        </View>

                        <Text style={[
                            styles.newBadgeText,
                            currentBadge.rarity === 'legendary' && styles.legendaryText
                        ]}>
                            {currentBadge.rarity === 'legendary' ? 'BADGE LÉGENDAIRE DÉBLOQUÉ !' : 'Nouveau badge débloqué !'}
                        </Text>
                        <Text style={styles.badgeTitle}>{currentBadge.name}</Text>
                        <Text style={styles.badgeDesc}>{currentBadge.description}</Text>

                        {/* Rarity */}
                        <View style={[styles.rarityBadge, { backgroundColor: currentBadge.color }]}>
                            <Text style={styles.rarityText}>
                                {currentBadge.rarity.toUpperCase()}
                                {currentBadge.rarity === 'legendary' && ' ⭐'}
                            </Text>
                        </View>

                        {/* Trigger Context */}
                        {currentEarnedBadge.triggeredBy && (
                            <View style={styles.triggerContainer}>
                                <Text style={styles.triggerLabel}>Débloqué grâce à :</Text>
                                <Text style={styles.triggerText}>
                                    {currentEarnedBadge.triggeredBy.context}
                                    {currentEarnedBadge.triggeredBy.points && (
                                        ` (${currentEarnedBadge.triggeredBy.points > 0 ? '+' : ''}${currentEarnedBadge.triggeredBy.points} pts)`
                                    )}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {newBadges.length > 1 && (
                            <Text style={styles.counterText}>
                                {currentBadgeIndex + 1} sur {newBadges.length}
                            </Text>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                currentBadge.rarity === 'legendary' && styles.legendaryButton
                            ]}
                            onPress={handleNextBadge}
                        >
                            <Text style={styles.continueText}>
                                {currentBadgeIndex < newBadges.length - 1 ? 'Suivant' : 'Continuer'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: width * 0.9,
        maxWidth: 400,
        overflow: 'hidden',
        position: 'relative',
    },
    confettiPiece: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        zIndex: 1000,
    },
    firework: {
        position: 'absolute',
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    fireworkEmoji: {
        fontSize: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingBottom: 0,
        zIndex: 1,
    },
    congratsText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeButton: {
        padding: 4,
    },
    badgeContainer: {
        alignItems: 'center',
        padding: 30,
        paddingTop: 20,
        zIndex: 1,
    },
    badgeWrapper: {
        transform: [{ scale: 1.2 }],
        marginBottom: 20,
    },
    newBadgeText: {
        fontSize: 16,
        color: '#8b5cf6',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    legendaryText: {
        color: '#f59e0b',
        fontSize: 18,
        textShadowColor: '#fbbf24',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    badgeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    badgeDesc: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 16,
    },
    rarityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 16,
    },
    rarityText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    triggerContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        width: '100%',
    },
    triggerLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    triggerText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    actions: {
        padding: 20,
        paddingTop: 0,
        alignItems: 'center',
        zIndex: 1,
    },
    counterText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
    },
    continueButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    legendaryButton: {
        backgroundColor: '#f59e0b',
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    continueText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BadgeCelebrationModal;