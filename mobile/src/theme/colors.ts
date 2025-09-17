export const Colors = {
  // Primary Brand Colors
  primary: '#2D9B9B',        // Warm Teal - main brand color
  accent: '#FF7A5C',         // Coral Orange - accent color

  // Light Theme Colors
  light: {
    background: {
      primary: '#FFFFFF',      // Pure white for main backgrounds
      secondary: '#F8F9FA',    // Very light gray for cards and sections
      tertiary: '#F1F3F5',     // Slightly darker for subtle depth
    },
    text: {
      primary: '#2C3E50',      // Dark blue-gray for main text
      secondary: '#6C757D',    // Medium gray for secondary text
      tertiary: '#ADB5BD',     // Light gray for placeholder text
    },
    border: '#E9ECEF',         // Light border color
    shadow: 'rgba(0, 0, 0, 0.1)', // Subtle shadow
  },

  // Dark Theme Colors
  dark: {
    background: {
      primary: '#1A1D29',      // Deep navy for main backgrounds
      secondary: '#252938',    // Slightly lighter for cards
      tertiary: '#2F3349',     // For elevated surfaces
    },
    text: {
      primary: '#FFFFFF',      // White for main text
      secondary: '#B8BCC8',    // Light gray for secondary text
      tertiary: '#858B9A',     // Medium gray for placeholders
    },
    border: '#3A3F52',         // Dark border color
    shadow: 'rgba(0, 0, 0, 0.3)', // Darker shadow
  },

  // Status Colors
  status: {
    success: '#28A745',        // Fresh green for positive actions
    warning: '#FFC107',        // Warm amber for cautions
    error: '#DC3545',          // Clear red for errors and urgent issues
    info: '#17A2B8',           // Calm blue for informational messages
  },

  // Pet Category Colors
  categories: {
    cat: '#8B5FBF',            // Soft Purple for cats
    dog: '#A0724F',            // Warm Brown for dogs
    other: '#7FB069',          // Sage Green for small pets/others
  },

  // Opacity variants
  opacity: {
    light: 'rgba(255, 255, 255, 0.9)',
    medium: 'rgba(255, 255, 255, 0.7)',
    dark: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  }
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors;