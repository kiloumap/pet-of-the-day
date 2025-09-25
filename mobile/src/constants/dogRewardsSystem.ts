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