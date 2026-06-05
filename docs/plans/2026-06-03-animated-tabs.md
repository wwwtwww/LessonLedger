# Animated Member Tabs Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add smooth, native-feeling color and layout transition animations to the MemberTabs component when selecting different members.

**Architecture:** 
1. Since `react-native-reanimated` is already installed, we will use it to animate the background color and text color of the tabs.
2. We will convert the `<TouchableOpacity>` and `<Text>` elements inside `MemberTabs.tsx` to `Animated.createAnimatedComponent(TouchableOpacity)` and `Animated.Text`.
3. We will use `useAnimatedStyle` and `withTiming` or `withSpring` to smoothly transition the background from transparent/white to the member's theme color when selected.

**Tech Stack:** React Native, `react-native-reanimated`

---

### Task 1: Refactor MemberTabs for Reanimated

**Files:**
- Modify: `components/ui/MemberTabs.tsx`

**Step 1: Create AnimatedTab Component**
Instead of animating inline, create an internal `AnimatedTab` sub-component within the file. This allows each tab to manage its own animation state independently based on whether it is `isSelected`.

```tsx
import Animated, { useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Inside the file, but outside the main component:
interface AnimatedTabProps {
  isSelected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  text: string;
  themeColor: string;
  defaultBgColor: string;
}

const AnimatedTab: React.FC<AnimatedTabProps> = ({ isSelected, onPress, onLongPress, text, themeColor, defaultBgColor }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(isSelected ? themeColor : defaultBgColor, { duration: 250 }),
      borderColor: withTiming(isSelected ? 'transparent' : '#E2E8F0', { duration: 250 }),
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      color: withTiming(isSelected ? '#FFFFFF' : '#64748B', { duration: 250 }),
    };
  });

  return (
    <AnimatedTouchableOpacity 
      style={[styles.memberTab, animatedStyle]} 
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Animated.Text style={[styles.memberTabText, textAnimatedStyle]}>
        {text}
      </Animated.Text>
    </AnimatedTouchableOpacity>
  );
};
```

**Step 2: Update Main MemberTabs Component**
Replace the static `TouchableOpacity` maps with the new `AnimatedTab` component.
- The "All" tab uses `themeColor="#0F172A"`.
- Member tabs use `themeColor={m.themeColor}`.

**Step 3: Test Animation**
Verify that tapping different tabs produces a smooth fade in/out of the background color and text color, rather than a harsh instant switch.

**Step 4: Commit**
```bash
git add components/ui/MemberTabs.tsx
git commit -m "feat(ui): add smooth color transitions to member tabs using reanimated"
```