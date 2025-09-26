import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';
import { behaviorService } from '../services/behaviorService';
import {
  Behavior,
  BehaviorLog,
  CreateBehaviorLogRequest,
  UpdateBehaviorLogRequest,
  BehaviorLogFilter,
  PetRanking,
  PetOfTheDayWinner,
  DailyScore,
} from '../types/behavior';
import { ApiError } from '../types/api';

// State interface
interface BehaviorState {
  // Behaviors
  behaviors: Behavior[];
  behaviorsBySpecies: Record<string, Behavior[]>;
  
  // Behavior Logs
  behaviorLogs: BehaviorLog[];
  behaviorLogsByPet: Record<string, BehaviorLog[]>;
  
  // Rankings & Scores
  groupRankings: PetRanking[];
  petOfTheDay: PetOfTheDayWinner | null;
  dailyScore: DailyScore | null;
  
  // Loading states
  behaviorsLoading: boolean;
  behaviorLogsLoading: boolean;
  rankingsLoading: boolean;
  createBehaviorLogLoading: boolean;
  updateBehaviorLogLoading: boolean;
  deleteBehaviorLogLoading: boolean;
  
  // Error states
  behaviorsError: string | null;
  behaviorLogsError: string | null;
  rankingsError: string | null;
  createBehaviorLogError: string | null;
  updateBehaviorLogError: string | null;
  deleteBehaviorLogError: string | null;
  
  // UI state
  selectedBehaviorFilter: string | null;
  lastRefresh: number | null;
}

// Initial state
const initialState: BehaviorState = {
  behaviors: [],
  behaviorsBySpecies: {},
  behaviorLogs: [],
  behaviorLogsByPet: {},
  groupRankings: [],
  petOfTheDay: null,
  dailyScore: null,
  
  behaviorsLoading: false,
  behaviorLogsLoading: false,
  rankingsLoading: false,
  createBehaviorLogLoading: false,
  updateBehaviorLogLoading: false,
  deleteBehaviorLogLoading: false,
  
  behaviorsError: null,
  behaviorLogsError: null,
  rankingsError: null,
  createBehaviorLogError: null,
  updateBehaviorLogError: null,
  deleteBehaviorLogError: null,
  
  selectedBehaviorFilter: null,
  lastRefresh: null,
};

// Async thunks
export const fetchBehaviors = createAsyncThunk(
  'behavior/fetchBehaviors',
  async (params: { species?: string; category?: string } = {}, { rejectWithValue }) => {
    try {
      return await behaviorService.getBehaviors(params);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const createBehaviorLog = createAsyncThunk(
  'behavior/createBehaviorLog',
  async (request: CreateBehaviorLogRequest, { rejectWithValue }) => {
    try {
      return await behaviorService.createBehaviorLog(request);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const fetchBehaviorLogs = createAsyncThunk(
  'behavior/fetchBehaviorLogs',
  async (filter: BehaviorLogFilter, { rejectWithValue }) => {
    try {
      return await behaviorService.getBehaviorLogs(filter);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const updateBehaviorLog = createAsyncThunk(
  'behavior/updateBehaviorLog',
  async ({ id, request }: { id: string; request: UpdateBehaviorLogRequest }, { rejectWithValue }) => {
    try {
      return await behaviorService.updateBehaviorLog(id, request);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const deleteBehaviorLog = createAsyncThunk(
  'behavior/deleteBehaviorLog',
  async (id: string, { rejectWithValue }) => {
    try {
      await behaviorService.deleteBehaviorLog(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const fetchGroupRankings = createAsyncThunk(
  'behavior/fetchGroupRankings',
  async (params: { groupId: string; date?: string }, { rejectWithValue }) => {
    try {
      return await behaviorService.getGroupRankings(params.groupId, params.date);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const fetchPetOfTheDay = createAsyncThunk(
  'behavior/fetchPetOfTheDay',
  async (params: { groupId: string; date?: string }, { rejectWithValue }) => {
    try {
      return await behaviorService.getPetOfTheDay(params.groupId, params.date);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const fetchDailyScore = createAsyncThunk(
  'behavior/fetchDailyScore',
  async (params: { petId: string; groupId: string; date?: string }, { rejectWithValue }) => {
    try {
      return await behaviorService.getDailyScore(params.petId, params.groupId, params.date);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

// Slice
const behaviorSlice = createSlice({
  name: 'behavior',
  initialState,
  reducers: {
    // UI actions
    setBehaviorFilter: (state, action: PayloadAction<string | null>) => {
      state.selectedBehaviorFilter = action.payload;
    },
    
    clearBehaviorErrors: (state) => {
      state.behaviorsError = null;
      state.behaviorLogsError = null;
      state.rankingsError = null;
      state.createBehaviorLogError = null;
      state.updateBehaviorLogError = null;
      state.deleteBehaviorLogError = null;
    },
    
    clearBehaviorLogs: (state) => {
      state.behaviorLogs = [];
      state.behaviorLogsByPet = {};
    },
    
    clearRankings: (state) => {
      state.groupRankings = [];
      state.petOfTheDay = null;
      state.dailyScore = null;
    },
    
    // Real-time updates (for WebSocket)
    updateRankingsRealTime: (state, action: PayloadAction<PetRanking[]>) => {
      state.groupRankings = action.payload;
      state.lastRefresh = Date.now();
    },
    
    updatePetOfTheDayRealTime: (state, action: PayloadAction<PetOfTheDayWinner>) => {
      state.petOfTheDay = action.payload;
      state.lastRefresh = Date.now();
    },
    
    // Optimistic updates
    addBehaviorLogOptimistic: (state, action: PayloadAction<Partial<BehaviorLog>>) => {
      const optimisticLog = {
        id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
        loggedAt: new Date().toISOString(),
        pointsAwarded: 0,
        notes: '',
        groupShares: [],
        ...action.payload,
      } as BehaviorLog;
      
      state.behaviorLogs.unshift(optimisticLog);
      
      // Update pet-specific logs
      if (optimisticLog.petId) {
        if (!state.behaviorLogsByPet[optimisticLog.petId]) {
          state.behaviorLogsByPet[optimisticLog.petId] = [];
        }
        state.behaviorLogsByPet[optimisticLog.petId].unshift(optimisticLog);
      }
    },
    
    removeBehaviorLogOptimistic: (state, action: PayloadAction<string>) => {
      const tempId = action.payload;
      state.behaviorLogs = state.behaviorLogs.filter(log => log.id !== tempId);
      
      // Update pet-specific logs
      Object.keys(state.behaviorLogsByPet).forEach(petId => {
        state.behaviorLogsByPet[petId] = state.behaviorLogsByPet[petId].filter(
          log => log.id !== tempId
        );
      });
    },
  },
  extraReducers: (builder) => {
    // Fetch Behaviors
    builder
      .addCase(fetchBehaviors.pending, (state) => {
        state.behaviorsLoading = true;
        state.behaviorsError = null;
      })
      .addCase(fetchBehaviors.fulfilled, (state, action) => {
        state.behaviorsLoading = false;
        state.behaviors = action.payload;
        
        // Group behaviors by species for easier filtering
        state.behaviorsBySpecies = action.payload.reduce((acc, behavior) => {
          const species = behavior.species || 'unknown';
          if (!acc[species]) {
            acc[species] = [];
          }
          acc[species].push(behavior);
          return acc;
        }, {} as Record<string, Behavior[]>);
      })
      .addCase(fetchBehaviors.rejected, (state, action) => {
        state.behaviorsLoading = false;
        state.behaviorsError = action.payload as string;
      });

    // Create Behavior Log
    builder
      .addCase(createBehaviorLog.pending, (state) => {
        state.createBehaviorLogLoading = true;
        state.createBehaviorLogError = null;
      })
      .addCase(createBehaviorLog.fulfilled, (state, action) => {
        state.createBehaviorLogLoading = false;
        
        // Remove any optimistic updates and add the real one
        const realLog = action.payload;
        state.behaviorLogs = state.behaviorLogs.filter(log => !log.id.startsWith('temp_'));
        state.behaviorLogs.unshift(realLog);
        
        // Update pet-specific logs
        if (!state.behaviorLogsByPet[realLog.petId]) {
          state.behaviorLogsByPet[realLog.petId] = [];
        }
        state.behaviorLogsByPet[realLog.petId] = state.behaviorLogsByPet[realLog.petId]
          .filter(log => !log.id.startsWith('temp_'));
        state.behaviorLogsByPet[realLog.petId].unshift(realLog);
      })
      .addCase(createBehaviorLog.rejected, (state, action) => {
        state.createBehaviorLogLoading = false;
        state.createBehaviorLogError = action.payload as string;
        
        // Remove optimistic updates on failure
        state.behaviorLogs = state.behaviorLogs.filter(log => !log.id.startsWith('temp_'));
        Object.keys(state.behaviorLogsByPet).forEach(petId => {
          state.behaviorLogsByPet[petId] = state.behaviorLogsByPet[petId]
            .filter(log => !log.id.startsWith('temp_'));
        });
      });

    // Fetch Behavior Logs
    builder
      .addCase(fetchBehaviorLogs.pending, (state) => {
        state.behaviorLogsLoading = true;
        state.behaviorLogsError = null;
      })
      .addCase(fetchBehaviorLogs.fulfilled, (state, action) => {
        state.behaviorLogsLoading = false;
        state.behaviorLogs = action.payload;
        
        // Group logs by pet ID for easier access
        state.behaviorLogsByPet = action.payload.reduce((acc, log) => {
          if (!acc[log.petId]) {
            acc[log.petId] = [];
          }
          acc[log.petId].push(log);
          return acc;
        }, {} as Record<string, BehaviorLog[]>);
      })
      .addCase(fetchBehaviorLogs.rejected, (state, action) => {
        state.behaviorLogsLoading = false;
        state.behaviorLogsError = action.payload as string;
      });

    // Update Behavior Log
    builder
      .addCase(updateBehaviorLog.pending, (state) => {
        state.updateBehaviorLogLoading = true;
        state.updateBehaviorLogError = null;
      })
      .addCase(updateBehaviorLog.fulfilled, (state, action) => {
        state.updateBehaviorLogLoading = false;
        const updatedLog = action.payload;
        
        // Update in main logs array
        const index = state.behaviorLogs.findIndex(log => log.id === updatedLog.id);
        if (index !== -1) {
          state.behaviorLogs[index] = updatedLog;
        }
        
        // Update in pet-specific logs
        if (state.behaviorLogsByPet[updatedLog.petId]) {
          const petIndex = state.behaviorLogsByPet[updatedLog.petId]
            .findIndex(log => log.id === updatedLog.id);
          if (petIndex !== -1) {
            state.behaviorLogsByPet[updatedLog.petId][petIndex] = updatedLog;
          }
        }
      })
      .addCase(updateBehaviorLog.rejected, (state, action) => {
        state.updateBehaviorLogLoading = false;
        state.updateBehaviorLogError = action.payload as string;
      });

    // Delete Behavior Log
    builder
      .addCase(deleteBehaviorLog.pending, (state) => {
        state.deleteBehaviorLogLoading = true;
        state.deleteBehaviorLogError = null;
      })
      .addCase(deleteBehaviorLog.fulfilled, (state, action) => {
        state.deleteBehaviorLogLoading = false;
        const deletedId = action.payload;
        
        // Remove from main logs array
        state.behaviorLogs = state.behaviorLogs.filter(log => log.id !== deletedId);
        
        // Remove from pet-specific logs
        Object.keys(state.behaviorLogsByPet).forEach(petId => {
          state.behaviorLogsByPet[petId] = state.behaviorLogsByPet[petId]
            .filter(log => log.id !== deletedId);
        });
      })
      .addCase(deleteBehaviorLog.rejected, (state, action) => {
        state.deleteBehaviorLogLoading = false;
        state.deleteBehaviorLogError = action.payload as string;
      });

    // Fetch Group Rankings
    builder
      .addCase(fetchGroupRankings.pending, (state) => {
        state.rankingsLoading = true;
        state.rankingsError = null;
      })
      .addCase(fetchGroupRankings.fulfilled, (state, action) => {
        state.rankingsLoading = false;
        state.groupRankings = action.payload;
        state.lastRefresh = Date.now();
      })
      .addCase(fetchGroupRankings.rejected, (state, action) => {
        state.rankingsLoading = false;
        state.rankingsError = action.payload as string;
      });

    // Fetch Pet of the Day
    builder
      .addCase(fetchPetOfTheDay.pending, (state) => {
        // Don't set loading for Pet of the Day as it's often fetched with rankings
      })
      .addCase(fetchPetOfTheDay.fulfilled, (state, action) => {
        state.petOfTheDay = action.payload;
      })
      .addCase(fetchPetOfTheDay.rejected, (state, action) => {
        // Pet of the Day not being available is not necessarily an error
        state.petOfTheDay = null;
      });

    // Fetch Daily Score
    builder
      .addCase(fetchDailyScore.pending, (state) => {
        // Don't set global loading state for individual pet scores
      })
      .addCase(fetchDailyScore.fulfilled, (state, action) => {
        state.dailyScore = action.payload;
      })
      .addCase(fetchDailyScore.rejected, (state, action) => {
        state.dailyScore = null;
      });
  },
});

// Actions
export const {
  setBehaviorFilter,
  clearBehaviorErrors,
  clearBehaviorLogs,
  clearRankings,
  updateRankingsRealTime,
  updatePetOfTheDayRealTime,
  addBehaviorLogOptimistic,
  removeBehaviorLogOptimistic,
} = behaviorSlice.actions;

// Selectors
export const selectBehaviors = (state: RootState) => state.behavior.behaviors;
export const selectBehaviorsBySpecies = (state: RootState) => state.behavior.behaviorsBySpecies;
export const selectBehaviorLogs = (state: RootState) => state.behavior.behaviorLogs;
export const selectBehaviorLogsByPet = (state: RootState) => state.behavior.behaviorLogsByPet;
export const selectGroupRankings = (state: RootState) => state.behavior.groupRankings;
export const selectPetOfTheDay = (state: RootState) => state.behavior.petOfTheDay;
export const selectDailyScore = (state: RootState) => state.behavior.dailyScore;

// Loading selectors
export const selectBehaviorsLoading = (state: RootState) => state.behavior.behaviorsLoading;
export const selectBehaviorLogsLoading = (state: RootState) => state.behavior.behaviorLogsLoading;
export const selectRankingsLoading = (state: RootState) => state.behavior.rankingsLoading;
export const selectCreateBehaviorLogLoading = (state: RootState) => state.behavior.createBehaviorLogLoading;
export const selectUpdateBehaviorLogLoading = (state: RootState) => state.behavior.updateBehaviorLogLoading;
export const selectDeleteBehaviorLogLoading = (state: RootState) => state.behavior.deleteBehaviorLogLoading;

// Error selectors
export const selectBehaviorsError = (state: RootState) => state.behavior.behaviorsError;
export const selectBehaviorLogsError = (state: RootState) => state.behavior.behaviorLogsError;
export const selectRankingsError = (state: RootState) => state.behavior.rankingsError;
export const selectCreateBehaviorLogError = (state: RootState) => state.behavior.createBehaviorLogError;
export const selectUpdateBehaviorLogError = (state: RootState) => state.behavior.updateBehaviorLogError;
export const selectDeleteBehaviorLogError = (state: RootState) => state.behavior.deleteBehaviorLogError;

// UI selectors
export const selectBehaviorFilter = (state: RootState) => state.behavior.selectedBehaviorFilter;
export const selectLastRefresh = (state: RootState) => state.behavior.lastRefresh;

// Computed selectors
export const selectBehaviorById = (state: RootState, behaviorId: string) =>
  state.behavior.behaviors.find(behavior => behavior.id === behaviorId);

export const selectBehaviorLogsByPetId = (state: RootState, petId: string) =>
  state.behavior.behaviorLogsByPet[petId] || [];

export const selectActiveBehaviors = (state: RootState) =>
  state.behavior.behaviors.filter(behavior => behavior.isActive);

export const selectBehaviorsByCategory = (state: RootState, category?: string) => {
  if (!category) return state.behavior.behaviors;
  return state.behavior.behaviors.filter(behavior => 
    behavior.isActive && behavior.category === category
  );
};

export const selectPetRankingById = (state: RootState, petId: string) =>
  state.behavior.groupRankings.find(ranking => ranking.petId === petId);

// Export reducer
export default behaviorSlice.reducer;
