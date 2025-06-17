import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import PetOfTheDayCard from '../../shared/cards/PetOfTheDayCard';
import QuickActions from '../../shared/QuickActions';
import MyPetsSection from './components/MyPetsSection';
import ActionModal from '../../shared/modals/ActionModal';
import BadgeCelebrationModal from '../../shared/modals/BadgeCelebrationModal';
import BadgeProgressWidget from '../../shared/widgets/BadgeProgressWidget';
import { selectPets, selectTodaysWinner } from '../../store/petsSlice';
import { useBadgeProgress } from '../../hooks/useBadgeProgress';

const HomeScreen: React.FC = () => {
    const [showActionModal, setShowActionModal] = useState<boolean>(false);
    const navigation = useNavigation();

    const pets = useSelector(selectPets);
    const todaysWinner = useSelector(selectTodaysWinner);

    // Hook pour calculer automatiquement la progression des badges
    useBadgeProgress();

    const handleNoteAction = () => {
        setShowActionModal(true);
    };

    const handlePhotoMoment = () => {
        // TODO: Implémenter la capture de photo
        console.log('Photo moment clicked');
    };

    const handleCloseModal = () => {
        setShowActionModal(false);
    };

    const handleSelectAction = (actionId: number, petId: number, finalPoints: number) => {
        // Cette logique sera gérée par le modal ActionModal avec Redux
        console.log(`Action ${actionId} pour pet ${petId} : ${finalPoints} points`);
        setShowActionModal(false);
    };

    const handleViewAllBadges = () => {
        // Navigation vers l'onglet Badges
        navigation.navigate('Badges' as never);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {todaysWinner && <PetOfTheDayCard winner={todaysWinner} />}

                <QuickActions
                    onNoteAction={handleNoteAction}
                    onPhotoMoment={handlePhotoMoment}
                />

                <BadgeProgressWidget onViewAll={handleViewAllBadges} />

                <MyPetsSection pets={pets} />
            </ScrollView>

            <ActionModal
                visible={showActionModal}
                pets={pets}
                onClose={handleCloseModal}
                onSelectAction={handleSelectAction}
            />

            <BadgeCelebrationModal />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollView: {
        flex: 1,
    },
});

export default HomeScreen;