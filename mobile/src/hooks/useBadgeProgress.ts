import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectPets,
    selectDailyActions,
    selectEarnedBadges,
    updateBadgeProgress
} from '@store/petsSlice';
import { BadgeEngine } from '@utils/badgeEngine';

export const useBadgeProgress = () => {
    const dispatch = useDispatch();
    const pets = useSelector(selectPets);
    const dailyActions = useSelector(selectDailyActions);
    const earnedBadges = useSelector(selectEarnedBadges);

    useEffect(() => {
        // Calculer la progression pour tous les pets
        const badgeEngine = new BadgeEngine(earnedBadges, dailyActions);
        const allProgress: any[] = [];

        pets.forEach(pet => {
            const petProgress = badgeEngine.getAllProgress(pet);
            allProgress.push(...petProgress);
        });

        // Mettre à jour le store avec les nouveaux progrès
        dispatch(updateBadgeProgress(allProgress));
    }, [pets, dailyActions, earnedBadges, dispatch]);

    return {
        // Hook peut retourner des utilitaires si nécessaire
        refreshProgress: () => {
            const badgeEngine = new BadgeEngine(earnedBadges, dailyActions);
            const allProgress: any[] = [];

            pets.forEach(pet => {
                const petProgress = badgeEngine.getAllProgress(pet);
                allProgress.push(...petProgress);
            });

            dispatch(updateBadgeProgress(allProgress));
        }
    };
};