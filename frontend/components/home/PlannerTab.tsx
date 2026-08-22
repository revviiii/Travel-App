import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
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
  const iconName = label.toLowerCase().includes('group')
    ? 'people-outline'
    : label.toLowerCase().includes('itinerary')
      ? 'map-outline'
      : label.toLowerCase().includes('goal')
        ? 'flag-outline'
        : 'options-outline';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
    >
      <Ionicons
        color={active ? AutumnColors.selectedTabText : AutumnColors.chipText}
        name={iconName}
        size={18}
      />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    gap: 7,
    minHeight: 40,
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
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  labelActive: {
    color: AutumnColors.selectedTabText,
  },
});
