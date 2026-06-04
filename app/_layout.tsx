import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from "../contexts/LanguageContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
