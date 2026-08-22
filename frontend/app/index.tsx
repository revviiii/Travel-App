import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { getPostAuthRoute } from '@/lib/post-auth-route';
import { supabase } from '@/lib/supabase';

const appLogo = require('@/assets/images/pinara-icon.png');

/** Delay in milliseconds before auto-navigating to onboarding. Easy to change later. */
const SPLASH_DELAY_MS = 2000;

export default function StartingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isCurrent = true;

    async function chooseNextScreen() {
      const minimumSplash = new Promise((resolve) => setTimeout(resolve, SPLASH_DELAY_MS));
      const { data } = await supabase.auth.getSession();
      await minimumSplash;
      if (!isCurrent) return;

      if (!data.session) {
        router.replace('/(onboarding)');
        return;
      }

      try {
        const nextRoute = await getPostAuthRoute();
        if (isCurrent) router.replace(nextRoute);
      } catch {
        if (isCurrent) router.replace('/Login');
      }
    }

    void chooseNextScreen();
    return () => {
      isCurrent = false;
    };
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Image
        source={appLogo}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="Pinara logo"
      />
      <Text style={styles.title}>Pinara</Text>
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
