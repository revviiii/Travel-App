import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PreferenceProvider } from "@/contexts/PreferenceContext";
import { SoloGoalsProvider } from "@/contexts/SoloGoalsContext";
import { GroupGoalsProvider } from "@/contexts/GroupGoalsContext";
import { GroupItineraryProvider } from "@/contexts/GroupItineraryContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferenceProvider>
        <SoloGoalsProvider>
          <GroupGoalsProvider>
            <GroupItineraryProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </GroupItineraryProvider>
          </GroupGoalsProvider>
        </SoloGoalsProvider>
      </PreferenceProvider>
    </GestureHandlerRootView>
  );
}
