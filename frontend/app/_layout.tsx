import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import {TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
              name="(header)"
              options={{
                headerShown: true,
                title: 'Pet of the Day',
                headerStyle: { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' },
                headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
                headerTitleAlign: 'center',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => console.log('Menu Open')}>
                      <Ionicons name="menu" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} style={{ marginLeft: 15 }} />
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <TouchableOpacity onPress={() => console.log('Profile')}>
                      <Ionicons name="person" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} style={{ marginRight: 15 }} />
                    </TouchableOpacity>
                ),
              }}
          />

          {/* Menu du bas */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Écran Not Found */}
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
  );
}
