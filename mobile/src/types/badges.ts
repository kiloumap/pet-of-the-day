export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: BadgeRequirement[];
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface BadgeRequirement {
  type: 'streak' | 'points' | 'action_count' | 'milestone';
  target: number;
  description: string;
}

export interface BadgeProgress {
  badgeId: string;
  petId?: string; // Optional for pet-specific progress tracking
  currentValue: number;
  targetValue: number;
  percentage: number;
}

export type BadgeCategory = 'care' | 'training' | 'health' | 'social' | 'milestone';

export interface EarnedBadge {
  id: string;
  badgeId: string;
  userId: string;
  petId?: number; // Optional since badges can be user-level or pet-level
  earnedAt: Date;
  badge: Badge;
}

export interface PetAction {
  id: string;
  petId: string;
  actionId: string;
  points: number;
  date: Date;
}