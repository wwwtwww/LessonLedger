# Component Fidelity: 100% 组件规范重构设计

## 1. 物理参数基准 (Physical Standard)
*   **源文件**: `docs/LESSONLEDGER_COMPONENT_SPEC.md`
*   **核心圆角**: 24px (卡片), 32px (弹窗)。
*   **核心阴影**: `y:8, blur:30, color: rgba(0,0,0,0.08)`。
*   **间距系统**: 8px 步进单位 (8/16/24/32)。

## 2. 交互与反馈 (Haptics & Animation)
*   **Haptics**:
    - Tap: light impact
    - Member Switch: medium impact
    - Card Press: soft impact
*   **Animations**:
    - 默认持续时间: 300ms
    - Easing: easeOut
    - 按压反馈: 卡片 0.97, 统计卡 1.02

## 3. 组件级精修 (Refinement)
*   **[Glass Header]**: 
    - 背景: `rgba(255,255,255,0.3)`，模糊强度: `60`。
    - 200ms fade-in 挂载动效。
*   **[Member Switcher]**: 
    - 锁定 72x72 尺寸。
    - Spring(20, 180) 物理手感。
*   **[Warning Cards]**: 
    - 160px 固定高度。
    - 250ms easeOut 进度条过渡。
*   **[Logs]**: 
    - 72px 条目高度。
    - 200ms fade-in。

## 4. 严格规则
*   严禁任何形式的新增板块或自行设计。
*   全案必须保持 390px 目标宽度布局。
