import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AutumnColors } from '@/constants/colors';

type PreferenceIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const PREFERENCE_ICONS: Record<string, PreferenceIconName> = {
  outdoors: 'compass-outline',
  adventure: 'compass-outline',
  city: 'city-variant-outline',
  'city-breaks': 'city-variant-outline',
  culture: 'bank-outline',
  'cultural-exploration': 'bank-outline',
  beaches: 'beach',
  'beach-vacations': 'beach',
  nature: 'pine-tree',
  'nature-escapes': 'pine-tree',
  roadtrips: 'car-outline',
  'road-trips': 'car-outline',
  food: 'silverware-fork-knife',
  'food-tourism': 'silverware-fork-knife',
  gym: 'dumbbell',
  bar: 'glass-cocktail',
  shopping: 'shopping-outline',
  skiing: 'ski',
  'skiing-snowboarding': 'ski',
  retreats: 'meditation',
  'retreats-profile': 'meditation',
  spa: 'spa-outline',
  'spa-getaways': 'spa-outline',
  wine: 'glass-wine',
  'historical-sites': 'castle',
  'music-festivals': 'music-note-outline',
  'art-gallery': 'palette-outline',
  'culinary-tours': 'chef-hat',
  'group-tours': 'account-group-outline',
  'water-activity': 'swim',
  'bus-hop-on-hop': 'bus',
  'cruise-vacations': 'ferry',
  'solo-travel': 'account-outline',
  'eco-tourism': 'leaf',
  'desert-adventures': 'cactus',
  'fishing-tour': 'fish',
};

interface PreferenceChipProps {
  label: string;
  onPress: () => void;
  preferenceId: string;
  selected: boolean;
  showIcon?: boolean;
}

/** Shared travel-preference chip used by onboarding and profile settings. */
export function PreferenceChip({
  label,
  onPress,
  preferenceId,
  selected,
  showIcon = true,
}: PreferenceChipProps) {
  const icon = PREFERENCE_ICONS[preferenceId] ?? 'map-marker-outline';

  return (
    <TouchableOpacity
      accessibilityLabel={`${label}, ${selected ? 'selected' : 'not selected'}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipNormal]}
    >
      {showIcon ? (
        <MaterialCommunityIcons
          color={selected ? AutumnColors.selectedText : AutumnColors.body}
          name={icon}
          size={18}
        />
      ) : null}
      <Text numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    maxWidth: '100%',
    borderWidth: 1.5,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipNormal: {
    borderColor: AutumnColors.chipBorder,
    backgroundColor: AutumnColors.chipBackground,
  },
  chipSelected: {
    borderColor: AutumnColors.selectedBorder,
    backgroundColor: AutumnColors.selectedBackground,
  },
  label: {
    flexShrink: 1,
    color: AutumnColors.chipText,
    fontSize: 14,
    fontWeight: '500',
  },
  labelSelected: {
    color: AutumnColors.selectedText,
  },
});
