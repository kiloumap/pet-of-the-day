import { Badge, EarnedBadge, BadgeProgress } from '../../types/badges';
import { Pet, Action } from '../../types';
import { BADGES } from '@/constants/badges';
import { getAgeGroup } from '@/constants/dogRewardsSystem';

interface PetAction {
    petId: number;
    actionId: number;
    points: number;
    timestamp: string;
    actionText: string;
}

export class BadgeEngine {
    private earnedBadges: EarnedBadge[] = [];
    private petActions: PetAction[] = [];

    constructor(earnedBadges: EarnedBadge[] = [], petActions: PetAction[] = []) {
        this.earnedBadges = earnedBadges;
        this.petActions = petActions;
    }

    private hasBadge(petId: number, badgeId: string): boolean {
        return this.earnedBadges.some(
            earned => earned.petId === petId && earned.badgeId === badgeId
        );
    }

    calculateProgress(pet: Pet, badge: Badge): BadgeProgress {
        const { requirements } = badge;
        let currentProgress = 0;
        let maxProgress = 1;

        const petActions = this.petActions.filter(action => action.petId === pet.id);

        switch (requirements.type) {
            case 'action_count':
                maxProgress = requirements.count || 1;
                if (requirements.actionIds) {
                    if (requirements.timeframe === 'day') {
                        const today = new Date().toISOString().split('T')[0];
                        currentProgress = petActions.filter(action =>
                            requirements.actionIds!.includes(action.actionId) &&
                            action.timestamp.startsWith(today)
                        ).length;
                    } else if (requirements.timeframe === 'week') {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        currentProgress = petActions.filter(action =>
                            requirements.actionIds!.includes(action.actionId) &&
                            new Date(action.timestamp) >= weekAgo
                        ).length;
                    } else if (requirements.timeframe === 'month') {
                        const monthAgo = new Date();
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        currentProgress = petActions.filter(action =>
                            requirements.actionIds!.includes(action.actionId) &&
                            new Date(action.timestamp) >= monthAgo
                        ).length;
                    } else {
                        currentProgress = petActions.filter(action =>
                            requirements.actionIds!.includes(action.actionId)
                        ).length;
                    }
                }
                break;

            case 'points_total':
                maxProgress = requirements.minPoints || 1;
                if (requirements.timeframe === 'day') {
                    const today = new Date().toISOString().split('T')[0];
                    currentProgress = Math.max(0, petActions
                        .filter(action => action.timestamp.startsWith(today))
                        .reduce((sum, action) => sum + action.points, 0));
                } else if (requirements.timeframe === 'week') {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    currentProgress = Math.max(0, petActions
                        .filter(action => new Date(action.timestamp) >= weekAgo)
                        .reduce((sum, action) => sum + action.points, 0));
                } else {
                    currentProgress = Math.max(0, petActions
                        .reduce((sum, action) => sum + action.points, 0));
                }
                break;

            case 'streak':
                if (badge.id === 'clean_week' || badge.category === 'propreté') {
                    currentProgress = this.calculateCleanStreak(pet.id);
                } else {
                    currentProgress = this.calculateStreak(pet.id, requirements.streakActionIds || []);
                }
                maxProgress = requirements.consecutiveDays || 1;
                break;

            case 'combo':
                const today = new Date().toISOString().split('T')[0];
                const todayPositiveActions = petActions.filter(action =>
                    action.timestamp.startsWith(today) && action.points > 0
                );
                currentProgress = todayPositiveActions.length;
                maxProgress = requirements.count || 3;
                break;

            case 'specific_action':
                const hasSpecificAction = petActions.some(action =>
                    action.actionId === requirements.specificActionId
                );

                if (requirements.conditions?.ageGroup) {
                    const petAgeGroup = getAgeGroup(pet.ageInMonths);
                    currentProgress = (hasSpecificAction && petAgeGroup === requirements.conditions.ageGroup) ? 1 : 0;
                } else {
                    currentProgress = hasSpecificAction ? 1 : 0;
                }
                maxProgress = 1;
                break;

            case 'time_based':
                currentProgress = this.checkTimeBasedRequirement(pet, badge) ? 1 : 0;
                maxProgress = 1;
                break;

            default:
                currentProgress = 0;
                maxProgress = 1;
        }

        const percentage = Math.min((currentProgress / maxProgress) * 100, 100);
        const isCompleted = currentProgress >= maxProgress;

        return {
            badgeId: badge.id,
            petId: pet.id,
            currentProgress,
            maxProgress,
            percentage,
            isCompleted,
            nextMilestone: isCompleted ? undefined : this.getNextMilestone(badge, currentProgress, maxProgress)
        };
    }

    private calculateStreak(petId: number, actionIds: number[]): number {
        const today = new Date();
        let streak = 0;

        const negativeActionIds = [2, 104];

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            const dayActions = this.petActions.filter(action =>
                action.petId === petId &&
                action.timestamp.startsWith(dateStr)
            );

            const hasNegativeAction = dayActions.some(action =>
                negativeActionIds.includes(action.actionId)
            );

            if (hasNegativeAction) {
                break;
            }

            const hasPositiveAction = dayActions.some(action =>
                (actionIds.length === 0 || actionIds.includes(action.actionId)) &&
                action.points > 0
            );

            if (hasPositiveAction) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }

        return streak;
    }

    private calculateCleanStreak(petId: number): number {
        const today = new Date();
        let streak = 0;

        const accidentActionIds = [2, 104, 314];

        const cleanActionIds = [1, 101, 102, 103];

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            const dayActions = this.petActions.filter(action =>
                action.petId === petId &&
                action.timestamp.startsWith(dateStr)
            );

            const hasAccident = dayActions.some(action =>
                accidentActionIds.includes(action.actionId)
            );

            if (hasAccident) {
                console.log(`Streak cassé le ${dateStr} - accident détecté`);
                break;
            }

            const hasCleanAction = dayActions.some(action =>
                cleanActionIds.includes(action.actionId) && action.points > 0
            );

            if (hasCleanAction || i === 0) {
                streak++;
                console.log(`Jour ${i} (${dateStr}): streak = ${streak}, actions propres: ${hasCleanAction}`);
            } else {
                break;
            }
        }

        return streak;
    }

    private checkTimeBasedRequirement(pet: Pet, badge: Badge): boolean {
        const { requirements } = badge;

        if (requirements.timeCondition?.type === 'first_week') {
            const firstAction = this.petActions
                .filter(action => action.petId === pet.id)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];

            if (!firstAction) return false;

            const firstActionDate = new Date(firstAction.timestamp);
            const weekAfter = new Date(firstActionDate);
            weekAfter.setDate(firstActionDate.getDate() + 7);

            return new Date() <= weekAfter;
        }

        return false;
    }

    private getNextMilestone(badge: Badge, currentProgress: number, maxProgress: number): string {
        const { requirements } = badge;

        switch (requirements.type) {
            case 'action_count':
                const remaining = maxProgress - currentProgress;
                const timeframe = requirements.timeframe;
                let timeframeText = '';
                if (timeframe === 'day') timeframeText = ' aujourd\'hui';
                else if (timeframe === 'week') timeframeText = ' cette semaine';
                else if (timeframe === 'month') timeframeText = ' ce mois';

                return `Plus que ${remaining} action${remaining > 1 ? 's' : ''}${timeframeText} !`;

            case 'points_total':
                const pointsNeeded = maxProgress - currentProgress;
                return `Plus que ${pointsNeeded} points !`;

            case 'streak':
                const daysNeeded = maxProgress - currentProgress;
                return `Plus que ${daysNeeded} jour${daysNeeded > 1 ? 's' : ''} consécutif${daysNeeded > 1 ? 's' : ''} !`;

            case 'combo':
                const actionsNeeded = maxProgress - currentProgress;
                return `Plus que ${actionsNeeded} action${actionsNeeded > 1 ? 's' : ''} positive${actionsNeeded > 1 ? 's' : ''} aujourd'hui !`;

            case 'specific_action':
                return 'Effectue cette action spécifique !';

            default:
                return 'Continue comme ça !';
        }
    }

    detectNewBadges(pet: Pet, newAction?: PetAction): EarnedBadge[] {
        const newBadges: EarnedBadge[] = [];

        for (const badge of BADGES) {
            if (this.hasBadge(pet.id, badge.id)) continue;

            const progress = this.calculateProgress(pet, badge);

            if (progress.isCompleted) {
                const earnedBadge: EarnedBadge = {
                    badgeId: badge.id,
                    petId: pet.id,
                    earnedAt: new Date().toISOString(),
                    triggeredBy: newAction ? {
                        actionId: newAction.actionId,
                        points: newAction.points,
                        context: newAction.actionText
                    } : undefined
                };

                newBadges.push(earnedBadge);
            }
        }

        return newBadges;
    }

    getAllProgress(pet: Pet): BadgeProgress[] {
        return BADGES.map(badge => this.calculateProgress(pet, badge));
    }

    getEarnedBadges(petId: number): EarnedBadge[] {
        return this.earnedBadges.filter(badge => badge.petId === petId);
    }

    getBadgeStats(petId: number) {
        const earned = this.getEarnedBadges(petId);
        const total = BADGES.length;

        const byRarity = {
            common: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.rarity === 'common').length,
            rare: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.rarity === 'rare').length,
            epic: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.rarity === 'epic').length,
            legendary: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.rarity === 'legendary').length,
        };

        const byCategory = {
            propreté: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.category === 'propreté').length,
            comportement: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.category === 'comportement').length,
            éducation: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.category === 'éducation').length,
            social: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.category === 'social').length,
            streak: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.category === 'streak').length,
            special: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.category === 'special').length,
        };

        return {
            total: earned.length,
            totalPossible: total,
            percentage: Math.round((earned.length / total) * 100),
            byRarity,
            byCategory,
            recentBadges: earned
                .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
                .slice(0, 3)
        };
    }
}