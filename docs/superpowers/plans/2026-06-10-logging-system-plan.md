# 统一日志工具 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建统一日志工具 `utils/logger.ts`，替换项目中 14 处散落的 `console.*` 调用。

**Architecture:** 单一文件 `utils/logger.ts`，零依赖，基于 `__DEV__` 判断环境级别。开发环境输出全部级别，生产环境仅输出 `warn`/`error`。

**Tech Stack:** TypeScript, React Native (`__DEV__` 全局常量)

**Spec:** `docs/superpowers/specs/2026-06-10-logging-system-design.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `utils/logger.ts` | **新建** | 统一日志工具 |
| `hooks/useMembers.ts` | 修改 | 替换 4 处 console.error |
| `hooks/useClasses.ts` | 修改 | 替换 8 处 console.log/error |
| `utils/notifications.ts` | 修改 | 替换 1 处 console.log |
| `components/dashboard/MemberTabs.tsx` | 修改 | 替换 1 处 console.log |

---

### Task 1: 创建 utils/logger.ts

**Files:**
- Create: `utils/logger.ts`

- [ ] **Step 1: 创建日志工具模块**

```typescript
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

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "logger"
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add utils/logger.ts
git commit -m "feat: add unified logger utility"
```

---

### Task 2: 替换 hooks/useMembers.ts 中的 console 调用

**Files:**
- Modify: `hooks/useMembers.ts`

- [ ] **Step 1: 添加 import 并替换全部 console.error**

在现有 `import { storage } from '../utils/storage';` 之后添加：
```typescript
import { log } from '../utils/logger';
```

逐个替换（精确匹配 oldString → newString）：

**替换 1**（约第 32 行）：
- old: `console.error('Error fetching members:', error.message);`
- new: `log.error('useMembers', 'Error fetching members', { message: error.message });`

**替换 2**（约第 68 行）：
- old: `console.error('Error adding member:', error?.message, error?.details, error?.hint);`
- new: `log.error('useMembers', 'Error adding member', { message: error?.message, details: error?.details, hint: error?.hint });`

**替换 3**（约第 106 行）：
- old: `console.error('Error updating member:', error.message, error.details, error.hint);`
- new: `log.error('useMembers', 'Error updating member', { message: error.message, details: error.details, hint: error.hint });`

**替换 4**（约第 132 行）：
- old: `console.error('Error deleting member:', error.message);`
- new: `log.error('useMembers', 'Error deleting member', { message: error.message });`

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "useMembers"
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add hooks/useMembers.ts
git commit -m "refactor(useMembers): replace console with unified logger"
```

---

### Task 3: 替换 hooks/useClasses.ts 中的 console 调用

**Files:**
- Modify: `hooks/useClasses.ts`

- [ ] **Step 1: 添加 import 并替换全部 console 调用**

在现有 `import { storage } from '../utils/storage';` 之后添加：
```typescript
import { log } from '../utils/logger';
```

逐一替换（精确匹配）：

**替换 1**（约第 83 行）：
- old: `console.log('Adding class:', classItem);`
- new: `log.info('useClasses', 'Adding class', classItem);`

**替换 2**（约第 102 行）：
- old: `console.error('Error adding class:', error?.message);`
- new: `log.error('useClasses', 'Error adding class', { message: error?.message });`

**替换 3**（约第 129 行）：
- old: `console.log('Updating class:', id, data);`
- new: `log.info('useClasses', 'Updating class', { id, data });`

**替换 4**（约第 154 行）：
- old: `console.error('Error updating class:', error.message);`
- new: `log.error('useClasses', 'Error updating class', { message: error.message });`

**替换 5**（约第 162 行）：
- old: `console.log('Deleting class:', id);`
- new: `log.info('useClasses', 'Deleting class', { id });`

**替换 6**（约第 179 行）：
- old: `console.error('Error deleting class:', error.message);`
- new: `log.error('useClasses', 'Error deleting class', { message: error.message });`

**替换 7**（约第 221 行）：
- old: `console.error('Update check-in failed:', updateError);`
- new: `log.error('useClasses', 'Update check-in failed', updateError);`

**替换 8**（约第 232 行）：
- old: `console.error('Insert log failed:', logError);`
- new: `log.error('useClasses', 'Insert log failed', logError);`

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "useClasses"
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add hooks/useClasses.ts
git commit -m "refactor(useClasses): replace console with unified logger"
```

---

### Task 4: 替换 utils/notifications.ts 中的 console 调用

**Files:**
- Modify: `utils/notifications.ts`

- [ ] **Step 1: 添加 import 并替换**

在文件顶部添加：
```typescript
import { log } from './logger';
```

替换（约第 97 行）：
- old: `console.log('Failed to cancel notification:', id);`
- new: `log.error('notifications', 'Failed to cancel notification', { id });`

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "notifications"
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add utils/notifications.ts
git commit -m "refactor(notifications): replace console with unified logger"
```

---

### Task 5: 替换 components/dashboard/MemberTabs.tsx 中的 console 调用

**Files:**
- Modify: `components/dashboard/MemberTabs.tsx`

- [ ] **Step 1: 添加 import 并替换**

在文件顶部添加：
```typescript
import { log } from '../../utils/logger';
```

替换（约第 93 行）：
- old: `console.log('MemberTabs: Add Member pressed');`
- new: `log.info('MemberTabs', 'Add Member pressed');`

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "MemberTabs"
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/MemberTabs.tsx
git commit -m "refactor(MemberTabs): replace console with unified logger"
```

---

### Task 6: 最终验证

- [ ] **Step 1: 全量 TypeScript 编译**

```bash
npx tsc --noEmit 2>&1
```
Expected: 仅 `AddClassSheet.tsx(138,29)` 预存错误，无新错误

- [ ] **Step 2: 确认无遗漏的 console 调用**

```bash
rg "console\.(log|error|warn|debug)" --include="*.ts" --include="*.tsx" hooks/ utils/notifications.ts components/dashboard/MemberTabs.tsx
```
Expected: No output（全部替换完毕）

- [ ] **Step 3: 启动验证**

```bash
npm start 2>&1
```
Expected: 启动正常，无错误
