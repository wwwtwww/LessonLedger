import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from "../contexts/LanguageContext";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <BottomSheetModalProvider>
            <Drawer screenOptions={{ headerShown: false }} />
          </BottomSheetModalProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
