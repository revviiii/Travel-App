import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

const MAX_CHARACTERS = 100;

interface TravelGoalInputProps {
  onAdd: (goal: string) => void;
}

/**
 * Input field for adding a new travel goal.
 * Enforces a 100-character limit and shows a live character counter.
 */
export function TravelGoalInput({ onAdd }: TravelGoalInputProps) {
  const [value, setValue] = useState('');

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0;

  const handleSubmit = () => {
    if (canSubmit) {
      onAdd(trimmed);
      setValue('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          maxLength={MAX_CHARACTERS}
          placeholder="Add a travel goal..."
          placeholderTextColor={AutumnColors.body}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          accessibilityLabel="Travel goal input"
          accessibilityHint="Enter a travel goal, maximum 100 characters"
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Add goal"
          style={[styles.addButton, !canSubmit && styles.addButtonDisabled]}
        >
          {/* TODO: Replace with final Figma SVG icon */}
          <View style={styles.addIconPlaceholder} />
        </TouchableOpacity>
      </View>
      <Text style={styles.counter}>
        {value.length} / {MAX_CHARACTERS}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: AutumnColors.chipText,
    paddingVertical: 10,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AutumnColors.secondaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addIconPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  counter: {
    fontSize: 12,
    fontWeight: '400',
    color: AutumnColors.body,
    textAlign: 'right',
    marginTop: 4,
    paddingRight: 4,
  },
});
