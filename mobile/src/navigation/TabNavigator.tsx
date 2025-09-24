import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Home, Users, Heart, Settings, Share2 } from 'lucide-react-native';

import { HomeScreen } from '../screens/home/HomeScreen';
import { MyPetsScreen } from '../screens/pets/MyPetsScreen';
import { SharedNotebooksScreen } from '../screens/sharing/SharedNotebooksScreen';
import { GroupsScreen } from '../screens/groups/GroupsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../theme';
import { useAppSelector } from '../hooks/reduxHooks';

export type TabParamList = {
  Home: undefined;
  MyPets: undefined;
  Groups: undefined;
  Shared: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Get pending invites count for badge
  const { pendingInvites } = useAppSelector((state) => state.sharing);
  const pendingInvitesCount = pendingInvites.length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          switch (route.name) {
            case 'Home':
              IconComponent = Home;
              break;
            case 'MyPets':
              IconComponent = Heart;
              break;
            case 'Groups':
              IconComponent = Users;
              break;
            case 'Shared':
              IconComponent = Share2;
              break;
            case 'Settings':
              IconComponent = Settings;
              break;
            default:
              IconComponent = Home;
          }

          return (
            <IconComponent
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: theme.colors.background.primary,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          color: theme.colors.text.primary,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: theme.colors.text.primary,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('navigation.home'),
          headerTitle: t('navigation.home'),
        }}
      />

      <Tab.Screen
        name="MyPets"
        component={MyPetsScreen}
        options={{
          title: t('navigation.myPets'),
          headerTitle: t('navigation.myPets'),
        }}
      />

      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          title: t('navigation.groups'),
          headerTitle: t('navigation.groups'),
        }}
      />

      <Tab.Screen
        name="Shared"
        component={SharedNotebooksScreen}
        options={{
          title: t('sharing.shared'),
          headerTitle: t('sharing.sharedNotebooks'),
          tabBarBadge: pendingInvitesCount > 0 ? pendingInvitesCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.error,
            color: theme.colors.white,
            fontSize: 10,
            minWidth: 16,
            height: 16,
          },
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('navigation.settings'),
          headerTitle: t('navigation.settings'),
        }}
      />
    </Tab.Navigator>
  );
};