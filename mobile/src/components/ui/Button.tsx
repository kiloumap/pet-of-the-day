import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large' | 'sm';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  testID,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.spacing.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const normalizedSize = size === 'sm' ? 'small' : size;
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        height: 36,
        paddingHorizontal: theme.spacing.md,
      },
      medium: {
        height: theme.spacing.height.button,
        paddingHorizontal: theme.spacing.lg,
      },
      large: {
        height: 56,
        paddingHorizontal: theme.spacing.xl,
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? theme.colors.text.tertiary : theme.colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? theme.colors.text.tertiary : theme.colors.accent,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? theme.colors.text.tertiary : theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[normalizedSize],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...theme.typography.styles.button,
      textAlign: 'center',
    };

    const variantTextStyles: Record<string, TextStyle> = {
      primary: {
        color: '#FFFFFF',
      },
      secondary: {
        color: '#FFFFFF',
      },
      outline: {
        color: disabled ? theme.colors.text.tertiary : theme.colors.primary,
      },
      ghost: {
        color: disabled ? theme.colors.text.tertiary : theme.colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...variantTextStyles[variant],
    };
  };

  const content = children || title;

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : theme.colors.primary}
          style={{ marginRight: 8 }}
        />
      )}
      {icon && !loading && <View style={{ marginRight: 8 }}>{icon}</View>}
      {typeof content === 'string' ? (
        <Text style={[getTextStyle(), textStyle]}>
          {content}
        </Text>
      ) : (
        content
      )}
    </TouchableOpacity>
  );
};