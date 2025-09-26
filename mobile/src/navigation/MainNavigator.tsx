import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Heart, User, Settings } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useTranslation } from '@/hooks';
import { MyPetsScreen } from '@screens/pets/MyPetsScreen';
import { AddPetScreen } from '@screens/pets/AddPetScreen';
import { PetDetailScreen } from '@screens/pets/PetDetailScreen';
import { SettingsScreen } from '@screens/settings/SettingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import GroupsScreen from '../screens/groups/GroupsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import JoinGroupScreen from '../screens/groups/JoinGroupScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import InviteToGroupScreen from '../screens/groups/InviteToGroupScreen';
import AddActionScreen from '../screens/points/AddActionScreen';
import LeaderboardScreen from '../screens/points/LeaderboardScreen';
import HomeScreen from '../screens/home/HomeScreen';
import BehaviorLogScreen from '../screens/behavior/BehaviorLogScreen';
import GroupRankingsScreen from '../screens/behavior/GroupRankingsScreen';



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
  GroupsTab: undefined;
  ProfileTab: undefined;
  SettingsTab: undefined;
};

export type RootNavigationParamList = MainTabParamList & GroupsStackParamList & PetsStackParamList;

export type PetsStackParamList = {
  MyPets: undefined;
  AddPet: undefined;
  PetDetail: { petId: string };
};

export type GroupsStackParamList = {
  Groups: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupDetail: { groupId: string };
  InviteToGroup: { groupId: string; groupName: string };
  AddAction: { groupId: string; petId?: string };
  Leaderboard: { groupId: string };
  BehaviorLog: { groupId: string; petId?: string };
  GroupRankings: { groupId: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const PetsStack = createNativeStackNavigator<PetsStackParamList>();
const GroupsStack = createNativeStackNavigator<GroupsStackParamList>();

const PetsStackNavigator: React.FC = () => {
    const { t } = useTranslation();

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
          title: 'Add Pet',
          presentation: 'modal',
        }}
      />
      <PetsStack.Screen
        name="PetDetail"
        component={PetDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </PetsStack.Navigator>
  );
};

const GroupsStackNavigator: React.FC = () => {
  return (
    <GroupsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <GroupsStack.Screen name="Groups" component={GroupsScreen} />
      <GroupsStack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen
        name="JoinGroup"
        component={JoinGroupScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <GroupsStack.Screen
        name="InviteToGroup"
        component={InviteToGroupScreen}
        options={{
          headerShown: false,
        }}
      />
      <GroupsStack.Screen
        name="AddAction"
        component={AddActionScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <GroupsStack.Screen
        name="BehaviorLog"
        component={BehaviorLogScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <GroupsStack.Screen
        name="GroupRankings"
        component={GroupRankingsScreen}
        options={{
          headerShown: false,
        }}
      />
    </GroupsStack.Navigator>
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
      case 'GroupsTab':
        return <MaterialIcons name="group" size={size} color={color} />;
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
        name="GroupsTab"
        component={GroupsStackNavigator}
        options={{ tabBarLabel: t('navigation.groups') }}
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