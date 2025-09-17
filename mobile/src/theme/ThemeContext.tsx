import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, createTheme } from './theme';
import { ColorScheme } from './colors';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme | 'auto') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_preference';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme() ?? 'light';
  const [themePreference, setThemePreference] = useState<ColorScheme | 'auto'>('auto');

  // Determine actual color scheme based on preference
  const actualColorScheme: ColorScheme =
    themePreference === 'auto' ? systemColorScheme : themePreference;

  const theme = createTheme(actualColorScheme);

  // Load theme preference from storage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && ['light', 'dark', 'auto'].includes(saved)) {
          setThemePreference(saved as ColorScheme | 'auto');
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference to storage when it changes
  const setColorScheme = async (scheme: ColorScheme | 'auto') => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
      setThemePreference(scheme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
      // Still update state even if storage fails
      setThemePreference(scheme);
    }
  };

  const toggleTheme = () => {
    const newScheme = actualColorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
  };

  const value: ThemeContextType = {
    theme,
    colorScheme: actualColorScheme,
    setColorScheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};