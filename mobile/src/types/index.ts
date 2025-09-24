// Main types export file
export * from './api';
export * from './navigation';
export * from './store';

// Additional type definitions that were missing
export interface Action {
  id: string;
  text: string;
  icon: string;
  points: number;
  category?: string;
}

export interface Multiplier {
  name: string;
  multiplier: number;
  icon: string;
}

export type Screen = 'home' | 'groups' | 'leaderboard' | 'profile';

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: string;
  petIds: string[];
}

export interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  theme: {
    colors: {
      primary: string;
      secondary: string;
      background: {
        primary: string;
        secondary: string;
      };
      text: {
        primary: string;
        secondary: string;
      };
      border: string;
      error: string;
      success: string;
    };
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
  };
}