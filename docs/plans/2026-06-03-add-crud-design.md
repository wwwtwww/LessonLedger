# Design Document: Add Member and Add Class Functionality

## 1. Overview
This document outlines the design for adding new members and new classes to the LessonLedger application. The design preserves the existing i18n logic, minimalist UI style, visual warning system, and check-in log functionality. The implementation will transition the static `members` and `classes` lists to dynamic state variables.

## 2. Architecture & Components
To maintain a clean `app/index.tsx`, the new modal interfaces will be extracted into a dedicated `components/` directory.

### 2.1 File Structure
- `components/AddMemberModal.tsx`
- `components/AddClassModal.tsx`
- `app/index.tsx` (Modified to import and manage modals)

### 2.2 Component Responsibilities
- **`AddMemberModal`**:
  - **Props**: `visible`, `onClose`, `onAdd` (returns new member data), `t` (i18n dictionary).
  - **State**: `name`, `icon` (emoji), `themeColor`.
  - **Features**: Includes a color picker providing a selection of aesthetically pleasing preset colors.
- **`AddClassModal`**:
  - **Props**: `visible`, `onClose`, `onAdd` (returns new class data), `members` (for assignment), `t`.
  - **State**: `name`, `totalPrice`, `totalLessons`, `schedule`, `memberId`.
  - **Features**: Includes a horizontal scrollable list of member capsule buttons to act as a radio group for assigning the class.

## 3. UI/UX Changes in `app/index.tsx`
- **Add Member Button**: A dashed-border button appended to the far right of the horizontal member selection list.
- **Add Class Button**: A prominent primary button placed below the dynamic asset dashboard and above the class list.
- Both buttons will toggle their respective state variables (`isAddMemberVisible`, `isAddClassVisible`) to show the modals.

## 4. Data Flow & State Management
- Update `const [members] = useState(...)` to `const [members, setMembers] = useState(...)`.
- The `onAdd` callbacks will generate unique IDs (e.g., `m${Date.now()}`) and append the new objects to the respective arrays using the spread operator to trigger re-renders.
- Default values for new classes: `doneLessons: 0`, `unitType: 'lesson'`.

## 5. Validation
- **Member**: `name` is required. `themeColor` selection is required. `icon` defaults to 👤 if empty.
- **Class**: `name` and `memberId` are required. `totalPrice` and `totalLessons` will be parsed as numbers (defaulting to 0 if invalid).

## 6. Internationalization (i18n)
New keys will be added to the `i18n` dictionary in `app/index.tsx`:
- `addMember`, `addCourse`, `name`, `icon`, `color`, `courseName`, `cost`, `totalHours`, `schedule`, `bindMember`, `cancel`, `confirm`.
- Both 'zh-CN' and 'en-US' translations will be provided.
