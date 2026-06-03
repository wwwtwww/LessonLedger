import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LanguageProvider } from "../contexts/LanguageContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <Stack />
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
