# Refactor app/index.tsx Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor `app/index.tsx` into a lean orchestrator by extracting i18n into a Context, logic into custom Hooks, and JSX into pure UI components.

**Architecture:** 
1. `contexts/LanguageContext.tsx` for global i18n.
2. `types/index.ts` for shared interfaces (`Member`, `ClassItem`, `LogItem`).
3. `hooks/useMembers.ts` and `hooks/useClasses.ts` for state management and core logic.
4. `components/ui/*` for presentational blocks.
5. Update `app/index.tsx` to compose them together.

**Tech Stack:** React Native, Expo, TypeScript

---

### Task 1: Setup Types and Language Context

**Files:**
- Create: `types/index.ts`
- Create: `contexts/LanguageContext.tsx`
- Modify: `app/_layout.tsx`

**Step 1: Extract Types**
Create `types/index.ts` and export the `Member`, `ClassItem`, and `LogItem` interfaces currently found in `app/index.tsx`.

**Step 2: Create LanguageContext**
Create `contexts/LanguageContext.tsx`. Move the large `i18n` object from `app/index.tsx` into this file. 
Implement and export `LanguageProvider` component that wraps children and provides `{ lang, t, toggleLang }` via Context.
Export a `useLanguage` hook.

**Step 3: Wrap App with Provider**
Modify `app/_layout.tsx`. Import `LanguageProvider` and wrap the `<Stack>` or root layout component with it.

**Step 4: Commit**
```bash
git add types/ contexts/ app/_layout.tsx
git commit -m "refactor: extract types and global LanguageContext"
```

---

### Task 2: Extract Custom Hooks

**Files:**
- Create: `hooks/useMembers.ts`
- Create: `hooks/useClasses.ts`

**Step 1: Implement useMembers**
Create `hooks/useMembers.ts`. Import `useState` and `Member` type.
Initialize the default members list exactly as it is in `index.tsx`.
Return `{ members, setMembers, currentMemberId, setCurrentMemberId, handleAddMember }`.

**Step 2: Implement useClasses**
Create `hooks/useClasses.ts`. Import types. Note: `useClasses` needs access to translations for `Platform.OS === 'web' ? alert : Alert.alert` and `t.unitLesson` etc in `handleCheckIn`. Pass `t` (translation object) as an argument to the hook, or use `useLanguage` inside it. Let's use `useLanguage` inside it.
Extract the default `classes` list, `logs` list, `totalSpent`, `totalClasses`, `totalRemaining` calculations, `handleCheckIn`, and `handleAddClass` from `index.tsx`.
Return `{ classes, logs, stats: { totalSpent, totalClasses, totalRemaining }, handleCheckIn, handleAddClass }`.

**Step 3: Commit**
```bash
git add hooks/
git commit -m "refactor: extract business logic into useMembers and useClasses hooks"
```

---

### Task 3: Extract UI Components (Part 1)

**Files:**
- Create: `components/ui/SummaryCard.tsx`
- Create: `components/ui/MemberTabs.tsx`

**Step 1: Implement SummaryCard**
Create `components/ui/SummaryCard.tsx`. It accepts `{ totalSpent, totalClasses, totalRemaining }` as props. It uses `useLanguage()` to get `t` and `lang`. Extract the relevant JSX and styles from `index.tsx`.

**Step 2: Implement MemberTabs**
Create `components/ui/MemberTabs.tsx`. It accepts `{ members, currentMemberId, onSelectMember, onAddMemberPress }` as props. Extract the horizontal ScrollView mapping members, and the "Add Member" button. Move relevant styles.

**Step 3: Commit**
```bash
git add components/ui/SummaryCard.tsx components/ui/MemberTabs.tsx
git commit -m "refactor: extract SummaryCard and MemberTabs UI components"
```

---

### Task 4: Extract UI Components (Part 2)

**Files:**
- Create: `components/ui/ClassCard.tsx`
- Create: `components/ui/LogList.tsx`

**Step 1: Implement ClassCard**
Create `components/ui/ClassCard.tsx`. It accepts `{ classItem, owner, onCheckIn }` as props. It uses `useLanguage()`. Move the complex card rendering logic, progress bar, and warning logic inside it. Copy necessary styles.

**Step 2: Implement LogList**
Create `components/ui/LogList.tsx`. Accepts `{ logs }` as props. Uses `useLanguage()`. Move the history log list rendering and styles.

**Step 3: Commit**
```bash
git add components/ui/ClassCard.tsx components/ui/LogList.tsx
git commit -m "refactor: extract ClassCard and LogList UI components"
```

---

### Task 5: Rewire app/index.tsx

**Files:**
- Modify: `app/index.tsx`
- Modify: `components/AddClassModal.tsx`
- Modify: `components/AddMemberModal.tsx`

**Step 1: Update Modals**
Update `AddClassModal` and `AddMemberModal` to use `useLanguage()` instead of receiving `t` via props. Import types from `types/index.ts`.

**Step 2: Refactor app/index.tsx**
Remove all the hardcoded states, i18n object, and computation logic.
Import `useLanguage`, `useMembers`, `useClasses`.
Import `SummaryCard`, `MemberTabs`, `ClassCard`, `LogList`, `AddMemberModal`, `AddClassModal`.
Render the clean structure:
```tsx
return (
  <ScrollView>
    {/* Language Toggle Header */}
    <SummaryCard ... />
    <MemberTabs ... />
    <TouchableOpacity onPress={showAddClass}> + Add Course </TouchableOpacity>
    <View>{filteredClasses.map(c => <ClassCard ... />)}</View>
    <LogList logs={logs} />
    <AddMemberModal />
    <AddClassModal />
  </ScrollView>
)
```
Ensure all required styles are kept for the top-level layout and any missing pieces. Remove unused code and styles.

**Step 3: Test Compilation**
Run `npx tsc --noEmit` and `npm run lint` to ensure everything is wired correctly.

**Step 4: Commit**
```bash
git add app/index.tsx components/AddClassModal.tsx components/AddMemberModal.tsx
git commit -m "refactor: rewire app/index.tsx as a clean orchestrator"
```