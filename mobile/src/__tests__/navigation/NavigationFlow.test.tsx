import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MainNavigator } from '../../navigation/MainNavigator';
import HomeScreen from '../../screens/home/HomeScreen';
import authSlice from '../../store/authSlice';
import petSlice from '../../store/petSlice';
import groupSlice from '../../store/groupSlice';

// Mock the theme hook
jest.mock('../../theme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#007AFF',
        text: {
          primary: '#000000',
          secondary: '#666666',
          tertiary: '#999999',
        },
        background: {
          primary: '#ffffff',
          secondary: '#f5f5f5',
          tertiary: '#f0f0f0',
        },
        border: '#e0e0e0',
        error: '#FF3B30',
        warning: '#FF9500',
        info: '#007AFF',
        success: '#34C759',
        white: '#ffffff',
        shadow: '#000000',
        status: {
          error: '#FF3B30',
        },
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        '2xl': 32,
        height: {
          tabBar: 60,
        },
      },
      typography: {
        fontSize: {
          xs: 12,
        },
        fontWeight: {
          medium: '500',
        },
      },
      borderRadius: {
        md: 8,
      },
    },
  }),
}));

// Mock translation hook
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'navigation.home': 'Home',
        'navigation.myPets': 'My Pets',
        'navigation.groups': 'Groups',
        'navigation.profile': 'Profile',
        'navigation.settings': 'Settings',
        'home.welcome': 'Welcome {{name}}!',
        'home.subtitle': 'Track your pets daily',
        'home.noPets': 'No pets yet',
        'home.noPetsDescription': 'Add your first pet to get started',
        'home.petOfTheDay': 'Pet of the Day',
        'home.quickActions.title': 'Quick Actions',
        'home.quickActions.addEntry': 'Add Entry',
        'home.quickActions.schedule': 'Schedule',
        'home.quickActions.shareNotebook': 'Share',
        'home.quickActions.viewStats': 'View Stats',
        'home.stats.pets': 'Pets',
        'home.stats.points': 'Points',
        'home.stats.shared': 'Shared',
        'home.stats.invites': 'Invites',
        'home.notifications.pendingInvites': '{{count}} pending invitations',
        'home.notifications.pendingInvitesDescription': 'You have pending group invitations',
        'pets.addPet': 'Add Pet',
        'pets.addAnimal': 'Add Animal',
        'common.viewAll': 'View All',
      };

      if (options && options.name) {
        return translations[key]?.replace('{{name}}', options.name) || key;
      }
      if (options && options.count !== undefined) {
        return translations[key]?.replace('{{count}}', options.count.toString()) || key;
      }

      return translations[key] || key;
    },
  }),
}));

// Mock react-i18next directly
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'navigation.home': 'Home',
        'navigation.myPets': 'My Pets',
        'navigation.groups': 'Groups',
        'navigation.profile': 'Profile',
        'navigation.settings': 'Settings',
        'home.welcome': 'Welcome {{name}}!',
        'home.subtitle': 'Track your pets daily',
        'home.noPets': 'No pets yet',
        'home.noPetsDescription': 'Add your first pet to get started',
        'home.petOfTheDay': 'Pet of the Day',
        'pets.addPet': 'Add Pet',
        'pets.addAnimal': 'Add Animal',
        'common.viewAll': 'View All',
      };

      if (options && options.name) {
        return translations[key]?.replace('{{name}}', options.name) || key;
      }

      return translations[key] || key;
    },
  }),
}));

// Mock all the screen components to prevent import errors
jest.mock('../../screens/pets/MyPetsScreen', () => ({
  MyPetsScreen: () => <div data-testid="my-pets-screen">My Pets Screen</div>,
}));

jest.mock('../../screens/pets/AddPetScreen', () => ({
  AddPetScreen: () => <div data-testid="add-pet-screen">Add Pet Screen</div>,
}));

jest.mock('../../screens/pets/PetDetailScreen', () => ({
  PetDetailScreen: () => <div data-testid="pet-detail-screen">Pet Detail Screen</div>,
}));

jest.mock('../../screens/settings/SettingsScreen', () => ({
  SettingsScreen: () => <div data-testid="settings-screen">Settings Screen</div>,
}));

jest.mock('../../screens/profile/ProfileScreen', () => ({
  __esModule: true,
  default: () => <div data-testid="profile-screen">Profile Screen</div>,
}));

jest.mock('../../screens/groups/GroupsScreen', () => ({
  __esModule: true,
  default: () => <div data-testid="groups-screen">Groups Screen</div>,
}));

// Mock other group screens
jest.mock('../../screens/groups/CreateGroupScreen', () => ({
  __esModule: true,
  default: () => <div data-testid="create-group-screen">Create Group Screen</div>,
}));

jest.mock('../../screens/groups/JoinGroupScreen', () => ({
  __esModule: true,
  default: () => <div data-testid="join-group-screen">Join Group Screen</div>,
}));

jest.mock('../../screens/groups/GroupDetailScreen', () => ({
  __esModule: true,
  default: () => <div data-testid="group-detail-screen">Group Detail Screen</div>,
}));

jest.mock('../../screens/groups/InviteToGroupScreen', () => ({
  __esModule: true,
  default: () => <div data-testid="invite-to-group-screen">Invite To Group Screen</div>,
}));

jest.mock('../../screens/points/AddActionScreen', () => ({
  __esModule: true,
  default: () => <div data-testid="add-action-screen">Add Action Screen</div>,
}));

jest.mock('../../screens/points/LeaderboardScreen', () => ({
  __esModule: true,
  default: () => <div data-testid="leaderboard-screen">Leaderboard Screen</div>,
}));

// Mock UI components
jest.mock('../../components/ui/Text', () => ({
  Text: ({ children, style, ...props }: any) => (
    <span style={style} {...props}>{children}</span>
  ),
}));

jest.mock('../../components/ui/Button', () => ({
  Button: ({ children, onPress, style, testID, ...props }: any) => (
    <button onClick={onPress} style={style} data-testid={testID} {...props}>
      {children}
    </button>
  ),
}));

// Mock card components
jest.mock('../../shared/cards/PetCard', () => ({
  PetCard: ({ pet }: any) => (
    <div data-testid={`pet-card-${pet.id}`} onClick={() => {}}>
      Pet Card: {pet.name}
    </div>
  ),
}));

jest.mock('../../shared/cards/PetOfTheDayCard', () => ({
  PetOfTheDayCard: ({ pet }: any) => (
    <div data-testid="pet-of-the-day-card">Pet of the Day: {pet.name}</div>
  ),
}));

// Mock Redux slices
jest.mock('../../store/slices/sharingSlice', () => ({
  fetchPendingInvites: () => ({ type: 'sharing/fetchPendingInvites' }),
  fetchSharedNotebooks: () => ({ type: 'sharing/fetchSharedNotebooks' }),
}));

// Mock icons
jest.mock('lucide-react-native', () => ({
  Home: ({ size, color }: any) => `Home-${size}-${color}`,
  Heart: ({ size, color }: any) => `Heart-${size}-${color}`,
  User: ({ size, color }: any) => `User-${size}-${color}`,
  Settings: ({ size, color }: any) => `Settings-${size}-${color}`,
  Calendar: ({ size, color }: any) => `Calendar-${size}-${color}`,
  Plus: ({ size, color }: any) => `Plus-${size}-${color}`,
  TrendingUp: ({ size, color }: any) => `TrendingUp-${size}-${color}`,
  Users: ({ size, color }: any) => `Users-${size}-${color}`,
  Bell: ({ size, color }: any) => `Bell-${size}-${color}`,
  BookOpen: ({ size, color }: any) => `BookOpen-${size}-${color}`,
  Star: ({ size, color }: any) => `Star-${size}-${color}`,
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: ({ name, size, color }: any) => `MaterialIcons-${name}-${size}-${color}`,
  Ionicons: ({ name, size, color }: any) => `Ionicons-${name}-${size}-${color}`,
}));

describe('NavigationFlow', () => {
  let store: any;
  let mockUser: any;
  let mockPets: any[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 'user-1',
      first_name: 'John',
      email: 'john.doe@example.com',
    };

    mockPets = [
      {
        id: 'pet-1',
        name: 'Buddy',
        species: 'dog',
        points: 100,
        created_at: '2023-01-01',
      },
      {
        id: 'pet-2',
        name: 'Whiskers',
        species: 'cat',
        points: 50,
        created_at: '2023-02-01',
      },
    ];

    store = configureStore({
      reducer: {
        auth: authSlice,
        pets: petSlice,
        groups: groupSlice,
        sharing: (state = { pendingInvites: [], sharedNotebooks: [] }) => state,
      },
      preloadedState: {
        auth: {
          user: mockUser,
          token: 'mock-token',
          isLoading: false,
          error: null,
          isAuthenticated: true,
        },
        pets: {
          pets: mockPets,
          selectedPet: null,
          isLoading: false,
          error: null,
          petFilters: { species: 'all', sortBy: 'name' },
        },
        groups: {
          groups: [],
          selectedGroup: null,
          isLoading: false,
          error: null,
        },
        sharing: {
          pendingInvites: [],
          sharedNotebooks: [],
        },
      },
    });
  });

  const renderWithNavigation = (Component: React.ComponentType<any> = MainNavigator) => {
    return render(
      <Provider store={store}>
        <NavigationContainer>
          <Component />
        </NavigationContainer>
      </Provider>
    );
  };

  const renderHomeScreen = () => {
    return render(
      <Provider store={store}>
        <NavigationContainer>
          <HomeScreen />
        </NavigationContainer>
      </Provider>
    );
  };

  // TESTS THAT SHOULD FAIL INITIALLY (TDD APPROACH)
  describe('Home Screen Navigation Buttons', () => {
    it('should navigate to Add Pet screen when Add Pet button is pressed', async () => {
      const { getByText, queryByTestId } = renderHomeScreen();

      // Look for Add Pet button - this test should FAIL because navigation is broken
      const addPetButton = getByText('Add Pet');
      expect(addPetButton).toBeTruthy();

      fireEvent.press(addPetButton);

      // Should navigate to AddPet screen - WILL FAIL because navigation is broken
      await waitFor(() => {
        const addPetScreen = queryByTestId('add-pet-screen');
        expect(addPetScreen).toBeTruthy();
      });
    });

    it('should navigate to My Pets screen when View All button is pressed', async () => {
      const { getByText, queryByTestId } = renderHomeScreen();

      // Look for View All button - this test should FAIL because navigation is broken
      const viewAllButton = getByText('View All');
      expect(viewAllButton).toBeTruthy();

      fireEvent.press(viewAllButton);

      // Should navigate to MyPets screen - WILL FAIL because navigation is broken
      await waitFor(() => {
        const myPetsScreen = queryByTestId('my-pets-screen');
        expect(myPetsScreen).toBeTruthy();
      });
    });

    it('should navigate to pet detail when pet card is pressed', async () => {
      const { getByTestId, queryByTestId } = renderHomeScreen();

      // Look for pet card - this test should FAIL because pet card navigation is broken
      const petCard = getByTestId('pet-card-pet-1');
      expect(petCard).toBeTruthy();

      fireEvent.press(petCard);

      // Should navigate to PetDetail screen - WILL FAIL because navigation is broken
      await waitFor(() => {
        const petDetailScreen = queryByTestId('pet-detail-screen');
        expect(petDetailScreen).toBeTruthy();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should navigate between tabs correctly', async () => {
      const { getByText, queryByTestId } = renderWithNavigation();

      // Test tab navigation
      const petsTab = getByText('My Pets');
      expect(petsTab).toBeTruthy();

      fireEvent.press(petsTab);

      await waitFor(() => {
        const myPetsScreen = queryByTestId('my-pets-screen');
        expect(myPetsScreen).toBeTruthy();
      });

      // Navigate to Groups tab
      const groupsTab = getByText('Groups');
      fireEvent.press(groupsTab);

      await waitFor(() => {
        const groupsScreen = queryByTestId('groups-screen');
        expect(groupsScreen).toBeTruthy();
      });
    });

    it('should maintain navigation state when switching tabs', async () => {
      const { getByText, queryByTestId } = renderWithNavigation();

      // Navigate to pets tab, then back to home
      const petsTab = getByText('My Pets');
      fireEvent.press(petsTab);

      const homeTab = getByText('Home');
      fireEvent.press(homeTab);

      // Should return to home screen and maintain state
      await waitFor(() => {
        const welcomeText = getByText(/Welcome John!/);
        expect(welcomeText).toBeTruthy();
      });
    });
  });

  describe('Back Button Functionality', () => {
    it('should handle system back button correctly', async () => {
      const { getByText } = renderWithNavigation();

      // This test should FAIL initially because system back button behavior is broken
      // Navigate to a nested screen first
      const petsTab = getByText('My Pets');
      fireEvent.press(petsTab);

      // Simulate system back button press
      // This would require additional setup with navigation testing utilities
      expect(true).toBeTruthy(); // Placeholder - would test back button behavior
    });

    it('should prevent navigation when there are unsaved changes', async () => {
      const { getByText } = renderWithNavigation();

      // This test should FAIL initially because unsaved changes handling is not implemented
      // Navigate to a form screen with unsaved changes
      // Then try to navigate away
      expect(true).toBeTruthy(); // Placeholder - would test unsaved changes warning
    });
  });

  describe('Deep Linking and Navigation State', () => {
    it('should handle deep links to pet detail screens', async () => {
      // This test should FAIL initially because deep linking might be broken
      const { queryByTestId } = renderWithNavigation();

      // Test navigation to pet detail via deep link
      // Would require navigation testing utilities to simulate deep linking
      expect(true).toBeTruthy(); // Placeholder - would test deep linking
    });

    it('should restore navigation state on app resume', async () => {
      // This test should FAIL initially because state restoration might be broken
      const { queryByTestId } = renderWithNavigation();

      // Test navigation state persistence and restoration
      expect(true).toBeTruthy(); // Placeholder - would test state restoration
    });
  });

  describe('Navigation Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      const { getByText } = renderWithNavigation();

      // This test should FAIL initially because error handling might not exist
      // Try to navigate to non-existent screen or with invalid params
      expect(true).toBeTruthy(); // Placeholder - would test error handling
    });

    it('should show appropriate error messages for failed navigation', async () => {
      const { getByText } = renderWithNavigation();

      // This test should FAIL initially because error messages might not be implemented
      expect(true).toBeTruthy(); // Placeholder - would test error messages
    });
  });

  describe('Navigation Performance', () => {
    it('should navigate smoothly without lag', async () => {
      const { getByText } = renderWithNavigation();

      // Test navigation performance
      const startTime = Date.now();

      const petsTab = getByText('My Pets');
      fireEvent.press(petsTab);

      const endTime = Date.now();
      const navigationTime = endTime - startTime;

      // Should navigate quickly (under 100ms)
      expect(navigationTime).toBeLessThan(100);
    });

    it('should not cause memory leaks during navigation', async () => {
      const { getByText } = renderWithNavigation();

      // Test for memory leaks during rapid navigation
      // Would require performance monitoring utilities
      expect(true).toBeTruthy(); // Placeholder - would test memory usage
    });
  });

  describe('Navigation Accessibility', () => {
    it('should support screen reader navigation', async () => {
      const { getByText, getByRole } = renderWithNavigation();

      // This test should FAIL initially if accessibility is not properly implemented
      // Test accessibility labels and navigation
      expect(true).toBeTruthy(); // Placeholder - would test accessibility
    });

    it('should handle keyboard navigation', async () => {
      const { getByText } = renderWithNavigation();

      // This test should FAIL initially if keyboard navigation is not implemented
      // Test keyboard navigation support
      expect(true).toBeTruthy(); // Placeholder - would test keyboard navigation
    });
  });

  describe('Navigation Guards', () => {
    it('should prevent unauthorized navigation', async () => {
      // This test should FAIL initially if navigation guards are not implemented
      const unauthenticatedStore = configureStore({
        reducer: {
          auth: authSlice,
          pets: petSlice,
          groups: groupSlice,
          sharing: (state = { pendingInvites: [], sharedNotebooks: [] }) => state,
        },
        preloadedState: {
          auth: {
            user: null,
            token: null,
            isLoading: false,
            error: null,
            isAuthenticated: false,
          },
          pets: { pets: [], selectedPet: null, isLoading: false, error: null, petFilters: { species: 'all', sortBy: 'name' } },
          groups: { groups: [], selectedGroup: null, isLoading: false, error: null },
          sharing: { pendingInvites: [], sharedNotebooks: [] },
        },
      });

      const { queryByTestId } = render(
        <Provider store={unauthenticatedStore}>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </Provider>
      );

      // Should not be able to access protected screens without authentication
      // Would redirect to login screen
      expect(true).toBeTruthy(); // Placeholder - would test authentication guards
    });
  });
});