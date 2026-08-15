import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

/** Delay in milliseconds before auto-navigating to onboarding. Easy to change later. */
const SPLASH_DELAY_MS = 2000;

export default function StartingScreen() {
  const router = useRouter();

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
    <View style={styles.container}>
      {/* TODO: Replace with final exported app logo */}
      <View style={styles.logoPlaceholder}>
        <Text style={styles.logoText}>LOGO</Text>
      </View>

      <Text style={styles.title}>Travel App</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: Colors.placeholder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.placeholderText,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
});
