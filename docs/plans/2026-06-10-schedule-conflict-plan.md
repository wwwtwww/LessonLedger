# Schedule Conflict Prevention Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement conflict detection to prevent scheduling overlapping classes for the same member.

**Architecture:** We will add a `duration` field to `ClassItem` and update `AddClassSheet` to check for overlapping time blocks against existing courses before allowing a save.

**Tech Stack:** React Native, Expo, TypeScript, Supabase.

---

### Task 1: Update Data Model and Storage

**Files:**
- Modify: `types/index.ts`
- Modify: `hooks/useClasses.ts`

**Step 1: Write the failing test**

We don't have an automated test suite currently set up for types and hooks in this project, so we will use TypeScript compilation as our "test".

Run: `npx tsc --noEmit`
Expected: PASS (Currently no errors)

**Step 2: Update `ClassItem` type**

Modify `types/index.ts` to add `duration?: number;` to the `ClassItem` interface.

```typescript
export interface ClassItem {
  id: string;
  memberId: string;
  name: string;
  totalPrice: number;
  totalLessons: number;
  doneLessons: number;
  schedule: ScheduleEntry[];
  unitType: 'lesson' | 'session';
  isDeleted?: boolean;
  notificationIds?: string[];
  duration?: number; // Duration in minutes
}
```

**Step 3: Update `handleAddClass` payload in `useClasses.ts`**

Modify `hooks/useClasses.ts` to accept `duration` in `handleAddClass` and pass it to Supabase.

```typescript
// Replace the signature of handleAddClass:
const handleAddClass = useCallback(async (classItem: Omit<ClassItem, 'id' | 'doneLessons' | 'isDeleted' | 'owner' | 'notificationIds'>) => {
// ...
    const newClass: ClassItem = { ...classItem, id: classId, doneLessons: 0, isDeleted: false, notificationIds: [], duration: classItem.duration || 60 };
// ...
    const newClassPayload = { id: classId, ...classItem, doneLessons: 0, isDeleted: false, notificationIds: ids, duration: classItem.duration || 60 };
```

**Step 4: Run test to verify it passes**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add types/index.ts hooks/useClasses.ts
git commit -m "feat: add duration to ClassItem type and hook payload"
```

---

### Task 2: Implement Conflict Detection Utility

**Files:**
- Create: `utils/scheduleConflict.ts`

**Step 1: Write the minimal implementation**

Create `utils/scheduleConflict.ts` with logic to detect overlaps.

```typescript
import { ClassItem, ScheduleEntry } from '../types';

export function hasScheduleConflict(
  newSchedule: ScheduleEntry[],
  newDuration: number = 60,
  existingClasses: ClassItem[]
): { conflict: boolean; conflictingClass?: string } {
  // Convert "HH:mm" to minutes since midnight
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const newBlocks = newSchedule.map(s => {
    const start = timeToMinutes(s.time);
    return {
      type: s.type,
      day: s.day,
      date: s.date,
      start,
      end: start + newDuration
    };
  });

  for (const existing of existingClasses) {
    if (existing.isDeleted) continue;
    const existingDuration = existing.duration || 60;
    
    for (const exEntry of existing.schedule) {
      const exStart = timeToMinutes(exEntry.time);
      const exEnd = exStart + existingDuration;

      for (const newBlock of newBlocks) {
        // Check if days overlap (simplified: assume specific dates don't easily cross weekly without full date math, 
        // for MVP we check if both are weekly and same day, or specific on same date)
        let dayOverlap = false;
        if (newBlock.type === 'weekly' && exEntry.type === 'weekly' && newBlock.day === exEntry.day) {
            dayOverlap = true;
        } else if (newBlock.type === 'specific' && exEntry.type === 'specific' && newBlock.date === exEntry.date) {
            dayOverlap = true;
        } else if (newBlock.type === 'weekly' && exEntry.type === 'specific' && newBlock.day === new Date(exEntry.date!).getDay()) {
            dayOverlap = true;
        } else if (newBlock.type === 'specific' && exEntry.type === 'weekly' && new Date(newBlock.date!).getDay() === exEntry.day) {
            dayOverlap = true;
        }

        if (dayOverlap) {
          // Check time overlap: Start A < End B && End A > Start B
          if (newBlock.start < exEnd && newBlock.end > exStart) {
            return { conflict: true, conflictingClass: existing.name };
          }
        }
      }
    }
  }

  return { conflict: false };
}
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add utils/scheduleConflict.ts
git commit -m "feat: add schedule conflict detection utility"
```

---

### Task 3: Integrate Validation into AddClassSheet

**Files:**
- Modify: `components/sheets/AddClassSheet.tsx`
- Modify: `app/courses.tsx`
- Modify: `app/index.tsx`

**Step 1: Modify AddClassSheet payload to include duration**

In `AddClassSheet.tsx`:
1. Add `const [duration, setDuration] = useState<number>(60);`
2. Pass `duration` to `onAdd`.
3. Add a basic TextInput for duration (or simple picker).

**Step 2: Add validation logic before saving**

In `AddClassSheet.tsx`, inside `handleSave`:

```typescript
import { hasScheduleConflict } from '../../utils/scheduleConflict';
import { Alert, Platform } from 'react-native';

// ... inside handleSave before calling onAdd
const existingMemberClasses = classes.filter(c => c.memberId === memberId && c.id !== initialData?.id);
const { conflict, conflictingClass } = hasScheduleConflict(parsedSchedule, duration, existingMemberClasses);

if (conflict) {
  const msg = `冲突提示：该时间段与 [${conflictingClass}] 的上课时间重合，请修改时间后重试。`;
  if (Platform.OS === 'web') alert(msg);
  else Alert.alert('时间冲突', msg);
  return;
}
```
*(Note: Requires passing `classes` prop into `AddClassSheet`)*

**Step 3: Update parent screens to pass `classes`**

In `app/courses.tsx` and `app/index.tsx`, pass `classes={allClasses}` to `<AddClassSheet />`.

**Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add components/sheets/AddClassSheet.tsx app/courses.tsx app/index.tsx
git commit -m "feat: enforce schedule conflict validation in AddClassSheet"
```

---

### Task 4: UI Enhancements (Duration Picker and Display)

**Files:**
- Modify: `components/sheets/AddClassSheet.tsx`
- Modify: `components/classes/ClassCard.tsx`

**Step 1: Add simple duration picker UI in AddClassSheet**

```tsx
// Below unit type selector in AddClassSheet.tsx
<Text style={styles.label}>{t.duration} (分钟)</Text>
<TextInput
  style={styles.input}
  value={duration.toString()}
  onChangeText={(text) => setDuration(parseInt(text) || 60)}
  keyboardType="numeric"
/>
```

**Step 2: Display duration in ClassCard**

Modify `components/classes/ClassCard.tsx`:
```tsx
// Inside ClassCard render
<Text style={styles.memberText}>
  {member?.name || 'Member'} · {formatSchedule(item.schedule, lang as 'zh-CN' | 'en-US')} {item.duration ? `(${item.duration}分钟)` : ''}
</Text>
```

**Step 3: Commit**

```bash
git add components/sheets/AddClassSheet.tsx components/classes/ClassCard.tsx
git commit -m "feat: show duration picker in sheet and duration info in class card"
```
