import { Stack } from "expo-router";
import { LanguageProvider } from "../contexts/LanguageContext";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack />
    </LanguageProvider>
  );
}
