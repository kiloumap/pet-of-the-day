// Base API types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
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

export interface GetPetsResponse {
  count: number;
  pets: Pet[];
}

// Auth token storage
export interface AuthTokens {
  accessToken: string;
  userId: string;
}