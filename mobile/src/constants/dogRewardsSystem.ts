export const DOG_REWARDS_SYSTEM = {
  actions: {
    walk: { points: 10, multiplier: 1.0 },
    feed: { points: 5, multiplier: 1.0 },
    play: { points: 8, multiplier: 1.0 },
    training: { points: 15, multiplier: 1.2 },
    grooming: { points: 12, multiplier: 1.0 },
    vet_visit: { points: 20, multiplier: 1.0 },
  },
  streaks: {
    daily: { multiplier: 1.1 },
    weekly: { multiplier: 1.25 },
    monthly: { multiplier: 1.5 },
  },
  achievements: {
    first_week: { points: 50, name: 'First Week Champion' },
    hundred_points: { points: 100, name: 'Century Club' },
    perfect_month: { points: 200, name: 'Perfect Month' },
  }
};

export type DogAction = keyof typeof DOG_REWARDS_SYSTEM.actions;
export type StreakType = keyof typeof DOG_REWARDS_SYSTEM.streaks;
export type Achievement = keyof typeof DOG_REWARDS_SYSTEM.achievements;

// Age groups for action availability
export type AgeGroup = 'puppy' | 'young' | 'adult' | 'senior';

// Multipliers export
export const multipliers = DOG_REWARDS_SYSTEM.streaks;

// Get age group based on pet age in months
export const getAgeGroup = (ageInMonths: number): AgeGroup => {
  if (ageInMonths < 6) return 'puppy';
  if (ageInMonths < 24) return 'young';
  if (ageInMonths < 84) return 'adult';
  return 'senior';
};

// Get available actions by age group
export const getActionsByAge = (ageGroup: AgeGroup) => {
  const allActions = Object.entries(DOG_REWARDS_SYSTEM.actions).map(([key, value]) => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
    points: value.points,
    multiplier: value.multiplier,
  }));

  // For now, return all actions for all age groups
  // You can customize this logic based on age restrictions
  return allActions;
};

// Calculate points with multipliers
export const calculatePoints = (basePoints: number, multiplier: number = 1.0): number => {
  return Math.floor(basePoints * multiplier);
};