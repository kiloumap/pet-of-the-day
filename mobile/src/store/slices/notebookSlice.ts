import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiError } from '../../types/api';

// Notebook entry types based on the backend domain model
export enum NotebookEntryType {
  MEDICAL = 'medical',
  DIET = 'diet',
  HABIT = 'habit',
  COMMAND = 'command',
}

// Base notebook entry interface
export interface BaseNotebookEntry {
  id: string;
  petId: string;
  type: NotebookEntryType;
  title: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

// Medical entry specific fields
export interface MedicalEntry extends BaseNotebookEntry {
  type: NotebookEntryType.MEDICAL;
  vetName?: string;
  symptoms?: string[];
  diagnosis?: string;
  treatment?: string;
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
  }[];
  nextAppointment?: string;
  severity: 'low' | 'medium' | 'high';
  status: 'ongoing' | 'resolved' | 'monitoring';
}

// Diet entry specific fields
export interface DietEntry extends BaseNotebookEntry {
  type: NotebookEntryType.DIET;
  foodBrand?: string;
  foodType?: string;
  quantity: number;
  unit: string;
  calories?: number;
  ingredients?: string[];
  allergies?: string[];
  notes?: string;
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

// Habit entry specific fields
export interface HabitEntry extends BaseNotebookEntry {
  type: NotebookEntryType.HABIT;
  behaviorType: 'positive' | 'negative' | 'neutral';
  frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  triggers?: string[];
  location?: string;
  context?: string;
  improvement?: boolean;
  severity?: 'low' | 'medium' | 'high';
}

// Command entry specific fields
export interface CommandEntry extends BaseNotebookEntry {
  type: NotebookEntryType.COMMAND;
  command: string;
  success: boolean;
  attempts: number;
  duration?: number; // in seconds
  trainingMethod?: string;
  reward?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  environment?: string;
  notes?: string;
}

export type NotebookEntry = MedicalEntry | DietEntry | HabitEntry | CommandEntry;

// Notebook for a specific pet
export interface PetNotebook {
  petId: string;
  petName: string;
  entries: NotebookEntry[];
  totalCount: number;
  lastUpdated: string;
}

// API request/response types
export interface CreateEntryRequest {
  petId: string;
  type: NotebookEntryType;
  data: Partial<NotebookEntry>;
}

export interface UpdateEntryRequest {
  entryId: string;
  data: Partial<NotebookEntry>;
}

export interface DeleteEntryRequest {
  entryId: string;
}

export interface GetEntriesRequest {
  petId: string;
  type?: NotebookEntryType;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// Redux state
export interface NotebookState {
  // Pet notebooks
  notebooks: { [petId: string]: PetNotebook };
  notebooksLoading: { [petId: string]: boolean };
  notebooksError: { [petId: string]: string | null };

  // Entry operations
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  operationError: string | null;

  // Filters and pagination
  currentFilters: {
    petId?: string;
    type?: NotebookEntryType;
    startDate?: string;
    endDate?: string;
  };
  pagination: {
    [petId: string]: {
      page: number;
      limit: number;
      hasMore: boolean;
    };
  };

  // Entry details
  selectedEntry: NotebookEntry | null;
  selectedEntryLoading: boolean;
}

const initialState: NotebookState = {
  notebooks: {},
  notebooksLoading: {},
  notebooksError: {},
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  operationError: null,
  currentFilters: {},
  pagination: {},
  selectedEntry: null,
  selectedEntryLoading: false,
};

// Async thunks for API calls
export const fetchPetNotebook = createAsyncThunk(
  'notebook/fetchPetNotebook',
  async (request: GetEntriesRequest, { rejectWithValue }) => {
    try {
      // TODO: Implement API call when backend endpoint is ready
      // const response = await apiService.getPetNotebook(request);
      // return response;

      // Mock data for now
      const mockEntries: NotebookEntry[] = [
        {
          id: '1',
          petId: request.petId,
          type: NotebookEntryType.MEDICAL,
          title: 'Annual Checkup',
          description: 'Regular health examination',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          vetName: 'Dr. Smith',
          symptoms: [],
          diagnosis: 'Healthy',
          treatment: 'None required',
          medications: [],
          severity: 'low',
          status: 'resolved',
        } as MedicalEntry,
        {
          id: '2',
          petId: request.petId,
          type: NotebookEntryType.DIET,
          title: 'Morning Meal',
          description: 'Regular breakfast',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          foodBrand: 'Royal Canin',
          foodType: 'Dry Food',
          quantity: 150,
          unit: 'g',
          calories: 450,
          mealTime: 'breakfast',
        } as DietEntry,
      ];

      const mockNotebook: PetNotebook = {
        petId: request.petId,
        petName: 'Mock Pet',
        entries: mockEntries,
        totalCount: mockEntries.length,
        lastUpdated: new Date().toISOString(),
      };

      return mockNotebook;
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

export const createNotebookEntry = createAsyncThunk(
  'notebook/createNotebookEntry',
  async (request: CreateEntryRequest, { rejectWithValue }) => {
    try {
      // TODO: Implement API call when backend endpoint is ready
      // const response = await apiService.createNotebookEntry(request);
      // return response;

      // Mock implementation for now
      const mockEntry: NotebookEntry = {
        id: Date.now().toString(),
        petId: request.petId,
        type: request.type,
        title: request.data.title || 'New Entry',
        description: request.data.description,
        date: request.data.date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: request.data.tags,
        ...request.data,
      } as NotebookEntry;

      return mockEntry;
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

export const updateNotebookEntry = createAsyncThunk(
  'notebook/updateNotebookEntry',
  async (request: UpdateEntryRequest, { rejectWithValue, getState }) => {
    try {
      // TODO: Implement API call when backend endpoint is ready
      // const response = await apiService.updateNotebookEntry(request);
      // return response;

      // Mock implementation for now
      const state = getState() as { notebook: NotebookState };
      const existingEntry = state.notebook.selectedEntry;

      if (!existingEntry) {
        throw new Error('Entry not found');
      }

      const updatedEntry: any = {
        ...existingEntry,
        ...request.data,
        updatedAt: new Date().toISOString(),
      };

      return updatedEntry;
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

export const deleteNotebookEntry = createAsyncThunk(
  'notebook/deleteNotebookEntry',
  async (request: DeleteEntryRequest, { rejectWithValue }) => {
    try {
      // TODO: Implement API call when backend endpoint is ready
      // await apiService.deleteNotebookEntry(request);

      // Mock implementation for now
      return request.entryId;
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

export const fetchNotebookEntry = createAsyncThunk(
  'notebook/fetchNotebookEntry',
  async (entryId: string, { rejectWithValue, getState }) => {
    try {
      // TODO: Implement API call when backend endpoint is ready
      // const response = await apiService.getNotebookEntry(entryId);
      // return response;

      // Mock implementation - find entry in current notebooks
      const state = getState() as { notebook: NotebookState };

      for (const notebook of Object.values(state.notebook.notebooks)) {
        const entry = notebook.entries.find(e => e.id === entryId);
        if (entry) {
          return entry;
        }
      }

      throw new Error('Entry not found');
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

// Redux slice
export const notebookSlice = createSlice({
  name: 'notebook',
  initialState,
  reducers: {
    clearError: (state) => {
      state.operationError = null;
      // Clear individual notebook errors
      Object.keys(state.notebooksError).forEach(petId => {
        state.notebooksError[petId] = null;
      });
    },
    clearNotebookError: (state, action: PayloadAction<string>) => {
      const petId = action.payload;
      state.notebooksError[petId] = null;
    },
    setFilters: (state, action: PayloadAction<Partial<NotebookState['currentFilters']>>) => {
      state.currentFilters = { ...state.currentFilters, ...action.payload };
    },
    clearFilters: (state) => {
      state.currentFilters = {};
    },
    setSelectedEntry: (state, action: PayloadAction<NotebookEntry | null>) => {
      state.selectedEntry = action.payload;
    },
    resetPagination: (state, action: PayloadAction<string>) => {
      const petId = action.payload;
      state.pagination[petId] = {
        page: 1,
        limit: 20,
        hasMore: true,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch pet notebook
    builder.addCase(fetchPetNotebook.pending, (state, action) => {
      const petId = action.meta.arg.petId;
      state.notebooksLoading[petId] = true;
      state.notebooksError[petId] = null;
    });
    builder.addCase(fetchPetNotebook.fulfilled, (state, action) => {
      const notebook = action.payload;
      state.notebooksLoading[notebook.petId] = false;
      state.notebooks[notebook.petId] = notebook;

      // Initialize pagination if not exists
      if (!state.pagination[notebook.petId]) {
        state.pagination[notebook.petId] = {
          page: 1,
          limit: 20,
          hasMore: notebook.entries.length >= 20,
        };
      }
    });
    builder.addCase(fetchPetNotebook.rejected, (state, action) => {
      const petId = action.meta.arg.petId;
      state.notebooksLoading[petId] = false;
      state.notebooksError[petId] = action.payload as string;
    });

    // Create notebook entry
    builder.addCase(createNotebookEntry.pending, (state) => {
      state.isCreating = true;
      state.operationError = null;
    });
    builder.addCase(createNotebookEntry.fulfilled, (state, action) => {
      state.isCreating = false;
      const newEntry = action.payload;

      // Add to existing notebook if it exists
      if (state.notebooks[newEntry.petId]) {
        state.notebooks[newEntry.petId].entries.unshift(newEntry);
        state.notebooks[newEntry.petId].totalCount++;
        state.notebooks[newEntry.petId].lastUpdated = new Date().toISOString();
      }
    });
    builder.addCase(createNotebookEntry.rejected, (state, action) => {
      state.isCreating = false;
      state.operationError = action.payload as string;
    });

    // Update notebook entry
    builder.addCase(updateNotebookEntry.pending, (state) => {
      state.isUpdating = true;
      state.operationError = null;
    });
    builder.addCase(updateNotebookEntry.fulfilled, (state, action) => {
      state.isUpdating = false;
      const updatedEntry = action.payload;

      // Update in notebook
      if (state.notebooks[updatedEntry.petId]) {
        const entryIndex = state.notebooks[updatedEntry.petId].entries.findIndex(
          e => e.id === updatedEntry.id
        );
        if (entryIndex !== -1) {
          state.notebooks[updatedEntry.petId].entries[entryIndex] = updatedEntry;
          state.notebooks[updatedEntry.petId].lastUpdated = new Date().toISOString();
        }
      }

      // Update selected entry if it's the same
      if (state.selectedEntry?.id === updatedEntry.id) {
        state.selectedEntry = updatedEntry;
      }
    });
    builder.addCase(updateNotebookEntry.rejected, (state, action) => {
      state.isUpdating = false;
      state.operationError = action.payload as string;
    });

    // Delete notebook entry
    builder.addCase(deleteNotebookEntry.pending, (state) => {
      state.isDeleting = true;
      state.operationError = null;
    });
    builder.addCase(deleteNotebookEntry.fulfilled, (state, action) => {
      state.isDeleting = false;
      const deletedEntryId = action.payload;

      // Remove from all notebooks
      Object.values(state.notebooks).forEach(notebook => {
        const entryIndex = notebook.entries.findIndex(e => e.id === deletedEntryId);
        if (entryIndex !== -1) {
          notebook.entries.splice(entryIndex, 1);
          notebook.totalCount--;
          notebook.lastUpdated = new Date().toISOString();
        }
      });

      // Clear selected entry if it was deleted
      if (state.selectedEntry?.id === deletedEntryId) {
        state.selectedEntry = null;
      }
    });
    builder.addCase(deleteNotebookEntry.rejected, (state, action) => {
      state.isDeleting = false;
      state.operationError = action.payload as string;
    });

    // Fetch notebook entry details
    builder.addCase(fetchNotebookEntry.pending, (state) => {
      state.selectedEntryLoading = true;
    });
    builder.addCase(fetchNotebookEntry.fulfilled, (state, action) => {
      state.selectedEntryLoading = false;
      state.selectedEntry = action.payload;
    });
    builder.addCase(fetchNotebookEntry.rejected, (state, action) => {
      state.selectedEntryLoading = false;
      state.operationError = action.payload as string;
    });
  },
});

export const {
  clearError,
  clearNotebookError,
  setFilters,
  clearFilters,
  setSelectedEntry,
  resetPagination,
} = notebookSlice.actions;

export default notebookSlice.reducer;