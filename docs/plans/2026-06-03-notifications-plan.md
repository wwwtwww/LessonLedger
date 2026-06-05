# Local Notifications Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a local push notification system that parses class schedules and alerts users 2 hours before a lesson.

**Architecture:** 
1. Use `expo-notifications` for scheduling and displaying local push notifications.
2. Create a dedicated `utils/notifications.ts` service to handle permission requests, time calculations (parsing `ScheduleEntry[]`), scheduling, and cancellation.
3. Update the Supabase `classes` table and `types/index.ts` to include `notificationIds: string[]`.
4. Integrate the service into `app/index.tsx` (for initialization) and `hooks/useClasses.ts` (to trigger scheduling/canceling during CRUD operations).

**Tech Stack:** Expo Notifications, React Native

---

### Task 1: Update Types and Database Schema

**Files:**
- Modify: `types/index.ts`
- Create: `scripts/update-schema-notifications.mjs`

**Step 1: Update Types**
Add `notificationIds?: string[];` to the `ClassItem` interface in `types/index.ts`.
Also update `Omit<ClassItem, ...>` in `useClasses.ts` if necessary, to exclude `notificationIds` from the initial insert payload.

**Step 2: Create Schema Update Script**
Create `scripts/update-schema-notifications.mjs` to add the column to Supabase:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_URL_HERE'; // The implementer must replace this
const supabaseAnonKey = 'YOUR_KEY_HERE'; // The implementer must replace this

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Adding notificationIds column...');
  // We use a raw query or RPC if possible, but since we don't have direct SQL exec via JS client without RPC,
  // we will instruct the developer to run the SQL manually or we assume it's done.
  // Actually, we'll just write the SQL they need to execute.
}
```
*Wait, since we can't execute DDL via the standard Supabase JS client without an RPC, the implementer subagent will just output the SQL for the user to run in the Supabase Dashboard, and then update the TypeScript types.*

**Refined Step 2: Output SQL and update types**
Instead of a script, the task is to just update `types/index.ts` and provide the SQL for the user.

**Step 3: Commit**
```bash
git add types/index.ts
git commit -m "feat: add notificationIds to ClassItem type"
```

---

### Task 2: Create Notification Service (Time Calculation & API Wrapper)

**Files:**
- Create: `utils/notifications.ts`

**Step 1: Implement the Service**
Create `utils/notifications.ts`.
Import `* as Notifications from 'expo-notifications';`.
Configure the handler to show alerts when the app is in the foreground:
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

Implement `requestPermissionsAsync`:
```typescript
export async function requestPermissionsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}
```

Implement a helper to calculate the next trigger date:
`calculateNextTrigger(entry: ScheduleEntry): Date | null`. It should calculate the next occurrence of the day/time, subtract 2 hours, and return a Date object.

Implement `scheduleClassReminders(classItem: ClassItem, memberName: string): Promise<string[]>`:
- Iterate over `classItem.schedule`.
- For each entry, calculate the trigger date.
- Call `Notifications.scheduleNotificationAsync`.
- Collect and return all notification IDs.

Implement `cancelReminders(ids: string[])`:
- Loop through IDs and call `Notifications.cancelScheduledNotificationAsync(id)`.

**Step 2: Commit**
```bash
git add utils/notifications.ts
git commit -m "feat: implement local notification service and scheduling algorithms"
```

---

### Task 3: Integrate Initialization in Main App

**Files:**
- Modify: `app/index.tsx`

**Step 1: Request Permissions on Mount**
In `app/index.tsx`, import `requestPermissionsAsync` from `../utils/notifications`.
Inside the existing `useEffect` (or a new one), call it when the app starts.

**Step 2: Commit**
```bash
git add app/index.tsx
git commit -m "feat: request notification permissions on app start"
```

---

### Task 4: Integrate Scheduling into Hooks

**Files:**
- Modify: `hooks/useClasses.ts`

**Step 1: Update handleAddClass**
- Import the notification service.
- After successfully inserting a class, call `scheduleClassReminders(newClass, ownerName)`. Note: you need to find the member name.
- If it returns IDs, perform a second update to Supabase to save `notificationIds`.

**Step 2: Update handleUpdateClass**
- If the schedule changed, cancel the old reminders (using `item.notificationIds`), schedule new ones, and update the DB with the new IDs.

**Step 3: Update handleDeleteClass**
- Cancel existing reminders before setting `isDeleted`.

**Step 4: Update handleCheckIn**
- Cancel old reminders and schedule new ones for the next week.

**Step 5: Commit**
```bash
git add hooks/useClasses.ts
git commit -m "feat: integrate notification scheduling into CRUD operations"
```
