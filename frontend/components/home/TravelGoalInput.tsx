import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { AutumnColors } from '@/constants/colors';

const sendIcon = require('@/assets/images/goals-send-ic.svg');

const MAX_CHARACTERS = 100;

interface TravelGoalInputProps {
  onAdd: (goal: string) => void | Promise<void>;
}

/**
 * Input field for adding a new travel goal.
 * Enforces a 100-character limit and shows a live character counter.
 */
export function TravelGoalInput({ onAdd }: TravelGoalInputProps) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (canSubmit) {
      setIsSubmitting(true);
      try {
        await onAdd(trimmed);
        setValue('');
      } catch {
        // The parent displays the API error and the input stays available for retry.
      } finally {
        setIsSubmitting(false);
      }
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
          <Image source={sendIcon} style={styles.sendIcon} contentFit="contain" />
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
  sendIcon: {
    width: 16,
    height: 16,
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
