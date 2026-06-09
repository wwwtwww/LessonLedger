# Drawer Navigation Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Expo Router Drawer navigation to move main management screens into a left-side hamburger menu.

**Architecture:** We will replace the flat `Stack` in `app/_layout.tsx` with a `Drawer` from `expo-router/drawer`. The main screens (index, courses, members, logs) will become drawer items. We will create a custom drawer content component to match the iOS 18 glassmorphism style and integrate the hamburger icon into our custom `AppHeader`.

**Tech Stack:** Expo Router v6, React Native Reanimated, React Native Gesture Handler, Expo Haptics.

---

### Task 1: Install Dependencies

**Step 1: Install Drawer and Reanimated packages**
Run: `npx expo install expo-router react-native-reanimated react-native-gesture-handler @react-navigation/drawer`
*(Note: Expo router drawer requires `@react-navigation/drawer` under the hood)*

**Step 2: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: install drawer navigation dependencies"
```

### Task 2: Refactor Root Layout to use Drawer

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Update `_layout.tsx`**
Replace `<Stack screenOptions={{ headerShown: false }} />` with `<Drawer screenOptions={{ headerShown: false }} />`. We need to import `Drawer` from `expo-router/drawer`.
```tsx
import { Drawer } from 'expo-router/drawer';
// ... other imports
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
```

**Step 2: Verify Compilation**
Run: `npm run lint` (or start the app briefly to ensure no crash).
Expected: PASS

**Step 3: Commit**
```bash
git add app/_layout.tsx
git commit -m "refactor: change root layout from Stack to Drawer"
```

### Task 3: Create Custom Drawer Content Component

**Files:**
- Create: `components/ui/CustomDrawerContent.tsx`

**Step 1: Write Custom Drawer Component**
Create a component that uses `DrawerContentScrollView` and `DrawerItemList` from `@react-navigation/drawer`, styling it to have a transparent/glassy background and custom selected states matching the design spec.
```tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { COLORS } from '../../utils/colors';

export default function CustomDrawerContent(props: any) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 60 }}>
        <View style={styles.header}>
           <Text style={styles.title}>LessonLedger</Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary }
});
```

**Step 2: Hook up Custom Drawer in Layout**
Modify `app/_layout.tsx` to use this custom content and define the routes.
```tsx
import CustomDrawerContent from '../components/ui/CustomDrawerContent';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
// ... inside Drawer component
<Drawer 
  drawerContent={(props) => <CustomDrawerContent {...props} />}
  screenOptions={{ 
    headerShown: false,
    drawerActiveBackgroundColor: 'rgba(99,102,241,0.08)',
    drawerActiveTintColor: COLORS.primary,
    drawerInactiveTintColor: COLORS.textSecondary,
    drawerStyle: { backgroundColor: COLORS.background, width: 280 }
  }}
>
  <Drawer.Screen 
    name="index" 
    options={{ drawerLabel: '仪表盘 Dashboard', drawerIcon: ({color}) => <Feather name="home" size={24} color={color}/> }} 
  />
  <Drawer.Screen 
    name="courses" 
    options={{ drawerLabel: '课程 Courses', drawerIcon: ({color}) => <Feather name="book" size={24} color={color}/> }} 
  />
  <Drawer.Screen 
    name="members" 
    options={{ drawerLabel: '成员 Members', drawerIcon: ({color}) => <Feather name="users" size={24} color={color}/> }} 
  />
  <Drawer.Screen 
    name="logs" 
    options={{ drawerLabel: '打卡日志 Logs', drawerIcon: ({color}) => <Feather name="list" size={24} color={color}/> }} 
  />
</Drawer>
```

**Step 3: Commit**
```bash
git add components/ui/CustomDrawerContent.tsx app/_layout.tsx
git commit -m "feat: add custom drawer content and configure drawer screens"
```

### Task 4: Connect AppHeader to Drawer Toggle

**Files:**
- Modify: `components/ui/AppHeader.tsx`
- Modify: `app/index.tsx`, `app/courses.tsx`, `app/members.tsx`, `app/logs.tsx`

**Step 1: Update AppHeader to accept toggle prop**
Wait, `AppHeader` already takes `onMenuPress`. We just need to change what `onMenuPress` does in the pages. Let's update `app/index.tsx`.
In `app/index.tsx`:
```tsx
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

// Inside DashboardPage
const navigation = useNavigation();

<AppHeader 
  themeColor={themeColor} 
  onMenuPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
  onNotificationPress={() => router.push('/logs')}
/>
```

**Step 2: Update other top-level pages headers**
In `app/courses.tsx`, `app/members.tsx`, `app/logs.tsx`:
Replace the `chevron-left` back button with the `menu` hamburger icon, and connect it to `navigation.dispatch(DrawerActions.toggleDrawer())`.
*Example for `app/courses.tsx`:*
```tsx
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

// ...
const navigation = useNavigation();
// ...
<TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.iconBtn}>
  <Feather name="menu" size={24} color={COLORS.textPrimary} />
</TouchableOpacity>
```

**Step 3: Add Haptics to Drawer State Change (Optional but desired)**
We can wrap the toggle in a helper that triggers haptics.
```tsx
import { triggerHaptic } from '../utils/haptics';
// ...
const handleMenuPress = () => {
  triggerHaptic('light');
  navigation.dispatch(DrawerActions.toggleDrawer());
};
```

**Step 4: Commit**
```bash
git add app/index.tsx app/courses.tsx app/members.tsx app/logs.tsx
git commit -m "feat: wire up hamburger menus to open drawer"
```

### Task 5: Clean up old navigation patterns

**Files:**
- Modify: `app/index.tsx`
- Modify: `components/dashboard/FitnessSummaryCards.tsx`

**Step 1: Remove redundant pushes**
- In `app/index.tsx`, remove the `router.push('/members')` from the MemberSwitcher long press if desired, or keep it as an alternative. It's safe to keep it, but the explicit instruction was to clean up if needed. Let's just verify no broken links remain.
- In `components/dashboard/FitnessSummaryCards.tsx`, it uses `router.push('/courses')`. This is still valid for Drawer navigation (it will jump to that tab). No changes strictly required.

**Step 2: Run linter**
Run: `npm run lint`
Expected: PASS

**Step 3: Commit**
```bash
git commit --allow-empty -m "chore: verify navigation routes"
```