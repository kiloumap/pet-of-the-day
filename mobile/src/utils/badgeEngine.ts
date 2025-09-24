import { Badge, BadgeProgress, BadgeRequirement } from '../types/badges';

export class BadgeEngine {
  static checkBadgeEligibility(
    badges: Badge[],
    userStats: Record<string, number>
  ): Badge[] {
    return badges.filter(badge => {
      if (badge.unlocked) return false;

      return badge.requirements.every(requirement => {
        const currentValue = userStats[requirement.type] || 0;
        return currentValue >= requirement.target;
      });
    });
  }

  static calculateProgress(
    badge: Badge,
    userStats: Record<string, number>
  ): BadgeProgress[] {
    return badge.requirements.map(requirement => ({
      badgeId: badge.id,
      currentValue: userStats[requirement.type] || 0,
      targetValue: requirement.target,
      percentage: Math.min(100, ((userStats[requirement.type] || 0) / requirement.target) * 100)
    }));
  }

  static unlockBadge(badge: Badge): Badge {
    return {
      ...badge,
      unlocked: true,
      unlockedAt: new Date()
    };
  }
}