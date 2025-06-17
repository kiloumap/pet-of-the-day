import { Action, Multiplier, AgeGroup } from '../../types';
import {
    baseActions,
    chiotActions,
    adulteActions,
    seniorActions,
    multipliers as importedMultipliers
} from '../../data/mockData';

export const multipliers = importedMultipliers;

export const getActionsByAge = (ageGroup: AgeGroup): Action[] => {
    const allActions = [...baseActions];

    switch (ageGroup) {
        case 'chiot':
            return [...allActions, ...chiotActions];
        case 'adulte':
            return [...allActions, ...adulteActions];
        case 'senior':
            return [...allActions, ...seniorActions];
        default:
            return allActions;
    }
};

export const calculatePoints = (basePoints: number, selectedMultipliers: string[]): number => {
    let totalMultiplier = 1;

    selectedMultipliers.forEach(multiplierName => {
        const multiplier = multipliers.find(m => m.name === multiplierName);
        if (multiplier) {
            totalMultiplier *= multiplier.factor;
        }
    });

    return Math.round(basePoints * totalMultiplier);
};

export const getAgeGroup = (ageInMonths: number): AgeGroup => {
    if (ageInMonths <= 12) return 'chiot';
    if (ageInMonths <= 84) return 'adulte'; // 7 ans * 12 mois
    return 'senior';
};

export const getAgeGroupInfo = (ageGroup: AgeGroup) => {
    switch (ageGroup) {
        case 'chiot':
            return {
                label: '🐶 Chiot (0-12 mois)',
                focus: 'Focus : Apprentissage & Socialisation',
                color: '#10b981'
            };
        case 'adulte':
            return {
                label: '🐕 Adulte (1-7 ans)',
                focus: 'Focus : Maintien & Performance',
                color: '#3b82f6'
            };
        case 'senior':
            return {
                label: '🐕‍🦺 Senior (7+ ans)',
                focus: 'Focus : Confort & Sagesse',
                color: '#8b5cf6'
            };
        default:
            return {
                label: '',
                focus: '',
                color: '#6b7280'
            };
    }
};