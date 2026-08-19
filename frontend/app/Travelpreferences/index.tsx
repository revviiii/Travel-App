import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { PROFILE_TRAVEL_PREFERENCES } from '@/constants/preferences';
import { usePreferences } from '@/contexts/PreferenceContext';

const DEFAULT_PREFERENCES = ['adventure', 'wine', 'nature-escapes', 'food-tourism'];

type CategoryIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const CATEGORY_ICONS: Record<string, CategoryIconName> = {
  adventure: 'compass-outline',
  'city-breaks': 'city-variant-outline',
  'cultural-exploration': 'bank-outline',
  wine: 'glass-wine',
  'beach-vacations': 'beach',
  'nature-escapes': 'pine-tree',
  'road-trips': 'car-outline',
  'food-tourism': 'silverware-fork-knife',
  'historical-sites': 'castle',
  'music-festivals': 'music-note-outline',
  'art-gallery': 'palette-outline',
  'culinary-tours': 'chef-hat',
  'group-tours': 'account-group-outline',
  'skiing-snowboarding': 'ski',
  'retreats-profile': 'meditation',
  'water-activity': 'swim',
  'bus-hop-on-hop': 'bus',
  'cruise-vacations': 'ferry',
  'solo-travel': 'account-outline',
  'eco-tourism': 'leaf',
  'spa-getaways': 'spa-outline',
  'desert-adventures': 'cactus',
  'fishing-tour': 'fish',
};

export default function TravelPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { maxPreferences, selectedPreferences, setPreferences } = usePreferences();
  const [draftPreferences, setDraftPreferences] = useState<Set<string>>(() => {
    const availableIds = new Set(PROFILE_TRAVEL_PREFERENCES.map((item) => item.id));
    const currentProfilePreferences = [...selectedPreferences].filter((id) => availableIds.has(id));
    return new Set(currentProfilePreferences.length ? currentProfilePreferences : DEFAULT_PREFERENCES);
  });

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/Userprofile');
  };

  const togglePreference = (id: string) => {
    setDraftPreferences((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxPreferences) {
        next.add(id);
      } else {
        Alert.alert('Selection limit', `Choose up to ${maxPreferences} travel preferences.`);
      }
      return next;
    });
  };

  const handleSave = () => {
    setPreferences(draftPreferences);
    Alert.alert('Preferences saved', 'Your travel preferences have been updated.');
  };

  return (
    <View style={styles.viewport}>
      <View style={styles.mobileFrame}>
        <StatusBar style="dark" />

        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 12,
              paddingLeft: insets.left + 20,
              paddingRight: insets.right + 20,
            },
          ]}
        >
          <TouchableOpacity
            accessibilityLabel="Go back"
            accessibilityRole="button"
            activeOpacity={0.7}
            hitSlop={8}
            onPress={handleBack}
            style={styles.backButton}
          >
            <Ionicons color={AutumnColors.heading} name="arrow-back" size={21} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Travel Preferences</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          bounces
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingLeft: insets.left + 24,
              paddingRight: insets.right + 24,
            },
          ]}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={styles.preferenceScroll}
        >
          <Text style={styles.description}>
            This is your current travel preferences. You can customize this by adding and removing.
          </Text>
          <Text style={styles.selectionHint}>Choose up to {maxPreferences} interests</Text>
          <Text style={styles.counter}>
            {draftPreferences.size} / {maxPreferences} selected
          </Text>

          <View style={styles.grid}>
            {PROFILE_TRAVEL_PREFERENCES.map((preference) => (
              <TravelPreferenceChip
                key={preference.id}
                icon={CATEGORY_ICONS[preference.id] ?? 'map-marker-outline'}
                label={preference.label}
                onPress={() => togglePreference(preference.id)}
                selected={draftPreferences.has(preference.id)}
              />
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomArea,
            {
              paddingBottom: insets.bottom + 16,
              paddingLeft: insets.left + 24,
              paddingRight: insets.right + 24,
            },
          ]}
        >
          <TouchableOpacity
            accessibilityLabel="Save travel preferences"
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={handleSave}
            style={styles.saveButton}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

type TravelPreferenceChipProps = {
  icon: CategoryIconName;
  label: string;
  onPress: () => void;
  selected: boolean;
};

function TravelPreferenceChip({ icon, label, onPress, selected }: TravelPreferenceChipProps) {
  return (
    <TouchableOpacity
      accessibilityLabel={`${label}, ${selected ? 'selected' : 'not selected'}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipDefault]}
    >
      <MaterialCommunityIcons
        color={selected ? AutumnColors.selectedText : AutumnColors.body}
        name={icon}
        size={18}
      />
      <Text numberOfLines={1} style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: AutumnColors.background,
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 414,
    backgroundColor: AutumnColors.background,
  },
  header: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSide: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    flex: 1,
    color: AutumnColors.heading,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  preferenceScroll: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 32,
  },
  description: {
    color: AutumnColors.body,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  selectionHint: {
    marginTop: 6,
    color: AutumnColors.body,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  counter: {
    marginTop: 12,
    marginBottom: 16,
    color: AutumnColors.body,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    columnGap: 10,
    rowGap: 14,
  },
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
  chipDefault: {
    borderColor: AutumnColors.chipBorder,
    backgroundColor: AutumnColors.chipBackground,
  },
  chipSelected: {
    borderColor: AutumnColors.selectedBorder,
    backgroundColor: AutumnColors.selectedBackground,
  },
  chipLabel: {
    flexShrink: 1,
    color: AutumnColors.chipText,
    fontSize: 14,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: AutumnColors.selectedText,
  },
  bottomArea: {
    paddingTop: 12,
    backgroundColor: AutumnColors.background,
  },
  saveButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AutumnColors.primary,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
