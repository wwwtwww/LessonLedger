# LessonLedger 项目概要

## 1. 项目定位
LessonLedger 是一个轻量级的课时管理移动应用，旨在帮助家庭和个人透明化管理各类课程资产。它支持多成员统筹、多语种切换，提供防纠纷的打卡日志凭证，并具备离线优先的健壮架构。

## 2. 已实现核心功能 (Feature List)
- **多成员管理 (CRUD)**: 
  - 支持创建成员，配置专属图标（Emoji）和主题色。
  - **交互升级**：支持长按成员头像唤起菜单，不同成员间切换时拥有丝滑的渐变动画过渡。
- **动态课时账本 (CRUD)**:
  - 核心消课打卡：实时计算剩余课时，支持“课时”和“次”两种单位。
  - **排课与防冲突**：引入结构化的时间选择器（支持按周重复或指定日期），并内置**时间冲突检测算法**，硬性拦截同一成员的重叠课程。
  - **侧滑操作**：课程列表支持原生侧滑手势，快速进行编辑或删除。
  - **预警系统**：当课时少于 3 课时时，UI 自动变红预警。
- **边缘场景打卡闭环 (Edge Cases)**:
  - **带时间戳的补签**：支持长按呼出昨日未打卡列表，进行带真实时间戳的“补打卡”。
  - **秒级撤销**：打卡后底部提供具备倒计时的“撤销条”，防止误触扣除课时。
  - **请假记录**：支持记录“请假”日志而不扣除课时，方便与机构对账。
- **智能排期与提醒 (Schedule & Notifications)**:
  - 内置基于 `expo-notifications` 的本地推送引擎，自动解析排期并在上课前 2 小时发送手机系统通知。打卡、删改课程时闹钟自动顺延或清理。
- **沉浸式原生体验 (Premium Native UX)**:
  - 采用 **底部标签栏 (Bottom Tabs)** 导航架构。
  - 引入 `react-native-safe-area-context` 完美避开 Android/iOS 的状态栏和刘海屏。
  - 采用顶部毛玻璃（Glassmorphism）悬浮导航栏，提供极致的视差滚动美感。
  - 所有表单弹窗全面升级为基于 `@gorhom/bottom-sheet` 的底层抽屉，Web 端自动优雅降级为高仿真 Modal。
- **国际化 (i18n)**: 深度集成中英文双语环境，支持实时切换（包括各类 Alert 提示语）。

## 3. 架构设计 (Architecture)

项目采用 **"Orchestrator-Hooks-UI"** 分层架构，结合**离线优先 (Offline-First)** 原则，实现了业务逻辑与展现层的深度解耦：

### 3.1 核心分层
- **Context 层 (`LanguageContext`)**: 提供全局的国际化状态和 `t` 翻译函数。
- **Hooks 逻辑层**:
  - `useMembers` & `useClasses`: 管理状态流转，内置极其严格的 **乐观更新保护 (Optimistic UI with pessimistic lock)**，通过 `try...finally` 和 `pendingChanges` 计数器确保在弱网/断网环境下本地界面秒级响应且不被旧数据覆盖。
- **Services 服务层**:
  - `utils/syncQueue.ts`: 离线同步队列机制。所有写操作失败时自动入队，网络恢复时后台静默重放。
  - `utils/supabase.ts`: 处理与 Supabase 的连接及 SSR 安全的本地缓存。
  - `utils/scheduleConflict.ts`: 负责跨午夜、跨时区的排课冲突判定。
- **UI 组件层**: 功能性底部抽屉及独立卡片组件，内置局部表单状态管理。

### 3.2 数据流向 (Data Flow)
1. **优先缓存**: App 启动时瞬间加载 `AsyncStorage` 缓存以实现“秒开”，同时后台并发拉取 Supabase 云端数据进行对比更新。
2. **乐观反馈**: 用户打卡 -> 界面立即变更 -> 数据静默写入缓存和云端 -> 若断网则压入 `syncQueue`。

## 4. 技术栈 (Tech Stack)
- **Framework**: Expo (SDK 54), React Native (0.81.5), Expo Router (Tabs)
- **Backend**: Supabase (Cloud Database, UUIDs, JSONB)
- **Storage & Offline**: `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`
- **Language**: TypeScript (严格模式)
- **Animations/Gestures**: `react-native-gesture-handler`, `react-native-reanimated`, `@gorhom/bottom-sheet`
- **Notifications**: `expo-notifications`

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
  doneLessons: number; // 实际已消耗课时
  unitType: 'lesson' | 'session';
  schedule: ScheduleEntry[]; // JSONB 格式存储
  notificationIds?: string[]; // 本地闹钟索引
  duration?: number; // 每次课时长 (分钟)
  isDeleted?: boolean;
}
```

## 6. 路线图 (Roadmap)
- [x] **数据持久化**: 接入 Supabase 云端数据库。
- [x] **提醒功能**: 基于结构化时间的课前 2 小时自动本地推送通知。
- [x] **高级原生 UI**: 引入 Bottom Sheet、毛玻璃头部、安全区适配及色彩过渡动画。
- [x] **离线优先架构**: AsyncStorage 本地缓存秒开 + 乐观更新 + Sync Queue 离线队列。
- [x] **排课与防出错体系**: 同一成员排课重叠硬拦截、错打卡秒级撤销、带真实日期的昨日补签。
- [ ] **统计报表**: 增加消费和消耗的可视化图表（按成员/月份维度的饼图与趋势图）。