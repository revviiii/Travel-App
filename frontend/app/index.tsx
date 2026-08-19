import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';

const appLogo = require('@/assets/images/app-logo.svg');

/** Delay in milliseconds before auto-navigating to onboarding. Easy to change later. */
const SPLASH_DELAY_MS = 2000;

export default function StartingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // TODO: Check session/authentication state here before navigating.
    // TODO: Check if onboarding has already been completed (AsyncStorage or similar).
    // For now, always navigate to onboarding after a short delay.

    const timeout = setTimeout(() => {
      router.replace('/(onboarding)');
    }, SPLASH_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Image
        source={appLogo}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="App logo"
      />
      <Text style={styles.title}>Ramyl</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AutumnColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: AutumnColors.heading,
  },
});
