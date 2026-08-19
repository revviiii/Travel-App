import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PreferenceProvider } from '@/contexts/PreferenceContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferenceProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </PreferenceProvider>
    </GestureHandlerRootView>
  );
}
