import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AlertCircle } from 'lucide-react-native';

interface ErrorMessageProps {
  message?: string;
  visible?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  visible = true
}) => {
  const { theme } = useTheme();

  if (!message || !visible) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.error + '10',
      borderColor: theme.colors.error,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
    },
    icon: {
      marginRight: 8,
    },
    text: {
      color: theme.colors.error,
      fontSize: 14,
      flex: 1,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <AlertCircle
        size={16}
        color={theme.colors.error}
        style={styles.icon}
      />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};