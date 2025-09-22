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
        const badgeEngine = new BadgeEngine(earnedBadges, dailyActions);
        const allProgress: any[] = [];

        pets.forEach(pet => {
            const petProgress = badgeEngine.getAllProgress(pet);
            allProgress.push(...petProgress);
        });

        dispatch(updateBadgeProgress(allProgress));
    }, [pets, dailyActions, earnedBadges, dispatch]);

    return {
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