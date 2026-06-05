# LessonLedger 重构设计文档 (2026-06-05)

## 1. 架构与依赖 (Architecture & Dependencies)

### 1.1 目录结构
采用“职责分离”与“直接路径导入”原则：
- `components/dashboard/`: 仪表盘专有组件。
- `components/classes/`: 课程展示与进度管理。
- `components/sheets/`: 基于 `BottomSheetModal` 的弹出层。
- `components/ui/`: 通用原子级 UI 组件。
- `hooks/`: 逻辑抽离，精简职责。

### 1.2 依赖项
- `expo-blur`: 实现顶部毛玻璃效果。
- `react-native-reanimated`: 驱动成员切换及布局动画。
- `react-native-gesture-handler`: 提供侧滑删除等手势支持。
- `expo-haptics`: 提供关键操作的触感反馈。
- `react-native-gifted-charts`: 实现数据统计看板。

---

## 2. 数据流与逻辑层 (Data Flow & Logic)

### 2.1 核心驱动 (useDashboard)
引入 `useDashboard.ts` 聚合 Hook：
- 协调 `useMembers` 与 `useClasses` 数据。
- 计算聚合指标（总课时、预警数）。
- 管理全局筛选状态（当前选中成员）。

### 2.2 数据同步策略
- **CRUD 分离**：基础 Hook 仅负责 Supabase 交互。
- **乐观更新**：打卡、修改操作优先更新本地状态，提升响应感。
- **实时订阅**：利用 Supabase Realtime 确保多设备数据同步。
- **统一错误处理**：在 `utils/supabase.ts` 中封装异常捕获。

---

## 3. 视觉与交互 (Visuals & Interaction)

### 3.1 原生交互质感
- **GlassHeader**：结合 `expo-blur` 与 `SafeAreaView` 实现。
- **MemberSwitcher**：头像缩放动画与背景颜色平滑插值过渡。
- **Swipeable Actions**：课程卡片支持具有弹性反馈的侧滑操作。

### 3.2 品牌色系统 (Theme)
统一引用 `utils/colors.ts` 中的变量：
- `primary`: `#6366F1`
- `danger`: `#EF4444` (用于课时预警)
- 配合 **Haptics**（触感反馈）形成完整的操作闭环。

### 3.3 加载与空态
- **Skeleton Loading**：减少请求期间的白屏。
- **EmptyState**：优化无数据时的视觉引导。

---

## 4. 实施路线图 (Roadmap)
1. **Sprint 1**: 物理目录搬迁、基础骨架组件创建。
2. **Sprint 2**: UI 细节打磨（动画、毛玻璃、侧滑）。
3. **Sprint 3**: 数据看板集成、触感反馈优化。
