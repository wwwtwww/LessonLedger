# 离线优先（Offline-First）数据层设计

> 日期：2026-06-10  
> 状态：已批准，待实现

## 1. 背景与目标

### 现状问题
- 每次启动和页面切换都从 Supabase 全量拉取数据，显示全屏 spinner（"Syncing with Cloud..."）
- 无网络时白屏或崩溃，无法查看已有数据
- 写操作依赖实时网络，离线无法操作

### 目标
- **秒开**：启动时先展示缓存数据，后台静默同步云端
- **离线可用**：无网络时正常读写，联网后自动同步
- **不破坏现有行为**：改动集中在 hooks 和数据层，UI 组件基本不变

## 2. 架构概览

```
┌─────────────────────────────────┐
│  UI 组件 (app/*.tsx)            │  ← 不变
├─────────────────────────────────┤
│  Hooks (useMembers/useClasses)  │  ← 逻辑不变，数据来源改为 storage
├─────────────────────────────────┤
│  Storage Layer (新增)           │  ← AsyncStorage 缓存 + 同步队列
├─────────────────────────────────┤
│  Supabase (云端)                │
└─────────────────────────────────┘
```

**核心原则**：
- **读**：缓存优先（秒开）→ 后台取云端 → 差异更新 UI
- **写**：先更新本地状态 + 缓存（瞬间响应）→ 再调 Supabase → 失败则入队重试

## 3. 文件变更

### 新增文件

| 文件 | 职责 |
|------|------|
| `utils/storage.ts` | AsyncStorage 读写封装、缓存键管理、数据序列化 |
| `utils/syncQueue.ts` | 离线操作队列（增删改的待同步记录）、重放逻辑 |
| `hooks/useNetwork.ts` | 网络状态监听（NetInfo），触发队列重放 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `hooks/useMembers.ts` | 读写改走 storage 层，乐观更新 |
| `hooks/useClasses.ts` | 同上 |
| `app/_layout.tsx` | 初始化网络监听、启动时回放同步队列 |
| `app/index.tsx` | 移除全屏 loading，改为缓存优先渲染 + 骨架屏/空状态 |

### 新依赖

```
@react-native-community/netinfo  (网络状态检测)
```

## 4. 读取流程

### 改进后（缓存优先）

```
页面挂载（或 useMembers/useClasses 实例化）
  ├─ ① 同步读 AsyncStorage → 立即 setState → UI 渲染（秒开）
  └─ ② 异步 fetch Supabase
       ├─ 数据相同（按记录 id + 字段比较）→ 不做任何事
       └─ 数据不同 → setState 更新 → UI 刷新
```

### 缓存键

| 键 | 内容 |
|----|------|
| `@lessonledger/members` | `Member[]` 数组 |
| `@lessonledger/classes` | `ClassItem[]` 数组 |
| `@lessonledger/logs` | `LogItem[]` 数组（最近 20 条） |
| `@lessonledger/syncQueue` | `SyncOperation[]` 队列 |

### 边界情况

- **首次使用（无缓存）**：回退到现有 loading → 显示骨架屏
- **AsyncStorage 读失败**：降级为直接 fetch Supabase
- **Supabase fetch 失败**：继续使用缓存数据，UI 底栏提示"离线模式"

## 5. 写入流程（乐观更新）

### 以"添加成员"为例

```
用户点击保存
  ├─ ① 生成临时 ID（temp_ 前缀）、setState 更新 React state
  ├─ ② 立即写入 AsyncStorage 缓存
  └─ ③ 调用 Supabase API
       ├─ 成功 → 用 Supabase 返回的真实 id 替换临时 id → 更新缓存
       └─ 失败 → 将操作写入 syncQueue，标记为 ☁️ 待同步
```

### 离线创建 ID 映射

离线时创建使用临时 ID（`temp_` 前缀），同步成功后替换为 Supabase 的真实 ID。关联记录（如课程关联成员 ID）需要级联更新。

## 6. 同步队列

### 数据结构

```ts
type SyncOperation = {
  id: string;           // 操作唯一 ID (uuid)
  table: 'members' | 'classes' | 'logs';
  type: 'insert' | 'update' | 'delete';
  payload: Record<string, any>;
  tempId?: string;      // 离线 insert 时的临时 ID
  createdAt: number;    // 时间戳，升序执行
  retries: number;      // 已重试次数 (max 3)
};
```

### 重试策略

- 按 `createdAt` 升序执行（保证操作顺序）
- 每项最多重试 3 次，间隔 2s / 4s / 8s 指数退避
- 3 次后仍失败 → 标记为 `failed`，保留在队列中，不再自动重试
- 用户下次启动时手动触发重放

### 冲突解决（简单策略）

| 场景 | 策略 |
|------|------|
| Insert + Insert | 后者生效（不可能同名冲突，Supabase 用自增 ID） |
| Update + Update | 后者覆盖（最后写入胜出） |
| Delete + Update | Delete 胜出 |

## 7. 网络检测与自动回放

### 流程

```
NetInfo.addEventListener
  ├─ 检测到 online
  │   ├─ 消重（2s 内多次触发仅执行一次）
  │   └─ 遍历 syncQueue → 逐条执行 → 成功则移除，失败则递增 retries
  └─ 检测到 offline
      └─ 仅记录状态，不阻塞操作（乐观更新已在本地生效）
```

### 初始化位置

在 `app/_layout.tsx` 的 `RootLayout` 中初始化，作为全局单例，避免多次注册监听。

## 8. 启动屏行为

### 流程

```
App 启动
  ├─ ① expo-splash-screen.preventAutoHideAsync() 保持启动屏
  ├─ ② 并行：读取 AsyncStorage 缓存 + requestPermissionsAsync
  ├─ ③ 判断缓存
  │    ├─ 有缓存 → hideAsync() 立即隐藏启动屏 → 用缓存数据渲染 UI
  │    └─ 无缓存 → 等待 Supabase fetch 完成 → hideAsync() → 渲染 UI
  └─ ④ 后台 fetch Supabase（有缓存时）→ 差异更新 UI
```

### 降级

- AsyncStorage 损坏或读失败：视为无缓存，走首次安装路径
- Supabase 同时失败：隐藏启动屏，显示错误提示 + 重试按钮

## 9. 页面级加载体验

### 首次安装（无任何缓存）

Splash screen 保持显示，直到 Supabase 初始数据到达后隐藏，用户直接看到完整 UI。

### 已有缓存时页面切换

| 场景 | 表现 |
|------|------|
| 仪表盘 | 缓存数据秒开，后台 fetch 差异更新 |
| 成员管理 | 同上 |
| 课程管理 | 同上 |
| 打卡日志 | 同上 |

### 缓存为空但非首次（如清除了缓存）

| 页面 | 加载态 |
|------|--------|
| 仪表盘 | 骨架屏（2-3 个灰色闪光卡片）替代全屏 spinner |
| 成员管理 | 骨架屏 → 空状态（"暂无家庭成员"） |
| 课程管理 | 骨架屏 → 空状态（"暂无课程"） |
| 打卡日志 | 空状态（"暂无打卡记录"） |

骨架屏不阻塞导航，用户可自由切换页面。

## 10. 错误降级矩阵

| 错误场景 | 处理方式 |
|----------|----------|
| AsyncStorage 读失败 | 降级为直接 fetch Supabase |
| AsyncStorage 写失败 | 仅更新内存 state，下次启动重拉 |
| Supabase fetch 失败 | 用缓存数据 + 底栏"离线模式"提示 |
| syncQueue 读取损坏 | 清空队列，下次全量 fetch 对齐 |
| NetInfo 不可用 | 默认视为在线，失败时正常走队列 |

## 11. 实现顺序

### Step 1：缓存读取层（优先）

- 新增 `utils/storage.ts`
- 修改 `useMembers`、`useClasses`：启动时缓存优先
- 用 splash screen 替换全屏 loading
- **交付效果**：非首次启动秒开，页面切换不重复加载

### Step 2：乐观写入 + 离线队列

- 新增 `utils/syncQueue.ts`、`hooks/useNetwork.ts`
- 修改 hooks 的写方法：本地先更新、后台同步
- `_layout.tsx` 初始化网络监听
- **交付效果**：离线可操作，联网自动同步

## 12. 影响对比

| 维度 | 现状 | 改进后 |
|------|------|--------|
| 启动速度 | 等待 Supabase（1-3s） | 秒开（缓存），后台刷新 |
| 页面切换 | 每次重新 fetch | 缓存复用，无等待 |
| 离线读取 | 白屏 / 报错 | 正常显示缓存数据 |
| 离线写入 | 无法操作 | 乐观更新，标记待同步 |
| 加载态 | 全屏 spinner | 骨架屏（首次）/ 无感知（有缓存） |
| 新依赖 | — | 仅加 `@react-native-community/netinfo` |
