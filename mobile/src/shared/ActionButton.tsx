import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Action } from '@/types';

interface ActionButtonProps {
  action: Action;
  onPress: () => void;
  finalPoints?: number;
  showOriginalPoints?: boolean;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
                                                     action,
                                                     onPress,
                                                     finalPoints,
                                                     showOriginalPoints,
                                                     disabled = false
                                                   }) => {
  const pointsToShow = finalPoints !== undefined ? finalPoints : action.points;

  return (
      <TouchableOpacity
          style={[
            styles.container,
            disabled && styles.disabled
          ]}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.7}
      >
        <View style={styles.left}>
          <Text style={styles.icon}>{action.icon}</Text>
          <Text style={styles.text}>{action.text}</Text>
        </View>
        <View style={styles.pointsContainer}>
          {showOriginalPoints && finalPoints !== action.points && (
              <Text style={styles.originalPoints}>
                {action.points > 0 ? '+' : ''}{action.points}
              </Text>
          )}
          <Text
              style={[
                styles.points,
                pointsToShow > 0 ? styles.positivePoints : styles.negativePoints,
              ]}
          >
            {pointsToShow > 0 ? '+' : ''}{pointsToShow}
          </Text>
        </View>
      </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    marginVertical: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  originalPoints: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positivePoints: {
    color: '#059669',
  },
  negativePoints: {
    color: '#dc2626',
  },
});

export default ActionButton;