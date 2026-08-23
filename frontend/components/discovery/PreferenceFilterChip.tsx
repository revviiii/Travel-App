import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';
import { PREFERENCE_ICONS } from '@/components/onboarding/PreferenceChip';

interface PreferenceFilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  /** When provided, renders this image/SVG via expo-image (e.g. group-ic.svg) */
  iconSource?: ImageSource;
  /** Preference category ID — resolves to a MaterialCommunityIcons icon */
  preferenceId?: string;
}

/**
 * A Discovery quick-filter chip.
 * Icon priority:
 * 1. iconSource (explicit image/SVG) — used for Group/Trip selectors
 * 2. preferenceId → PREFERENCE_ICONS mapping → MaterialCommunityIcons
 * 3. Fallback placeholder dot (only if neither is provided)
 */
export function PreferenceFilterChip({
  label,
  active,
  onPress,
  iconSource,
  preferenceId,
}: PreferenceFilterChipProps) {
  const iconColor = active ? AutumnColors.filterChipText : AutumnColors.body;

  const renderIcon = () => {
    if (iconSource) {
      return (
        <Image
          source={iconSource}
          style={styles.iconImage}
          contentFit="contain"
          tintColor={iconColor}
        />
      );
    }

    if (preferenceId) {
      const iconName = PREFERENCE_ICONS[preferenceId] ?? 'map-marker-outline';
      return (
        <MaterialCommunityIcons
          name={iconName}
          size={16}
          color={iconColor}
        />
      );
    }

    // Fallback placeholder
    return (
      <View style={[styles.iconPlaceholder, active && styles.iconPlaceholderActive]} />
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} filter`}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      {renderIcon()}
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
  iconImage: {
    width: 18,
    height: 18,
  },
  iconPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AutumnColors.chipBorder,
  },
  iconPlaceholderActive: {
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
