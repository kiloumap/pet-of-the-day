import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useAppDispatch } from '../../hooks';

import PetOfTheDayCard from '../../shared/cards/PetOfTheDayCard';
import QuickActions from '../../shared/QuickActions';
import MyPetsSection from './components/MyPetsSection';
import ModernActionModal from '../../components/ModernActionModal';
import BadgeCelebrationModal from '../../shared/modals/BadgeCelebrationModal';
import BadgeProgressWidget from '../../shared/widgets/BadgeProgressWidget';
import ActivityFeed from '../../components/ActivityFeed';
import { selectPets, selectTodaysWinner, fetchPets } from '../../store/petSlice';
import { useBadgeProgress } from '../../hooks/useBadgeProgress';
import { useTranslation } from '../../hooks';

const HomeScreen: React.FC = () => {
    const [showActionModal, setShowActionModal] = useState<boolean>(false);
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const pets = useSelector(selectPets);
    const todaysWinner = useSelector(selectTodaysWinner);

    // Hook pour calculer automatiquement la progression des badges
    useBadgeProgress();

    // Load pets on mount
    useEffect(() => {
        dispatch(fetchPets());
    }, [dispatch]);

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


    const handleViewAllBadges = () => {
        // Navigation vers l'onglet Badges
        navigation.navigate('Badges' as never);
    };

    const handleActivityPress = (activity: any) => {
        // Navigate to group detail or pet detail
        console.log('Activity pressed:', activity);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background.primary,
        },
        scrollView: {
            flex: 1,
        },
        headerSection: {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
        },
        welcomeText: {
            fontSize: 24,
            fontWeight: '700',
            color: theme.colors.text.primary,
            marginBottom: 4,
        },
        subtitleText: {
            fontSize: 14,
            color: theme.colors.text.secondary,
            fontWeight: '500',
        },
        section: {
            paddingHorizontal: 16,
            marginBottom: 16,
        },
        activitySection: {
            backgroundColor: theme.colors.background.secondary,
            marginHorizontal: 16,
            marginBottom: 24, // Add more padding bottom
            borderRadius: 12,
            overflow: 'hidden',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            maxHeight: 300,
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.welcomeText}>{t('navigation.home')}</Text>
                    <Text style={styles.subtitleText}>{t('common.recentActivity')}</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <QuickActions
                        onNoteAction={handleNoteAction}
                        onPhotoMoment={handlePhotoMoment}
                    />
                </View>

                {/* Pet of the Day Card */}
                {todaysWinner && (
                    <View style={styles.section}>
                        <PetOfTheDayCard winner={todaysWinner} />
                    </View>
                )}

                {/* Activity Feed */}
                <View style={styles.activitySection}>
                    <ActivityFeed onActionPress={handleActivityPress} />
                </View>

                {/* Badge Progress */}
                <View style={styles.section}>
                    <BadgeProgressWidget onViewAll={handleViewAllBadges} />
                </View>

                {/* My Pets Section */}
                <View style={styles.section}>
                    <MyPetsSection pets={pets} />
                </View>
            </ScrollView>

            <ModernActionModal
                visible={showActionModal}
                pets={pets}
                onClose={handleCloseModal}
                onSuccess={() => {
                    // Refresh activity feed or any other data
                    console.log('Action recorded successfully');
                }}
            />

            <BadgeCelebrationModal />
        </SafeAreaView>
    );
};

export default HomeScreen;