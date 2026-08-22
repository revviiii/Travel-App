import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getMyProfile } from '@/lib/api';
import { createSessionFromUrl } from '@/lib/oauth';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const callbackUrl = Linking.useLinkingURL();
  const started = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const currentCallbackUrl = callbackUrl;
    if (!currentCallbackUrl || started.current) return;
    started.current = true;

    async function finishSignIn(url: string) {
      try {
        await createSessionFromUrl(url);
        const profile = await getMyProfile();
        router.replace(profile.onboarding_completed ? '/home' : '/preferences');
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Pinara could not finish signing you in.',
        );
      }
    }

    void finishSignIn(currentCallbackUrl);
  }, [callbackUrl, router]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Text style={styles.brand}>Pinara</Text>

      {errorMessage ? (
        <>
          <Text style={styles.title}>Google sign-in was not completed</Text>
          <Text style={styles.message}>{errorMessage}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.replace('/Login')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Return to Pinara login</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator color="#D43A11" size="large" />
          <Text style={styles.title}>Finishing your Google sign-in</Text>
          <Text style={styles.message}>You will continue to Pinara.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFF9F1',
  },
  brand: {
    marginBottom: 32,
    color: '#2A1008',
    fontSize: 34,
    fontWeight: '800',
  },
  title: {
    marginTop: 24,
    color: '#2A1008',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    marginTop: 12,
    color: '#675B52',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    marginTop: 28,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#D43A11',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
