import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  autoCorrect?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  required?: boolean;
  helpText?: string;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  autoCorrect = true,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  required = false,
  helpText,
  leftIcon,
  style,
  inputStyle,
  testID,
}) => {
  const { theme } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const showPassword = secureTextEntry && !isPasswordVisible;
  const hasError = !!error;

  const containerStyle: ViewStyle = {
    marginBottom: theme.spacing.lg,
  };

  const labelStyle: TextStyle = {
    ...theme.typography.styles.label,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: hasError
      ? theme.colors.status.error
      : isFocused
      ? theme.colors.primary
      : theme.colors.border,
    borderRadius: theme.spacing.radius.md,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.padding.input,
    height: multiline ? undefined : theme.spacing.height.input,
    minHeight: multiline ? theme.spacing.height.input : undefined,
  };

  const textInputStyle: TextStyle = {
    flex: 1,
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    paddingVertical: multiline ? theme.spacing.sm : 0,
  };

  const errorStyle: TextStyle = {
    ...theme.typography.styles.caption,
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
  };

  const iconStyle = {
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  };

  return (
    <View style={[containerStyle, style]}>
      {label && (
        <Text style={labelStyle}>
          {label}{required && <Text style={{ color: theme.colors.status.error }}> *</Text>}
        </Text>
      )}

      <View style={inputContainerStyle}>
        {leftIcon && <View style={{ marginRight: theme.spacing.sm }}>{leftIcon}</View>}
        <TextInput
          style={[textInputStyle, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          secureTextEntry={showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPasswordVisible ? (
              <EyeOff size={theme.spacing.iconSize.md} style={iconStyle} />
            ) : (
              <Eye size={theme.spacing.iconSize.md} style={iconStyle} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {hasError && <Text style={errorStyle}>{error}</Text>}
      {helpText && !hasError && (
        <Text style={[errorStyle, { color: theme.colors.text.secondary }]}>{helpText}</Text>
      )}
    </View>
  );
};