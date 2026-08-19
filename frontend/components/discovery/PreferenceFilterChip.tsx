import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface PreferenceFilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/**
 * A Discovery quick-filter chip.
 * Larger rounded pill shape matching the Figma reference.
 * Active: warm yellow background + brown text.
 * Inactive: cream background + muted border + normal text (still selectable, not disabled).
 * Includes a placeholder for the future SVG icon on the left.
 */
export function PreferenceFilterChip({ label, active, onPress }: PreferenceFilterChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} filter`}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      {/* TODO: Replace with final Figma preference SVG icon */}
      <View style={[styles.iconPlaceholder, active && styles.iconActive]} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    gap: 7,
    borderWidth: 1,
  },
  chipInactive: {
    backgroundColor: AutumnColors.chipBackground,
    borderColor: AutumnColors.chipBorder,
  },
  chipActive: {
    backgroundColor: AutumnColors.filterChipBackground,
    borderColor: AutumnColors.filterChipBackground,
  },
  iconPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AutumnColors.chipBorder,
  },
  iconActive: {
    backgroundColor: AutumnColors.filterChipText,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  labelActive: {
    color: AutumnColors.filterChipText,
  },
});
