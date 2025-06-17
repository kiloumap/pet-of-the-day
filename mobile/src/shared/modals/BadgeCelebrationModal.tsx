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

import BadgeComponent from '../badges/BadgeComponent';
import { BADGES } from '@/constants/badges';
import {
    selectShowBadgeModal,
    selectNewlyEarnedBadges,
    dismissBadgeModal
} from '@/store/petsSlice';

const { width } = Dimensions.get('window');

const BadgeCelebrationModal: React.FC = () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(selectShowBadgeModal);
    const newBadges = useSelector(selectNewlyEarnedBadges);

    const [animationValue] = useState(new Animated.Value(0));
    const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

    useEffect(() => {
        if (isVisible && newBadges.length > 0) {
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
        }
    }, [isVisible, newBadges]);

    const handleClose = () => {
        Animated.timing(animationValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            dispatch(dismissBadgeModal());
            setCurrentBadgeIndex(0);
        });
    };

    const handleNextBadge = () => {
        if (currentBadgeIndex < newBadges.length - 1) {
            setCurrentBadgeIndex(currentBadgeIndex + 1);
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

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.container,
                    { transform: [{ scale }], opacity }
                ]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.congratsText}>🎉 Félicitations ! 🎉</Text>
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

                        <Text style={styles.newBadgeText}>Nouveau badge débloqué !</Text>
                        <Text style={styles.badgeTitle}>{currentBadge.name}</Text>
                        <Text style={styles.badgeDesc}>{currentBadge.description}</Text>

                        {/* Rarity */}
                        <View style={[styles.rarityBadge, { backgroundColor: currentBadge.color }]}>
                            <Text style={styles.rarityText}>
                                {currentBadge.rarity.toUpperCase()}
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
                            style={styles.continueButton}
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
    continueText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BadgeCelebrationModal;