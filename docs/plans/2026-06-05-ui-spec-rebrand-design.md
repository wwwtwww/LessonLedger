# UI Rebrand: 100% iOS 18 规范重构设计

## 1. 视觉基准 (Visual Standard)
*   **源文件**: `docs/UI_SPEC.md`
*   **核心风格**: 线性极简 (Linear Style), 玻璃拟态 (Glassmorphism), Apple iOS 18。
*   **颜色系统**: 
    - 背景: `#F8FAFC`
    - 主色: `#6366F1`
    - 危险: `#EF4444`
    - 成功: `#22C55E`
*   **几何**: 圆角 24px (卡片), 16px (按钮)。

## 2. 页面结构 (Dashboard Structure)
首页严格限制为 5 个纵向排列的部分，间距统一为 24px：

1.  **[Glass Header]**: 
    - 沉浸式顶部，hairlineWidth 底部边框。
    - 移除双行标题，改为 iOS 18 线性排版。
2.  **[Member Switcher]**: 
    - Apple Wallet 风格卡片堆叠。
    - reanimated 弹簧反馈 (scale: 1.05, translateY: -4)。
3.  **[Summary Cards]**: 
    - 采用 Apple Fitness 风格的双块设计。
    - 移除饼图。
    - 左卡片: 累计投入 (Gradient)。
    - 右卡片: 剩余课时总计 (作为完整列表入口)。
4.  **[Warning Courses]**: 
    - 动态展示 (仅当剩余 <= 3 时)。
    - 线性边框风格，无背景投影。
5.  **[Recent Logs]**: 
    - 极简线性时间轴。
    - 移除组件卡片感，直接在背景上排版。

## 3. 组件重构策略
*   **合并**: 原“全部课程列表”移入二级层级，通过 Summary Card 点击进入。
*   **删除**: 移除 `ExpensePieChart`、Bootstrap 样式的阴影、三栏平铺统计。
*   **更新**: 所有按钮对齐 16px 圆角。
