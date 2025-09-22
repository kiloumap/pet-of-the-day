import { Colors, ColorScheme } from './colors';
import { Typography } from './typography';
import { Spacing } from './spacing';

export interface Theme {
  colors: {
    primary: string;
    accent: string;
    reverse: string;
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
    status: typeof Colors.status;
    categories: typeof Colors.categories;
    opacity: typeof Colors.opacity;
  };
  typography: typeof Typography;
  spacing: typeof Spacing;
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
      background: colorSet.background,
      text: colorSet.text,
      border: colorSet.border,
      shadow: colorSet.shadow,
      status: Colors.status,
      categories: Colors.categories,
      opacity: Colors.opacity,
    },
    typography: Typography,
    spacing: Spacing,
    isDark,
  };
};

// Default themes
export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');