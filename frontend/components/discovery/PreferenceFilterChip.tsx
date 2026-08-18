import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface PreferenceFilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/**
 * A filter chip for the Discovery preferences section.
 * Active state uses olive green background matching the planner tab style.
 * Includes a placeholder for the future SVG icon.
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
      {/* TODO: Replace with final Figma SVG icon */}
      <View style={[styles.iconPlaceholder, active && styles.iconActive]} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  chipInactive: {
    backgroundColor: AutumnColors.chipBackground,
    borderColor: AutumnColors.chipBorder,
  },
  chipActive: {
    backgroundColor: AutumnColors.secondaryAccent,
    borderColor: AutumnColors.secondaryAccent,
  },
  iconPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: AutumnColors.chipBorder,
  },
  iconActive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
