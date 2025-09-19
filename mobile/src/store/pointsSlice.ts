import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../services/api';
import {
  Behavior,
  ScoreEvent,
  LeaderboardEntry,
  ApiError,
  CreateScoreEventRequest,
  CreateScoreEventResponse,
  GetBehaviorsResponse,
  GetPetScoreEventsResponse,
  GetLeaderboardResponse,
} from '../types/api';

interface PointsState {
  // Behaviors data
  behaviors: Behavior[];
  availableBehaviors: Behavior[]; // Filtered by current pet species

  // Score events data
  scoreEvents: ScoreEvent[];
  petScoreEvents: { [petId: string]: ScoreEvent[] };
  petTotalPoints: { [petId: string]: number };

  // Leaderboard data
  dailyLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;

  // Loading states
  isLoadingBehaviors: boolean;
  isCreatingEvent: boolean;
  isLoadingEvents: boolean;
  isLoadingLeaderboard: boolean;
  isDeletingEvent: boolean;

  // Error states
  error: ApiError | null;

  // UI states
  selectedBehaviorCategory: string | null;
  leaderboardPeriod: 'daily' | 'weekly';
}

const initialState: PointsState = {
  behaviors: [],
  availableBehaviors: [],
  scoreEvents: [],
  petScoreEvents: {},
  petTotalPoints: {},
  dailyLeaderboard: [],
  weeklyLeaderboard: [],
  currentPeriodStart: null,
  currentPeriodEnd: null,
  isLoadingBehaviors: false,
  isCreatingEvent: false,
  isLoadingEvents: false,
  isLoadingLeaderboard: false,
  isDeletingEvent: false,
  error: null,
  selectedBehaviorCategory: null,
  leaderboardPeriod: 'daily',
};

// Async thunks
export const fetchBehaviors = createAsyncThunk(
  'points/fetchBehaviors',
  async (species?: 'dog' | 'cat', { rejectWithValue }) => {
    try {
      const response = await apiService.getBehaviors(species);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const createScoreEvent = createAsyncThunk(
  'points/createScoreEvent',
  async (data: CreateScoreEventRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.createScoreEvent(data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const fetchPetScoreEvents = createAsyncThunk(
  'points/fetchPetScoreEvents',
  async ({ petId, groupId, limit = 50 }: { petId: string; groupId: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.getPetScoreEvents(petId, groupId, limit);
      return { petId, ...response };
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const fetchGroupLeaderboard = createAsyncThunk(
  'points/fetchGroupLeaderboard',
  async ({ groupId, period = 'daily' }: { groupId: string; period?: 'daily' | 'weekly' }, { rejectWithValue }) => {
    try {
      const response = await apiService.getGroupLeaderboard(groupId, period);
      return { period, ...response };
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

export const deleteScoreEvent = createAsyncThunk(
  'points/deleteScoreEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await apiService.deleteScoreEvent(eventId);
      return eventId;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError);
    }
  }
);

const pointsSlice = createSlice({
  name: 'points',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setBehaviorCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedBehaviorCategory = action.payload;
    },
    setLeaderboardPeriod: (state, action: PayloadAction<'daily' | 'weekly'>) => {
      state.leaderboardPeriod = action.payload;
    },
    filterBehaviorsBySpecies: (state, action: PayloadAction<'dog' | 'cat' | 'both'>) => {
      const species = action.payload;
      state.availableBehaviors = state.behaviors.filter(
        behavior => behavior.species === species || behavior.species === 'both'
      );
    },
    resetPointsState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch behaviors
    builder
      .addCase(fetchBehaviors.pending, (state) => {
        state.isLoadingBehaviors = true;
        state.error = null;
      })
      .addCase(fetchBehaviors.fulfilled, (state, action) => {
        state.isLoadingBehaviors = false;
        state.behaviors = action.payload.behaviors;
        state.availableBehaviors = action.payload.behaviors;
        state.error = null;
      })
      .addCase(fetchBehaviors.rejected, (state, action) => {
        state.isLoadingBehaviors = false;
        state.error = action.payload as ApiError;
      });

    // Create score event
    builder
      .addCase(createScoreEvent.pending, (state) => {
        state.isCreatingEvent = true;
        state.error = null;
      })
      .addCase(createScoreEvent.fulfilled, (state, action) => {
        state.isCreatingEvent = false;
        const newEvent = action.payload;

        // Add to general score events
        state.scoreEvents.unshift(newEvent);

        // Add to pet-specific events
        if (!state.petScoreEvents[newEvent.pet_id]) {
          state.petScoreEvents[newEvent.pet_id] = [];
        }
        state.petScoreEvents[newEvent.pet_id].unshift(newEvent);

        // Update pet total points
        if (state.petTotalPoints[newEvent.pet_id]) {
          state.petTotalPoints[newEvent.pet_id] += newEvent.points;
        } else {
          state.petTotalPoints[newEvent.pet_id] = newEvent.points;
        }

        state.error = null;
      })
      .addCase(createScoreEvent.rejected, (state, action) => {
        state.isCreatingEvent = false;
        state.error = action.payload as ApiError;
      });

    // Fetch pet score events
    builder
      .addCase(fetchPetScoreEvents.pending, (state) => {
        state.isLoadingEvents = true;
        state.error = null;
      })
      .addCase(fetchPetScoreEvents.fulfilled, (state, action) => {
        state.isLoadingEvents = false;
        const { petId, events, total_points } = action.payload;
        state.petScoreEvents[petId] = events;
        state.petTotalPoints[petId] = total_points;
        state.error = null;
      })
      .addCase(fetchPetScoreEvents.rejected, (state, action) => {
        state.isLoadingEvents = false;
        state.error = action.payload as ApiError;
      });

    // Fetch group leaderboard
    builder
      .addCase(fetchGroupLeaderboard.pending, (state) => {
        state.isLoadingLeaderboard = true;
        state.error = null;
      })
      .addCase(fetchGroupLeaderboard.fulfilled, (state, action) => {
        state.isLoadingLeaderboard = false;
        const { period, daily, weekly, period_start, period_end } = action.payload;

        if (period === 'daily') {
          state.dailyLeaderboard = daily;
        } else {
          state.weeklyLeaderboard = weekly;
        }

        state.currentPeriodStart = period_start;
        state.currentPeriodEnd = period_end;
        state.error = null;
      })
      .addCase(fetchGroupLeaderboard.rejected, (state, action) => {
        state.isLoadingLeaderboard = false;
        state.error = action.payload as ApiError;
      });

    // Delete score event
    builder
      .addCase(deleteScoreEvent.pending, (state) => {
        state.isDeletingEvent = true;
        state.error = null;
      })
      .addCase(deleteScoreEvent.fulfilled, (state, action) => {
        state.isDeletingEvent = false;
        const eventId = action.payload;

        // Remove from general score events
        state.scoreEvents = state.scoreEvents.filter(event => event.id !== eventId);

        // Remove from pet-specific events and update points
        Object.keys(state.petScoreEvents).forEach(petId => {
          const eventIndex = state.petScoreEvents[petId].findIndex(event => event.id === eventId);
          if (eventIndex !== -1) {
            const deletedEvent = state.petScoreEvents[petId][eventIndex];
            state.petScoreEvents[petId].splice(eventIndex, 1);

            // Update pet total points
            if (state.petTotalPoints[petId]) {
              state.petTotalPoints[petId] -= deletedEvent.points;
            }
          }
        });

        state.error = null;
      })
      .addCase(deleteScoreEvent.rejected, (state, action) => {
        state.isDeletingEvent = false;
        state.error = action.payload as ApiError;
      });
  },
});

export const {
  clearError,
  setBehaviorCategory,
  setLeaderboardPeriod,
  filterBehaviorsBySpecies,
  resetPointsState,
} = pointsSlice.actions;

export default pointsSlice.reducer;