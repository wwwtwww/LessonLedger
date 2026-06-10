# 离线优先（Offline-First）数据层 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现数据缓存层 + 乐观更新 + 离线同步队列，让应用秒开且离线可用。

**Architecture:** 在现有 hooks 和 Supabase 之间插入 AsyncStorage 缓存层。读操作缓存优先后台刷新，写操作先更新本地再调云端，失败时入队联网后自动重放。

**Tech Stack:** TypeScript, React Native, Expo SDK 54, @react-native-async-storage/async-storage, Supabase, @react-native-community/netinfo

**Spec:** `docs/superpowers/specs/2026-06-10-offline-first-design.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `utils/storage.ts` | **新建** | AsyncStorage 封装，缓存读写 |
| `utils/syncQueue.ts` | **新建** | 离线操作队列，重放逻辑 |
| `hooks/useNetwork.ts` | **新建** | 网络状态监听，触发队列回放 |
| `hooks/useMembers.ts` | 修改 | 读写走 storage 层，乐观更新 |
| `hooks/useClasses.ts` | 修改 | 同上 |
| `app/_layout.tsx` | 修改 | 初始化网络监听、重放队列 |
| `app/index.tsx` | 修改 | 移除全屏 loading，用缓存优先 |

---

## Step 1: 缓存读取层

### Task 1: 安装新依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 @react-native-community/netinfo**

```bash
npm install @react-native-community/netinfo
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @react-native-community/netinfo for offline detection"
```

---

### Task 2: 创建 utils/storage.ts

**Files:**
- Create: `utils/storage.ts`

- [ ] **Step 1: 创建存储工具模块**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  MEMBERS: '@lessonledger/members',
  CLASSES: '@lessonledger/classes',
  LOGS: '@lessonledger/logs',
  SYNC_QUEUE: '@lessonledger/syncQueue',
} as const;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  KEYS,

  async getMembers<T>() {
    const raw = await AsyncStorage.getItem(KEYS.MEMBERS);
    return safeParse<T>(raw, null as T);
  },

  async setMembers(data: unknown) {
    await AsyncStorage.setItem(KEYS.MEMBERS, JSON.stringify(data));
  },

  async getClasses<T>() {
    const raw = await AsyncStorage.getItem(KEYS.CLASSES);
    return safeParse<T>(raw, null as T);
  },

  async setClasses(data: unknown) {
    await AsyncStorage.setItem(KEYS.CLASSES, JSON.stringify(data));
  },

  async getLogs<T>() {
    const raw = await AsyncStorage.getItem(KEYS.LOGS);
    return safeParse<T>(raw, null as T);
  },

  async setLogs(data: unknown) {
    await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(data));
  },

  async getSyncQueue<T>() {
    const raw = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    return safeParse<T>(raw, [] as unknown as T);
  },

  async setSyncQueue(data: unknown) {
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(data));
  },
};
```

- [ ] **Step 2: 验证模块可被导入**

```bash
node -e "require('./utils/storage')" 2>&1
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add utils/storage.ts
git commit -m "feat: add local storage cache layer"
```

---

### Task 3: 修改 useMembers.ts — 缓存优先读取

**Files:**
- Modify: `hooks/useMembers.ts`

- [ ] **Step 1: 修改 fetchMembers，缓存优先**

在 `useMembers.ts` 顶部添加 import：
```typescript
import { storage } from '../utils/storage';
```

将 `fetchMembers` 替换为：
```typescript
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);

    // Step A: 同步读缓存
    const cached = await storage.getMembers<Member[] | null>();
    if (cached && cached.length > 0) {
      setAllMembers(cached);
      setIsLoading(false);
    }

    // Step B: 后台拉取 Supabase
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .is('isDeleted', false)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error.message);
      if (!cached) setIsLoading(false);
      return data;
    }

    if (data) {
      setAllMembers(data);
      await storage.setMembers(data);
    }

    setIsLoading(false);
    return data;
  }, []);
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "useMembers"
```

Expected: No errors for `useMembers.ts`

- [ ] **Step 3: Commit**

```bash
git add hooks/useMembers.ts
git commit -m "feat(useMembers): add cache-first read with background sync"
```

---

### Task 4: 修改 useClasses.ts — 缓存优先读取

**Files:**
- Modify: `hooks/useClasses.ts`

- [ ] **Step 1: 修改 fetchData，缓存优先**

在 `useClasses.ts` 顶部添加 import：
```typescript
import { storage } from '../utils/storage';
```

将 `fetchData` 替换为：
```typescript
  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Step A: 同步读缓存
    const [cachedClasses, cachedLogs] = await Promise.all([
      storage.getClasses<ClassItem[] | null>(),
      storage.getLogs<LogItem[] | null>(),
    ]);
    if (cachedClasses && cachedClasses.length > 0) {
      setClasses(cachedClasses);
      setIsLoading(false);
    }
    if (cachedLogs && cachedLogs.length > 0) {
      setLogs(cachedLogs);
    }

    // Step B: 后台拉取 Supabase
    const [classesRes, logsRes] = await Promise.all([
      supabase.from('classes').select('*').is('isDeleted', false).order('id', { ascending: true }),
      supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    if (!classesRes.error && classesRes.data) {
      const formattedClasses = classesRes.data.map((c: any) => ({
        ...c,
        notificationIds: c.notificationids !== undefined ? c.notificationids : c.notificationIds,
      })) as ClassItem[];
      setClasses(formattedClasses);
      await storage.setClasses(formattedClasses);
    } else if (!cachedClasses) {
      setIsLoading(false);
    }

    if (!logsRes.error && logsRes.data) {
      const formattedLogs = logsRes.data.map((log: any) => ({
        id: log.id.toString(),
        time: new Date(log.created_at).toLocaleString(),
        text: log.text,
        classId: log.class_id?.toString(),
      })) as LogItem[];
      setLogs(formattedLogs);
      await storage.setLogs(formattedLogs);
    }

    setIsLoading(false);
  }, []);
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "useClasses"
```

Expected: No errors for `useClasses.ts`

- [ ] **Step 3: Commit**

```bash
git add hooks/useClasses.ts
git commit -m "feat(useClasses): add cache-first read with background sync"
```

---

### Task 5: 修改 app/index.tsx — 移除全屏 loading

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: 移除全屏 spinner，添加 splash screen 控制**

在 `app/index.tsx` 顶部添加 import：
```typescript
import * as SplashScreen from 'expo-splash-screen';
```

将组件开头的代码：
```typescript
export default function DashboardPage() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();

  const {
    members,
    ...
    isLoading,
    ...
  } = useDashboard();

  ...

  // 初始化加载
  useEffect(() => {
    requestPermissionsAsync();
  }, []);

  ...

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={themeColor || COLORS.primary} />
        <Text style={styles.loadingText}>Syncing with Cloud...</Text>
      </View>
    );
  }
```

替换为：
```typescript
export default function DashboardPage() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();

  const {
    members,
    ...
    isLoading,
    ...
  } = useDashboard();

  const [appIsReady, setAppIsReady] = useState(false);

  // 初始化加载
  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await requestPermissionsAsync();
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  // 首次加载：缓存为空且正在加载时显示骨架屏
  if (!appIsReady || (isLoading && members.length === 0)) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit 2>&1
```

Expected: No new errors in `app/index.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat(dashboard): replace fullscreen loading with splash screen control"
```

---

## Step 2: 乐观写入 + 离线同步队列

### Task 6: 创建 utils/syncQueue.ts

**Files:**
- Create: `utils/syncQueue.ts`

- [ ] **Step 1: 创建同步队列模块**

```typescript
import { storage } from './storage';

export type SyncOperation = {
  id: string;
  table: 'members' | 'classes' | 'logs';
  type: 'insert' | 'update' | 'delete';
  payload: Record<string, any>;
  tempId?: string;
  createdAt: number;
  retries: number;
};

let queueFlushInProgress = false;

export const syncQueue = {
  async getAll(): Promise<SyncOperation[]> {
    return storage.getSyncQueue<SyncOperation[]>() ?? [];
  },

  async add(op: Omit<SyncOperation, 'id' | 'createdAt' | 'retries'>): Promise<void> {
    const queue = await this.getAll();
    queue.push({
      ...op,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      retries: 0,
    });
    await storage.setSyncQueue(queue);
  },

  async remove(id: string): Promise<void> {
    const queue = await this.getAll();
    await storage.setSyncQueue(queue.filter(op => op.id !== id));
  },

  async incrementRetry(id: string): Promise<void> {
    const queue = await this.getAll();
    const op = queue.find(o => o.id === id);
    if (op) op.retries += 1;
    await storage.setSyncQueue(queue);
  },

  async flush(executor: (op: SyncOperation) => Promise<boolean>): Promise<void> {
    if (queueFlushInProgress) return;
    queueFlushInProgress = true;

    const queue = await this.getAll();
    for (const op of [...queue].sort((a, b) => a.createdAt - b.createdAt)) {
      if (op.retries >= 3) continue;
      const ok = await executor(op);
      if (ok) {
        await this.remove(op.id);
      } else {
        await this.incrementRetry(op.id);
      }
    }

    queueFlushInProgress = false;
  },
};
```

- [ ] **Step 2: 验证模块导入**

```bash
node -e "require('./utils/syncQueue')" 2>&1
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add utils/syncQueue.ts
git commit -m "feat: add offline sync queue with retry logic"
```

---

### Task 7: 创建 hooks/useNetwork.ts

**Files:**
- Create: `hooks/useNetwork.ts`

- [ ] **Step 1: 创建网络状态监听 hook**

```typescript
import { useEffect, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkCallback = (isConnected: boolean) => void;

let listeners: NetworkCallback[] = [];
let currentState = true;
let initialized = false;

function notify(isConnected: boolean) {
  currentState = isConnected;
  listeners.forEach(fn => fn(isConnected));
}

export function initNetworkListener() {
  if (initialized) return;
  initialized = true;

  NetInfo.addEventListener((state: NetInfoState) => {
    const online = !!(state.isConnected && state.isInternetReachable !== false);
    notify(online);
  });
}

export function useNetwork() {
  const callbackRef = useRef<NetworkCallback | null>(null);

  useEffect(() => {
    initNetworkListener();
  }, []);

  const onNetworkChange = (callback: NetworkCallback) => {
    callbackRef.current = callback;
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(fn => fn !== callback);
    };
  };

  return { onNetworkChange, isConnected: currentState };
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "useNetwork"
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add hooks/useNetwork.ts
git commit -m "feat: add network state monitoring hook"
```

---

### Task 8: 修改 useMembers.ts — 乐观写入

**Files:**
- Modify: `hooks/useMembers.ts`

- [ ] **Step 1: 添加 import**

```typescript
import { syncQueue, SyncOperation } from '../utils/syncQueue';
```

- [ ] **Step 2: 修改 handleAddMember 为乐观更新**

替换 `handleAddMember`：
```typescript
  const handleAddMember = useCallback(async (name: string, icon: string, themeColor: string) => {
    const tempId = `temp_${Date.now()}`;
    const newMember: Member = { id: tempId, name, icon, themeColor, isDeleted: false };

    // 乐观更新：立即更新 UI + 缓存（使用函数式 setState 保证拿到最新值）
    setAllMembers(prev => {
      const updated = [...prev, newMember];
      storage.setMembers(updated);
      return updated;
    });

    // 尝试同步到 Supabase
    const { data, error } = await supabase
      .from('members')
      .insert([{ name, icon, themeColor, isDeleted: false }])
      .select();

    if (error || !data) {
      console.error('Error adding member (will retry):', error?.message);
      await syncQueue.add({
        table: 'members',
        type: 'insert',
        payload: { name, icon, themeColor, isDeleted: false },
        tempId,
      });
      return;
    }

    // 用云端 ID 替换临时 ID
    setAllMembers(prev => {
      const updated = prev.map(m => m.id === tempId ? { ...m, id: data[0].id } : m);
      storage.setMembers(updated);
      return updated;
    });
  }, []);
```

- [ ] **Step 3: 修改 handleUpdateMember 为乐观更新**

替换 `handleUpdateMember`：
```typescript
  const handleUpdateMember = useCallback(async (id: string, data: Partial<Member>) => {
    const updateData = { ...data };
    delete updateData.id;

    // 乐观更新
    setAllMembers(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...data } : m);
      storage.setMembers(updated);
      return updated;
    });

    // 尝试同步
    const { error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating member (will retry):', error.message);
      await syncQueue.add({
        table: 'members',
        type: 'update',
        payload: { id, ...updateData },
      });
    }
  }, []);
```

- [ ] **Step 4: 修改 handleDeleteMember 为乐观更新**

替换 `handleDeleteMember`：
```typescript
  const handleDeleteMember = useCallback(async (id: string) => {
    // 乐观更新
    setAllMembers(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, isDeleted: true } : m);
      storage.setMembers(updated);
      return updated;
    });

    if (id === currentMemberId) {
      setCurrentMemberId('all');
    }

    // 尝试同步
    const { error } = await supabase
      .from('members')
      .update({ isDeleted: true })
      .eq('id', id);

    if (error) {
      console.error('Error deleting member (will retry):', error.message);
      await syncQueue.add({
        table: 'members',
        type: 'update',
        payload: { id, isDeleted: true },
      });
    }
  }, [currentMemberId]);
```

- [ ] **Step 5: 验证编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "useMembers"
```

Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add hooks/useMembers.ts
git commit -m "feat(useMembers): add optimistic writes with offline queue fallback"
```

---

### Task 9: 修改 useClasses.ts — 乐观写入 + 缓存持久化

**Files:**
- Modify: `hooks/useClasses.ts`

- [ ] **Step 1: 添加 import**

```typescript
import { syncQueue } from '../utils/syncQueue';
```

- [ ] **Step 2: 修改 handleAddClass 为乐观更新**

替换 `handleAddClass`：
```typescript
  const handleAddClass = useCallback(async (classItem: Omit<ClassItem, 'id' | 'doneLessons' | 'isDeleted' | 'owner' | 'notificationIds'>) => {
    console.log('Adding class:', classItem);
    const tempId = `temp_${Date.now()}`;
    const newClass: ClassItem = { ...classItem, id: tempId, doneLessons: 0, isDeleted: false, notificationIds: [] };

    // 乐观更新
    setClasses(prev => {
      const updated = [...prev, newClass];
      storage.setClasses(updated);
      return updated;
    });

    // 尝试同步
    const newClassPayload = { ...classItem, doneLessons: 0, isDeleted: false };
    const { data, error } = await supabase
      .from('classes')
      .insert([newClassPayload])
      .select();

    if (error || !data) {
      console.error('Error adding class (will retry):', error?.message);
      await syncQueue.add({
        table: 'classes',
        type: 'insert',
        payload: newClassPayload,
        tempId,
      });
      return;
    }

    const memberName = members.find(m => m.id === classItem.memberId)?.name || '未知';
    const ids = await scheduleClassReminders(data[0] as ClassItem, memberName);
    if (ids.length > 0) {
      await supabase.from('classes').update({ notificationids: ids }).eq('id', data[0].id);
    }

    setClasses(prev => {
      const updated = prev.map(c => c.id === tempId ? { ...data[0], notificationIds: ids } : c);
      storage.setClasses(updated);
      return updated;
    });
  }, [members]);
```

- [ ] **Step 3: 修改 handleUpdateClass 为乐观更新**

替换 `handleUpdateClass`：
```typescript
  const handleUpdateClass = useCallback(async (id: string, data: Partial<ClassItem>) => {
    console.log('Updating class:', id, data);
    const oldClass = classes.find(c => c.id === id);
    await cancelReminders(oldClass?.notificationIds);

    const memberName = members.find(m => m.id === (data.memberId || oldClass?.memberId))?.name || '未知';
    const updatedClass = { ...oldClass, ...data } as ClassItem;
    const ids = await scheduleClassReminders(updatedClass, memberName);

    // 乐观更新
    setClasses(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...data, notificationIds: ids } : c);
      storage.setClasses(updated);
      return updated;
    });

    const updateData: any = { ...data, notificationIds: ids };
    delete updateData.id;
    delete updateData.owner;

    const { error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating class (will retry):', error.message);
      await syncQueue.add({
        table: 'classes',
        type: 'update',
        payload: { id, ...updateData },
      });
    }
  }, [classes, members]);
```

- [ ] **Step 4: 修改 handleDeleteClass 为乐观更新**

替换 `handleDeleteClass`：
```typescript
  const handleDeleteClass = useCallback(async (id: string) => {
    console.log('Deleting class:', id);
    const oldClass = classes.find(c => c.id === id);
    await cancelReminders(oldClass?.notificationIds);

    // 乐观更新
    setClasses(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, isDeleted: true } : c);
      storage.setClasses(updated);
      return updated;
    });

    const { error } = await supabase
      .from('classes')
      .update({ isDeleted: true })
      .eq('id', id);

    if (error) {
      console.error('Error deleting class (will retry):', error.message);
      await syncQueue.add({
        table: 'classes',
        type: 'update',
        payload: { id, isDeleted: true },
      });
    }
  }, [classes]);
```

- [ ] **Step 5: 修改 handleCheckIn 添加缓存持久化**

在 `handleCheckIn` 的 `performAction` 函数中，找到 `setClasses(...)` 调用（约第 190 行），在它之后添加缓存写入：

```typescript
      // 3. 更新本地状态
      setClasses(prev => {
        const updated = prev.map(c => c.id === classId ? { ...c, doneLessons: nextDoneLessons, notificationIds: ids } : c);
        storage.setClasses(updated);
        return updated;
      });

      if (logData) {
        const newLog: LogItem = {
          id: logData[0].id.toString(),
          time: new Date(logData[0].created_at).toLocaleString(),
          text: logMessage,
        };
        setLogs(prev => {
          const updated = [newLog, ...prev];
          storage.setLogs(updated);
          return updated;
        });
      }
```

- [ ] **Step 6: 验证编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "useClasses"
```

Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add hooks/useClasses.ts
git commit -m "feat(useClasses): add optimistic writes with offline queue fallback"
```

---

### Task 10: 修改 app/_layout.tsx — 网络监听 + 队列回放

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: 添加同步队列执行器和网络监听**

在 `_layout.tsx` 顶部添加 import：
```typescript
import { useEffect } from 'react';
import { initNetworkListener, useNetwork } from '../hooks/useNetwork';
import { syncQueue, SyncOperation } from '../utils/syncQueue';
import { supabase } from '../utils/supabase';
import { storage } from '../utils/storage';
```

在 `DrawerWrapper` 组件内部（`const { t } = useLanguage();` 之后）添加：

```typescript
  // 队列执行器：将离线操作同步回 Supabase
  const executeSyncOp = async (op: SyncOperation): Promise<boolean> => {
    try {
      if (op.type === 'insert') {
        const { error } = await supabase.from(op.table).insert([op.payload]).select();
        return !error;
      } else if (op.type === 'update') {
        const { id, ...data } = op.payload;
        const { error } = await supabase.from(op.table).update(data).eq('id', id);
        return !error;
      } else if (op.type === 'delete') {
        const { id } = op.payload;
        const { error } = await supabase.from(op.table).delete().eq('id', id);
        return !error;
      }
      return false;
    } catch {
      return false;
    }
  };

  // 初始化网络监听，联网时自动回放队列
  const { onNetworkChange } = useNetwork();

  useEffect(() => {
    initNetworkListener();

    const unsub = onNetworkChange((isConnected) => {
      if (isConnected) {
        syncQueue.flush(executeSyncOp);
      }
    });

    return unsub;
  }, [onNetworkChange]);
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit 2>&1 | Select-String "_layout"
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(layout): add network listener and offline queue replay"
```

---

### Task 11: 最终验证

**Files:**
- 无（验证步骤）

- [ ] **Step 1: 验证 TypeScript 全量编译**

```bash
npx tsc --noEmit 2>&1
```

Expected: 仅 `components/sheets/AddClassSheet.tsx(138,29)` 的预存错误（与本次无关），无新错误。

- [ ] **Step 2: 验证 app 可正常启动**

```bash
npm start 2>&1
```

Expected: `Starting project at E:\LessonLedger`，无 `TypeError: fetch failed` 错误。

- [ ] **Step 3: Commit**

```bash
git status
```
