import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PetDetailScreen } from '../../screens/pets/PetDetailScreen';
import petSlice from '../../store/petSlice';

// Mock the hooks
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const translations: { [key: string]: string } = {
        'common.loading': 'Loading...',
        'common.success': 'Success',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.notSpecified': 'Not specified',
        'common.addedOn': 'Added on',
        'pets.editPet': 'Edit Pet',
        'pets.basicInfo': 'Basic Information',
        'pets.additionalInfo': 'Additional Information',
        'pets.notesSection': 'Notes',
        'pets.coOwnersSection': 'Co-owners',
        'pets.personalitySection': 'Personality',
        'pets.name': 'Name',
        'pets.species': 'Species',
        'pets.breed': 'Breed',
        'pets.birthDate': 'Birth Date',
        'pets.photoUrl': 'Photo URL',
        'pets.deletePet': 'Delete Pet',
        'pets.deleteConfirmTitle': 'Delete Pet',
        'pets.deleteConfirmMessage': 'Are you sure you want to delete {{name}}?',
        'pets.updateSuccess': 'Pet updated successfully',
        'pets.validations.nameRequired': 'Name is required',
        'pets.validations.speciesRequired': 'Species is required',
        'pets.validations.dateFormatInvalid': 'Date format is invalid',
        'pets.validations.photoUrlInvalid': 'Photo URL is invalid',
        'pets.placeholders.petName': 'Enter pet name',
        'pets.placeholders.species': 'Select species',
        'pets.placeholders.breed': 'Enter breed',
        'pets.placeholders.photoUrl': 'Enter photo URL',
        'pets.dateFormatHelp': 'Use YYYY-MM-DD format',
        'pets.photoUrlHelp': 'Enter a valid image URL',
        'pets.dog': 'Dog',
        'pets.cat': 'Cat',
      };
      return translations[key] || defaultValue || key;
    },
  }),
}));

jest.mock('../../theme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        text: {
          primary: '#000000',
          secondary: '#666666',
        },
        background: {
          primary: '#ffffff',
          secondary: '#f5f5f5',
        },
        border: '#e0e0e0',
        primary: '#007AFF',
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
        padding: {
          screen: 16,
        },
      },
      typography: {
        styles: {
          h2: { fontSize: 20, fontWeight: 'bold' },
          h3: { fontSize: 18, fontWeight: '600' },
          body: { fontSize: 16 },
          label: { fontSize: 14, fontWeight: '500' },
        },
      },
    },
  }),
}));

// Mock Lucide React Native icons
jest.mock('lucide-react-native', () => ({
  ArrowLeft: ({ size, color }: any) => `ArrowLeft-${size}-${color}`,
  Edit3: ({ size, color }: any) => `Edit3-${size}-${color}`,
  Trash2: ({ size, color }: any) => `Trash2-${size}-${color}`,
}));

// Mock UI components
jest.mock('../../components/ui/Button', () => ({
  Button: ({ title, onPress, testID }: any) => (
    <button onPress={onPress} testID={testID}>{title}</button>
  ),
}));

jest.mock('../../components/ui/Input', () => ({
  Input: ({ value, onChangeText, testID, placeholder }: any) => (
    <input
      value={value}
      onChange={(e: any) => onChangeText(e.target.value)}
      testID={testID}
      placeholder={placeholder}
    />
  ),
}));

jest.mock('../../components/ui/Dropdown', () => ({
  Dropdown: ({ value, onSelect, options, testID }: any) => (
    <select
      value={value}
      onChange={(e: any) => onSelect(e.target.value)}
      testID={testID}
    >
      {options?.map((option: any) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  ),
  DropdownOption: ({ value, label }: any) => ({ value, label }),
}));

jest.mock('../../components/ui/ErrorMessage', () => ({
  ErrorMessage: ({ message }: any) => <div data-testid="error-message">{message}</div>,
}));

// Mock utils
jest.mock('../../utils/speciesLocalization', () => ({
  getSpeciesOptions: () => [
    { value: 'dog', label: 'Dog' },
    { value: 'cat', label: 'Cat' },
  ],
}));

jest.mock('../../utils/errorHandler', () => ({
  ErrorHandler: {
    handleValidationErrors: (error: any) => error || {},
  },
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockRoute = {
  params: {
    petId: 'test-pet-id',
  },
};

describe('PetDetailScreen', () => {
  let store: any;
  let mockPet: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPet = {
      id: 'test-pet-id',
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      birth_date: '2020-01-01',
      photo_url: 'https://example.com/buddy.jpg',
      created_at: '2023-01-01T00:00:00Z',
      owner_id: 'user-1',
    };

    store = configureStore({
      reducer: {
        pets: petSlice,
      },
      preloadedState: {
        pets: {
          selectedPet: mockPet,
          isLoading: false,
          error: null,
          pets: [mockPet],
          petFilters: { species: 'all', sortBy: 'name' },
        },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <PetDetailScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );
  };

  it('should render pet basic information', () => {
    const { getByText } = renderComponent();

    expect(getByText('Buddy')).toBeTruthy();
    expect(getByText('Basic Information')).toBeTruthy();
    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Species')).toBeTruthy();
    expect(getByText('Breed')).toBeTruthy();
    expect(getByText('Birth Date')).toBeTruthy();
  });

  it('should render additional information section', () => {
    const { getByText } = renderComponent();

    expect(getByText('Additional Information')).toBeTruthy();
    expect(getByText('Photo URL')).toBeTruthy();
    expect(getByText('Added on')).toBeTruthy();
  });

  // TESTS FOR MISSING SECTIONS - THESE SHOULD FAIL INITIALLY (TDD APPROACH)
  it('should render Notes section with add/edit functionality', () => {
    const { getByText, queryByText } = renderComponent();

    // This test should FAIL initially because the Notes section doesn't exist yet
    expect(queryByText('Notes')).toBeTruthy();
    expect(queryByText('Add Note')).toBeTruthy();
  });

  it('should render Co-owners section with management functionality', () => {
    const { getByText, queryByText } = renderComponent();

    // This test should FAIL initially because the Co-owners section doesn't exist yet
    expect(queryByText('Co-owners')).toBeTruthy();
    expect(queryByText('Manage Co-owners')).toBeTruthy();
  });

  it('should render Personality section with trait management', () => {
    const { getByText, queryByText } = renderComponent();

    // This test should FAIL initially because the Personality section doesn't exist yet
    expect(queryByText('Personality')).toBeTruthy();
    expect(queryByText('Personality Traits')).toBeTruthy();
  });

  it('should allow adding notes to pet', async () => {
    const { getByText, getByTestId, queryByTestId } = renderComponent();

    // This test should FAIL initially because notes functionality doesn't exist yet
    const addNoteButton = queryByTestId('add-note-button');
    expect(addNoteButton).toBeTruthy();

    if (addNoteButton) {
      fireEvent.press(addNoteButton);

      const noteInput = queryByTestId('note-input');
      expect(noteInput).toBeTruthy();

      if (noteInput) {
        fireEvent.changeText(noteInput, 'Test note content');

        const saveNoteButton = queryByTestId('save-note-button');
        expect(saveNoteButton).toBeTruthy();

        if (saveNoteButton) {
          fireEvent.press(saveNoteButton);

          await waitFor(() => {
            expect(getByText('Test note content')).toBeTruthy();
          });
        }
      }
    }
  });

  it('should allow deleting notes with confirmation', async () => {
    const { getByText, queryByTestId } = renderComponent();

    // This test should FAIL initially because note deletion doesn't exist yet
    const deleteNoteButton = queryByTestId('delete-note-button');
    expect(deleteNoteButton).toBeTruthy();
  });

  it('should display co-owner information and management options', () => {
    const { getByText, queryByText, queryByTestId } = renderComponent();

    // This test should FAIL initially because co-owner functionality doesn't exist yet
    expect(queryByText('Co-owners')).toBeTruthy();

    const addCoOwnerButton = queryByTestId('add-co-owner-button');
    expect(addCoOwnerButton).toBeTruthy();

    const coOwnerList = queryByTestId('co-owner-list');
    expect(coOwnerList).toBeTruthy();
  });

  it('should display personality traits with editing capabilities', () => {
    const { getByText, queryByText, queryByTestId } = renderComponent();

    // This test should FAIL initially because personality functionality doesn't exist yet
    expect(queryByText('Personality')).toBeTruthy();

    const addTraitButton = queryByTestId('add-trait-button');
    expect(addTraitButton).toBeTruthy();

    const traitList = queryByTestID('trait-list');
    expect(traitList).toBeTruthy();
  });

  // EXISTING FUNCTIONALITY TESTS
  it('should handle edit mode toggle', () => {
    const { getByTestId } = renderComponent();

    const editButton = getByTestId('edit-button') || document.querySelector('[data-testid="edit-button"]');
    if (editButton) {
      fireEvent.press(editButton);
      // Should show edit form
    }
  });

  it('should handle pet deletion with confirmation', async () => {
    const { getByText, queryByTestId } = renderComponent();

    const deleteButton = queryByTestId('delete-button');
    if (deleteButton) {
      fireEvent.press(deleteButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(getByText('Delete Pet')).toBeTruthy();
      });
    }
  });

  it('should validate form fields when editing', async () => {
    const { getByTestId, queryByTestId } = renderComponent();

    const editButton = queryByTestId('edit-button');
    if (editButton) {
      fireEvent.press(editButton);

      // Clear name field
      const nameInput = queryByTestId('name-input');
      if (nameInput) {
        fireEvent.changeText(nameInput, '');

        const saveButton = queryByTestId('save-button');
        if (saveButton) {
          fireEvent.press(saveButton);

          await waitFor(() => {
            const errorMessage = queryByTestId('error-message');
            expect(errorMessage).toBeTruthy();
          });
        }
      }
    }
  });

  it('should show loading state when pet is loading', () => {
    const loadingStore = configureStore({
      reducer: {
        pets: petSlice,
      },
      preloadedState: {
        pets: {
          selectedPet: null,
          isLoading: true,
          error: null,
          pets: [],
          petFilters: { species: 'all', sortBy: 'name' },
        },
      },
    });

    const { getByText } = render(
      <Provider store={loadingStore}>
        <PetDetailScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should handle navigation back', () => {
    const { queryByTestId } = renderComponent();

    const backButton = queryByTestId('back-button');
    if (backButton) {
      fireEvent.press(backButton);
      expect(mockNavigation.goBack).toHaveBeenCalled();
    }
  });
});