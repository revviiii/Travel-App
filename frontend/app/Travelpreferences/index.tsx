import { Ionicons } from '@expo/vector-icons';
import { router, type RelativePathString } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import {
  normalizePreferenceIds,
  PROFILE_TRAVEL_PREFERENCES,
} from '@/constants/preferences';
import { PreferenceChip } from '@/components/onboarding/PreferenceChip';
import { usePreferences } from '@/contexts/PreferenceContext';
import { getMyPreferences, replaceMyPreferences } from '@/lib/api';

export default function TravelPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { selectedPreferences, setPreferences } = usePreferences();
  const [draftPreferences, setDraftPreferences] = useState<Set<string>>(() => {
    const availableIds = new Set(PROFILE_TRAVEL_PREFERENCES.map((item) => item.id));
    const currentProfilePreferences = [...selectedPreferences].filter((id) => availableIds.has(id));
    return new Set(currentProfilePreferences);
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getMyPreferences()
      .then((preferences) => {
        if (!isCurrent) return;
        const normalized = normalizePreferenceIds(preferences);
        setDraftPreferences(new Set(normalized));
        setPreferences(normalized);
      })
      .catch((error) => {
        if (isCurrent) {
          Alert.alert(
            'Unable to load preferences',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [setPreferences]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/Userprofile' as RelativePathString);
  };

  const togglePreference = (id: string) => {
    setDraftPreferences((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await replaceMyPreferences([...draftPreferences]);
      const normalized = normalizePreferenceIds(saved);
      setPreferences(normalized);
      setDraftPreferences(new Set(normalized));
      Alert.alert('Preferences saved', 'Your travel preferences have been updated.');
    } catch (error) {
      Alert.alert(
        'Unable to save preferences',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
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
          <Text style={styles.selectionHint}>Choose any interests that match your travel style</Text>
          <Text style={styles.counter}>
            {draftPreferences.size} selected · no limit
          </Text>

          {isLoading ? <ActivityIndicator color={AutumnColors.primary} /> : <View style={styles.grid}>
            {PROFILE_TRAVEL_PREFERENCES.map((preference) => (
              <PreferenceChip
                key={preference.id}
                label={preference.label}
                onPress={() => togglePreference(preference.id)}
                preferenceId={preference.id}
                selected={draftPreferences.has(preference.id)}
              />
            ))}
          </View>}
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
            disabled={isLoading || isSaving}
            onPress={() => void handleSave()}
            style={styles.saveButton}
          >
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
