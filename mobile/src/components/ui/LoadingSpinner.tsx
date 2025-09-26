import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'small',
  color,
  style
}) => {
  const { theme } = useTheme();

  const spinnerColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={spinnerColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;