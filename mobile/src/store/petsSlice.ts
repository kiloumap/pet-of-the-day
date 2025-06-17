import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pet, Group } from '../../types';

interface PetAction {
    petId: number;
    actionId: number;
    points: number;
    timestamp: string;
    actionText: string;
}

interface PetsState {
    pets: Pet[];
    groups: Group[];
    dailyActions: PetAction[];
    selectedDate: string;
}

const initialState: PetsState = {
    pets: [],
    groups: [],
    dailyActions: [],
    selectedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
};

const petsSlice = createSlice({
    name: 'pets',
    initialState,
    reducers: {
        setPets: (state, action: PayloadAction<Pet[]>) => {
            state.pets = action.payload;
        },
        setGroups: (state, action: PayloadAction<Group[]>) => {
            state.groups = action.payload;
        },
        updatePetPoints: (state, action: PayloadAction<{ petId: number; points: number }>) => {
            const pet = state.pets.find(p => p.id === action.payload.petId);
            if (pet) {
                pet.points += action.payload.points;
            }
        },
        addAction: (state, action: PayloadAction<PetAction>) => {
            state.dailyActions.push(action.payload);
            // Mettre à jour les points du pet
            const pet = state.pets.find(p => p.id === action.payload.petId);
            if (pet) {
                pet.points += action.payload.points;
            }
        },
        resetDailyPoints: (state) => {
            state.pets.forEach(pet => {
                pet.points = 0;
            });
            state.dailyActions = [];
        },
        setSelectedDate: (state, action: PayloadAction<string>) => {
            state.selectedDate = action.payload;
        },
        // Actions pour les groupes
        addGroup: (state, action: PayloadAction<Group>) => {
            state.groups.push(action.payload);
        },
        updateGroup: (state, action: PayloadAction<Group>) => {
            const index = state.groups.findIndex(g => g.id === action.payload.id);
            if (index !== -1) {
                state.groups[index] = action.payload;
            }
        },
        removeGroup: (state, action: PayloadAction<number>) => {
            state.groups = state.groups.filter(g => g.id !== action.payload);
        },
    },
});

export const {
    setPets,
    setGroups,
    updatePetPoints,
    addAction,
    resetDailyPoints,
    setSelectedDate,
    addGroup,
    updateGroup,
    removeGroup,
} = petsSlice.actions;

// Selectors
export const selectPets = (state: { pets: PetsState }) => state.pets.pets;
export const selectGroups = (state: { pets: PetsState }) => state.pets.groups;
export const selectDailyActions = (state: { pets: PetsState }) => state.pets.dailyActions;
export const selectTodaysWinner = (state: { pets: PetsState }) => {
    const pets = state.pets.pets;
    if (pets.length === 0) return undefined;
    return pets.reduce((winner, pet) => pet.points > winner.points ? pet : winner);
};

export default petsSlice.reducer;