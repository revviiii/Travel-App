import { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AutumnColors } from '@/constants/colors';
import { PREFERENCE_CATEGORIES } from '@/constants/preferences';
import { PreferenceChip } from '@/components/onboarding/PreferenceChip';

const MAX_FILTERS = 4;

interface DiscoveryFilterPanelProps {
  visible: boolean;
  /** Current active Discovery filters — used to initialize the temporary selection */
  currentFilters: Set<string>;
  onApply: (filters: Set<string>) => void;
  onCancel: () => void;
}

/**
 * A modal panel for selecting Discovery preference filters.
 * Maintains a temporary selection while open.
 * - Opening initializes from currentFilters (the currently applied Discovery filters).
 * - Cancel discards changes.
 * - Apply Filters commits the temporary selection.
 * - Maximum of 4 filters enforced.
 *
 * This does NOT modify the user's permanent PreferenceContext preferences.
 * // TODO: Replace local filtering with recommendation API filtering
 */
export function DiscoveryFilterPanel({
  visible,
  currentFilters,
  onApply,
  onCancel,
}: DiscoveryFilterPanelProps) {
  const [tempSelection, setTempSelection] = useState<Set<string>>(new Set(currentFilters));

  // Re-initialize temp selection from currentFilters each time the panel opens
  useEffect(() => {
    if (visible) {
      setTempSelection(new Set(currentFilters));
    }
  }, [visible, currentFilters]);

  const toggleCategory = (id: string) => {
    setTempSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_FILTERS) {
        next.add(id);
      }
      // At max and trying to add → no-op
      return next;
    });
  };

  const handleApply = () => {
    onApply(new Set(tempSelection));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {/* Header */}
          <Text style={styles.title}>Filter your interests</Text>
          <Text style={styles.description}>
            {'Choose what you\'d like to discover.'}
          </Text>

          {/* Counter */}
          <Text style={styles.counter}>
            {tempSelection.size} / {MAX_FILTERS} selected
          </Text>

          {/* Category chips */}
          <ScrollView
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
          >
            {PREFERENCE_CATEGORIES.map((cat) => (
              <PreferenceChip
                key={cat.id}
                label={cat.label}
                preferenceId={cat.id}
                selected={tempSelection.has(cat.id)}
                onPress={() => toggleCategory(cat.id)}
              />
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel="Apply Filters"
              style={styles.applyButton}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
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
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: AutumnColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AutumnColors.heading,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: AutumnColors.body,
    lineHeight: 20,
    marginBottom: 12,
  },
  counter: {
    fontSize: 12,
    fontWeight: '400',
    color: AutumnColors.body,
    textAlign: 'right',
    marginBottom: 12,
  },
  scrollArea: {
    flexShrink: 1,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 12,
    alignItems: 'flex-start',
    paddingBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  applyButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: AutumnColors.primary,
  },
  applyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
