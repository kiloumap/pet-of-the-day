import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Heart, User, Settings } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useTranslation } from '../hooks';
import { MyPetsScreen } from '../screens/pets/MyPetsScreen';
import { AddPetScreen } from '../screens/pets/AddPetScreen';

// Placeholder screens
const HomeScreen = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background.primary }]}>
      <Text style={[styles.placeholderText, { color: theme.colors.text.primary }]}>
        Home Screen
      </Text>
    </View>
  );
};

const ProfileScreen = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background.primary }]}>
      <Text style={[styles.placeholderText, { color: theme.colors.text.primary }]}>
        Profile Screen
      </Text>
    </View>
  );
};

const SettingsScreen = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background.primary }]}>
      <Text style={[styles.placeholderText, { color: theme.colors.text.primary }]}>
        Settings Screen
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '500',
  },
});

export type MainTabParamList = {
  HomeTab: undefined;
  PetsTab: undefined;
  ProfileTab: undefined;
  SettingsTab: undefined;
};

export type PetsStackParamList = {
  MyPets: undefined;
  AddPet: undefined;
  PetDetail: { petId: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const PetsStack = createNativeStackNavigator<PetsStackParamList>();

const PetsStackNavigator: React.FC = () => {
  return (
    <PetsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <PetsStack.Screen name="MyPets" component={MyPetsScreen} />
      <PetsStack.Screen
        name="AddPet"
        component={AddPetScreen}
        options={{
          headerShown: true,
          title: 'Add Pet', // This will be overridden by the screen itself
          presentation: 'modal',
        }}
      />
    </PetsStack.Navigator>
  );
};

export const MainNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
    switch (routeName) {
      case 'HomeTab':
        return <Home size={size} color={color} />;
      case 'PetsTab':
        return <Heart size={size} color={color} />;
      case 'ProfileTab':
        return <User size={size} color={color} />;
      case 'SettingsTab':
        return <Settings size={size} color={color} />;
      default:
        return <Home size={size} color={color} />;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingBottom: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
          height: theme.spacing.height.tabBar,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: t('navigation.home') }}
      />
      <Tab.Screen
        name="PetsTab"
        component={PetsStackNavigator}
        options={{ tabBarLabel: t('navigation.myPets') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: t('navigation.profile') }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: t('navigation.settings') }}
      />
    </Tab.Navigator>
  );
};