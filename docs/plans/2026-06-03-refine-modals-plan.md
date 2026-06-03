# Refine Modals Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine AddMemberModal and AddClassModal to support Edit mode correctly, handle mobile keyboards better, and include unit type selection.

**Architecture:** Use ScrollView for better mobile UX, update prop types for consistency, and ensure state resets only on visibility changes.

**Tech Stack:** React Native, Expo, TypeScript

---

### Task 1: Update LanguageContext.tsx

**Files:**
- Modify: `E:\LessonLedger\contexts\LanguageContext.tsx`

**Step 1: Add unitLabel to translations**
Add `unitLabel` to both `zh-CN` and `en-US` dictionaries.

**Step 2: Commit changes**
```bash
git add E:\LessonLedger\contexts\LanguageContext.tsx
git commit -m "i18n: add unitLabel for course modal"
```

### Task 2: Refine AddMemberModal.tsx

**Files:**
- Modify: `E:\LessonLedger\components\AddMemberModal.tsx`

**Step 1: Update onAdd type and add ScrollView**
Update `onAdd` signature. Use `ScrollView` inside the modal.

**Step 2: Implement visibility-based state reset**
Use a ref to track `visible` state and only reset when it flips to true.

**Step 3: Update handleAdd to include id from initialData**
Ensure `id` is passed if editing.

**Step 4: Commit changes**
```bash
git add E:\LessonLedger\components\AddMemberModal.tsx
git commit -m "refactor: improve AddMemberModal logic and UX"
```

### Task 3: Refine AddClassModal.tsx

**Files:**
- Modify: `E:\LessonLedger\components\AddClassModal.tsx`

**Step 1: Update onAdd type and add ScrollView**
Update `onAdd` signature. Wrap form in `ScrollView`.

**Step 2: Add unitType state and UI**
Add `unitType` selection (Lesson vs Session).

**Step 3: Implement visibility-based state reset**
Sync `unitType` from `initialData` or default.

**Step 4: Update handleAdd to include id and unitType**
Ensure all fields are passed correctly to `onAdd`.

**Step 5: Commit changes**
```bash
git add E:\LessonLedger\components\AddClassModal.tsx
git commit -m "feat: add unit type selection to AddClassModal"
```

### Task 4: Verification

**Step 1: Verify TypeScript types**
Run `npx tsc --noEmit` to ensure no regressions in parent components.

**Step 2: Final Commit**
```bash
git commit --allow-empty -m "chore: complete modal refinements"
```
