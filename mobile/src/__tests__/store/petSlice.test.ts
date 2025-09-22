import { configureStore } from '@reduxjs/toolkit';
import petSlice, {
  fetchPets,
  fetchPetById,
  addPet,
  updatePet,
  deletePet,
  clearError,
  clearSelectedPet,
  resetPets,
  selectPets,
  selectTodaysWinner,
} from '../../store/petSlice';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('Pet Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        pets: petSlice,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().pets;
      expect(state).toEqual({
        pets: [],
        selectedPet: null,
        isLoading: false,
        isAdding: false,
        isUpdating: false,
        isDeleting: false,
        error: null,
      });
    });
  });

  describe('fetchPets', () => {
    it('should handle successful pets fetch', async () => {
      const mockPets = [
        { id: 'pet-1', name: 'Buddy', species: 'dog', breed: 'Golden Retriever' },
        { id: 'pet-2', name: 'Whiskers', species: 'cat', breed: 'Persian' }
      ];

      mockedApiService.getPets.mockResolvedValueOnce({ pets: mockPets });

      await store.dispatch(fetchPets());

      const state = store.getState().pets;
      expect(state.isLoading).toBe(false);
      expect(state.pets).toHaveLength(2);
      expect(state.pets[0].name).toBe('Buddy');
      expect(state.pets[1].name).toBe('Whiskers');
      expect(state.error).toBeNull();
    });

    it('should handle failed pets fetch', async () => {
      const mockError = 'Failed to fetch pets';
      mockedApiService.getPets.mockRejectedValueOnce({ message: mockError });

      await store.dispatch(fetchPets());

      const state = store.getState().pets;
      expect(state.isLoading).toBe(false);
      expect(state.pets).toHaveLength(0);
      expect(state.error).toBe(mockError);
    });

    it('should set loading state during fetch', () => {
      const promise = store.dispatch(fetchPets());

      const state = store.getState().pets;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();

      return promise;
    });
  });

  describe('fetchPetById', () => {
    it('should handle successful pet by ID fetch', async () => {
      const mockPet = {
        id: 'pet-1',
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        birth_date: '2020-01-01'
      };

      mockedApiService.getPetById.mockResolvedValueOnce(mockPet);

      await store.dispatch(fetchPetById('pet-1'));

      const state = store.getState().pets;
      expect(state.isLoading).toBe(false);
      expect(state.selectedPet).toEqual(mockPet);
      expect(state.error).toBeNull();
    });

    it('should handle failed pet by ID fetch', async () => {
      const mockError = 'Pet not found';
      mockedApiService.getPetById.mockRejectedValueOnce({ message: mockError });

      await store.dispatch(fetchPetById('invalid-id'));

      const state = store.getState().pets;
      expect(state.isLoading).toBe(false);
      expect(state.selectedPet).toBeNull();
      expect(state.error).toBe(mockError);
    });
  });

  describe('addPet', () => {
    it('should handle successful pet addition', async () => {
      const newPetData = {
        name: 'Max',
        species: 'dog',
        breed: 'Labrador',
        birth_date: '2023-01-01',
        photo_url: 'https://example.com/max.jpg'
      };

      const addPetResponse = {
        id: 'new-pet-id',
        name: 'Max',
        species: 'dog'
      };

      const updatedPets = [
        { id: 'pet-1', name: 'Buddy' },
        { id: 'new-pet-id', name: 'Max' }
      ];

      mockedApiService.addPet.mockResolvedValueOnce(addPetResponse);
      mockedApiService.getPets.mockResolvedValueOnce({ pets: updatedPets });

      await store.dispatch(addPet(newPetData));

      const state = store.getState().pets;
      expect(state.isAdding).toBe(false);
      expect(state.error).toBeNull();
      // Note: addPet calls fetchPets internally, so we check the mocks
      expect(mockedApiService.addPet).toHaveBeenCalledWith(newPetData);
      expect(mockedApiService.getPets).toHaveBeenCalled();
    });

    it('should handle failed pet addition', async () => {
      const newPetData = {
        name: '',
        species: 'dog',
        breed: 'Labrador',
        birth_date: '2023-01-01',
        photo_url: ''
      };

      const mockError = 'Name is required';
      mockedApiService.addPet.mockRejectedValueOnce({ message: mockError });

      await store.dispatch(addPet(newPetData));

      const state = store.getState().pets;
      expect(state.isAdding).toBe(false);
      expect(state.error).toBe(mockError);
    });

    it('should set adding state during pet addition', () => {
      const newPetData = {
        name: 'Max',
        species: 'dog',
        breed: 'Labrador',
        birth_date: '2023-01-01',
        photo_url: 'https://example.com/max.jpg'
      };

      const promise = store.dispatch(addPet(newPetData));

      const state = store.getState().pets;
      expect(state.isAdding).toBe(true);
      expect(state.error).toBeNull();

      return promise;
    });
  });

  describe('updatePet', () => {
    it('should handle successful pet update', async () => {
      const updateData = {
        petId: 'pet-1',
        name: 'Buddy Updated',
        breed: 'Golden Retriever Mix'
      };

      const updateResponse = {
        pet: {
          id: 'pet-1',
          name: 'Buddy Updated',
          breed: 'Golden Retriever Mix'
        }
      };

      mockedApiService.updatePet.mockResolvedValueOnce(updateResponse);
      mockedApiService.getPets.mockResolvedValueOnce({ pets: [] });

      await store.dispatch(updatePet(updateData));

      const state = store.getState().pets;
      expect(state.isUpdating).toBe(false);
      expect(state.selectedPet).toEqual(updateResponse.pet);
      expect(state.error).toBeNull();
    });

    it('should handle failed pet update', async () => {
      const updateData = {
        petId: 'pet-1',
        name: '',
      };

      const mockError = { message: 'Name cannot be empty', status: 400 };
      mockedApiService.updatePet.mockRejectedValueOnce(mockError);

      await store.dispatch(updatePet(updateData));

      const state = store.getState().pets;
      expect(state.isUpdating).toBe(false);
      expect(state.error).toEqual({message: 'Name cannot be empty', status: 400});
    });
  });

  describe('deletePet', () => {
    it('should handle successful pet deletion', async () => {
      // Set up initial pets
      store.dispatch({
        type: 'pets/fetchPets/fulfilled',
        payload: [
          { id: 'pet-1', name: 'Buddy' },
          { id: 'pet-2', name: 'Whiskers' }
        ]
      });

      mockedApiService.deletePet.mockResolvedValueOnce(undefined);
      mockedApiService.getPets.mockResolvedValueOnce({
        pets: [{ id: 'pet-2', name: 'Whiskers' }]
      });

      await store.dispatch(deletePet('pet-1'));

      const state = store.getState().pets;
      expect(state.isDeleting).toBe(false);
      expect(state.selectedPet).toBeNull();
      expect(state.error).toBeNull();
      expect(mockedApiService.deletePet).toHaveBeenCalledWith('pet-1');
      expect(mockedApiService.getPets).toHaveBeenCalled();
    });

    it('should handle failed pet deletion', async () => {
      const mockError = 'Pet not found';
      mockedApiService.deletePet.mockRejectedValueOnce({ message: mockError });

      await store.dispatch(deletePet('invalid-id'));

      const state = store.getState().pets;
      expect(state.isDeleting).toBe(false);
      expect(state.error).toBe(mockError);
    });
  });

  describe('reducers', () => {
    it('should clear error', () => {
      // Set initial error
      store.dispatch({
        type: 'pets/fetchPets/rejected',
        payload: 'Test error'
      });

      store.dispatch(clearError());

      const state = store.getState().pets;
      expect(state.error).toBeNull();
    });

    it('should clear selected pet', () => {
      // Set initial selected pet
      store.dispatch({
        type: 'pets/fetchPetById/fulfilled',
        payload: { id: 'pet-1', name: 'Buddy' }
      });

      store.dispatch(clearSelectedPet());

      const state = store.getState().pets;
      expect(state.selectedPet).toBeNull();
    });

    it('should reset pets state', () => {
      // Set some state
      store.dispatch({
        type: 'pets/fetchPets/fulfilled',
        payload: [{ id: 'pet-1', name: 'Buddy' }]
      });

      store.dispatch(resetPets());

      const state = store.getState().pets;
      expect(state.pets).toHaveLength(0);
      expect(state.selectedPet).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      // Set up test state
      store.dispatch({
        type: 'pets/fetchPets/fulfilled',
        payload: [
          { id: 'pet-1', name: 'Buddy', species: 'dog' },
          { id: 'pet-2', name: 'Whiskers', species: 'cat' },
          { id: 'pet-3', name: 'Max', species: 'dog' }
        ]
      });
    });

    it('should select pets correctly', () => {
      const state = store.getState();
      const pets = selectPets(state);

      expect(pets).toHaveLength(3);
      expect(pets[0].name).toBe('Buddy');
    });

    it('should select todays winner (first pet)', () => {
      const state = store.getState();
      const winner = selectTodaysWinner(state);

      expect(winner).toBeTruthy();
      expect(winner.id).toBe('pet-1');
      expect(winner.name).toBe('Buddy');
    });

    it('should return null for todays winner when no pets', () => {
      // Reset to empty state
      store.dispatch(resetPets());

      const state = store.getState();
      const winner = selectTodaysWinner(state);

      expect(winner).toBeNull();
    });
  });

  describe('async thunk error handling', () => {
    it('should handle different error types correctly', async () => {
      // Test API error object
      const apiError = {
        message: 'Validation failed',
        status: 400,
        code: 'VALIDATION_ERROR'
      };

      mockedApiService.addPet.mockRejectedValueOnce(apiError);

      await store.dispatch(addPet({
        name: '',
        species: 'dog',
        breed: '',
        birth_date: '',
        photo_url: ''
      }));

      const state = store.getState().pets;
      expect(state.error).toBe('Validation failed');
    });

    it('should handle string error', async () => {
      mockedApiService.getPets.mockRejectedValueOnce(new Error('Network error'));

      await store.dispatch(fetchPets());

      const state = store.getState().pets;
      expect(state.error).toBe('Network error');
    });
  });
});