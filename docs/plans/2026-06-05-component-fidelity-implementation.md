# Component Fidelity Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 按照 LESSONLEDGER_COMPONENT_SPEC.md 100% 还原 UI 组件，校准物理尺寸、动效参数及交互反馈。

**Architecture:** 
- 全局布局对齐 390px/430px 移动优先标准。
- 组件级重构：Header, Summary, Switcher, Warning, Logs。
- 注入 reanimated 弹簧动效与 expo-haptics 触感。

**Tech Stack:** React Native (Expo), reanimated, expo-blur, expo-haptics, utils/colors.ts.

---

### Task 1: 全局样式与触感基准 (Global Alignment)

**Files:**
- Modify: `utils/colors.ts`
- Modify: `utils/haptics.ts`
- Modify: `app/index.tsx`

**Step 1: 校准全局参数**
确保圆角基础为 `24px`，间距单位为 `8px`。在 `app/index.tsx` 中锁定内容容器 `maxWidth: 430`。

**Step 2: 实现规范触感反馈**
更新 `utils/haptics.ts` 以映射规范定义的反馈级别。

**Step 3: Commit**
```bash
git add utils/colors.ts utils/haptics.ts app/index.tsx
git commit -m "style: align global foundation with component spec"
```

---

### Task 2: 精修 Glass Header (Header)

**Files:**
- Modify: `components/ui/GlassHeader.tsx`

**Step 1: 还原玻璃质感**
高度 `72px`，背景 `rgba(255,255,255,0.3)`，模糊强度 `60`。

**Step 2: 挂载渐显动效**
使用 `reanimated` 实现 200ms 的淡入效果。

**Step 3: Commit**
```bash
git add components/ui/GlassHeader.tsx
git commit -m "feat: refine GlassHeader with fidelity parameters and fade-in animation"
```

---

### Task 3: 响应式统计卡片 (Summary Section)

**Files:**
- Modify: `components/dashboard/FitnessSummaryCards.tsx`

**Step 1: 校准卡片物理尺寸**
高度 `120px`，圆角 `24px`，内边距 `16px`。

**Step 2: 注入按压动效与排版**
实现 1.0 -> 1.02 的按压缩放（120ms）。对齐 Icon (左上), Value (中), Label (左下) 的排版。

**Step 3: Commit**
```bash
git add components/dashboard/FitnessSummaryCards.tsx
git commit -m "feat: refine SummaryCards with pressure feedback and spec alignment"
```

---

### Task 4: 物理动效成员切换器 (Member Switcher)

**Files:**
- Modify: `components/dashboard/MemberSwitcher.tsx`

**Step 1: 锁定 72x72 卡片规格**
对齐规范尺寸，间距 `16px`。

**Step 2: 重构 Spring 动效**
Spring(20, 180)，选中态 Scale 1.08。切换时触发 Medium impact。

**Step 3: Commit**
```bash
git add components/dashboard/MemberSwitcher.tsx
git commit -m "feat: refine MemberSwitcher with high-fidelity spring animations"
```

---

### Task 5: 高级预警课程卡片 (Warning Courses)

**Files:**
- Modify: `components/dashboard/WarningSection.tsx`

**Step 1: 重塑卡片阴影与布局**
高度 `160px`。阴影 `y:8, blur:30, rgba(0,0,0,0.08)`。

**Step 2: 进度条平滑过渡**
实现进度条填充的 250ms easeOut 动画。

**Step 3: Commit**
```bash
git add components/dashboard/WarningSection.tsx
git commit -m "feat: refine WarningSection cards with smooth progress and spec shadows"
```

---

### Task 6: 线性日志与全案闭环 (Logs & Sheets)

**Files:**
- Modify: `components/logs/LogList.tsx`
- Modify: `components/sheets/AddClassSheet.tsx`

**Step 1: 日志高度校准**
条目高度 `72px`。头像圆角 `20px`。增加 200ms 挂载渐显。

**Step 2: 底部弹窗规范化**
圆角 `32px`。Handle `40x5px`。保存按钮高度 `56px`，圆角 `16px`。

**Step 3: Commit**
```bash
git add components/logs/LogList.tsx components/sheets/AddClassSheet.tsx
git commit -m "feat: finalize component fidelity for logs and bottom sheets"
```
