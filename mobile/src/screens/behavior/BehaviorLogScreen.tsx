import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useTranslation } from '../../hooks';
import { useTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import {
  fetchBehaviors,
  createBehaviorLog,
  fetchBehaviorLogs,
  selectBehaviors,
  selectBehaviorLogsLoading,
  selectBehaviorLogs,
} from '../../store/behaviorSlice';
import { selectCurrentUser } from '../../store/authSlice';
import { selectUserPets } from '../../store/petSlice';
import { selectCurrentGroup } from '../../store/groupSlice';

import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BehaviorSelector from '../../components/behavior/BehaviorSelector';
import PetCheckboxSelector from '../../components/PetCheckboxSelector';
import ModernActionModal from '../../components/ModernActionModal';

type BehaviorLogScreenRouteProp = RouteProp<RootStackParamList, 'BehaviorLog'>;
type BehaviorLogScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BehaviorLog'>;

interface BehaviorLogScreenProps {}

const BehaviorLogScreen: React.FC<BehaviorLogScreenProps> = () => {
  const navigation = useNavigation<BehaviorLogScreenNavigationProp>();
  const route = useRoute<BehaviorLogScreenRouteProp>();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const theme = useTheme();

  // Redux state
  const currentUser = useAppSelector(selectCurrentUser);
  const userPets = useAppSelector(selectUserPets);
  const currentGroup = useAppSelector(selectCurrentGroup);
  const behaviors = useAppSelector(selectBehaviors);
  const behaviorLogs = useAppSelector(selectBehaviorLogs);
  const isLoading = useAppSelector(selectBehaviorLogsLoading);

  // Local state
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [selectedBehaviorId, setSelectedBehaviorId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  // Screen initialization
  useEffect(() => {
    loadInitialData();
  }, []);

  // Pre-select pet if passed via route params
  useEffect(() => {
    if (route.params?.petId) {
      setSelectedPetIds([route.params.petId]);
    }
  }, [route.params?.petId]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        dispatch(fetchBehaviors()).unwrap(),
        dispatch(fetchBehaviorLogs({ 
          groupId: currentGroup?.id,
          limit: 50 
        })).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert(
        t('behavior.errors.loadFailed.title'),
        t('behavior.errors.loadFailed.message')
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogBehavior = async () => {
    if (!selectedBehaviorId || selectedPetIds.length === 0) {
      Alert.alert(
        t('behavior.validation.incomplete.title'),
        t('behavior.validation.incomplete.message')
      );
      return;
    }

    if (!currentGroup) {
      Alert.alert(
        t('behavior.errors.noGroup.title'),
        t('behavior.errors.noGroup.message')
      );
      return;
    }

    setIsSubmitting(true);
    setShowActionModal(true);

    try {
      // Create behavior logs for each selected pet
      const promises = selectedPetIds.map(petId =>
        dispatch(createBehaviorLog({
          petId,
          behaviorId: selectedBehaviorId,
          notes: notes.trim(),
          groupIds: [currentGroup.id],
        })).unwrap()
      );

      await Promise.all(promises);

      // Show success message
      const selectedBehavior = behaviors.find(b => b.id === selectedBehaviorId);
      const petNames = selectedPetIds
        .map(id => userPets.find(p => p.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      Alert.alert(
        t('behavior.success.logged.title'),
        t('behavior.success.logged.message', {
          behavior: selectedBehavior?.name || '',
          pets: petNames,
          points: selectedBehavior?.pointValue || 0,
        })
      );

      // Reset form
      setSelectedPetIds([]);
      setSelectedBehaviorId('');
      setNotes('');

      // Refresh behavior logs
      await dispatch(fetchBehaviorLogs({ 
        groupId: currentGroup.id,
        limit: 50 
      })).unwrap();

    } catch (error: any) {
      console.error('Failed to log behavior:', error);
      
      let errorMessage = t('behavior.errors.logFailed.message');
      if (error.message?.includes('duplicate')) {
        errorMessage = t('behavior.errors.duplicate.message');
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = t('behavior.errors.unauthorized.message');
      }

      Alert.alert(
        t('behavior.errors.logFailed.title'),
        errorMessage
      );
    } finally {
      setIsSubmitting(false);
      setShowActionModal(false);
    }
  };

  const canLogBehavior = () => {
    return (
      selectedBehaviorId &&
      selectedPetIds.length > 0 &&
      currentGroup &&
      !isSubmitting
    );
  };

  const getSelectedBehavior = () => {
    return behaviors.find(b => b.id === selectedBehaviorId);
  };

  const getTotalPoints = () => {
    const behavior = getSelectedBehavior();
    if (!behavior) return 0;
    return behavior.pointValue * selectedPetIds.length;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContainer: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.md,
    },
    pointsPreview: {
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.md,
      borderRadius: 8,
      marginTop: theme.spacing.sm,
    },
    pointsText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    positivePoints: {
      color: theme.colors.success,
    },
    negativePoints: {
      color: theme.colors.error,
    },
    notesInput: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      padding: theme.spacing.md,
      minHeight: 80,
      textAlignVertical: 'top',
      color: theme.colors.text.primary,
      fontSize: 16,
    },
    buttonContainer: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
    },
    recentLogsSection: {
      marginTop: theme.spacing.xl,
    },
    logItem: {
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.md,
      borderRadius: 8,
      marginBottom: theme.spacing.sm,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    logBehavior: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    logPoints: {
      fontSize: 14,
      fontWeight: '600',
    },
    logDetails: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    emptyState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner />
        <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing.md }}>
          {t('behavior.loading.behaviors')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Pet Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('behavior.selectPets.title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('behavior.selectPets.subtitle')}</Text>
          <PetCheckboxSelector
            pets={userPets}
            selectedPetIds={selectedPetIds}
            onSelectionChange={setSelectedPetIds}
          />
        </View>

        {/* Behavior Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('behavior.selectBehavior.title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('behavior.selectBehavior.subtitle')}</Text>
          <BehaviorSelector
            behaviors={behaviors}
            selectedBehaviorId={selectedBehaviorId}
            onBehaviorSelect={setSelectedBehaviorId}
          />
        </View>

        {/* Points Preview */}
        {selectedBehaviorId && selectedPetIds.length > 0 && (
          <View style={styles.pointsPreview}>
            <Text
              style={[
                styles.pointsText,
                getTotalPoints() > 0 ? styles.positivePoints : styles.negativePoints,
              ]}
            >
              {getTotalPoints() > 0 ? '+' : ''}{getTotalPoints()} {t('behavior.points')}
            </Text>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('behavior.notes.title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('behavior.notes.subtitle')}</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('behavior.notes.placeholder')}
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            maxLength={500}
          />
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={t('behavior.logBehavior')}
            onPress={handleLogBehavior}
            disabled={!canLogBehavior()}
            loading={isSubmitting}
          />
        </View>

        {/* Recent Logs */}
        <View style={styles.recentLogsSection}>
          <Text style={styles.sectionTitle}>{t('behavior.recentLogs.title')}</Text>
          {behaviorLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {t('behavior.recentLogs.empty')}
              </Text>
            </View>
          ) : (
            behaviorLogs.slice(0, 10).map((log) => {
              const behavior = behaviors.find(b => b.id === log.behaviorId);
              const pet = userPets.find(p => p.id === log.petId);
              
              return (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logBehavior}>
                      {behavior?.name || t('behavior.unknownBehavior')}
                    </Text>
                    <Text
                      style={[
                        styles.logPoints,
                        log.pointsAwarded > 0 ? styles.positivePoints : styles.negativePoints,
                      ]}
                    >
                      {log.pointsAwarded > 0 ? '+' : ''}{log.pointsAwarded}
                    </Text>
                  </View>
                  <Text style={styles.logDetails}>
                    {pet?.name || t('behavior.unknownPet')} • {new Date(log.loggedAt).toLocaleDateString()}
                  </Text>
                  {log.notes && (
                    <Text style={[styles.logDetails, { marginTop: theme.spacing.xs }]}>
                      "{log.notes}"
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Action Modal */}
      <ModernActionModal
        visible={showActionModal}
        title={t('behavior.logging.title')}
        message={t('behavior.logging.message')}
        onClose={() => setShowActionModal(false)}
      />
    </View>
  );
};

export default BehaviorLogScreen;
