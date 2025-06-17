
export interface Pet {
  id: number;
  name: string;
  breed: string;
  age: string;
  ageInMonths: number; // Nouveau champ pour le calcul précis
  points: number;
  image: string;
  isOwn: boolean;
}

export interface Group {
  id: number;
  name: string;
  members: number;
  type: 'personal' | 'neighborhood' | 'friends';
}

export interface Action {
  id: number;
  text: string;
  points: number;
  icon: string;
  category: 'propreté' | 'comportement' | 'éducation' | 'social' | 'bonus';
  ageGroup?: 'chiot' | 'adulte' | 'senior'; // Nouveau champ optionnel
}

export interface Multiplier {
  name: string;
  factor: number;
  description?: string;
}

export type AgeGroup = 'chiot' | 'adulte' | 'senior';

export type Screen = 'home' | 'groups' | 'leaderboard' | 'profile' | 'settings';

export interface NavItem {
  id: Screen;
  label: string;
  icon: any; // Lucide icon component
}