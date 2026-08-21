import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter, type RelativePathString } from 'expo-router';
import { AutumnColors } from '@/constants/colors';
import { acceptTripInvitation } from '@/lib/api';

export default function AcceptInvitationScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Joining travel group…');
  const [tripId, setTripId] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function acceptInvitation() {
      if (!token) {
        setStatus('error');
        setMessage('This invitation link is incomplete.');
        return;
      }

      try {
        const trip = await acceptTripInvitation(token);
        if (!isCurrent) return;
        setTripId(trip.id);
        setStatus('success');
        setMessage(`You joined ${trip.name}.`);
      } catch (error) {
        if (!isCurrent) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unable to accept this invitation.');
      }
    }

    void acceptInvitation();
    return () => {
      isCurrent = false;
    };
  }, [token]);

  const continueToApp = () => {
    const path = tripId ? `/group/${tripId}` : '/home';
    router.replace(path as RelativePathString);
  };

  return (
    <View style={styles.screen}>
      {status === 'loading' ? <ActivityIndicator color={AutumnColors.primary} size="large" /> : null}
      <Text style={styles.title}>
        {status === 'success' ? 'Invitation accepted' : status === 'error' ? 'Unable to join' : 'Joining group'}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {status !== 'loading' ? (
        <TouchableOpacity style={styles.button} onPress={continueToApp}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: AutumnColors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  title: {
    color: AutumnColors.heading,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 18,
    textAlign: 'center',
  },
  message: {
    color: AutumnColors.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: AutumnColors.primary,
    borderRadius: 22,
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
