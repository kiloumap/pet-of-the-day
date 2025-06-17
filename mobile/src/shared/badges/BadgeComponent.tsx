import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge, BadgeProgress } from '../../../types/badges';
import { RARITY_COLORS } from '@/constants/badges';

interface BadgeComponentProps {
    badge: Badge;
    isEarned?: boolean;
    progress?: BadgeProgress;
    size?: 'small' | 'medium' | 'large';
    showProgress?: boolean;
}

const BadgeComponent: React.FC<BadgeComponentProps> = ({
                                                           badge,
                                                           isEarned = false,
                                                           progress,
                                                           size = 'medium',
                                                           showProgress = false
                                                       }) => {
    const sizeStyles = {
        small: styles.small,
        medium: styles.medium,
        large: styles.large
    };

    const rarityColor = RARITY_COLORS[badge.rarity];

    return (
        <View style={[styles.container, sizeStyles[size]]}>
            {/* Badge Circle */}
            <View style={[
                styles.badgeCircle,
                { borderColor: rarityColor },
                !isEarned && styles.unearned,
                size === 'large' && styles.largeCircle
            ]}>
                <Text style={[
                    styles.badgeIcon,
                    size === 'small' && styles.smallIcon,
                    size === 'large' && styles.largeIcon,
                    !isEarned && styles.unearnedIcon
                ]}>
                    {badge.icon}
                </Text>

                {/* Rarity indicator */}
                <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]}>
                    <View style={styles.rarityDot} />
                </View>
            </View>

            {/* Badge Info */}
            {size !== 'small' && (
                <View style={styles.badgeInfo}>
                    <Text style={[styles.badgeName, !isEarned && styles.unearnedText]} numberOfLines={1}>
                        {badge.name}
                    </Text>
                    {size === 'large' && (
                        <Text style={[styles.badgeDescription, !isEarned && styles.unearnedText]} numberOfLines={2}>
                            {badge.description}
                        </Text>
                    )}

                    {/* Progress Bar */}
                    {showProgress && progress && !isEarned && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={[
                                    styles.progressFill,
                                    { width: `${progress.percentage}%`, backgroundColor: rarityColor }
                                ]} />
                            </View>
                            <Text style={styles.progressText}>
                                {progress.currentProgress}/{progress.maxProgress}
                            </Text>
                        </View>
                    )}

                    {/* Next Milestone */}
                    {showProgress && progress && !isEarned && progress.nextMilestone && (
                        <Text style={styles.nextMilestone}>
                            {progress.nextMilestone}
                        </Text>
                    )}
                </View>
            )}

            {/* Earned Overlay */}
            {isEarned && (
                <View style={styles.earnedOverlay}>
                    <Text style={styles.earnedBadge}>✓</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        margin: 4,
    },
    small: {
        width: 60,
    },
    medium: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },
    large: {
        marginLeft: 20,
        marginRight: 20,
        alignItems: 'flex-start',
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginVertical: 4,
    },
    badgeCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    largeCircle: {
        marginRight: 12,
        flexShrink: 0,
    },
    unearned: {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
    },
    badgeIcon: {
        fontSize: 24,
    },
    smallIcon: {
        fontSize: 18,
    },
    largeIcon: {
        fontSize: 28,
    },
    unearnedIcon: {
        opacity: 0.5,
    },
    rarityIndicator: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    rarityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
    },
    badgeInfo: {
        flex: 1,
        alignItems: 'center',
        marginTop: 8,
        width: '100%',
    },
    badgeName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'center',
    },
    badgeDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
        lineHeight: 18,
    },
    unearnedText: {
        color: '#9ca3af',
    },
    progressContainer: {
        width: '100%',
        marginTop: 8,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e5e7eb',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 4,
    },
    nextMilestone: {
        fontSize: 11,
        color: '#8b5cf6',
        fontWeight: '500',
        marginTop: 4,
        textAlign: 'center',
    },
    earnedOverlay: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    earnedBadge: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default BadgeComponent;