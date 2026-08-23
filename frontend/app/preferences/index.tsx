import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { PREFERENCE_CATEGORIES } from '@/constants/preferences';
import { PreferenceChip } from '@/components/onboarding/PreferenceChip';
import { usePreferences } from '@/contexts/PreferenceContext';
import { replaceMyPreferences, updateMyProfile } from '@/lib/api';

const MAX_ONBOARDING_PREFERENCES = 4;

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedPreferences, togglePreference } = usePreferences();
  const [isSaving, setIsSaving] = useState(false);

  const saveAndContinue = async (preferenceKeys: string[]) => {
    setIsSaving(true);
    try {
      await Promise.all([
        replaceMyPreferences(preferenceKeys),
        updateMyProfile({ onboarding_completed: true }),
      ]);
      router.replace('/home');
    } catch (error) {
      Alert.alert(
        'Unable to save preferences',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = () => void saveAndContinue([...selectedPreferences]);
  const canContinue =
    selectedPreferences.size >= 1
    && selectedPreferences.size <= MAX_ONBOARDING_PREFERENCES
    && !isSaving;

  const handleTogglePreference = (id: string) => {
    if (
      !selectedPreferences.has(id)
      && selectedPreferences.size >= MAX_ONBOARDING_PREFERENCES
    ) {
      return; // silently block fifth selection — counter communicates the limit
    }
    togglePreference(id);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header} />

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <Text style={styles.heading}>Your Preference</Text>

        {/* Description + selection hint */}
        <Text style={styles.description}>
          {'Share your travel preferences, and we\'ll craft your perfect trip.'}
        </Text>
        <Text style={styles.selectionHint}>Choose up to {MAX_ONBOARDING_PREFERENCES} interests</Text>
        <Text style={styles.counter}>
          {selectedPreferences.size} / {MAX_ONBOARDING_PREFERENCES} selected
        </Text>

        {/* Preference chips — flex-wrap flow layout */}
        <View style={styles.grid}>
          {PREFERENCE_CATEGORIES.map((pref) => (
            <PreferenceChip
              key={pref.id}
              label={pref.label}
              preferenceId={pref.id}
              selected={selectedPreferences.has(pref.id)}
              onPress={() => handleTogglePreference(pref.id)}
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
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          disabled={!canContinue}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>Continue</Text>
          )}
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 20,
    marginBottom: 8,
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
    paddingHorizontal: 8,
  },

  /* Selection hint */
  selectionHint: {
    fontSize: 13,
    fontWeight: '500',
    color: AutumnColors.body,
    textAlign: 'center',
    marginTop: 6,
  },

  /* Counter */
  counter: {
    fontSize: 12,
    fontWeight: '400',
    color: AutumnColors.body,
    textAlign: 'right',
    marginTop: 10,
    marginBottom: 16,
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
  continueButtonDisabled: {
    opacity: 0.45,
  },
});
