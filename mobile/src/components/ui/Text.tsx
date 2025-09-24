import React from 'react';
import { Text as RNText, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme';

interface TextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label' | 'button';
  color?: 'primary' | 'secondary' | 'tertiary' | 'white' | 'error' | 'success' | 'warning';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  style?: StyleProp<TextStyle>;
  onPress?: () => void;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  weight,
  align = 'left',
  numberOfLines,
  ellipsizeMode,
  style,
  onPress,
}) => {
  const { theme } = useTheme();

  const getVariantStyle = (): TextStyle => {
    const variantStyles: Record<string, TextStyle> = {
      h1: {
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 34,
      },
      h2: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 30,
      },
      h3: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 26,
      },
      body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 22,
      },
      caption: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 18,
      },
      label: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
      },
      button: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 20,
      },
    };

    return variantStyles[variant] || variantStyles.body;
  };

  const getColorStyle = (): TextStyle => {
    const colorStyles: Record<string, TextStyle> = {
      primary: {
        color: theme.colors.text.primary,
      },
      secondary: {
        color: theme.colors.text.secondary,
      },
      tertiary: {
        color: theme.colors.text.tertiary,
      },
      white: {
        color: '#FFFFFF',
      },
      error: {
        color: theme.colors.error,
      },
      success: {
        color: theme.colors.success,
      },
      warning: {
        color: theme.colors.warning,
      },
    };

    return colorStyles[color] || colorStyles.primary;
  };

  const getWeightStyle = (): TextStyle => {
    if (!weight) return {};

    const weightStyles: Record<string, TextStyle> = {
      normal: { fontWeight: '400' },
      medium: { fontWeight: '500' },
      semibold: { fontWeight: '600' },
      bold: { fontWeight: '700' },
    };

    return weightStyles[weight] || {};
  };

  const getAlignStyle = (): TextStyle => {
    return {
      textAlign: align,
    };
  };

  const combinedStyle: TextStyle = {
    ...getVariantStyle(),
    ...getColorStyle(),
    ...getWeightStyle(),
    ...getAlignStyle(),
  };

  return (
    <RNText
      style={[combinedStyle, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      onPress={onPress}
    >
      {children}
    </RNText>
  );
};

export default Text;