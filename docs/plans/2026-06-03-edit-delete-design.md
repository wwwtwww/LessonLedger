# 设计文档：完善 CRUD - 编辑与逻辑删除功能

## 1. 概述
本项目目前已实现成员和课程的“新增”功能。为了提供完整的闭环管理体验，我们需要增加“编辑”和“删除”功能。为了保证数据的安全性和可扩展性，删除操作将采用“逻辑删除 (Soft Delete)”模式，UI 交互将采用移动端原生的“侧滑操作 (Swipe to Action)”。

## 2. 架构设计

### 2.1 数据模型 (Data Model)
在 `types/index.ts` 中为 `Member` 和 `ClassItem` 接口增加可选属性：
- `isDeleted?: boolean;` // 标记是否已被删除

### 2.2 业务逻辑 (Hooks)
扩展 `useMembers` 和 `useClasses`：
- **Update**: `handleUpdateMember(id, data)` / `handleUpdateClass(id, data)`
- **Delete**: `handleDeleteMember(id)` / `handleDeleteClass(id)`
  - 执行操作：将目标的 `isDeleted` 设为 `true`。
  - 过滤逻辑：更新 `useMemo` 中的过滤逻辑，仅返回 `!item.isDeleted` 的数据。

### 2.3 UI 组件 (UI Components)
- **SwipeableRow**: 创建一个通用的包装组件，基于 `react-native-gesture-handler/Swipeable`。
  - 右侧操作：[编辑 (蓝色)] | [删除 (红色)]。
- **Modal 复用**: 增强 `AddMemberModal` 和 `AddClassModal`。
  - 属性：增加 `initialData?: T`。
  - 逻辑：若有 `initialData`，则进入“编辑模式”，标题和按钮文本相应变化。

## 3. 交互流程
1. **侧滑**: 用户在列表项向左滑动，露出操作按钮。
2. **编辑**: 点击编辑 -> 打开 Modal (预填充数据) -> 确认保存 -> 更新状态 -> Modal 关闭。
3. **删除**: 点击删除 -> 弹出系统确认框 -> 确认 -> 触发逻辑删除 -> 列表项带动画消失。
4. **触觉反馈**: 使用 `expo-haptics` 在侧滑露出按钮和执行删除时提供物理反馈。

## 4. 关键技术点
- **性能**: 使用 `react-native-reanimated` 确保侧滑动画在原生线程运行，避免卡顿。
- **稳定性**: 在 `useClasses` 的 `handleDeleteMember` 触发时，确保其名下的课程也能在 UI 层级正确“隐藏”。
- **闭包安全**: 所有状态更新继续使用 `setState(prev => ...)` 模式。

## 5. 验收标准
- [ ] 侧滑手势响应灵敏，无卡顿。
- [ ] 编辑成员/课程后，列表数据立即更新且保持语言同步。
- [ ] 点击删除并确认后，项消失，且重新加载或切换语言后依然不显示（逻辑删除生效）。
- [ ] 在 Web 端也能通过鼠标模拟滑动或点击进行相同操作。
