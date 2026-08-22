import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';

const locationIllustration = require('@/assets/images/slide3.png');

export default function LocationSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    router.replace('/Login');
  };

  const handleAllowLocation = async () => {
    setIsRequestingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Location permission not granted',
          'You can still use Pinara and search for any destination manually.',
        );
      }
      router.replace('/Login');
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const handleSetLocation = () => {
    router.replace('/Login');
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
          <Ionicons color={AutumnColors.heading} name="chevron-back" size={24} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip location setup"
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons color={AutumnColors.primary} name="chevron-forward" size={18} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.illustrationFrame}>
          <Image
            accessibilityLabel="Map, passport, airplane, and location pin illustration"
            contentFit="cover"
            source={locationIllustration}
            style={styles.illustration}
          />
          <View style={styles.locationBadge}>
            <Ionicons color="#FFFFFF" name="location" size={30} />
          </View>
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
          disabled={isRequestingLocation}
          onPress={() => void handleAllowLocation()}
          accessibilityRole="button"
          accessibilityLabel="Allow Location Access"
        >
          {isRequestingLocation ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Allow Location Access</Text>
          )}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  illustrationFrame: {
    width: '85%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    backgroundColor: AutumnColors.chipBackground,
    overflow: 'hidden',
    marginBottom: 32,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  locationBadge: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AutumnColors.primary,
    borderWidth: 3,
    borderColor: AutumnColors.background,
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
