# Design Spec: Sidebar Drawer Navigation
Date: 2026-06-09

## 1. Overview
This design outlines the migration from a flat Stack navigation to a Drawer navigation architecture in LessonLedger. The goal is to declutter the dashboard by moving global management features ("Members", "Courses", "Logs", "Settings") into a standardized left-side hamburger menu.

## 2. Architectural Changes
- **Expo Router Adoption**: Introduce `expo-router/drawer` as the root layout wrapper in `app/_layout.tsx`.
- **Route Hierarchy**:
  - `app/index.tsx` (Dashboard) -> Drawer Item
  - `app/courses.tsx` (Courses) -> Drawer Item
  - `app/members.tsx` (Members) -> Drawer Item
  - `app/logs.tsx` (Logs) -> Drawer Item
  - `app/settings.tsx` (Settings - placeholder) -> Drawer Item

## 3. UI/UX Specifications
- **Trigger Mechanism**:
  - Tapping the hamburger icon (Feather `menu`) in the `AppHeader`.
  - Swiping right from the left edge of the screen.
- **Drawer Content Styling**:
  - Custom drawer content component to match the iOS 18 glassmorphism and minimal design.
  - Active items highlighted with a subtle background (`rgba(99,102,241,0.08)`) and primary color text (`#6366F1`).
  - Inactive items use secondary text colors (`#64748B`).
- **Header Synchronization**:
  - Top-level screens accessed via the drawer will replace the standard "back" chevron with the hamburger menu icon to indicate they are top-level views.
- **Micro-interactions**:
  - `expo-haptics` (`light` impact) triggered upon drawer open/close thresholds to provide physical feedback.

## 4. Edge Cases & Constraints
- **Deep Linking / Modals**: Ensure that existing bottom sheets (`AddClassSheet`, `AddMemberSheet`) continue to overlay correctly on top of the Drawer context.
- **State Management**: The drawer does not unmount screens by default; state preservation for forms must be managed carefully when switching between drawer tabs.
- **Web Fallback**: `expo-router/drawer` handles web degradation gracefully, usually rendering as a static sidebar on wide screens or a typical off-canvas menu on mobile web viewports.

## 5. Success Criteria
- The left hamburger icon opens the drawer instead of pushing the members route.
- All core management screens are accessible via the sidebar.
- Navigation transitions are smooth and performant without visual tearing.