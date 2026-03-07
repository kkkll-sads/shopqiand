# 项目自定义指令

## 项目概述

数字藏品交易平台前端（cultural-asset-trader），面向移动端 H5 / WebView 场景。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19 |
| 构建 | Vite | 6 |
| 样式 | Tailwind CSS | v4 (`@tailwindcss/postcss`) |
| 类型 | TypeScript | 5.8 |
| 状态 | Zustand | 5 |
| 路由 | React Router | 7 |
| 测试 | Vitest | 4 |
| 代码规范 | ESLint + Prettier |  |

## ⚠️ 浏览器兼容性（最高优先级）

本项目必须兼容旧版浏览器和 WebView，目标：

```
> 0.5%, last 2 versions, not dead, Android >= 5, iOS >= 10
```

### 禁止使用的 CSS 特性

| 特性 | 原因 | 替代方案 |
|------|------|----------|
| `color-mix()` | Chrome 111+ | 使用 `rgba()` / `hex` |
| `lab()` / `oklch()` | Chrome 111+ | 使用 `rgb()` / `hex` |
| `@layer` | Chrome 99+ (由 PostCSS 自动降级) | 无需手动处理 |
| `@property` | Chrome 85+ | 直接声明 CSS 变量 |
| `:host` 选择器 | 非 Shadow DOM 项目 | 不使用 |
| `lh` 单位 | Chrome 109+ | 使用 `em` / `rem` |
| CSS 逻辑属性 (`padding-inline` 等) | Chrome 87+ (由 PostCSS 自动降级) | 推荐直接写物理属性 |
| `color-scheme` | 部分旧版不支持 | 手动实现主题切换 |

### 禁止使用的 JS 特性（运行时）

以下特性即使 TypeScript 编译通过，在旧版 WebView 中也会报错：

| 特性 | 最低支持 | 替代方案 |
|------|----------|----------|
| `Array.at()` | Chrome 92 | `arr[arr.length - 1]` |
| `Object.hasOwn()` | Chrome 93 | `Object.prototype.hasOwnProperty.call()` |
| `structuredClone()` | Chrome 98 | `JSON.parse(JSON.stringify())` |
| `Array.prototype.findLast()` | Chrome 97 | `[...arr].reverse().find()` |
| `String.prototype.replaceAll()` | Chrome 85 | `.replace(/pattern/g, replacement)` |
| 顶层 `await` | ES2022 | 包裹在 `async` 函数中 |
| `??=`, `||=`, `&&=` | Chrome 85 | 展开写 `x = x ?? y` |

> [!IMPORTANT]
> `@vitejs/plugin-legacy` 会通过 Babel 转译语法，但 **不会自动 polyfill 实例方法**。
> 上述 API 必须手动避免或显式引入 polyfill。

### 构建验证流水线

构建后必须通过 CSS 兼容性检查：

```bash
npm run build          # 构建 + CSS 清理 (sanitize-css.mjs)
npm run check:css-compat  # 验证无不兼容 CSS 残留
```

## 项目结构

```
src/
├── components/    # 可复用组件
├── constants/     # 常量定义
├── context/       # React Context
├── hooks/         # 自定义 Hooks
├── layouts/       # 布局组件
├── pages/         # 页面组件（按功能模块分目录）
├── providers/     # Provider 组件
├── router/        # 路由配置
├── services/      # API 服务层
├── stores/        # Zustand 状态管理
├── styles/        # 全局样式
├── types/         # TypeScript 类型定义
└── utils/         # 工具函数
```

## 编码规范

### 样式
- 使用 **Tailwind CSS v4** 实用类（通过 `@tailwindcss/postcss` 集成）
- 主色调：`primary` 系列（JD Red `#e1251b`）
- 颜色只使用 `rgb()` / `rgba()` / `hex`，**禁止**高级色彩函数
- 移动端优先设计，支持安全区域 `env(safe-area-inset-*)`

### TypeScript
- `target: ES2022`（编译目标，由 legacy 插件降级）
- 路径别名 `@/` → `src/`
- 允许 `any`（`@typescript-eslint/no-explicit-any: off`）
- 函数参数/变量以 `_` 前缀忽略未使用警告

### 代码格式
- 单引号，分号结尾
- 缩进 2 空格
- 行宽 100 字符
- 尾逗号 `es5`
- 箭头函数始终加括号

### 组件规范
- 函数组件 + Hooks
- 使用 `React.FC<Props>` 类型标注
- 日志统一使用 `debugLog()` / `errorLog()`（`@/utils/logger`）
- API 响应使用 `isSuccess()` 判断（`@/utils/apiHelpers`）

### 后端 API
- 前缀 `/api`，开发环境通过 Vite proxy 转发
- 后端为 ThinkPHP，入口 `/api/index.php`

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 5657） |
| `npm run build` | 生产构建 + CSS 清理 |
| `npm run verify` | 完整验证（测试 + 类型 + 构建 + CSS 检查） |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run test` | 运行 Vitest 单元测试 |
| `npm run check:css-compat` | 构建产物 CSS 兼容性检查 |
