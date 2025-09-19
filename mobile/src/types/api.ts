// Base API types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  field?: string;
  validationErrors?: ValidationError[];
}

// User types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface RegisterResponse {
  user_id: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user_id: string;
  token: string;
}

// Pet types
export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  photo_url?: string;
  owner_id: string;
  co_owner_ids?: string[];
  created_at: string;
  updated_at?: string;
}

export interface AddPetRequest {
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  photo_url?: string;
}

export interface AddPetResponse {
  pet_id: string;
  pet: {
    name: string;
    species: string;
    breed?: string;
    birth_date?: string;
    photo_url?: string;
  };
}

export interface UpdatePetRequest {
  petId: string;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  photo_url?: string;
}

export interface UpdatePetResponse {
  pet: Pet;
}

export interface GetPetsResponse {
  count: number;
  pets: Pet[];
}

// Group types
export interface Group {
  id: string;
  name: string;
  description: string;
  privacy: 'private' | 'public';
  creator_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Membership {
  id: string;
  group_id: string;
  user_id: string;
  pet_ids: string[];
  status: string;
  joined_at: string;
}

export interface Invitation {
  id: string;
  group_id: string;
  invite_type: 'email' | 'code';
  invitee_email?: string;
  invite_code?: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  privacy?: 'private' | 'public';
  pet_ids?: string[];
}

export interface CreateGroupResponse {
  id: string;
  name: string;
  description: string;
  privacy: string;
  creator_id: string;
  created_at: string;
  invite_code: string;
  membership: {
    id: string;
    user_id: string;
    pet_ids: string[];
    status: string;
  };
}

export interface UpdateGroupRequest {
  groupId: string;
  name?: string;
  description?: string;
  privacy?: 'private' | 'public';
}

export interface UpdateGroupResponse {
  id: string;
  name: string;
  description: string;
  privacy: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface JoinGroupRequest {
  pet_ids: string[];
}

export interface JoinGroupResponse {
  id: string;
  group_id: string;
  user_id: string;
  pet_ids: string[];
  status: string;
}

export interface GetUserGroupsResponse {
  created_groups: Group[];
  joined_groups: {
    group: Group;
    membership: Membership;
  }[];
}

export interface GetGroupResponse {
  group: Group;
  is_creator: boolean;
  membership?: Membership;
}

export interface GetGroupMembersResponse {
  group: Group;
  members: Membership[];
  invitations?: Invitation[];
}

export interface AcceptInvitationRequest {
  invitation_id?: string;
  invite_code?: string;
  pet_ids: string[];
}

export interface InviteToGroupRequest {
  invitee_email?: string;
  invite_type: 'email' | 'code';
}

export interface InviteToGroupResponse {
  id: string;
  group_id: string;
  invite_type: string;
  invite_code?: string;
  expires_at: string;
  created_at: string;
}

export interface UpdateMembershipPetsRequest {
  groupId: string;
  pet_ids: string[];
}

// Points system types
export interface Behavior {
  id: string;
  name: string;
  description?: string;
  points: number;
  category: 'hygiene' | 'play' | 'training' | 'socialization' | 'care' | 'behavior';
  species: 'dog' | 'cat' | 'both';
  icon?: string;
  is_global: boolean;
  created_at: string;
}

export interface ScoreEvent {
  id: string;
  pet_id: string;
  behavior_id: string;
  group_id: string;
  points: number;
  comment?: string;
  recorded_at: string;
  action_date: string;
  recorded_by: string;
}

export interface CreateScoreEventRequest {
  pet_id: string;
  behavior_id: string;
  group_id: string;
  comment?: string;
  action_date?: string;
}

export interface CreateScoreEventResponse {
  id: string;
  pet_id: string;
  behavior_id: string;
  group_id: string;
  points: number;
  comment?: string;
  recorded_at: string;
  action_date: string;
  recorded_by: string;
}

export interface LeaderboardEntry {
  pet_id: string;
  pet_name: string;
  species: string;
  owner_name: string;
  total_points: number;
  actions_count: number;
  rank: number;
}

export interface GetLeaderboardResponse {
  daily: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  period_start: string;
  period_end: string;
}

export interface GetBehaviorsResponse {
  behaviors: Behavior[];
}

export interface GetPetScoreEventsResponse {
  events: ScoreEvent[];
  total_points: number;
}

export interface ActivityItem extends ScoreEvent {
  pet_name: string;
  behavior_name: string;
  group_name: string;
  owner_name: string;
}

export interface GetRecentActivitiesResponse {
  activities: ActivityItem[];
  total_count: number;
}

// Auth token storage
export interface AuthTokens {
  accessToken: string;
  userId: string;
}