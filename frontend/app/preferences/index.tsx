import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { PreferenceChip } from '@/components/onboarding/PreferenceChip';

// TODO: Redirect returning users directly to the main app when preferences are already completed

/**
 * Travel preference categories.
 * Easy to edit — just update this array when labels change.
 */
const PREFERENCES = [
  { id: 'outdoors', label: 'Outdoors' },
  { id: 'city', label: 'City Exploration' },
  { id: 'culture', label: 'Cultural & Heritage' },
  { id: 'beaches', label: 'Beaches' },
  { id: 'nature', label: 'Nature' },
  { id: 'roadtrips', label: 'Road Trips' },
  { id: 'food', label: 'Food & Culinary' },
  { id: 'gym', label: 'Gym' },
  { id: 'bar', label: 'Bar' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'skiing', label: 'Skiing/Snowboarding' },
  { id: 'retreats', label: 'Retreats' },
  { id: 'spa', label: 'SPA' },
] as const;

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const togglePreference = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    // TODO: Navigate to the next screen (main app / tabs) when available
  };

  const handleContinue = () => {
    // TODO: Persist selected preferences when backend integration is implemented
    // TODO: Navigate to the next screen (main app / tabs) when available
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          {/* TODO: Replace with final Figma back-arrow SVG */}
          <View style={styles.backIconPlaceholder} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip preferences"
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
          {/* TODO: Replace with final Figma skip-chevron SVG */}
          <View style={styles.chevronPlaceholder} />
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <Text style={styles.heading}>Your Preference</Text>

        {/* Description */}
        <Text style={styles.description}>
          Share your travel preferences, and we'll craft your perfect trip.
        </Text>

        {/* Preference chips — flex-wrap flow layout */}
        <View style={styles.grid}>
          {PREFERENCES.map((pref) => (
            <PreferenceChip
              key={pref.id}
              label={pref.label}
              selected={selected.has(pref.id)}
              onPress={() => togglePreference(pref.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue button — pinned to bottom */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          style={styles.continueButton}
        >
          <Text style={styles.continueText}>Continue</Text>
          {/* TODO: Replace with final Continue arrow SVG */}
          <View style={styles.continueArrowPlaceholder} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AutumnColors.background,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: AutumnColors.primary,
  },
  chevronPlaceholder: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: AutumnColors.chipBorder,
  },

  /* Scrollable content */
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  /* Heading */
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: AutumnColors.heading,
    textAlign: 'center',
    marginTop: 16,
  },

  /* Description */
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: AutumnColors.body,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  /* Chip flow layout — chips self-size to content, wrap naturally into rows */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 14,
    alignItems: 'flex-start',
  },

  /* Bottom continue button */
  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: AutumnColors.background,
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: AutumnColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueArrowPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginLeft: 8,
    position: 'absolute',
    right: 20,
  },
});
