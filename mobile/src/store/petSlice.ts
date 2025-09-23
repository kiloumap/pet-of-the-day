import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../services/api';
import { Pet, AddPetRequest, UpdatePetRequest, ApiError } from '../types/api';

interface PetState {
  pets: Pet[];
  selectedPet: Pet | null;
  isLoading: boolean;
  isAdding: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
}

const initialState: PetState = {
  pets: [],
  selectedPet: null,
  isLoading: false,
  isAdding: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
};

// Async thunks
export const fetchPets = createAsyncThunk(
  'pets/fetchPets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getPets();
      return response.pets;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message);
    }
  }
);

export const fetchPetById = createAsyncThunk(
  'pets/fetchPetById',
  async (petId: string, { rejectWithValue }) => {
    try {
      const pet = await apiService.getPetById(petId);
      return pet;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message);
    }
  }
);

export const addPet = createAsyncThunk(
  'pets/addPet',
  async (petData: AddPetRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiService.addPet(petData);
      // Refresh pets list after adding
      dispatch(fetchPets());
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message);
    }
  }
);

export const updatePet = createAsyncThunk(
  'pets/updatePet',
  async (petData: UpdatePetRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiService.updatePet(petData);
      // Refresh pets list after updating
      dispatch(fetchPets());
      return response.pet;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const deletePet = createAsyncThunk(
  'pets/deletePet',
  async (petId: string, { rejectWithValue, dispatch }) => {
    try {
      await apiService.deletePet(petId);
      // Refresh pets list after deleting
      dispatch(fetchPets());
      return petId;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message);
    }
  }
);

const petSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedPet: (state) => {
      state.selectedPet = null;
    },
    resetPets: () => initialState,
    updatePetPoints: (state, action: PayloadAction<{ petId: string; points: number }>) => {
      const pet = state.pets.find(p => p.id === action.payload.petId);
      if (pet) {
        pet.points = (pet.points || 0) + action.payload.points;
      }
    },
    initializePetPoints: (state) => {
      state.pets.forEach(pet => {
        if (pet.points === undefined) {
          pet.points = 0;
        }
      });
    },
  },
  extraReducers: (builder) => {
    // Fetch pets
    builder
      .addCase(fetchPets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pets = action.payload;
        state.error = null;
      })
      .addCase(fetchPets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch pet by ID
    builder
      .addCase(fetchPetById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPetById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedPet = action.payload;
        state.error = null;
      })
      .addCase(fetchPetById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add pet
    builder
      .addCase(addPet.pending, (state) => {
        state.isAdding = true;
        state.error = null;
      })
      .addCase(addPet.fulfilled, (state) => {
        state.isAdding = false;
        state.error = null;
      })
      .addCase(addPet.rejected, (state, action) => {
        state.isAdding = false;
        state.error = action.payload as string;
      });

    // Update pet
    builder
      .addCase(updatePet.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updatePet.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.selectedPet = action.payload;
        state.error = null;
      })
      .addCase(updatePet.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Delete pet
    builder
      .addCase(deletePet.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deletePet.fulfilled, (state) => {
        state.isDeleting = false;
        state.selectedPet = null;
        state.error = null;
      })
      .addCase(deletePet.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedPet, resetPets, updatePetPoints, initializePetPoints } = petSlice.actions;

// Selectors
export const selectPets = (state: any) => state.pets.pets;
export const selectPetsLoading = (state: any) => state.pets.isLoading;
export const selectSelectedPet = (state: any) => state.pets.selectedPet;
export const selectTodaysWinner = (state: any) => {
  const pets = state.pets.pets;
  if (!pets || pets.length === 0) return null;
  // Return first pet as winner for now (you can implement your logic here)
  return pets[0];
};

export default petSlice.reducer;