# Native UX Polish Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the default Expo Router header and apply SafeArea padding to make the app feel fully native and immersive.

**Architecture:** 
1. Use Expo Router's `<Stack>` screen options to completely hide the default navigation header.
2. Wrap the root layout in `<SafeAreaProvider>` from `react-native-safe-area-context`.
3. Use `<SafeAreaView>` in `app/index.tsx` instead of a plain `<ScrollView>` or `<View>` to automatically pad the top so content avoids the notch/status bar.
4. Hide the `ScrollView` indicators for a cleaner look.

**Tech Stack:** Expo Router, React Native, `react-native-safe-area-context`

---

### Task 1: Hide Native Header & Setup SafeAreaProvider

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Update RootLayout**
Import `SafeAreaProvider` from `react-native-safe-area-context`.
Wrap the `<Stack />` in `<SafeAreaProvider>`.
Update `<Stack>` to pass `screenOptions={{ headerShown: false }}` to completely hide the "index" header.

```tsx
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
```

**Step 2: Commit**
```bash
git add app/_layout.tsx
git commit -m "style: hide default expo router header and wrap with SafeAreaProvider"
```

---

### Task 2: Apply SafeAreaView and Hide Scroll Indicators

**Files:**
- Modify: `app/index.tsx`

**Step 1: Import SafeAreaView**
Import `SafeAreaView` from `react-native-safe-area-context` (do NOT use the one from `react-native` as it only works on iOS).

**Step 2: Wrap Content in SafeAreaView**
Change the root `<ScrollView>` to a `<SafeAreaView>` with `edges={['top']}`. Then place the `<ScrollView>` inside it.

**Step 3: Hide Scroll Indicators**
Add `showsVerticalScrollIndicator={false}` to the `ScrollView`.
Ensure the background color of the `SafeAreaView` matches the app's background (`#F8FAFC`) so the status bar area looks seamless.

**Implementation detail for app/index.tsx (Render method):**
```tsx
// Imports:
import { SafeAreaView } from 'react-native-safe-area-context';

// Render:
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader />
        {/* ... rest of components ... */}
      </ScrollView>
      
      {/* Modals stay outside ScrollView */}
      <AddMemberModal ... />
      <AddClassModal ... />
    </SafeAreaView>
  );

// Styles:
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Match app background
  },
  // ... keep existing styles
```

**Step 4: Commit**
```bash
git add app/index.tsx
git commit -m "style: apply SafeAreaView to handle notches and hide scrollbar for native feel"
```