import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

const MAX_NAME_LENGTH = 50;

interface CreateGroupModalProps {
  visible: boolean;
  onCancel: () => void;
  onCreate: (name: string) => void;
}

/**
 * Modal for creating a new travel group.
 * Enforces a 50-character name limit with a live counter.
 * Matches the autumn theme.
 */
export function CreateGroupModal({ visible, onCancel, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState('');

  const trimmed = name.trim();
  const canCreate = trimmed.length > 0;

  const handleCreate = () => {
    if (canCreate) {
      onCreate(trimmed);
      setName('');
    }
  };

  const handleCancel = () => {
    setName('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Create a Group</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Group name"
              placeholderTextColor={AutumnColors.body}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              accessibilityLabel="Group name input"
              accessibilityHint="Enter a group name, maximum 50 characters"
            />
          </View>

          <Text style={styles.counter}>
            {name.length} / {MAX_NAME_LENGTH}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={!canCreate}
              accessibilityRole="button"
              accessibilityLabel="Create Group"
              style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
            >
              <Text style={styles.createText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: AutumnColors.background,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AutumnColors.heading,
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: {
    fontSize: 15,
    color: AutumnColors.chipText,
    paddingVertical: 12,
  },
  counter: {
    fontSize: 12,
    fontWeight: '400',
    color: AutumnColors.body,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: AutumnColors.primary,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
