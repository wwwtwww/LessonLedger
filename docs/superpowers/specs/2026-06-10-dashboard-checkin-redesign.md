# 全局 UI 重构 — 聚焦打卡体验

## 问题

当前 Dashboard 只有「预警课程（剩余≤3）」才显示打卡按钮。正常课程打卡需要：打开 Drawer → 课程页 → 找课程 → 点打卡，共 3-4 步。用户 70% 的打卡是固定排期的日常课，每次都走长路径。

**目标**：打开 App 后 1 步完成打卡。

## 导航架构变更

### 从 Drawer → 底部 Tab 导航

| 变更 | 原状态 | 新状态 |
|------|--------|--------|
| 导航方式 | Drawer 抽屉（4页） | Bottom Tabs（3个Tab） |
| 侧边栏 | CustomDrawerContent | **移除** |
| 语言切换 | Drawer 底部 | 移至 Tab3 资料页 |
| 各页面独立 Header | GlassHeader + AppHeader | GlassHeader 保留（Tab1），Tab2/Tab3 普通 Header |

### 新导航结构

```
BottomTabNavigator
├── Tab 1: 🏠 首页    → app/index.tsx   （Dashboard：今日课程打卡）
├── Tab 2: 📚 课程    → app/courses.tsx  （全部课程列表）
└── Tab 3: 👤 资料    → app/profile.tsx  （新的，整合成员+日志入口）
```

### Tab3 资料页布局

```
┌──────────────────────────────┐
│ 👤 资料                       │
├──────────────────────────────┤
│                              │
│ 👥 家庭成员                   │
│  ┌────────────────────────┐  │
│  │ 👦 小明 · 🟣          │  │  ← 保留现有成员卡片
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 👧 小红 · 🔵          │  │
│  └────────────────────────┘  │
│  [+ 添加成员]                │
│                              │
│ 📝 最近打卡                   │
│  👦 🎹 钢琴 -1 · 2小时前     │
│  👧 📐 数学 -1 · 昨天        │
│  📋 查看全部打卡日志 →       │  ← router.push('/logs')
│                              │
│ 🌐 语言: 中文 / English       │  ← 语言切换
└──────────────────────────────┘
```

## Tab1 首页 Dashboard 布局

展示所有成员的课程，不按成员过滤。每张卡片通过头像/昵称区分归属。

```
┌──────────────────────────────────────┐
│  6月10日 周三                        │  ← 日期标题
├──────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┐    │
│  │ 总支出   │ 总消耗   │ 剩余     │    │  ← 汇总统计卡片
│  │ ¥8,800  │ 24课时   │ 36课时  │    │
│  └─────────┴─────────┴─────────┘    │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 👦 小明 🎹 钢琴      18:00    │  │  ← 显示成员名
│  │     剩余 12 课时      [打卡]  │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ 👧 小红 📐 数学      16:00    │  │
│  │     剩余 5 次         [打卡]  │  │
│  └────────────────────────────────┘  │
│  ┌────────── ⚠️ ─────────────────┐  │
│  │ 👦 小明 🎨 美术      15:30    │  │  ← 预警红色高亮
│  │     剩余 1 课时 ⚠️    [打卡]  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📋  全部课程 (5门，足球剩8)    │  │  ← 跳转 Tab2
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### 各区域变更

| 区域 | 原状态 | 新状态 |
|------|--------|--------|
| 汇总统计卡片 | FitnessSummaryCards 三张大卡 | **保留**，Dashboard 顶部展示 |
| 预警课程区域 | WarningSection 独立区域 | **融入** 今日课程（红色高亮） |
| 近期打卡日志 | LogList 组件 | **移除**，移至 Tab3 资料页 |
| 今日课程区域 | 无 | **新增**，Dashboard 核心 |
| 成员切换器 | 横向滚动大按钮 | **移除**，Dashboard 展示所有成员课程 |
| GlassHeader | Dashboard 使用 | **保留** Tab1，Tab2/Tab3 不使用 |
| AddClassSheet | 存在 | **保留** 不变 |
| AddMemberSheet | 存在 | **保留** 不变 |

## 卡片状态

### 1. 正常排期卡片
- 白色背景 + 紫色(#6366F1)圆角打卡按钮
- 显示：成员头像、课程名、成员名、上课时间、剩余课时
- `schedule[].type === 'weekly' && day === 今天星期几`
- `schedule[].type === 'specific' && date === 今天日期`

### 2. 预警卡片（剩余 ≤ 3）
- 浅红背景 #FFF5F5 + #FECACA 边框
- 红色(#EF4444)打卡按钮
- ⚠️ 剩余数字红色高亮

### 3. 已打卡卡片
- 灰色背景 #F8FAFC + 半透明
- 灰色按钮「已打卡」
- 课程名删除线 + ✅ 标记
- 判断依据：今日 logs 表中存在该课程 ID 记录

### 4. 空状态（今日无排期课程）
- 标题切换为「近期课程」
- 展示未来7天内的排期课程（同样的卡片样式，按日期分组）
- 如果未来7天也没有，降级显示全部活跃课程
- 完全无课程：引导「添加第一门课程」

### 5. 无成员状态
- 引导「添加第一个家庭成员」

## 今日课程匹配逻辑

Dashboard 展示**所有成员**的今日排期课程，不按当前成员过滤。

新 Hook（提取或扩展）：
```typescript
function getTodayScheduledClasses(allClasses: ClassItem[]): ClassItem[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=周日
  const dateStr = today.toISOString().slice(0, 10);

  return allClasses.filter(c => {
    if (c.isDeleted) return false;
    if (c.doneLessons >= c.totalLessons) return false;
    return c.schedule.some(s =>
      (s.type === 'weekly' && s.day === dayOfWeek) ||
      (s.type === 'specific' && s.date === dateStr)
    );
  });
}
```

已打卡判断：查询 `logs` 表中当天 classId 的记录。

需要从 `useDashboard` 获取 `allClasses`（未过滤的课程列表）而非 `filteredClasses`。

## 组件拆分

### 新增组件
- `components/dashboard/TodayClasses.tsx` — 今日课程列表主组件
- `components/dashboard/ClassCheckInCard.tsx` — 单门课程打卡卡片

### 新增页面
- `app/profile.tsx` — Tab3 资料页（成员列表 + 最近日志 + 语言切换）

### 保留组件
- `components/ui/GlassHeader.tsx` — Tab1 使用
- `components/ui/AppHeader.tsx` — 调整为通用 Header 组件
- `components/sheets/AddClassSheet.tsx` — 不变
- `components/sheets/AddMemberSheet.tsx` — 不变
- `components/classes/ClassCard.tsx` — Tab2 课程列表使用（移除打卡按钮）
- `components/logs/LogList.tsx` — Tab3 资料页使用

### 移除组件
- `components/dashboard/WarningSection.tsx` — 功能融入 TodayClasses
- `components/dashboard/SummaryCard.tsx` — 不再使用
- `components/dashboard/MemberTabs.tsx` — 不再使用
- `components/dashboard/MemberSwitcher.tsx` — 不再使用
- `components/ui/CustomDrawerContent.tsx` — Drawer 已移除

### 修改组件
- `components/classes/ClassCard.tsx` — 移除打卡按钮（打卡移至首页）
- `components/ui/AppHeader.tsx` — 去除 Drawer 菜单相关逻辑

## 路由

```
RootLayout (_layout.tsx)
  └── BottomTabNavigator
      ├── Tab "首页" → app/index.tsx
      ├── Tab "课程" → app/courses.tsx
      └── Tab "资料" → app/profile.tsx
          └── (Stack 或 Modal)
              ├── app/logs.tsx         （查看全部日志）
              └── app/members.tsx      （完整成员管理，可选）
```

- `_layout.tsx`：Drawer 替换为 BottomTabs
- `index.tsx`：只改造 Dashboard 内容（已设计）
- `courses.tsx`：移除课程卡片中的打卡按钮
- `profile.tsx`：新建，整合成员 + 日志
- `logs.tsx`：保留，作为 profile 的二级页面
- `members.tsx`：**移除**，功能融入 `profile.tsx`

## 国际化

新增文案：
- `tabHome`: '首页' / 'Home'
- `tabCourses`: '课程' / 'Courses'
- `tabProfile`: '资料' / 'Profile'
- `todayClasses`: '今日课程' / "Today's Classes"
- `upcomingClasses`: '近期课程' / "Upcoming Classes"
- `noClassToday`: '今天没有排课' / "No classes today"
- `checkedIn`: '已打卡' / "Checked In"
- `viewAllCourses`: '查看全部课程' / "View All Courses"
- `addFirstClass`: '添加第一门课程' / "Add Your First Class"
- `recentLogs': '最近打卡' / "Recent Logs"
- `viewAllLogs': '查看全部打卡日志' / "View All Logs"

移除文案：
- Drawer 菜单项相关
- WarningSection 相关
- MemberSwitcher 相关
- `allMembersFilter`

## 不涉及

- 打卡核心逻辑 `handleCheckIn` 不变
- 打卡后动画/触感反馈不变
- Supabase 同步逻辑不变
- 通知系统不变
- useClasses / useMembers / useDashboard hooks 核心逻辑不变（可能有接口调整）
