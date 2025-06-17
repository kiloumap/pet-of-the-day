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

    // 🎯 Vérifier si un pet a déjà gagné un badge
    private hasBadge(petId: number, badgeId: string): boolean {
        return this.earnedBadges.some(
            earned => earned.petId === petId && earned.badgeId === badgeId
        );
    }

    // 📊 Calculer le progrès vers un badge
    calculateProgress(pet: Pet, badge: Badge): BadgeProgress {
        const { requirements } = badge;
        let currentProgress = 0;
        let maxProgress = 1;

        const petActions = this.petActions.filter(action => action.petId === pet.id);

        switch (requirements.type) {
            case 'action_count':
                maxProgress = requirements.count || 1;
                if (requirements.actionIds) {
                    currentProgress = petActions.filter(action =>
                        requirements.actionIds!.includes(action.actionId)
                    ).length;
                }
                break;

            case 'points_total':
                maxProgress = requirements.minPoints || 1;
                if (requirements.timeframe === 'day') {
                    const today = new Date().toISOString().split('T')[0];
                    currentProgress = petActions
                        .filter(action => action.timestamp.startsWith(today))
                        .reduce((sum, action) => sum + action.points, 0);
                } else {
                    currentProgress = petActions.reduce((sum, action) => sum + action.points, 0);
                }
                break;

            case 'streak':
                currentProgress = this.calculateStreak(pet.id, requirements.streakActionIds || []);
                maxProgress = requirements.consecutiveDays || 1;
                break;

            case 'combo':
                const today = new Date().toISOString().split('T')[0];
                const todayActions = petActions.filter(action =>
                    action.timestamp.startsWith(today) && action.points > 0
                );
                currentProgress = todayActions.length;
                maxProgress = requirements.count || 3;
                break;

            default:
                currentProgress = this.checkSpecificRequirement(pet, badge) ? 1 : 0;
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
            nextMilestone: isCompleted ? undefined : this.getNextMilestone(badge, currentProgress)
        };
    }

    // 🔥 Calculer les streaks
    private calculateStreak(petId: number, actionIds: number[]): number {
        const today = new Date();
        let streak = 0;

        for (let i = 0; i < 30; i++) { // Vérifier les 30 derniers jours
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            const dayActions = this.petActions.filter(action =>
                action.petId === petId &&
                action.timestamp.startsWith(dateStr) &&
                (actionIds.length === 0 || actionIds.includes(action.actionId)) &&
                action.points > 0
            );

            if (dayActions.length > 0) {
                streak++;
            } else if (i > 0) { // Si pas d'action aujourd'hui, ça compte pas contre le streak
                break;
            }
        }

        return streak;
    }

    // ✅ Vérifier les conditions spécifiques
    private checkSpecificRequirement(pet: Pet, badge: Badge): boolean {
        const { requirements } = badge;

        switch (requirements.type) {
            case 'specific_action':
                const hasAction = this.petActions.some(action =>
                    action.petId === pet.id &&
                    action.actionId === requirements.specificActionId
                );

                // Vérifier les conditions d'âge
                if (requirements.conditions?.ageGroup) {
                    const petAgeGroup = getAgeGroup(pet.ageInMonths);
                    return hasAction && petAgeGroup === requirements.conditions.ageGroup;
                }

                return hasAction;

            case 'time_based':
                if (requirements.timeCondition?.type === 'first_week') {
                    // Vérifier si c'est la première semaine du pet
                    const firstAction = this.petActions
                        .filter(action => action.petId === pet.id)
                        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];

                    if (!firstAction) return false;

                    const firstActionDate = new Date(firstAction.timestamp);
                    const weekAfter = new Date(firstActionDate);
                    weekAfter.setDate(firstActionDate.getDate() + 7);

                    return new Date() <= weekAfter;
                }
                break;

            default:
                return false;
        }

        return false;
    }

    // 📝 Obtenir le prochain jalon
    private getNextMilestone(badge: Badge, currentProgress: number): string {
        const { requirements } = badge;

        switch (requirements.type) {
            case 'action_count':
                const remaining = (requirements.count || 1) - currentProgress;
                return `Plus que ${remaining} fois !`;

            case 'points_total':
                const pointsNeeded = (requirements.minPoints || 1) - currentProgress;
                return `Plus que ${pointsNeeded} points !`;

            case 'streak':
                const daysNeeded = (requirements.consecutiveDays || 1) - currentProgress;
                return `Plus que ${daysNeeded} jours consécutifs !`;

            default:
                return 'Continue comme ça !';
        }
    }

    // 🎉 Détecter les nouveaux badges gagnés
    detectNewBadges(pet: Pet, newAction?: PetAction): EarnedBadge[] {
        const newBadges: EarnedBadge[] = [];

        for (const badge of BADGES) {
            // Skip si déjà gagné
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

    // 📋 Obtenir tous les progrès d'un pet
    getAllProgress(pet: Pet): BadgeProgress[] {
        return BADGES.map(badge => this.calculateProgress(pet, badge));
    }

    // 🏆 Obtenir les badges gagnés d'un pet
    getEarnedBadges(petId: number): EarnedBadge[] {
        return this.earnedBadges.filter(badge => badge.petId === petId);
    }

    // 📊 Statistiques des badges
    getBadgeStats(petId: number) {
        const earned = this.getEarnedBadges(petId);
        const total = BADGES.length;

        const byRarity = {
            common: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.rarity === 'common').length,
            rare: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.rarity === 'rare').length,
            epic: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.rarity === 'epic').length,
            legendary: earned.filter(e => BADGES.find(b => b.id === e.badgeId)?.rarity === 'legendary').length,
        };

        return {
            total: earned.length,
            totalPossible: total,
            percentage: Math.round((earned.length / total) * 100),
            byRarity
        };
    }
}