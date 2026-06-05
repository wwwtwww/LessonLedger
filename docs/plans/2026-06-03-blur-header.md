# Blur Effect Header Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the static top header into a sticky, semi-transparent blur header (Glassmorphism) that content scrolls underneath.

**Architecture:** 
1. Use `BlurView` from `expo-blur` to wrap the top section (`AppHeader`).
2. Restructure `app/index.tsx` layout: detach the header from the `ScrollView` flow and make it absolutely positioned at the top of the `SafeAreaView`.
3. Add top padding to the `ScrollView`'s `contentContainerStyle` equal to the height of the sticky header, so initial content isn't hidden beneath it.
4. Keep the `MemberTabs` and `SummaryCard` scrolling naturally for now, creating a nice parallax feel as they slide under the blurred header.

**Tech Stack:** React Native, `expo-blur`

---

### Task 1: Restructure Layout for Sticky Header

**Files:**
- Modify: `app/index.tsx`

**Step 1: Import BlurView**
Import `BlurView` from `expo-blur`.

**Step 2: Extract AppHeader to Absolute BlurView**
In the render method, move `<AppHeader />` outside of the `<ScrollView>`.
Wrap it in a `<BlurView intensity={80} tint="light" style={styles.headerBlur}>`.
Place this `BlurView` component *after* the `ScrollView` in the JSX so it renders on top (z-index).

**Step 3: Update Styles**
Add `headerBlur` to `styles`:
```javascript
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    // Add horizontal padding to match content
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
```

Modify `contentContainerStyle` in `styles.contentContainer` to add `paddingTop: 80` (approximate height of the header + safe area) so the first elements don't get covered when scrolled to the top.

**Implementation Note:** We must remove the top padding from `styles.contentContainer` if it pushes the whole scrollview down, but since we are absolutely positioning the header, we add padding *inside* the scroll view content.

**Step 4: Verify visually**
Ensure the app runs. Scrolling should cause the `SummaryCard` and lists to pass *under* the frosted glass header.

**Step 5: Commit**
```bash
git add app/index.tsx
git commit -m "feat(ui): implement sticky blur header for premium native feel"
```

---

### Task 2: Polish the Header Component (Optional but recommended)

**Files:**
- Modify: `components/ui/AppHeader.tsx`

**Step 1: Clean up internal padding**
Since the `BlurView` wrapper in `app/index.tsx` now dictates the container, ensure `AppHeader` doesn't have conflicting background colors or excessive margins that break the glass illusion. Remove any solid `backgroundColor` from `AppHeader`'s root view if it exists.

**Step 2: Commit**
```bash
git add components/ui/AppHeader.tsx
git commit -m "style: remove solid backgrounds from AppHeader to support blur effect"
```