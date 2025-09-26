import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pet, Group } from '@/types';
import { EarnedBadge, BadgeProgress } from '@/types/badges';

interface PetAction {
    petId: string;
    actionId: string;
    points: number;
    timestamp: string;
    actionText: string;
}

interface PetsState {
    pets: Pet[];
    groups: Group[];
    dailyActions: PetAction[];
    selectedDate: string;
    earnedBadges: EarnedBadge[];
    badgeProgress: BadgeProgress[];
    showBadgeModal: boolean;
    newlyEarnedBadges: EarnedBadge[];
}

const initialState: PetsState = {
    pets: [],
    groups: [],
    dailyActions: [],
    selectedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    earnedBadges: [],
    badgeProgress: [],
    showBadgeModal: false,
    newlyEarnedBadges: [],
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
        updatePetPoints: (state, action: PayloadAction<{ petId: string; points: number }>) => {
            const pet = state.pets.find(p => p.id === action.payload.petId);
            if (pet) {
                pet.points = (pet.points || 0) + action.payload.points;
            }
        },
        addAction: (state, action: PayloadAction<PetAction>) => {
            state.dailyActions.push(action.payload);
            // Mettre à jour les points du pet
            const pet = state.pets.find(p => p.id === action.payload.petId);
            if (pet) {
                pet.points = (pet.points || 0) + action.payload.points;
            }
        },
        resetDailyPoints: (state) => {
            state.pets.forEach((pet: Pet) => {
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
            const index = state.groups.findIndex((g: Group) => g.id === action.payload.id);
            if (index !== -1) {
                state.groups[index] = action.payload;
            }
        },
        removeGroup: (state, action: PayloadAction<string>) => {
            state.groups = state.groups.filter((g: Group) => g.id !== action.payload);
        },
        // Actions pour les badges
        addEarnedBadge: (state, action: PayloadAction<EarnedBadge>) => {
            state.earnedBadges.push(action.payload);
        },
        addMultipleBadges: (state, action: PayloadAction<EarnedBadge[]>) => {
            state.earnedBadges.push(...action.payload);
            state.newlyEarnedBadges = action.payload;
            if (action.payload.length > 0) {
                state.showBadgeModal = true;
            }
        },
        updateBadgeProgress: (state, action: PayloadAction<BadgeProgress[]>) => {
            state.badgeProgress = action.payload;
        },
        dismissBadgeModal: (state) => {
            state.showBadgeModal = false;
            state.newlyEarnedBadges = [];
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
    addEarnedBadge,
    addMultipleBadges,
    updateBadgeProgress,
    dismissBadgeModal,
} = petsSlice.actions;

// Selectors
export const selectPets = (state: { pets: PetsState }) => state.pets.pets;
export const selectGroups = (state: { pets: PetsState }) => state.pets.groups;
export const selectDailyActions = (state: { pets: PetsState }) => state.pets.dailyActions;
export const selectEarnedBadges = (state: { pets: PetsState }) => state.pets.earnedBadges;
export const selectBadgeProgress = (state: { pets: PetsState }) => state.pets.badgeProgress;
export const selectShowBadgeModal = (state: { pets: PetsState }) => state.pets.showBadgeModal;
export const selectNewlyEarnedBadges = (state: { pets: PetsState }) => state.pets.newlyEarnedBadges;
export const selectTodaysWinner = (state: { pets: PetsState }) => {
    const pets = state.pets.pets;
    if (pets.length === 0) return undefined;
    return pets.reduce((winner, pet) => (pet.points || 0) > (winner.points || 0) ? pet : winner);
};

// Sélecteurs de badges pour un pet spécifique
export const selectPetBadges = (state: { pets: PetsState }, petId: string) =>
    state.pets.earnedBadges.filter(badge => String(badge.petId) === String(petId));

export const selectPetBadgeProgress = (state: { pets: PetsState }, petId: string) =>
    state.pets.badgeProgress.filter(progress => progress.petId === petId);

export default petsSlice.reducer;