import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiError } from '../../types/api';

// Personality trait types based on the backend domain model
export interface PersonalityTrait {
  id: string;
  category: PersonalityCategory;
  name: string;
  description: string;
  intensity: TraitIntensity;
}

export enum PersonalityCategory {
  ENERGY = 'energy',
  SOCIABILITY = 'sociability',
  TRAINING = 'training',
  BEHAVIOR = 'behavior',
  CARE = 'care'
}

export enum TraitIntensity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface PetPersonalityTrait {
  traitId: string;
  trait: PersonalityTrait;
  intensity: TraitIntensity;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalityProfile {
  petId: string;
  traits: PetPersonalityTrait[];
  lastUpdated: string;
}

// API request/response types
export interface AddPersonalityTraitRequest {
  petId: string;
  traitId: string;
  intensity: TraitIntensity;
  notes?: string;
}

export interface UpdatePersonalityTraitRequest {
  petId: string;
  traitId: string;
  intensity: TraitIntensity;
  notes?: string;
}

export interface RemovePersonalityTraitRequest {
  petId: string;
  traitId: string;
}

// Redux state
export interface PersonalityState {
  // Available personality traits (static data)
  availableTraits: PersonalityTrait[];
  availableTraitsLoading: boolean;
  availableTraitsError: string | null;

  // Pet personality profiles (dynamic data per pet)
  profiles: { [petId: string]: PersonalityProfile };
  profilesLoading: { [petId: string]: boolean };
  profilesError: { [petId: string]: string | null };

  // Current operations
  isAdding: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  operationError: string | null;
}

const initialState: PersonalityState = {
  availableTraits: [],
  availableTraitsLoading: false,
  availableTraitsError: null,
  profiles: {},
  profilesLoading: {},
  profilesError: {},
  isAdding: false,
  isUpdating: false,
  isRemoving: false,
  operationError: null,
};

// Async thunks for API calls
export const fetchAvailableTraits = createAsyncThunk(
  'personality/fetchAvailableTraits',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement API call when backend endpoint is ready
      // const response = await apiService.getPersonalityTraits();
      // return response;

      // Mock data for now
      const mockTraits: PersonalityTrait[] = [
        {
          id: '1',
          category: PersonalityCategory.ENERGY,
          name: 'Hyperactive',
          description: 'Very high energy levels, always on the move',
          intensity: TraitIntensity.HIGH,
        },
        {
          id: '2',
          category: PersonalityCategory.ENERGY,
          name: 'Calm',
          description: 'Low energy, prefers relaxing activities',
          intensity: TraitIntensity.LOW,
        },
        {
          id: '3',
          category: PersonalityCategory.SOCIABILITY,
          name: 'Social Butterfly',
          description: 'Loves meeting new people and animals',
          intensity: TraitIntensity.HIGH,
        },
        {
          id: '4',
          category: PersonalityCategory.SOCIABILITY,
          name: 'Shy',
          description: 'Prefers familiar people and environments',
          intensity: TraitIntensity.LOW,
        },
        {
          id: '5',
          category: PersonalityCategory.TRAINING,
          name: 'Quick Learner',
          description: 'Picks up new commands and tricks easily',
          intensity: TraitIntensity.HIGH,
        },
        {
          id: '6',
          category: PersonalityCategory.TRAINING,
          name: 'Stubborn',
          description: 'Takes time and patience to learn new things',
          intensity: TraitIntensity.LOW,
        },
        {
          id: '7',
          category: PersonalityCategory.BEHAVIOR,
          name: 'Playful',
          description: 'Loves games, toys, and interactive activities',
          intensity: TraitIntensity.HIGH,
        },
        {
          id: '8',
          category: PersonalityCategory.BEHAVIOR,
          name: 'Independent',
          description: 'Comfortable being alone, self-sufficient',
          intensity: TraitIntensity.MEDIUM,
        },
        {
          id: '9',
          category: PersonalityCategory.CARE,
          name: 'High Maintenance',
          description: 'Requires frequent grooming and attention',
          intensity: TraitIntensity.HIGH,
        },
        {
          id: '10',
          category: PersonalityCategory.CARE,
          name: 'Low Maintenance',
          description: 'Easy-going with minimal grooming needs',
          intensity: TraitIntensity.LOW,
        },
      ];

      return mockTraits;
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

export const fetchPetPersonalityProfile = createAsyncThunk(
  'personality/fetchPetPersonalityProfile',
  async (petId: string, { rejectWithValue }) => {
    try {
      // TODO: Implement API call when backend endpoint is ready
      // const response = await apiService.getPetPersonalityProfile(petId);
      // return response;

      // Mock data for now
      const mockProfile: PersonalityProfile = {
        petId,
        traits: [],
        lastUpdated: new Date().toISOString(),
      };

      return mockProfile;
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

export const addPersonalityTrait = createAsyncThunk(
  'personality/addPersonalityTrait',
  async (request: AddPersonalityTraitRequest, { rejectWithValue, getState }) => {
    try {
      // TODO: Implement API call when backend endpoint is ready
      // const response = await apiService.addPersonalityTrait(request);
      // return response;

      // Mock implementation for now
      const state = getState() as { personality: PersonalityState };
      const availableTrait = state.personality.availableTraits.find(
        trait => trait.id === request.traitId
      );

      if (!availableTrait) {
        throw new Error('Trait not found');
      }

      const newPetTrait: PetPersonalityTrait = {
        traitId: request.traitId,
        trait: availableTrait,
        intensity: request.intensity,
        notes: request.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return { petId: request.petId, trait: newPetTrait };
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

export const updatePersonalityTrait = createAsyncThunk(
  'personality/updatePersonalityTrait',
  async (request: UpdatePersonalityTraitRequest, { rejectWithValue, getState }) => {
    try {
      // TODO: Implement API call when backend endpoint is ready
      // const response = await apiService.updatePersonalityTrait(request);
      // return response;

      // Mock implementation for now
      const state = getState() as { personality: PersonalityState };
      const profile = state.personality.profiles[request.petId];
      const existingTrait = profile?.traits.find(
        trait => trait.traitId === request.traitId
      );

      if (!existingTrait) {
        throw new Error('Pet trait not found');
      }

      const updatedTrait: PetPersonalityTrait = {
        ...existingTrait,
        intensity: request.intensity,
        notes: request.notes,
        updatedAt: new Date().toISOString(),
      };

      return { petId: request.petId, trait: updatedTrait };
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

export const removePersonalityTrait = createAsyncThunk(
  'personality/removePersonalityTrait',
  async (request: RemovePersonalityTraitRequest, { rejectWithValue }) => {
    try {
      // TODO: Implement API call when backend endpoint is ready
      // await apiService.removePersonalityTrait(request);

      // Mock implementation for now
      return request;
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

// Redux slice
export const personalitySlice = createSlice({
  name: 'personality',
  initialState,
  reducers: {
    clearError: (state) => {
      state.availableTraitsError = null;
      state.operationError = null;
      // Clear individual profile errors
      Object.keys(state.profilesError).forEach(petId => {
        state.profilesError[petId] = null;
      });
    },
    clearProfileError: (state, action: PayloadAction<string>) => {
      const petId = action.payload;
      state.profilesError[petId] = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch available traits
    builder.addCase(fetchAvailableTraits.pending, (state) => {
      state.availableTraitsLoading = true;
      state.availableTraitsError = null;
    });
    builder.addCase(fetchAvailableTraits.fulfilled, (state, action) => {
      state.availableTraitsLoading = false;
      state.availableTraits = action.payload;
    });
    builder.addCase(fetchAvailableTraits.rejected, (state, action) => {
      state.availableTraitsLoading = false;
      state.availableTraitsError = action.payload as string;
    });

    // Fetch pet personality profile
    builder.addCase(fetchPetPersonalityProfile.pending, (state, action) => {
      const petId = action.meta.arg;
      state.profilesLoading[petId] = true;
      state.profilesError[petId] = null;
    });
    builder.addCase(fetchPetPersonalityProfile.fulfilled, (state, action) => {
      const profile = action.payload;
      state.profilesLoading[profile.petId] = false;
      state.profiles[profile.petId] = profile;
    });
    builder.addCase(fetchPetPersonalityProfile.rejected, (state, action) => {
      const petId = action.meta.arg;
      state.profilesLoading[petId] = false;
      state.profilesError[petId] = action.payload as string;
    });

    // Add personality trait
    builder.addCase(addPersonalityTrait.pending, (state) => {
      state.isAdding = true;
      state.operationError = null;
    });
    builder.addCase(addPersonalityTrait.fulfilled, (state, action) => {
      state.isAdding = false;
      const { petId, trait } = action.payload;

      // Initialize profile if it doesn't exist
      if (!state.profiles[petId]) {
        state.profiles[petId] = {
          petId,
          traits: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      // Add the new trait
      state.profiles[petId].traits.push(trait);
      state.profiles[petId].lastUpdated = new Date().toISOString();
    });
    builder.addCase(addPersonalityTrait.rejected, (state, action) => {
      state.isAdding = false;
      state.operationError = action.payload as string;
    });

    // Update personality trait
    builder.addCase(updatePersonalityTrait.pending, (state) => {
      state.isUpdating = true;
      state.operationError = null;
    });
    builder.addCase(updatePersonalityTrait.fulfilled, (state, action) => {
      state.isUpdating = false;
      const { petId, trait } = action.payload;

      if (state.profiles[petId]) {
        const traitIndex = state.profiles[petId].traits.findIndex(
          t => t.traitId === trait.traitId
        );
        if (traitIndex !== -1) {
          state.profiles[petId].traits[traitIndex] = trait;
          state.profiles[petId].lastUpdated = new Date().toISOString();
        }
      }
    });
    builder.addCase(updatePersonalityTrait.rejected, (state, action) => {
      state.isUpdating = false;
      state.operationError = action.payload as string;
    });

    // Remove personality trait
    builder.addCase(removePersonalityTrait.pending, (state) => {
      state.isRemoving = true;
      state.operationError = null;
    });
    builder.addCase(removePersonalityTrait.fulfilled, (state, action) => {
      state.isRemoving = false;
      const { petId, traitId } = action.payload;

      if (state.profiles[petId]) {
        state.profiles[petId].traits = state.profiles[petId].traits.filter(
          trait => trait.traitId !== traitId
        );
        state.profiles[petId].lastUpdated = new Date().toISOString();
      }
    });
    builder.addCase(removePersonalityTrait.rejected, (state, action) => {
      state.isRemoving = false;
      state.operationError = action.payload as string;
    });
  },
});

export const { clearError, clearProfileError } = personalitySlice.actions;
export default personalitySlice.reducer;