import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { Pet } from '../../../types';

interface PetOfTheDayCardProps {
  winner?: Pet;
}

const PetOfTheDayCard: React.FC<PetOfTheDayCardProps> = ({ winner }) => {
  const { theme } = useTheme();

  if (!winner) return null;

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
      color: 'white',
      marginBottom: 8,
    },
    petInfo: {
      fontSize: 18,
      color: 'white',
      marginBottom: 4,
    },
    breed: {
      fontSize: 14,
      color: 'white',
      opacity: 0.9,
    },
    emoji: {
      fontSize: 48,
      color: 'white',
    },
    sparkle: {
      position: 'absolute',
      right: -16,
      bottom: -16,
      fontSize: 64,
      color: 'white',
      opacity: 0.2,
    },
  });

  return (
      <View style={styles.container}>
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>🏆 Pet of the Day</Text>
              <Text style={styles.petInfo}>{winner.name} - {winner.points} pts</Text>
              <Text style={styles.breed}>{winner.breed}</Text>
            </View>
            <Text style={styles.emoji}>{winner.image}</Text>
          </View>
          <Text style={styles.sparkle}>✨</Text>
        </LinearGradient>
      </View>
  );
};

export default PetOfTheDayCard;