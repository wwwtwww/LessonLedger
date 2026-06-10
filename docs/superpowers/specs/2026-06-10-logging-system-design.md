# A 级统一日志工具 设计

> 日期：2026-06-10  
> 状态：已批准，待实现

## 1. 背景与目标

### 现状
项目中有 14 处散落的 `console.log` / `console.error`，分布在 4 个文件中：
- `hooks/useMembers.ts`（4 处）
- `hooks/useClasses.ts`（8 处）
- `utils/notifications.ts`（1 处）
- `components/dashboard/MemberTabs.tsx`（1 处）

格式不统一，没有时间戳、级别和模块名，难以 grep 和过滤。

### 目标
- 提供统一的 `utils/logger.ts`，替换所有散落的 `console`
- 统一输出格式：`[时间戳] [级别] [模块名] 消息`
- 按环境区分输出级别（生产环境关闭 debug 和 info）

## 2. API 设计

```ts
import { log } from '../utils/logger';

log.debug(tag, message, data?);  // 仅在 __DEV__ 时输出
log.info(tag, message, data?);   // 仅在 __DEV__ 时输出
log.warn(tag, message, data?);   // 始终输出
log.error(tag, message, error?); // 始终输出
```

**参数说明**：
- `tag`: 模块名/标签（如 `'useMembers'`、`'supabase'`）
- `message`: 描述信息
- `data` / `error`: 可选的附加数据或错误对象

## 3. 输出格式

```
[2026-06-10 14:30:01.123] INFO  [useMembers] fetching members...
[2026-06-10 14:30:01.456] ERROR [supabase] fetch failed { message: 'xxx' }
[2026-06-10 14:30:01.789] WARN  [useMembers] member list is empty
[2026-06-10 14:30:02.012] DEBUG [useClasses] Adding class: { name: "钢琴课" }
```

## 4. 环境级别控制

| 环境 | debug | info | warn | error |
|------|-------|------|------|-------|
| 开发 (`__DEV__`) | ✅ | ✅ | ✅ | ✅ |
| 生产 | ❌ | ❌ | ✅ | ✅ |

使用 React Native 的全局 `__DEV__` 常量判断环境。

## 5. 实现细节

### 5.1 新增文件

**`utils/logger.ts`**：单一文件，零依赖。核心逻辑：

```ts
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

function format(level: LogLevel, tag: string, message: string): string {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 23);
  return `[${ts}] ${level.padEnd(5)} [${tag}] ${message}`;
}

function shouldLog(level: LogLevel): boolean {
  if (__DEV__) return true;
  return level === 'WARN' || level === 'ERROR';
}

export const log = {
  debug(tag: string, message: string, data?: unknown) {
    if (!shouldLog('DEBUG')) return;
    console.log(format('DEBUG', tag, message), data ?? '');
  },
  info(tag: string, message: string, data?: unknown) {
    if (!shouldLog('INFO')) return;
    console.log(format('INFO', tag, message), data ?? '');
  },
  warn(tag: string, message: string, data?: unknown) {
    if (!shouldLog('WARN')) return;
    console.warn(format('WARN', tag, message), data ?? '');
  },
  error(tag: string, message: string, error?: unknown) {
    if (!shouldLog('ERROR')) return;
    console.error(format('ERROR', tag, message), error ?? '');
  },
};
```

### 5.2 修改文件

| 文件 | 替换规则 | 处数 |
|------|----------|------|
| `hooks/useMembers.ts` | `console.error(...)` → `log.error('useMembers', ...)` | 4 |
| `hooks/useClasses.ts` | `console.log(...)` → `log.info('useClasses', ...)`；`console.error(...)` → `log.error('useClasses', ...)` | 8 |
| `utils/notifications.ts` | `console.log(...)` → `log.error('notifications', ...)` | 1 |
| `components/dashboard/MemberTabs.tsx` | `console.log(...)` → `log.info('MemberTabs', ...)` | 1 |

### 5.3 标签命名规范

标签使用文件名或模块名，小驼峰：

| 文件 | 标签 |
|------|------|
| `hooks/useMembers.ts` | `useMembers` |
| `hooks/useClasses.ts` | `useClasses` |
| `utils/notifications.ts` | `notifications` |
| `components/dashboard/MemberTabs.tsx` | `MemberTabs` |

## 6. 后续扩展路径（本次不实现）

- **持久化**：将日志写入 AsyncStorage，App 内可查看历史
- **远程上报**：批量上传到 Supabase `app_logs` 表
- **运行时开关**：设置页面动态切换日志级别
