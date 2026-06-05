# Structured Schedule Picker Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the plain text "Schedule" input with a structured, multi-entry selection component that stores data as JSONB in Supabase.

**Architecture:** 
1. **Data Layer**: Update `types/index.ts` to define `ScheduleEntry`. Change `ClassItem.schedule` to `ScheduleEntry[]`.
2. **Component Layer**: Create `components/ui/SchedulePicker.tsx` to handle adding/removing time slots using native Date/Time pickers.
3. **Integration**: Update `AddClassModal.tsx` to use the new picker.
4. **Formatting**: Implement a utility to convert the JSON array into a readable string for the `ClassCard` display.

**Tech Stack:** React Native, Expo, `@react-native-community/datetimepicker`, Supabase (JSONB)

---

### Task 1: Update Type Definitions

**Files:**
- Modify: `types/index.ts`

**Step 1: Add ScheduleEntry interface**
Add the following to `types/index.ts`:
```typescript
export interface ScheduleEntry {
  type: 'weekly' | 'specific';
  day?: number;    // 0-6
  date?: string;   // YYYY-MM-DD
  time: string;    // HH:mm
}
```

**Step 2: Update ClassItem**
Change `schedule: string;` to `schedule: ScheduleEntry[];`.

**Step 3: Commit**
```bash
git add types/index.ts
git commit -m "refactor: update ClassItem to use structured ScheduleEntry array"
```

---

### Task 2: Create Schedule Formatter Utility

**Files:**
- Create: `utils/formatters.ts`

**Step 1: Implement formatSchedule**
Create a function that takes `ScheduleEntry[]` and returns a string like "Mon/Thu 18:00" or "2026-06-05 14:00". Handle the sorting and grouping of weekly slots.

**Step 2: Commit**
```bash
git add utils/formatters.ts
git commit -m "feat: add schedule formatting utility"
```

---

### Task 3: Implement SchedulePicker UI Component

**Files:**
- Create: `components/ui/SchedulePicker.tsx`

**Step 1: Install datetimepicker**
Run `npx expo install @react-native-community/datetimepicker`.

**Step 2: Build the UI**
- Show a list of currently selected entries as removable tags.
- Add an "Add Slot" button.
- Implement the logic to pick Weekly (Day of Week) vs Specific (Date) + Time.
- Support both Web and Native pickers.

**Step 3: Commit**
```bash
git add components/ui/SchedulePicker.tsx
git commit -m "feat(ui): implement multi-entry SchedulePicker component"
```

---

### Task 4: Integrate Picker into AddClassModal

**Files:**
- Modify: `components/AddClassModal.tsx`

**Step 1: Replace TextInput**
Replace the text input for `schedule` with the new `<SchedulePicker />`.
Update the `onAdd` payload to send the array directly to Supabase.

**Step 2: Commit**
```bash
git add components/AddClassModal.tsx
git commit -m "feat: integrate SchedulePicker into AddClassModal"
```

---

### Task 5: Update ClassCard Display

**Files:**
- Modify: `components/ui/ClassCard.tsx`

**Step 1: Use Formatter**
Use the `formatSchedule` utility to display the class time on the card.

**Step 2: Commit**
```bash
git add components/ui/ClassCard.tsx
git commit -m "feat: display structured schedule on ClassCard"
```
