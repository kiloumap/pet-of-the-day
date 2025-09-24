import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { Pet } from '../../types/api';

interface PetOfTheDayCardProps {
  pet?: Pet;
}

const PetOfTheDayCard: React.FC<PetOfTheDayCardProps> = ({ pet }) => {
  const { theme } = useTheme();

  if (!pet) return null;

  const styles = StyleSheet.create({
    container: {
      margin: 16,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    gradient: {
      padding: 24,
      position: 'relative',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    petInfo: {
      fontSize: 18,
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    breed: {
      fontSize: 14,
      color: theme.colors.text.primary,
      opacity: 0.9,
    },
    emoji: {
      fontSize: 48,
      color: theme.colors.text.primary,
    },
    sparkle: {
      position: 'absolute',
      right: -16,
      bottom: -16,
      fontSize: 64,
      color: theme.colors.text.primary,
      opacity: 0.2,
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>🏆 Pet of the Day</Text>
            <Text style={styles.petInfo}>
              {pet.name} - {pet.points ?? 0} pts
            </Text>
            <Text style={styles.breed}>{pet.breed}</Text>
          </View>
          <Text style={styles.emoji}>🐕</Text>
        </View>
        <Text style={styles.sparkle}>✨</Text>
      </LinearGradient>
    </View>
  );
};

export { PetOfTheDayCard };