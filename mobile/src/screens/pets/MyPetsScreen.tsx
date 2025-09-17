import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { useAppDispatch, useAppSelector, useTranslation } from '../../hooks';
import { fetchPets, clearError } from '../../store/petSlice';
import { Pet } from '../../types/api';

interface MyPetsScreenProps {
  navigation: any;
}

export const MyPetsScreen: React.FC<MyPetsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { pets, isLoading, error } = useAppSelector((state) => state.pets);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchPets());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchPets());
  };

  const handleAddPet = () => {
    navigation.navigate('AddPet');
  };

  const handlePetPress = (pet: Pet) => {
    navigation.navigate('PetDetail', { petId: pet.id });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{t('pets.noPets')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('pets.noPetsSubtitle')}
      </Text>
      <Button
        title={t('pets.addAnimal')}
        onPress={handleAddPet}
        style={styles.emptyButton}
      />
    </View>
  );

  const renderPetCard = (pet: Pet) => (
    <TouchableOpacity
      key={pet.id}
      style={styles.petCard}
      onPress={() => handlePetPress(pet)}
    >
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petSpecies}>{pet.species}</Text>
        {pet.breed && <Text style={styles.petBreed}>{pet.breed}</Text>}
      </View>
      <View style={styles.petMeta}>
        <Text style={styles.petDate}>
          {t('pets.addedOn')} {new Date(pet.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.padding.screen,
      paddingBottom: theme.spacing.lg,
    },
    title: {
      ...theme.typography.styles.h2,
      color: theme.colors.text.primary,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContainer: {
      flex: 1,
      padding: theme.spacing.padding.screen,
    },
    petCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.spacing.radius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    petInfo: {
      marginBottom: theme.spacing.sm,
    },
    petName: {
      ...theme.typography.styles.h4,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    petSpecies: {
      ...theme.typography.styles.body,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    petBreed: {
      ...theme.typography.styles.bodySmall,
      color: theme.colors.text.tertiary,
    },
    petMeta: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
    },
    petDate: {
      ...theme.typography.styles.caption,
      color: theme.colors.text.tertiary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing['3xl'],
    },
    emptyTitle: {
      ...theme.typography.styles.h3,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    emptySubtitle: {
      ...theme.typography.styles.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing['2xl'],
    },
    emptyButton: {
      minWidth: 200,
    },
    errorContainer: {
      padding: theme.spacing.lg,
      margin: theme.spacing.padding.screen,
      backgroundColor: theme.colors.status.error + '20',
      borderRadius: theme.spacing.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.status.error,
    },
    errorText: {
      ...theme.typography.styles.body,
      color: theme.colors.status.error,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('pets.myPets')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {pets.length === 0 && !isLoading ? (
          renderEmptyState()
        ) : (
          pets.map(renderPetCard)
        )}
      </ScrollView>
    </View>
  );
};