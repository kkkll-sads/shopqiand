# 项目开发规范（shuquanqian-codex-billing-align）

## 1. 适用范围

本规范适用于本仓库所有前端代码与文档改动，包含：

- `src/` 下业务代码
- `scripts/` 下构建辅助脚本
- `docs/` 下项目文档

目标是保证以下三点：

- 可维护：目录分层清晰，职责单一
- 可协作：命名、编码、提交流程一致
- 可上线：本地可复现，构建稳定

## 2. 技术栈基线

本项目当前基线如下（以 `package.json` 为准）：

- Runtime: `React 19` + `TypeScript` + `Vite 6`
- Router: `react-router-dom 6`（`createHashRouter`）
- Style: `Tailwind CSS v4`
- Mobile Shell: `Capacitor 8`（Android）
- Icons: `lucide-react`

禁止在未评审的情况下引入同类替代框架（如额外状态库、额外 CSS-in-JS 方案）。

## 3. 目录与职责规范

目录分层按“从通用到业务”执行：

- `src/api/`: 所有后端接口封装与类型
- `src/components/ui/`: 纯 UI 基础组件（无业务耦合）
- `src/components/biz/`: 可复用业务组件
- `src/pages/`: 路由页面与页面级组合逻辑
- `src/features/`: 跨页面可复用业务能力
- `src/hooks/`: 通用 Hooks（请求、滚动、生命周期等）
- `src/lib/`: 与框架无关的业务工具函数
- `docs/`: 规范、架构文档、对外说明

约束：

- 页面逻辑不得直接写进 `ui` 基础组件。
- 复杂页面应拆为 `index.tsx + components/*`。
- 跨页面复用逻辑优先沉淀到 `features/` 或 `hooks/`。

## 4. 路由与页面规范

路由注册统一在 `src/router/index.tsx`。

- 非首屏页面优先 `lazy()` 懒加载。
- Tab 页由 `AppLayout` 统一管理（含 keep-alive 逻辑）。
- 新增页面必须补全路由声明与导航入口。
- 页面导出命名统一为 `XxxPage`。

禁止：

- 在页面内部写“隐式路由跳转魔法”而不经过路由配置。
- 新增重复路径语义（同功能多路径）而无兼容说明。

## 5. API 与数据流规范

接口层统一通过 `src/api/core/client.ts` 与 `src/api/modules/*` 调用。

- 禁止在页面组件中直接 `fetch`。
- 每个接口按模块归档到对应 `modules/*.ts`。
- 接口数据类型必须显式声明，不使用裸 `any`。
- 业务成功码按客户端既有规则处理（`code === 1` / `'1'`）。

错误处理：

- 页面层展示错误时统一走 `FeedbackProvider` / `showToast` / `showConfirm`。
- 需要文案透传时通过 `getErrorMessage` 统一落地。

## 6. 组件与状态管理规范

- 优先函数组件 + Hooks。
- 本地状态优先 `useState`，跨组件共享优先现有上下文与 hooks 能力。
- 请求状态优先复用 `useRequest`，需要分页时复用 `useInfiniteScroll`。
- 一次交互只保留一个主操作按钮，避免双主按钮竞争。

类型规范：

- `props` 必须定义 `interface/type`。
- 公共组件导出类型时，类型名与组件名保持语义一致。
- 不得新增无约束的 `as any`，临时断言需附带注释与后续修复计划。

## 7. UI 与样式规范

- 统一使用 Tailwind 工具类与项目设计 token。
- 公共样式进入 `src/index.css` 或可复用组件，不在页面散落重复样式块。
- 移动端优先：考虑安全区、底部栏、可点击区域最小尺寸。
- 弹窗/抽屉优先复用现有 `BottomSheet`、`ActionSheet`、反馈体系。

新增交互时必须覆盖：

- loading 态
- empty 态
- error 态
- disabled 态

## 8. 编码与文件格式规范

全局编码规范以仓库根目录 `AGENTS.md` 为准，强制执行：

- 文本文件统一 `UTF-8 without BOM`
- 禁止混用 `GBK/ANSI/UTF-16`
- 行尾优先 `LF`；已是 `CRLF` 的文件保持不变
- 提交前检查乱码、BOM、混合编码

## 9. 质量门禁与命令规范

开发流程最小门禁：

1. 开发：`npm run dev`
2. 类型检查：`npm run lint`
3. 构建校验：`npm run build`
4. 架构文档（涉及页面/组件/hooks 变更时）：`npm run docs:architecture`

提交要求：

- 不提交与本任务无关的格式化噪音
- 不提交本地临时文件
- 变更说明必须包含“改了什么、为什么、如何验证”

## 10. 变更清单（PR Checklist）

每次提交前自检：

- 已按目录职责放置文件
- 页面未直接调用裸 `fetch`
- 请求/错误处理使用统一能力
- UI 覆盖 loading/empty/error
- 编码与行尾符合规范
- `lint` 与 `build` 在本地可通过（或明确记录阻塞项）

---

如本规范与线上紧急修复冲突，先修复线上问题，后在 24 小时内补齐规范化改造与文档更新。
