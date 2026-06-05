# 结构化课程调度器 (Schedule Picker) 设计文档

## 1. 概述
当前 `ClassItem` 中的 `schedule` 字段为纯文本格式，导致数据不规范且难以用于未来的智能提醒。本设计旨在引入一个结构化的、基于选择的调度组件，支持周期性课程和单次具体日期的灵活组合。

## 2. 数据模型变更

### 2.1 ScheduleEntry 定义
在 `types/index.ts` 中新增：
```typescript
export interface ScheduleEntry {
  type: 'weekly' | 'specific';
  day?: number;    // 0-6 (周日到周六)，仅在 weekly 模式下必填
  date?: string;   // YYYY-MM-DD，仅在 specific 模式下必填
  time: string;    // HH:mm (24小时制)
}
```

### 2.2 ClassItem 升级
`schedule` 字段从 `string` 变更为 `ScheduleEntry[]`。

## 3. 交互流程 (AddClassModal)

### 3.1 调度列表
- 替代原本的文本框。
- 默认展示已添加的时间点列表。
- 每一个条目显示为标签，如 `[周一 18:00] (x)` 或 `[2026-06-10 14:00] (x)`。

### 3.2 添加流程
1. 点击“+ 添加上课时间”。
2. 弹出选择器 Overlay。
3. **模式切换**：SegmentedControl 或切换开关（每周重复 / 具体日期）。
4. **日期/星期选择**：
   - 每周重复：选择星期。
   - 具体日期：弹出 DatePicker。
5. **时间选择**：弹出 TimePicker。
6. 点击“确定”存入数组。

## 4. 存储方案
- **Supabase**: `schedule` 字段继续使用 `TEXT` 或改为 `JSONB`。
- **持久化**: 前端在发送请求前将数组执行 `JSON.stringify()`，拉取后执行 `JSON.parse()`。

## 5. 验收标准
- [ ] 用户无法手动输入任何文字到时间字段。
- [ ] 支持为同一门课添加多个不规律的时间点。
- [ ] 课程卡片能正确解析并美化显示数组内容（如“周一, 周四 18:00”）。
