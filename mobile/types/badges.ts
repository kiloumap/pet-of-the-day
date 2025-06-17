// Export vers types/index.ts
export * from './badges';export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    category: 'propreté' | 'comportement' | 'éducation' | 'social' | 'streak' | 'special';
    requirements: BadgeRequirement;
}

export interface BadgeRequirement {
    type: 'action_count' | 'streak' | 'points_total' | 'specific_action' | 'time_based' | 'combo';
    // Pour action_count
    actionIds?: number[];
    count?: number;
    timeframe?: 'day' | 'week' | 'month' | 'all_time';

    // Pour streak
    consecutiveDays?: number;
    streakActionIds?: number[];

    // Pour points_total
    minPoints?: number;

    // Pour specific_action
    specificActionId?: number;
    conditions?: {
        ageGroup?: 'chiot' | 'adulte' | 'senior';
        multipliers?: string[];
        minPoints?: number;
    };

    // Pour combo (plusieurs actions le même jour)
    comboActionIds?: number[];

    // Pour time_based
    timeCondition?: {
        type: 'first_week' | 'weekend' | 'holiday';
        value?: any;
    };
}

export interface EarnedBadge {
    badgeId: string;
    petId: number;
    earnedAt: string;
    triggeredBy?: {
        actionId?: number;
        points?: number;
        context?: string;
    };
}

export interface BadgeProgress {
    badgeId: string;
    petId: number;
    currentProgress: number;
    maxProgress: number;
    percentage: number;
    isCompleted: boolean;
    nextMilestone?: string;
}