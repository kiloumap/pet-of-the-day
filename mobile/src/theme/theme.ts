import { Colors, ColorScheme } from './colors';
import { Typography } from './typography';
import { Spacing } from './spacing';

export interface Theme {
  colors: {
    primary: string;
    accent: string;
    reverse: string;
    white: string;
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    border: string;
    shadow: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    status: typeof Colors.status;
    categories: typeof Colors.categories;
    opacity: typeof Colors.opacity;
  };
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  isDark: boolean;
}

export const createTheme = (colorScheme: ColorScheme): Theme => {
  const isDark = colorScheme === 'dark';
  const colorSet = isDark ? Colors.dark : Colors.light;

  return {
    colors: {
      primary: Colors.primary,
      accent: Colors.accent,
      reverse: Colors.reverse,
      white: '#FFFFFF',
      background: colorSet.background,
      text: colorSet.text,
      border: colorSet.border,
      shadow: colorSet.shadow,
      success: Colors.status.success,
      warning: Colors.status.warning,
      error: Colors.status.error,
      info: Colors.status.info,
      status: Colors.status,
      categories: Colors.categories,
      opacity: Colors.opacity,
    },
    typography: Typography,
    spacing: Spacing,
    borderRadius: {
      sm: 6,
      md: 8,
      lg: 12,
      xl: 16,
    },
    isDark,
  };
};

// Default themes
export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');