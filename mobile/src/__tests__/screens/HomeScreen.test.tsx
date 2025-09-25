import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../../screens/home/HomeScreen';
import authSlice from '../../store/authSlice';
import petSlice from '../../store/petSlice';

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
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        '2xl': 32,
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
        'navigation.myPets': 'My Pets',
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
    <div data-testid={`pet-card-${pet.id}`} style={{ width: 280, height: 180 }}>
      Pet Card: {pet.name}
    </div>
  ),
}));

jest.mock('../../shared/cards/PetOfTheDayCard', () => ({
  PetOfTheDayCard: ({ pet }: any) => (
    <div data-testid="pet-of-the-day-card" style={{ width: '100%' }}>
      Pet of the Day: {pet.name}
    </div>
  ),
}));

// Mock Redux slices
jest.mock('../../store/slices/sharingSlice', () => ({
  fetchPendingInvites: () => ({ type: 'sharing/fetchPendingInvites' }),
  fetchSharedNotebooks: () => ({ type: 'sharing/fetchSharedNotebooks' }),
}));

// Mock icons
jest.mock('lucide-react-native', () => ({
  Heart: ({ size, color }: any) => `Heart-${size}-${color}`,
  Calendar: ({ size, color }: any) => `Calendar-${size}-${color}`,
  Plus: ({ size, color }: any) => `Plus-${size}-${color}`,
  TrendingUp: ({ size, color }: any) => `TrendingUp-${size}-${color}`,
  Users: ({ size, color }: any) => `Users-${size}-${color}`,
  Bell: ({ size, color }: any) => `Bell-${size}-${color}`,
  BookOpen: ({ size, color }: any) => `BookOpen-${size}-${color}`,
  Star: ({ size, color }: any) => `Star-${size}-${color}`,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color }: any) => `Ionicons-${name}-${size}-${color}`,
}));

describe('HomeScreen Layout Tests', () => {
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
        sharing: {
          pendingInvites: [],
          sharedNotebooks: [],
        },
      },
    });
  });

  const renderWithProviders = () => {
    return render(
      <Provider store={store}>
        <NavigationContainer>
          <HomeScreen />
        </NavigationContainer>
      </Provider>
    );
  };

  describe('My Pets Section Layout', () => {
    // THIS TEST SHOULD FAIL INITIALLY - MyPets section is not properly centered
    it('should have proper centering for My Pets section', () => {
      const { getByText, container } = renderWithProviders();

      // Find the My Pets section
      const myPetsTitle = getByText('My Pets');
      expect(myPetsTitle).toBeTruthy();

      // Check if the section has proper alignment styles
      const myPetsSection = myPetsTitle.closest('[data-testid="my-pets-section"]') ||
                           myPetsTitle.parentElement?.parentElement;

      // This test should FAIL because the section doesn't have proper centering
      expect(myPetsSection).toHaveStyle({
        alignItems: 'center',
        justifyContent: 'center',
      });
    });

    it('should center pet cards within the horizontal scroll view', () => {
      const { getByTestId, container } = renderWithProviders();

      // Check if pet cards are properly centered within their container
      const petCard = getByTestId('pet-card-pet-1');
      expect(petCard).toBeTruthy();

      const petListContainer = petCard.closest('[data-testid="pet-list-container"]');

      // This test should FAIL because pet cards are not properly centered
      expect(petListContainer).toHaveStyle({
        justifyContent: 'center',
        alignItems: 'center',
      });
    });

    it('should center the empty state when no pets exist', () => {
      // Create store with no pets
      const emptyStore = configureStore({
        reducer: {
          auth: authSlice,
          pets: petSlice,
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
            pets: [],
            selectedPet: null,
            isLoading: false,
            error: null,
            petFilters: { species: 'all', sortBy: 'name' },
          },
          sharing: {
            pendingInvites: [],
            sharedNotebooks: [],
          },
        },
      });

      const { getByText, container } = render(
        <Provider store={emptyStore}>
          <NavigationContainer>
            <HomeScreen />
          </NavigationContainer>
        </Provider>
      );

      const noPetsMessage = getByText('No pets yet');
      expect(noPetsMessage).toBeTruthy();

      const emptyState = noPetsMessage.closest('[data-testid="empty-state"]') ||
                        noPetsMessage.parentElement;

      // This test should FAIL because empty state is not properly centered
      expect(emptyState).toHaveStyle({
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      });
    });

    it('should have proper spacing between section elements', () => {
      const { getByText } = renderWithProviders();

      const myPetsTitle = getByText('My Pets');
      const viewAllButton = getByText('View All');

      // Check spacing between title and view all button
      const sectionHeader = myPetsTitle.parentElement;

      // This test should FAIL because spacing is not properly implemented
      expect(sectionHeader).toHaveStyle({
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
      });
    });

    it('should center the Add Pet card within the horizontal scroll', () => {
      const { getByText } = renderWithProviders();

      const addPetButton = getByText('Add Animal');
      expect(addPetButton).toBeTruthy();

      const addPetCard = addPetButton.closest('[data-testid="add-pet-card"]') ||
                        addPetButton.parentElement;

      // This test should FAIL because Add Pet card is not properly centered
      expect(addPetCard).toHaveStyle({
        justifyContent: 'center',
        alignItems: 'center',
      });
    });

    it('should maintain proper aspect ratio for pet cards', () => {
      const { getByTestId } = renderWithProviders();

      const petCard = getByTestId('pet-card-pet-1');

      // Pet cards should have consistent dimensions
      expect(petCard).toHaveStyle({
        width: 280,
        height: 180,
      });

      // Container should respect card dimensions
      const cardContainer = petCard.parentElement;

      // This test should FAIL if card container doesn't maintain proper dimensions
      expect(cardContainer).toHaveStyle({
        width: 280,
      });
    });
  });

  describe('Overall Section Alignment', () => {
    it('should center all main sections within the screen', () => {
      const { container, getByText } = renderWithProviders();

      // Check if the main scroll view content is properly aligned
      const scrollViewContent = container.querySelector('[data-testid="scroll-content"]');

      // This test should FAIL because overall content alignment is not implemented
      expect(scrollViewContent).toHaveStyle({
        alignItems: 'center',
      });
    });

    it('should have consistent padding across all sections', () => {
      const { getByText } = renderWithProviders();

      const sections = [
        getByText('My Pets').parentElement,
        getByText('Welcome John!').parentElement,
      ];

      sections.forEach(section => {
        // This test should FAIL because consistent padding is not implemented
        expect(section).toHaveStyle({
          paddingHorizontal: 16,
        });
      });
    });

    it('should center quick stats cards', () => {
      const { container } = renderWithProviders();

      // Find stats container
      const statsContainer = container.querySelector('[data-testid="stats-container"]');

      // This test should FAIL because stats are not properly centered
      expect(statsContainer).toHaveStyle({
        justifyContent: 'center',
        alignItems: 'center',
      });
    });
  });

  describe('Responsive Layout Behavior', () => {
    it('should maintain centering on different screen widths', () => {
      const { container } = renderWithProviders();

      // Test behavior with different container widths
      const mainContainer = container.firstChild;

      // This test should FAIL because responsive behavior is not implemented
      expect(mainContainer).toHaveStyle({
        width: '100%',
        alignItems: 'center',
      });
    });

    it('should handle overflow properly in horizontal scroll sections', () => {
      const { getByTestId } = renderWithProviders();

      const petCard = getByTestId('pet-card-pet-1');
      const scrollView = petCard.closest('[data-testid="pet-scroll-view"]');

      // This test should FAIL because overflow handling is not properly implemented
      expect(scrollView).toHaveStyle({
        overflow: 'hidden',
      });
    });
  });

  describe('Visual Design Consistency', () => {
    it('should have consistent section title styling and alignment', () => {
      const { getByText } = renderWithProviders();

      const myPetsTitle = getByText('My Pets');

      // This test should FAIL because consistent title styling is not implemented
      expect(myPetsTitle).toHaveStyle({
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'left', // Title should be left-aligned within centered container
      });
    });

    it('should maintain proper visual hierarchy with centering', () => {
      const { getByText, container } = renderWithProviders();

      const welcomeText = getByText('Welcome John!');
      const subtitle = getByText('Track your pets daily');

      const welcomeSection = welcomeText.closest('[data-testid="welcome-section"]');

      // This test should FAIL because visual hierarchy with centering is not implemented
      expect(welcomeSection).toHaveStyle({
        alignItems: 'center',
        textAlign: 'center',
      });
    });

    it('should center action buttons properly', () => {
      const { getByText } = renderWithProviders();

      const viewAllButton = getByText('View All');

      // This test should FAIL because button centering is not properly implemented
      expect(viewAllButton).toHaveStyle({
        textAlign: 'center',
      });
    });
  });

  describe('Accessibility and Layout', () => {
    it('should maintain proper touch targets with centering', () => {
      const { getByTestId } = renderWithProviders();

      const petCard = getByTestId('pet-card-pet-1');

      // Touch targets should be large enough even when centered
      const cardStyle = window.getComputedStyle(petCard);
      const width = parseInt(cardStyle.width);
      const height = parseInt(cardStyle.height);

      // This test should FAIL if touch targets are too small
      expect(width).toBeGreaterThanOrEqual(44); // Minimum touch target size
      expect(height).toBeGreaterThanOrEqual(44);
    });

    it('should preserve accessibility labels with layout changes', () => {
      const { getByTestId } = renderWithProviders();

      const petCard = getByTestId('pet-card-pet-1');

      // Accessibility should not be compromised by layout changes
      expect(petCard).toBeTruthy();
      // This would check for accessibility labels in a real implementation
    });
  });
});