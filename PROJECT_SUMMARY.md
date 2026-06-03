# Project Analysis Report: LessonLedger

## 1. Project Overview
LessonLedger 是一个轻量级的课时管理移动应用，专为家庭和个人设计。它旨在帮助用户追踪各种课程（如钢琴、美术、健身等）的课时消耗、剩余次数以及财务投入。

该项目的主要目标是提供一个简洁直观的界面，让用户能够快速完成课时“打卡”记录，同时通过多维度的数据看板（如总投入、剩余课时预警等）实现对家庭教育或自我提升资产的透明化管理。

## 2. Tech Stack
| Category | Technologies |
| :--- | :--- |
| **Languages** | TypeScript |
| **Frameworks** | Expo (SDK 54), React Native 0.81.5 |
| **Database** | N/A (目前为内存 Mock 数据，未来计划支持 AsyncStorage 或 SQLite) |
| **Routing** | Expo Router (File-based routing) |
| **Styling** | React Native StyleSheet |
| **Build Tools** | Metro Bundler |

## 3. Core Features
- **多成员管理**: 支持为不同家庭成员（如哥哥、妹妹、妈妈）设置独立的配置（名称、图标、主题色）。
- **课时打卡系统**: 核心的“消课”逻辑，包含余额验证、操作确认以及自动生成打卡日志。
- **动态资产看板**: 实时计算总支出、正在进行的课程数量及总剩余课时，并提供低余额预警（少于 3 课时时变红）。
- **成员视图过滤**: 允许用户按成员筛选显示的课程，方便快速查看。
- **国际化 (i18n)**: 支持中英文双语实时切换。

## 4. REST Services & Endpoints
目前该项目为纯客户端应用，不包含任何 REST 接口。

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| N/A | N/A | 纯单机/客户端逻辑 |

## 5. Project Structure
```text
LessonLedger/
├── app/                # Expo Router 页面目录
│   ├── _layout.tsx     # 全局布局与导航配置
│   └── index.tsx       # 核心业务逻辑与主页面
├── assets/             # 静态资源（图标、开屏图等）
├── docs/               # 项目文档
│   └── PRD.md          # 产品需求文档
├── package.json        # 项目依赖与配置
└── tsconfig.json       # TypeScript 配置
```

## 6. Architecture Summary
项目目前采用**紧耦合的单页面组件模式**。所有的状态管理（`useState`）、业务逻辑（打卡函数、统计计算）、国际化配置以及 UI 渲染均集中在 `app/index.tsx` 文件中。这种结构在原型开发阶段非常高效，但随着功能增加，建议向 **Hooks/Services 分层架构** 演进。

## 7. Data Architecture & Models
- **Database**: 目前没有持久化存储。
- **Key Entities**:
    - `Member`: 定义成员属性（ID、姓名、图标、主题色）。
    - `ClassItem`: 定义课程核心属性（价格、总课时、已上课时、上课频率等）。
    - `LogItem`: 记录消课历史（时间、描述文本）。

## 8. External Integrations
- **Expo SDK**: 提供原生功能的桥接。
- **Expo Router**: 处理应用内的导航流。

## 9. CI/CD & DevOps
- **Development**: 使用 Expo CLI 进行本地开发和热更新。
- **Deployment**: N/A (目前处于开发初期)。

## 10. Testing Strategy
- **Frameworks**: 尚未集成正式的测试框架。
- **Validation**: 目前主要通过 Expo Go 进行手动验证。

## 11. Other Relevant Information
- **Build/Run Instructions**: 使用 `npm run start` 启动 Expo 开发服务器。
- **Critical File**: `app/index.tsx` 是目前项目的全部核心所在。
