# 课程本地提醒功能 (Local Notifications) 设计文档

## 1. 概述
本设计旨在利用 Expo 的本地通知服务 (`expo-notifications`)，根据 `ClassItem` 中的结构化时间数据 (`schedule`)，在上课前自动向用户发送提醒，防止忘记上课或打卡。该方案为纯本地实现，无需后端定时任务。

## 2. 核心逻辑

### 2.1 触发时机
- **应用启动时**：请求通知权限。
- **新增课程时**：解析时间，计算未来一周内的最近上课时间，注册通知。
- **打卡消课时**：取消上一次的通知，并为下周的同一时间注册新的通知。
- **修改课程时**：取消旧通知，注册新通知。
- **删除课程时**：取消相关通知。

### 2.2 提醒策略
- **默认提前量**：上课前 2 小时。
- **通知内容**：
  - 标题：`🎒 上课提醒：{Course Name}`
  - 正文：`{Member Name} 的 {Course Name} 将在 {Time} 开始，不要迟到哦！（剩余: {N}次）`

## 3. 架构设计

### 3.1 独立服务层 (`utils/notifications.ts`)
封装底层的 `expo-notifications` API：
- `requestPermissionsAsync()`: 获取通知权限。
- `scheduleClassReminder(classItem, memberName)`: 核心算法。遍历 `schedule` 数组，计算出下一个最接近的上课时间（减去 2 小时），并调用底层 API 注册，返回生成的 `notificationId`。
- `cancelReminders(ids)`: 批量取消指定的本地闹钟。

### 3.2 数据模型变更
在 `types/index.ts` 的 `ClassItem` 和 Supabase 的 `classes` 表中新增可选字段：
```typescript
notificationIds?: string[]; // 存储由系统生成的本地通知 ID 列表
```
*说明：Supabase 需要执行 SQL 补充 `notificationIds TEXT[]` 字段。*

### 3.3 Hook 集成 (`hooks/useClasses.ts`)
在 `useClasses` 的 `handleAddClass`, `handleUpdateClass`, `handleDeleteClass`, `handleCheckIn` 方法中，注入通知服务的调用。
例如，在添加课程时：
1. 插入 Supabase。
2. 成功后，调用 `scheduleClassReminder` 获取 `ids`。
3. 再次执行一次 `update`，将 `ids` 补充进刚才插入的课程数据中。

## 4. 界面反馈
- 在 `app/index.tsx` 的 `useEffect` 中处理权限弹窗。
- 在 `ClassCard.tsx` 中，如果是即将上课（2小时内），可以考虑在进度条上方加一个小小的 🔔 闪烁图标（进阶项）。

## 5. 验收标准
- [ ] 允许应用发送通知。
- [ ] 添加一个 5 分钟后开始的测试课程，3 分钟后能收到手机推送。
- [ ] 删除课程后，系统列队的对应通知被移除。