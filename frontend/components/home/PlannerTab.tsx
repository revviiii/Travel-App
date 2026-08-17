import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface PlannerTabProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/**
 * A selectable planner tab button used in the Home screen.
 * Displays an icon placeholder and label. Active state uses olive green.
 */
export function PlannerTab({ label, active, onPress }: PlannerTabProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
    >
      {/* TODO: Replace with final Figma SVG icon */}
      <View style={[styles.iconPlaceholder, active && styles.iconActive]} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  tabInactive: {
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
  },
  tabActive: {
    backgroundColor: AutumnColors.secondaryAccent,
    borderWidth: 1,
    borderColor: AutumnColors.secondaryAccent,
  },
  iconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
  },
  iconActive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
