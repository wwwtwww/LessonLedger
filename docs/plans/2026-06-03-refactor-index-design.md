# Design Document: Refactoring app/index.tsx

## 1. Overview
The current `app/index.tsx` file has become overly bloated (>400 lines), managing UI rendering, business logic, global state, and internationalization (i18n). This refactoring aims to improve maintainability, component reusability, and separation of concerns by breaking the file down into smaller UI components, custom hooks for business logic, and a React Context for i18n.

## 2. Refactoring Strategy
- **UI Components**: Extract logical blocks (Dashboard, Member list, Class cards) into pure presentational components.
- **Custom Hooks**: Isolate the complex state management (CRUD operations, check-in logic, aggregate calculations) into dedicated hooks (`useMembers`, `useClasses`).
- **Global i18n Context**: Migrate the hardcoded translation dictionary into a React Context provider, eliminating the need to pass the `t` function down via props.

## 3. Architecture & Directory Structure
```text
LessonLedger/
├── app/
│   ├── _layout.tsx           # Will wrap the app with <LanguageProvider>
│   └── index.tsx             # Lean container orchestrating the hooks and components
├── components/
│   ├── ui/
│   │   ├── SummaryCard.tsx   # Top dashboard displaying total costs and remaining classes
│   │   ├── MemberTabs.tsx    # Horizontal scrollable member selection bar
│   │   ├── ClassCard.tsx     # Individual class item card with progress bar and check-in button
│   │   └── AddCourseBtn.tsx  # Prominent button to trigger AddClassModal
│   ├── LogList.tsx           # List displaying check-in history logs
│   ├── AddMemberModal.tsx    # (Existing)
│   └── AddClassModal.tsx     # (Existing)
├── hooks/
│   ├── useMembers.ts         # Manages members array and currentMemberId state
│   └── useClasses.ts         # Manages classes array, logs, check-in logic, and computes stats
└── contexts/
    └── LanguageContext.tsx   # Stores the i18n dictionary and exposes { t, lang, toggleLang }
```

## 4. Implementation Details

### 4.1 Global Context (`LanguageContext.tsx`)
- Create a `LanguageProvider` that maintains the `lang` state ('zh-CN' | 'en-US').
- Expose a custom hook `useLanguage()` returning `{ lang, t, toggleLang }`.
- Update `app/_layout.tsx` to wrap the `Stack`/`Slot` with this Provider.

### 4.2 Custom Hooks
- **`useMembers.ts`**:
  - Initializes static member data.
  - Exposes `members`, `currentMemberId`, `setCurrentMemberId`, and `addMember`.
- **`useClasses.ts`**:
  - Requires `t` and `lang` (or `LanguageContext` access) for localized alerts and log generation.
  - Initializes static class data and empty logs array.
  - Computes `totalSpent`, `totalClasses`, and `totalRemaining`.
  - Exposes `classes`, `logs`, computed stats, `addClass`, and `handleCheckIn` (with its double-confirmation logic).

### 4.3 UI Components
- Transform each segment of `app/index.tsx`'s return statement into functional components.
- Each component should independently use the `useLanguage()` hook to get translation strings.
- Pass necessary data and callbacks (e.g., `onCheckIn`, `currentMemberId`) down as props from `app/index.tsx`.

## 5. End State of `app/index.tsx`
The primary file will serve only as the conductor:
1. Call `useMembers` and `useClasses`.
2. Filter the `classes` based on `currentMemberId`.
3. Render the stacked layout composed entirely of imported components from `components/` and `components/ui/`.
