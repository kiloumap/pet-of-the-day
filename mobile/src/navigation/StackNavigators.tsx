import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { PasswordResetScreen } from '../screens/auth/PasswordResetScreen';

// Pet screens
import { MyPetsScreen } from '../screens/pets/MyPetsScreen';
import { AddPetScreen } from '../screens/pets/AddPetScreen';
import { PetDetailScreen } from '../screens/pets/PetDetailScreen';
import { PersonalityManagementScreen } from '../screens/pets/PersonalityManagementScreen';
import { CoOwnerManagementScreen } from '../screens/pets/CoOwnerManagementScreen';

// Notebook screens
import { NotebookScreen } from '../screens/notebook/NotebookScreen';

// Sharing screens
import { SharedNotebooksScreen } from '../screens/sharing/SharedNotebooksScreen';

// Group screens
import { GroupsScreen } from '../screens/groups/GroupsScreen';
import { CreateGroupScreen } from '../screens/groups/CreateGroupScreen';
import { JoinGroupScreen } from '../screens/groups/JoinGroupScreen';
import { GroupDetailScreen } from '../screens/groups/GroupDetailScreen';

// Home and Settings screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

import { useTheme } from '../theme';
import { useTranslation } from '../hooks/useTranslation';

// Navigation parameter types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordReset: undefined;
};

export type PetStackParamList = {
  MyPets: undefined;
  AddPet: { editMode?: boolean; petId?: string };
  PetDetail: { petId: string; petName: string };
  PersonalityManagement: { petId: string; petName: string };
  CoOwnerManagement: {
    petId: string;
    petName: string;
    petBreed?: string;
    petPhotoUrl?: string;
  };
  Notebook: {
    petId: string;
    petName: string;
    petBreed?: string;
    petPhotoUrl?: string;
  };
};

export type GroupStackParamList = {
  Groups: undefined;
  CreateGroup: undefined;
  JoinGroup: { inviteCode?: string };
  GroupDetail: { groupId: string; groupName: string };
};

export type SharingStackParamList = {
  SharedNotebooks: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

// Stack navigators
const AuthStack = createStackNavigator<AuthStackParamList>();
const PetStack = createStackNavigator<PetStackParamList>();
const GroupStack = createStackNavigator<GroupStackParamList>();
const SharingStack = createStackNavigator<SharingStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

// Auth Stack Navigator
export const AuthStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
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
        cardStyle: {
          backgroundColor: theme.colors.background.primary,
        },
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: false,
        }}
      />
      <AuthStack.Screen
        name="PasswordReset"
        component={PasswordResetScreen}
        options={{
          headerShown: false,
        }}
      />
    </AuthStack.Navigator>
  );
};

// Pet Stack Navigator
export const PetStackNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <PetStack.Navigator
      screenOptions={{
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
        cardStyle: {
          backgroundColor: theme.colors.background.primary,
        },
      }}
    >
      <PetStack.Screen
        name="MyPets"
        component={MyPetsScreen}
        options={{
          headerShown: false, // Will be shown by TabNavigator
        }}
      />
      <PetStack.Screen
        name="AddPet"
        component={AddPetScreen}
        options={({ route }) => ({
          title: route.params?.editMode ? t('pets.editPet') : t('pets.addPet'),
        })}
      />
      <PetStack.Screen
        name="PetDetail"
        component={PetDetailScreen}
        options={({ route }) => ({
          title: route.params?.petName || t('pets.petDetail'),
        })}
      />
      <PetStack.Screen
        name="PersonalityManagement"
        component={PersonalityManagementScreen}
        options={() => ({
          title: t('personality.title'),
        })}
      />
      <PetStack.Screen
        name="CoOwnerManagement"
        component={CoOwnerManagementScreen}
        options={() => ({
          title: t('sharing.coOwnership.coOwners'),
        })}
      />
      <PetStack.Screen
        name="Notebook"
        component={NotebookScreen}
        options={() => ({
          title: t('notebook.title'),
        })}
      />
    </PetStack.Navigator>
  );
};

// Group Stack Navigator
export const GroupStackNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <GroupStack.Navigator
      screenOptions={{
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
        cardStyle: {
          backgroundColor: theme.colors.background.primary,
        },
      }}
    >
      <GroupStack.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          headerShown: false, // Will be shown by TabNavigator
        }}
      />
      <GroupStack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{
          title: t('groups.createGroup'),
        }}
      />
      <GroupStack.Screen
        name="JoinGroup"
        component={JoinGroupScreen}
        options={{
          title: t('groups.joinGroup'),
        }}
      />
      <GroupStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={({ route }) => ({
          title: route.params?.groupName || t('groups.groupDetail'),
        })}
      />
    </GroupStack.Navigator>
  );
};

// Sharing Stack Navigator
export const SharingStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <SharingStack.Navigator
      screenOptions={{
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
        cardStyle: {
          backgroundColor: theme.colors.background.primary,
        },
      }}
    >
      <SharingStack.Screen
        name="SharedNotebooks"
        component={SharedNotebooksScreen}
        options={{
          headerShown: false, // Will be shown by TabNavigator
        }}
      />
    </SharingStack.Navigator>
  );
};

// Home Stack Navigator
export const HomeStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <HomeStack.Navigator
      screenOptions={{
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
        cardStyle: {
          backgroundColor: theme.colors.background.primary,
        },
      }}
    >
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false, // Will be shown by TabNavigator
        }}
      />
    </HomeStack.Navigator>
  );
};

// Settings Stack Navigator
export const SettingsStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <SettingsStack.Navigator
      screenOptions={{
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
        cardStyle: {
          backgroundColor: theme.colors.background.primary,
        },
      }}
    >
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false, // Will be shown by TabNavigator
        }}
      />
    </SettingsStack.Navigator>
  );
};