import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

export default function LocationSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    // TODO: Continue to authentication flow
  };

  const handleAllowLocation = () => {
    // TODO: Request device location permission using Expo Location
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
          <Text style={styles.backArrow}>{'<-'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip location setup"
        >
          <Text style={styles.skipText}>Skip {'>'}</Text>
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
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.accent,
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
    backgroundColor: Colors.placeholder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.placeholderText,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.buttonText,
  },
  secondaryButton: {
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    textDecorationLine: 'underline',
  },
});
