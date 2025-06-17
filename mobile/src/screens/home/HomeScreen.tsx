import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import PetOfTheDayCard from '../../shared/cards/PetOfTheDayCard';
import QuickActions from '../../shared/QuickActions';
import MyPetsSection from './components/MyPetsSection';
import ActionModal from '../../shared/modals/ActionModal';
import BadgeCelebrationModal from '../../shared/modals/BadgeCelebrationModal';
import { selectPets, selectTodaysWinner } from '@store/petsSlice';

const HomeScreen: React.FC = () => {
    const [showActionModal, setShowActionModal] = useState<boolean>(false);

    const pets = useSelector(selectPets);
    const todaysWinner = useSelector(selectTodaysWinner);

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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {todaysWinner && <PetOfTheDayCard winner={todaysWinner} />}

                <QuickActions
                    onNoteAction={handleNoteAction}
                    onPhotoMoment={handlePhotoMoment}
                />

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