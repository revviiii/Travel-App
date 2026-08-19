import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';

export default function LocationSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    // TODO: Continue to authentication flow
    router.replace('/Login');
  };

  const handleAllowLocation = () => {
    // TODO: Request device location permission using Expo Location
    router.replace('/Login');
  };

  const handleSetLocation = () => {
    // TODO: Navigate to manual location selection
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          {/* TODO: Replace with final Figma Back arrow SVG */}
          <View style={styles.backIconPlaceholder} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip location setup"
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
          {/* TODO: Replace with final Figma Skip chevron SVG */}
          <View style={styles.skipChevronPlaceholder} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* TODO: Replace with exported Figma location illustration */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>LOCATION IMAGE</Text>
        </View>

        <Text style={styles.heading}>Turn on Location</Text>
        <Text style={styles.description}>
          We need to know your location in order to suggest nearby spots for your group.
        </Text>
      </View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleAllowLocation}
          accessibilityRole="button"
          accessibilityLabel="Allow Location Access"
        >
          <Text style={styles.primaryButtonText}>Allow Location Access</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSetLocation}
          accessibilityRole="button"
          accessibilityLabel="Set Location manually"
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Set Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AutumnColors.background,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 16,
    fontWeight: '500',
    color: AutumnColors.primary,
  },
  skipChevronPlaceholder: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: AutumnColors.chipBorder,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  imagePlaceholder: {
    width: '85%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    backgroundColor: AutumnColors.chipBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: AutumnColors.body,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: AutumnColors.heading,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: AutumnColors.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  actions: {
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: AutumnColors.primary,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.heading,
    textDecorationLine: 'underline',
  },
});
