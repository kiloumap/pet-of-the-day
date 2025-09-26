// Behavior logging system types that match backend domain entities

export type BehaviorCategory =
  | 'potty_training'
  | 'basic_commands'
  | 'exercise'
  | 'socialization'
  | 'grooming'
  | 'feeding'
  | 'health'
  | 'play'
  | 'misbehavior';

export type Species = 'dog' | 'cat' | 'both';

// Core Behavior entity
export interface Behavior {
  id: string;
  name: string;
  description: string;
  category: BehaviorCategory;
  pointValue: number;
  minIntervalMinutes: number;
  species: Species;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Behavior log entity for tracking behavior instances
export interface BehaviorLog {
  id: string;
  petId: string;
  behaviorId: string;
  userId: string;
  pointsAwarded: number;
  loggedAt: string;
  createdAt: string;
  notes: string;
  groupShares: BehaviorLogGroupShare[];
}

export interface BehaviorLogGroupShare {
  id: string;
  behaviorLogId: string;
  groupId: string;
  createdAt: string;
}

// Request/Response types for API
export interface CreateBehaviorLogRequest {
  petId: string;
  behaviorId: string;
  loggedAt?: string;
  notes: string;
  groupIds: string[];
}

export interface UpdateBehaviorLogRequest {
  notes: string;
  groupIds: string[];
}

export interface BehaviorLogFilter {
  petId?: string;
  behaviorId?: string;
  groupId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}

// Daily scoring system
export interface DailyScore {
  id: string;
  petId: string;
  groupId: string;
  date: string;
  totalPoints: number;
  positiveBehaviors: number;
  negativeBehaviors: number;
  behaviorCount: number;
  lastUpdated: string;
  breakdown: DailyScoreBreakdown[];
}

export interface DailyScoreBreakdown {
  behaviorId: string;
  behaviorName: string;
  behaviorCategory: BehaviorCategory;
  count: number;
  pointsPerInstance: number;
  totalPoints: number;
}

// Pet ranking system
export interface PetRanking {
  petId: string;
  petName: string;
  ownerName: string;
  totalPoints: number;
  positiveBehaviors: number;
  negativeBehaviors: number;
  behaviorCount: number;
  rank: number;
  isTied: boolean;
  lastActivityDate?: string;
}

// Pet of the Day system
export interface PetOfTheDayWinner {
  id: string;
  groupId: string;
  petId: string;
  petName: string;
  ownerName: string;
  date: string;
  score: number;
  positiveBehaviors: number;
  negativeBehaviors: number;
  selectedAt: string;
}

// Response wrappers
export interface GetBehaviorsResponse {
  behaviors: Behavior[];
}

export interface GetBehaviorLogsResponse {
  behaviorLogs: BehaviorLog[];
  total: number;
}

export interface CreateBehaviorLogResponse {
  behaviorLog: BehaviorLog;
  affectedGroups: string[];
}

export interface UpdateBehaviorLogResponse {
  behaviorLog: BehaviorLog;
  affectedGroups: string[];
}

export interface GetGroupRankingsResponse {
  rankings: PetRanking[];
  groupId: string;
  date: string;
  totalPets: number;
}

export interface GetPetOfTheDayResponse {
  winner: PetOfTheDayWinner | null;
  groupId: string;
  date: string;
}

export interface GetDailyScoreResponse {
  dailyScore: DailyScore;
  petId: string;
  groupId: string;
  date: string;
}

// Filter types for queries
export interface DailyScoreFilter {
  petId?: string;
  groupId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}

// User timezone settings
export interface UserTimezoneSettings {
  userId: string;
  timezone: string;
  dailyResetTime: string;
  updatedAt: string;
}