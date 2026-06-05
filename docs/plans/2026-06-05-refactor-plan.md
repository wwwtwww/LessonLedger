推荐目录结构
app/
└── index.tsx                 // Orchestrator

components/
├── dashboard/
│   ├── DashboardHeader.tsx
│   ├── SummaryCard.tsx
│   ├── MemberSwitcher.tsx
│   └── WarningClasses.tsx
│
├── classes/
│   ├── ClassCard.tsx
│   ├── ClassProgress.tsx
│   ├── ClassSwipeActions.tsx
│   └── ClassDetailSheet.tsx
│
├── members/
│   ├── MemberAvatar.tsx
│   ├── MemberCard.tsx
│   ├── MemberMenuSheet.tsx
│   └── MemberEditorSheet.tsx
│
├── logs/
│   ├── LogItem.tsx
│   └── LogList.tsx
│
├── sheets/
│   ├── AddClassSheet.tsx
│   ├── EditClassSheet.tsx
│   ├── ScheduleSheet.tsx
│   └── AddMemberSheet.tsx
│
└── ui/
    ├── GlassHeader.tsx
    ├── GradientCard.tsx
    ├── ProgressBar.tsx
    ├── EmptyState.tsx
    └── SectionTitle.tsx

hooks/
├── useMembers.ts
├── useClasses.ts
├── useNotifications.ts
└── useDashboard.ts

utils/
├── supabase.ts
├── notifications.ts
└── colors.ts
页面拆解
Dashboard

对应设计稿第一页

┌─────────────────────┐
│ Glass Header        │
├─────────────────────┤
│ Member Switcher     │
├─────────────────────┤
│ Summary Cards       │
├─────────────────────┤
│ Warning Classes     │
├─────────────────────┤
│ Recent Check-ins    │
└─────────────────────┘

组件树：

<SafeAreaView>
  <GlassHeader />

  <MemberSwitcher />

  <SummaryCard />

  <WarningClasses />

  <RecentLogs />
</SafeAreaView>
Dashboard Header

对应设计稿顶部毛玻璃

<BlurView intensity={60}>
  <Text>LessonLedger</Text>
  <NotificationButton />
</BlurView>

依赖：

expo-blur
react-native-safe-area-context
成员切换器

对应顶部头像区域

<MemberSwitcher>
   😀 小明
   👧 小红
   👩 妈妈
</MemberSwitcher>

动画：

react-native-reanimated

效果：

点击切换
背景渐变过渡
当前成员放大
scale: withSpring(1.1)
长按菜单

对应设计稿里的成员管理菜单

编辑成员
切换主题色
删除成员

实现：

<MemberMenuSheet />

调用：

onLongPress={()=>{
  bottomSheetRef.current?.present()
}}
课程列表

设计稿第二页

┌────────────┐
│ 钢琴课     │
│ 剩余6课时  │
├────────────┤
│ 数学辅导   │
│ 剩余2课时  │
└────────────┘

组件：

<ClassCard />
课时进度条
<ClassProgress />

计算：

const remain =
totalLessons - doneLessons

const progress =
doneLessons / totalLessons

显示：

██████░░░░
60%
红色预警

PRD要求：

剩余课时 < 3

逻辑：

remain <= 3

UI：

borderColor="#EF4444"
<Text style={{color:"#EF4444"}}>
  剩余2课时
</Text>
课程侧滑

设计稿里的蓝红按钮

← 编辑
← 删除

组件：

<Swipeable />

依赖：

react-native-gesture-handler

效果：

renderRightActions()

显示：

[编辑]
[删除]
添加课程 Bottom Sheet

设计稿第四页

<AddClassSheet />

字段：

课程名称
所属成员
总价格
总课时
单位

对应数据模型：

ClassItem
排期设置 Sheet

设计稿里的时间选择器

每周重复
指定日期

组件：

<ScheduleSheet />

对应：

ScheduleEntry[]

数据结构：

{
  type:'weekly',
  day:1,
  time:'18:00'
}
打卡日志页

设计稿第五页

今天

小明
钢琴课
消课1次

昨天

小红
英语课
消课1次

组件：

<LogList />

结构：

<LogItem />
数据看板

新增 Roadmap 功能

建议使用：

react-native-gifted-charts

页面：

消费占比
课程占比
成员活跃度

组件：

<ExpensePieChart />
<MonthlyTrendChart />
颜色系统

建立统一 Theme

export const COLORS = {
  primary: '#6366F1',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
}
下一步最值得做的

你的项目已经有：

✅ Supabase
✅ Members CRUD
✅ Classes CRUD
✅ BottomSheet
✅ Notifications
✅ i18n

我建议下一阶段直接开发：

Sprint 1（UI重构）
Glass Header
Member Switcher动画
新版Dashboard
Swipe课程卡片
Sprint 2（体验升级）
Haptics
主题色系统
Skeleton Loading
Empty State
Sprint 3（Roadmap）
消费统计图
月度趋势图
成员维度分析