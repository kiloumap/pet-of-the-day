import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Check, Heart, PawPrint } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Pet } from '../types/api';
import { useTranslation } from '../hooks';

interface PetCheckboxSelectorProps {
  pets: Pet[];
  selectedPetIds: string[];
  onSelectionChange: (petIds: string[]) => void;
  title?: string;
  selectAllByDefault?: boolean;
  disabled?: boolean;
}

const PetCheckboxSelector: React.FC<PetCheckboxSelectorProps> = ({
  pets,
  selectedPetIds,
  onSelectionChange,
  title,
  selectAllByDefault = false,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Initialize with all pets selected if selectAllByDefault is true and no pets are selected
  React.useEffect(() => {
    if (selectAllByDefault && selectedPetIds.length === 0 && pets.length > 0) {
      onSelectionChange(pets.map(pet => pet.id));
    }
  }, [selectAllByDefault, selectedPetIds.length, pets, onSelectionChange]);

  const togglePet = (petId: string) => {
    if (disabled) return;

    if (selectedPetIds.includes(petId)) {
      onSelectionChange(selectedPetIds.filter(id => id !== petId));
    } else {
      onSelectionChange([...selectedPetIds, petId]);
    }
  };

  const toggleSelectAll = () => {
    if (disabled) return;

    if (selectedPetIds.length === pets.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(pets.map(pet => pet.id));
    }
  };

  const getSpeciesIcon = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return '🐕';
      case 'cat':
        return '🐱';
      default:
        return '🐾';
    }
  };

  const getSpeciesName = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return t('pets.species.dog');
      case 'cat':
        return t('pets.species.cat');
      default:
        return species;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 16,
    },
    selectAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      marginBottom: 16,
      gap: 12,
    },
    selectAllText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.primary,
    },
    petsList: {
      maxHeight: 300,
    },
    petItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    petItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}20`,
    },
    petItemDisabled: {
      backgroundColor: theme.colors.background.tertiary,
      opacity: 0.6,
    },
    petInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    petIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    speciesEmoji: {
      fontSize: 20,
    },
    petDetails: {
      flex: 1,
    },
    petName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    petSpecies: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    checkboxDisabled: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background.tertiary,
    },
    selectionSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: `${theme.colors.secondary}20`,
      borderRadius: 8,
      marginTop: 16,
      gap: 8,
    },
    summaryText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.secondary,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    disabledText: {
      color: theme.colors.text.tertiary,
    },
  });

  if (pets.length === 0) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyState}>
          <PawPrint size={48} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyText}>{t('pets.noPets')}</Text>
          <Text style={styles.emptySubtext}>{t('pets.noPetsSubtitle')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      {pets.length > 1 && (
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={toggleSelectAll}
          disabled={disabled}
        >
          <View style={[
            styles.checkbox,
            selectedPetIds.length === pets.length && styles.checkboxSelected,
            disabled && styles.checkboxDisabled,
          ]}>
            {selectedPetIds.length === pets.length && (
              <Check size={16} color="#ffffff" />
            )}
          </View>
          <Text style={[styles.selectAllText, disabled && styles.disabledText]}>
            {selectedPetIds.length === pets.length ? t('common.deselectAll') : t('common.selectAll')}
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.petsList} showsVerticalScrollIndicator={false}>
        {pets.map((pet) => {
          const isSelected = selectedPetIds.includes(pet.id);

          return (
            <TouchableOpacity
              key={pet.id}
              style={[
                styles.petItem,
                isSelected && styles.petItemSelected,
                disabled && styles.petItemDisabled,
              ]}
              onPress={() => togglePet(pet.id)}
              disabled={disabled}
            >
              <View style={styles.petInfo}>
                <View style={styles.petIcon}>
                  <Text style={styles.speciesEmoji}>{getSpeciesIcon(pet.species)}</Text>
                </View>
                <View style={styles.petDetails}>
                  <Text style={[styles.petName, disabled && styles.disabledText]}>
                    {pet.name}
                  </Text>
                  <Text style={[styles.petSpecies, disabled && styles.disabledText]}>
                    {getSpeciesName(pet.species)}
                    {pet.breed && ` • ${pet.breed}`}
                  </Text>
                </View>
              </View>

              <View style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
                disabled && styles.checkboxDisabled,
              ]}>
                {isSelected && <Check size={16} color="#ffffff" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedPetIds.length > 0 && (
        <View style={styles.selectionSummary}>
          <Heart size={16} color={theme.colors.secondary} />
          <Text style={styles.summaryText}>
            {selectedPetIds.length} {selectedPetIds.length === 1 ? t('pets.petSelected') : t('pets.petsSelected')}
          </Text>
        </View>
      )}
    </View>
  );
};

export default PetCheckboxSelector;