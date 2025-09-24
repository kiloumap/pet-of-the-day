import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ChevronDown, Check } from 'lucide-react-native';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  value?: string;
  selectedValue?: string;
  onSelect: (value: string) => void;
  error?: string;
  style?: any;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  selectedValue,
  onSelect,
  error,
  style
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const actualValue = selectedValue || value;
  const selectedOption = options.find(option => option.value === actualValue);

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setIsOpen(false);
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    dropdown: {
      borderWidth: 1,
      borderColor: error ? theme.colors.status.error : theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.background.primary,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 48,
    },
    dropdownText: {
      fontSize: 16,
      color: selectedOption ? theme.colors.text.primary : theme.colors.text.tertiary,
      flex: 1,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.status.error,
      marginTop: 4,
    },
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: 12,
      padding: 0,
      width: '80%',
      maxHeight: '60%',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    modalHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    optionsList: {
      maxHeight: 300,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionText: {
      fontSize: 16,
      color: theme.colors.text.primary,
      flex: 1,
    },
    selectedOption: {
      backgroundColor: theme.colors.primary + '10',
    },
    backdrop: {
      flex: 1,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownText}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={20} color={theme.colors.text.secondary} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={styles.modal}>
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label}</Text>
              </View>

              <FlatList
                data={options}
                style={styles.optionsList}
                keyExtractor={(item) => item.value}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      item.value === actualValue && styles.selectedOption,
                      index === options.length - 1 && { borderBottomWidth: 0 }
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text style={styles.optionText}>{item.label}</Text>
                    {item.value === actualValue && (
                      <Check size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};