# Bottom Sheet Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace full-screen React Native Modals with smooth, native-feeling Bottom Sheets for "Add Member" and "Add Class" forms.

**Architecture:** 
1. Use `@gorhom/bottom-sheet` which is the community standard for 60fps native bottom sheets in React Native.
2. Wrap the entire app in `BottomSheetModalProvider` in `app/_layout.tsx`.
3. Refactor `AddMemberModal.tsx` and `AddClassModal.tsx` to use `BottomSheetModal` instead of `Modal`.
4. Use a `useEffect` inside the refactored modals to automatically call `.present()` or `.dismiss()` on the internal `BottomSheetModal` ref based on the `visible` prop. This allows us to keep `app/index.tsx` mostly unchanged.

**Tech Stack:** React Native, `@gorhom/bottom-sheet`, `react-native-gesture-handler`

---

### Task 1: Setup Provider in Root Layout

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Import and Wrap**
Import `BottomSheetModalProvider` from `@gorhom/bottom-sheet`.
Wrap the `<Stack />` inside the `<BottomSheetModalProvider>`. It should be inside the `SafeAreaProvider` and `GestureHandlerRootView`.

```tsx
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

// Inside RootLayout:
<GestureHandlerRootView style={{ flex: 1 }}>
  <SafeAreaProvider>
    <LanguageProvider>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </BottomSheetModalProvider>
    </LanguageProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>
```

**Step 2: Commit**
```bash
git add app/_layout.tsx
git commit -m "feat: add BottomSheetModalProvider to root layout"
```

---

### Task 2: Refactor AddMemberModal

**Files:**
- Modify: `components/AddMemberModal.tsx`

**Step 1: Import Components**
Import `BottomSheetModal`, `BottomSheetView`, and `BottomSheetBackdrop` from `@gorhom/bottom-sheet`.

**Step 2: Setup Refs and Snap Points**
Create a ref: `const bottomSheetModalRef = useRef<BottomSheetModal>(null);`
Define snap points: `const snapPoints = useMemo(() => ['75%'], []);`

**Step 3: Sync `visible` prop to Ref**
Add a `useEffect` that listens to the `visible` prop:
```tsx
  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);
```

**Step 4: Render Backdrop**
Create a `renderBackdrop` callback:
```tsx
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    []
  );
```

**Step 5: Replace Modal**
Replace the React Native `<Modal>` and its overlay `View` with `<BottomSheetModal>`.
Update `BottomSheetModal` props:
- `ref={bottomSheetModalRef}`
- `index={0}`
- `snapPoints={snapPoints}`
- `onDismiss={onClose}` (important to keep parent state in sync)
- `backdropComponent={renderBackdrop}`
- `keyboardBlurBehavior="restore"`

Remove `KeyboardAvoidingView` as BottomSheet handles it better internally or we can use `BottomSheetScrollView`.
Replace inner `<ScrollView>` with `<BottomSheetView>` or `BottomSheetScrollView`.
Adjust styles (remove `overlay`, `modalContainer`, adjust padding).

**Step 6: Commit**
```bash
git add components/AddMemberModal.tsx
git commit -m "feat(ui): refactor AddMemberModal to use bottom sheet"
```

---

### Task 3: Refactor AddClassModal

**Files:**
- Modify: `components/AddClassModal.tsx`

**Step 1: Apply Same Pattern**
Follow the exact same steps from Task 2 to convert `AddClassModal.tsx` to use `BottomSheetModal`.
For `AddClassModal`, since it has more fields, use `snapPoints={['90%']}` or `['85%']` and make sure to use `BottomSheetScrollView` for the form content so it scrolls correctly within the sheet.

**Step 2: Commit**
```bash
git add components/AddClassModal.tsx
git commit -m "feat(ui): refactor AddClassModal to use bottom sheet"
```