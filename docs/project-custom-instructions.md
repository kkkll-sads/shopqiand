# 项目自定义指令（适配版）

> 来源：历史项目规范。  
> 本文已按当前仓库真实配置做适配：可执行项直接生效，未启用项单独标注。

## 1. 项目概述

数字藏品交易平台前端（移动端 H5 / WebView 场景）。

## 2. 技术栈（当前仓库）

| 类别 | 技术 | 当前状态 |
|---|---|---|
| 框架 | React | 已启用（19.x） |
| 构建 | Vite | 已启用（6.x） |
| 样式 | Tailwind CSS | 已启用（v4） |
| 类型 | TypeScript | 已启用（5.8） |
| 路由 | React Router | 已启用（6.28，非 7） |
| 状态 | Zustand | 暂未启用（依赖中不存在） |
| 测试 | Vitest | 暂未启用（无 test 脚本） |
| 代码规范 | ESLint + Prettier | 暂未启用（无相关脚本） |

## 3. 浏览器兼容性（最高优先级）

兼容目标（执行约束）：

```
> 0.5%, last 2 versions, not dead, Android >= 5, iOS >= 10
```

### 3.1 禁止使用的 CSS 特性

- `color-mix()`
- `lab()`
- `oklch()`
- `@property`
- `:host`
- `lh` 单位

说明：

- `@layer`、逻辑属性等由构建脚本处理，但仍建议优先写旧版友好写法。
- 构建后会通过脚本清理/检查不兼容 CSS。

### 3.2 禁止使用的 JS 运行时特性

- `Array.at()`
- `Object.hasOwn()`
- `structuredClone()`
- `Array.prototype.findLast()`
- `String.prototype.replaceAll()`
- 顶层 `await`
- `??=` / `||=` / `&&=`

说明：

- `@vitejs/plugin-legacy` 负责语法转译，不保证实例方法自动 polyfill。

## 4. 构建验证流水线（强制）

```bash
npm run build
npm run check:css-compat
```

备注：

- `npm run build` 已包含 `sanitize-css.mjs` 与 `check-css-compat.mjs`。

## 5. 编码与样式规范

- 统一 `UTF-8 without BOM`（见根目录 `AGENTS.md`）。
- 移动端优先，考虑安全区 `env(safe-area-inset-*)`。
- 颜色优先 `rgb()` / `rgba()` / `hex`。
- 禁止引入高级色彩函数作为运行时依赖。

## 6. TypeScript 与代码风格

- 函数组件 + Hooks。
- 对外 API / Props 必须有类型声明。
- 禁止新增无约束 `any`；若必须使用需写清原因。
- 既有代码中的宽松规则允许保留，但新代码优先严格类型。

## 7. API 约束

- 请求前缀使用 `/api`。
- 开发环境由 Vite Proxy 转发到后端（当前为 `/index.php/api` 路径改写）。
- 不在页面直接写裸 `fetch`，统一走 `src/api` 封装层。

## 8. 命令基线（当前可用）

| 命令 | 说明 |
|---|---|
| `npm run dev` | 本地开发（5657） |
| `npm run lint` | TypeScript 类型检查（`tsc --noEmit`） |
| `npm run build` | 生产构建 + CSS 清理 + CSS 兼容检查 |
| `npm run check:css-compat` | 仅检查构建产物 CSS 兼容 |
| `npm run docs:architecture` | 生成页面/组件/hooks 文档 |

## 9. 历史规范中的“暂未启用项”

以下内容来自旧规范，但当前仓库尚未启用：

- Zustand 状态层
- React Router 7
- Vitest 测试体系与 `npm run test`
- ESLint + Prettier 工具链
- `npm run verify` / `npm run typecheck`（当前无脚本）

如后续引入这些能力，应在引入同一 PR 中同步更新本文件与 `README.md`。
