# Edit and Delete Functionality Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement editing and logical deletion for members and classes with swipe-to-action UI.

**Architecture:** 
1. **Types**: Add `isDeleted` to `Member` and `ClassItem`.
2. **Logic**: Add `handleUpdate*` and `handleDelete*` to `useMembers` and `useClasses` hooks. Filter out deleted items in `useMemo`.
3. **UI**: Update Modals to handle `initialData` for editing. Implement `SwipeableItem` using `react-native-gesture-handler`.
4. **Integration**: Update `app/index.tsx` to handle edit/delete events.

**Tech Stack:** React Native, Expo, TypeScript, react-native-gesture-handler, react-native-reanimated

---

### Task 1: Update Types and Hook Logic (Foundation)

**Files:**
- Modify: `types/index.ts`
- Modify: `hooks/useMembers.ts`
- Modify: `hooks/useClasses.ts`

**Step 1: Update Types**
Add `isDeleted?: boolean;` to `Member` and `ClassItem` interfaces in `types/index.ts`.

**Step 2: Update useMembers logic**
- Add `handleUpdateMember(id, data)` and `handleDeleteMember(id)`.
- Update `members` return to be filtered: `members.filter(m => !m.isDeleted)`. Wait, `setMembers` should keep the full list if we want real logical deletion, but for now, simple `filter` in the return or `useMemo` is fine. Let's use `useMemo` for a `visibleMembers` list.

**Step 3: Update useClasses logic**
- Add `handleUpdateClass(id, data)` and `handleDeleteClass(id)`.
- Update `filteredClasses` and `stats` to only count `!c.isDeleted`.

**Step 4: Commit**
```bash
git add types/index.ts hooks/useMembers.ts hooks/useClasses.ts
git commit -m "feat: add update/delete logic and logical delete support to hooks"
```

---

### Task 2: Refactor Modals for Edit Mode

**Files:**
- Modify: `components/AddMemberModal.tsx`
- Modify: `components/AddClassModal.tsx`

**Step 1: Enhance AddMemberModal**
- Accept `initialData?: Member`.
- Use `useEffect` to sync internal state when `initialData` changes.
- Change title and button text based on whether it's editing.

**Step 2: Enhance AddClassModal**
- Accept `initialData?: ClassItem`.
- Sync state with `initialData`.
- Update logic to call `onAdd` (which will now be `onSave`) with the updated data.

**Step 3: Commit**
```bash
git add components/AddMemberModal.tsx components/AddClassModal.tsx
git commit -m "feat: enhance modals to support editing existing items"
```

---

### Task 3: Create SwipeableItem UI Component

**Files:**
- Create: `components/ui/SwipeableItem.tsx`

**Step 1: Implement SwipeableItem**
- Use `Swipeable` from `react-native-gesture-handler`.
- Provide `renderRightActions` with "Edit" (Blue) and "Delete" (Red) buttons.
- Use `expo-haptics` for feedback.

**Step 2: Commit**
```bash
git add components/ui/SwipeableItem.tsx
git commit -m "feat: add SwipeableItem component for list actions"
```

---

### Task 4: Integrate Edit/Delete in app/index.tsx (Part 1 - Classes)

**Files:**
- Modify: `app/index.tsx`
- Modify: `components/ui/ClassCard.tsx`

**Step 1: Wrap ClassCard with SwipeableItem**
Update `app/index.tsx` to wrap `ClassCard` inside `SwipeableItem`.
Pass `onEdit` (opens modal) and `onDelete` (calls hook) handlers.

**Step 2: Handle Edit Class**
Maintain a `editingClass` state in `App` component. When "Edit" is clicked, set `editingClass` and open modal.

**Step 3: Commit**
```bash
git add app/index.tsx components/ui/ClassCard.tsx
git commit -m "feat: integrate swipe-to-edit/delete for classes"
```

---

### Task 4: Integrate Edit/Delete in app/index.tsx (Part 2 - Members)

**Files:**
- Modify: `app/index.tsx`
- Modify: `components/ui/MemberTabs.tsx`

**Step 1: Add Long-press or Edit mode for Members**
The design mentioned swipe for list items. Members are in horizontal tabs. 
Let's add a "long press" or a small edit icon to members, OR just swipe if we change the layout.
Design says "UI 交互将采用移动端原生的“侧滑操作”".
Let's stick to swipe for classes first. For members, maybe a long-press to edit/delete is better for horizontal tabs.

**Step 2: Commit**
```bash
git add app/index.tsx
git commit -m "feat: integrate member editing/deletion"
```

---

### Task 5: Final Polish and Verification

**Step 1: Run Lint and Type Check**
Run: `npm run lint` and `npx tsc --noEmit`.

**Step 2: Manual Verification**
- Verify adding/editing/deleting works for both members and classes.
- Verify statistics update correctly.
- Verify language switching still works for existing and new items.

**Step 3: Commit**
```bash
git commit -m "chore: final polish for CRUD implementation"
```
