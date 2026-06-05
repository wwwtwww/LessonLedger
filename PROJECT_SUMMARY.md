# LessonLedger 项目概要

## 1. 项目定位
LessonLedger 是一个轻量级的课时管理移动应用，旨在帮助家庭和个人透明化管理各类课程资产。它支持多成员统筹、多语种切换，并提供防纠纷的打卡日志凭证。

## 2. 已实现核心功能 (Feature List)
- **多成员管理 (CRUD)**: 
  - 支持创建成员，配置专属图标（Emoji）和主题色。
  - **交互升级**：支持长按成员头像唤起菜单，且在不同成员间切换时拥有丝滑的渐变动画过渡。
- **动态课时账本 (CRUD)**:
  - 核心消课打卡：实时计算剩余课时，支持“课时”和“次”两种单位。
  - **侧滑操作**：课程列表支持原生侧滑手势，快速进行编辑或删除。
  - **预警系统**：当课时少于 3 课时时，UI 自动变红预警。
- **智能排期与提醒 (Schedule & Notifications)**:
  - 弃用手动输入，引入结构化的时间选择器（支持按周重复或单次指定日期）。
  - 内置基于 `expo-notifications` 的本地推送引擎，自动解析排期并在上课前 2 小时发送手机系统通知。打卡、删改课程时闹钟自动顺延或清理。
- **沉浸式原生体验 (Premium Native UX)**:
  - 引入 `react-native-safe-area-context` 完美避开 Android/iOS 的状态栏和刘海屏。
  - 采用顶部毛玻璃（Glassmorphism）悬浮导航栏，提供极致的视差滚动美感。
  - 所有表单弹窗全面升级为基于 `@gorhom/bottom-sheet` 的底层抽屉，且在 Web 端自动优雅降级为高仿真 Modal。
- **数据看板 (Dashboard)**:
  - 实时汇总总支出、活跃课程总数及全员剩余课时。
  - 支持按成员筛选视图。
- **打卡日志系统**: 自动记录每次消课的时间、成员及变动详情。
- **国际化 (i18n)**: 深度集成中英文双语环境，支持实时切换。

## 3. 架构设计 (Architecture)

项目采用 **"Orchestrator-Hooks-UI"** 分层架构，实现了业务逻辑与展现层的深度解耦：

### 3.1 核心分层
- **Context 层 (`LanguageContext`)**: 提供全局的国际化状态和 `t` 翻译函数，是整个应用的最底层支撑。
- **Hooks 逻辑层**:
  - `useMembers`: 管理全量成员状态，对外暴露过滤后的 `visibleMembers` 及 CRUD 操作方法。
  - `useClasses`: 依赖 `members` 状态，负责课程过滤、资产统计、消课逻辑、日志生成以及**本地通知的生命周期管理**。
- **Services 服务层**:
  - `utils/supabase.ts`: 处理与 Supabase 的连接及 SSR 安全的本地缓存。
  - `utils/notifications.ts`: 封装底层通知 API 和复杂的时间推算算法。
- **Orchestrator (容器层 - `app/index.tsx`)**: 作为纯净的调度中心，通过 Hooks 获取数据并分发给各 UI 组件，并负责初始化时的并发请求及默认数据写入。
- **UI 组件层**: 
  - `components/ui/`: 纯展示组件。
  - `components/`: 功能性底部抽屉，内置表单状态管理。

### 3.2 数据流向 (Data Flow)
1. **初始化**: `app/index.tsx` 并行调用 API 获取全量数据，若检测到空库，强制执行写入引导流程。
2. **状态联动**: 当 `useMembers` 中的成员被逻辑删除时，`useClasses` 内部的 `useMemo` 会自动重新计算，从 UI 中同步隐藏该成员的所有课程，并更新 `SummaryCard` 的总资产统计。
3. **操作反馈**: 
   - 用户触发事件 -> 调用 Hook 方法 -> 清洗冗余字段并映射为纯小写 (Postgres 兼容) -> 发起 Supabase 请求。
   - 请求成功后 -> 同步更新本地状态，触发全应用响应式重绘。

## 4. 技术栈 (Tech Stack)
- **Framework**: Expo (SDK 54), React Native (0.81.5)
- **Backend**: Supabase (Cloud Database, UUIDs, JSONB)
- **Storage**: `@react-native-async-storage/async-storage` (Web SSR Safe)
- **Language**: TypeScript (严格模式)
- **Animations/Gestures**: `react-native-gesture-handler`, `react-native-reanimated`, `@gorhom/bottom-sheet`
- **Notifications**: `expo-notifications`
- **Haptics**: `expo-haptics` (物理触感反馈)

## 5. 核心数据模型 (Data Models)
```typescript
interface Member {
  id: string; // Supabase UUID
  name: string;
  icon: string;
  themeColor: string;
  isDeleted?: boolean;
}

interface ScheduleEntry {
  type: 'weekly' | 'specific';
  day?: number;    // 0-6
  date?: string;   // YYYY-MM-DD
  time: string;    // HH:mm
}

interface ClassItem {
  id: string; // Supabase UUID
  memberId: string;
  name: string;
  totalPrice: number;
  totalLessons: number;
  doneLessons: number;
  unitType: 'lesson' | 'session';
  schedule: ScheduleEntry[]; // JSONB 格式存储
  notificationIds?: string[]; // 本地闹钟索引
  isDeleted?: boolean;
}
```

## 6. 路线图 (Roadmap)
- [x] **数据持久化**: 接入 Supabase 云端数据库，实现了成员、课程和日志的云端存储与实时同步。
- [x] **提醒功能**: 实现基于结构化时间的课前 2 小时自动本地推送通知。
- [x] **高级原生 UI**: 引入 Bottom Sheet、毛玻璃头部、安全区适配及色彩过渡动画。
- [ ] **统计报表**: 增加消费和消耗的可视化图表（按成员/月份维度的饼图与趋势图）。
