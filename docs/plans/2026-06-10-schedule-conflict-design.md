# Schedule Conflict Prevention Design

**Date:** 2026-06-10
**Goal:** Prevent scheduling conflicts by ensuring different courses for the same member do not overlap in time.

## 1. Data Model & Architecture (Data Flow)

To accurately calculate time overlaps, the system needs to know the duration of a course.

- **Type Definition (`types/index.ts`)**: Add a `duration` field to the `ClassItem` interface representing minutes.
  ```typescript
  export interface ClassItem {
    // ... existing fields
    duration?: number; // Duration in minutes (e.g., 60)
  }
  ```
- **Supabase Database**: Add a `duration` column to the `classes` table.
  ```sql
  ALTER TABLE classes ADD COLUMN duration INT DEFAULT 60;
  ```

## 2. UI Components

- **Add/Edit Course Form (`AddClassSheet.tsx`)**:
  - Add a "Duration" input/picker. Default to 60 minutes.
  - When saving, include the `duration` in the payload.
- **Course Card (`ClassCard.tsx` / `SwipeableItem` inner content)**:
  - Display the duration alongside the schedule time (e.g., "Mon 10:00 (60min)").

## 3. Conflict Detection & Error Handling

- **Timing**: Validation occurs within `AddClassSheet` right before calling the `onSave` callback.
- **Algorithm**:
  1. Fetch all active (`isDeleted: false`) courses for the currently selected `memberId`.
  2. Parse the new course's `ScheduleEntry` items and calculate the start and end times based on the chosen `duration`.
  3. Compare these time windows against the time windows of the existing courses.
  4. Handle intersections for both `weekly` and `specific` types. For `specific` dates, identify the day of the week to check against `weekly` recurring classes.
- **Error Handling (Hard Block)**:
  - If `Start A < End B` and `End A > Start B`, a conflict exists.
  - Block the save operation.
  - Display an Alert/Toast: *"Conflict: This time overlaps with [Existing Course Name]. Please choose a different time."*

## 4. Testing Strategy

- **Happy Path**: Same member, non-overlapping times (10:00-11:00 and 11:30-12:30).
- **Conflict Path**: Same member, overlapping times (10:00-11:00 and 10:30-11:30). Should be blocked.
- **Edge Case (Back-to-back)**: Same member, adjacent times (10:00-11:00 and 11:00-12:00). Should succeed.
- **Cross-Type**: `specific` single class overlaps with a `weekly` class on the same day of the week.
- **Isolation**: Overlapping times, but assigned to *different* members. Should succeed.
