export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  requirements: {
    type: string;
    count?: number;
    days?: number;
  };
}

export interface BadgeProgress {
  badgeId: string;
  current: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: Date;
}