import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PreferenceProvider } from "@/contexts/PreferenceContext";
import { SoloGoalsProvider } from "@/contexts/SoloGoalsContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferenceProvider>
        <SoloGoalsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SoloGoalsProvider>
      </PreferenceProvider>
    </GestureHandlerRootView>
  );
}
