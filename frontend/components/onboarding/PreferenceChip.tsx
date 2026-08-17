import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface PreferenceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * A selectable preference chip used in the Travel Preference screen.
 * Displays an icon placeholder and a label. Toggles between selected/unselected states.
 */
export function PreferenceChip({ label, selected, onPress }: PreferenceChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${selected ? 'selected' : 'not selected'}`}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipNormal,
      ]}
    >
      {/* TODO: Replace with final Figma SVG preference icon */}
      <View
        style={[
          styles.iconPlaceholder,
          selected && styles.iconPlaceholderSelected,
        ]}
      />

      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    borderWidth: 1.5,
    gap: 8,
  },
  chipNormal: {
    backgroundColor: AutumnColors.chipBackground,
    borderColor: AutumnColors.chipBorder,
  },
  chipSelected: {
    backgroundColor: AutumnColors.selectedBackground,
    borderColor: AutumnColors.selectedBorder,
  },
  iconPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
  },
  iconPlaceholderSelected: {
    backgroundColor: AutumnColors.selectedText,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.chipText,
    flexShrink: 1,
  },
  labelSelected: {
    color: AutumnColors.selectedText,
  },
});
