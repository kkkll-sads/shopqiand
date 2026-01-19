# 项目架构与开发规范

> 适用范围：本仓库前端（React + Vite + Zustand + TypeScript + Tailwind）
> 
> 目标：所有后续修改必须遵循本文档规范，确保新架构一致性、可维护性与稳定性。

---

## 1. 架构总览

- **路由与页面**：统一使用 `react-router-dom` 的 `useNavigate`/`useParams` 等。
- **状态管理**：全局用户与鉴权由 `src/stores/authStore.ts` 统一管理。
- **加载/提交状态**：统一使用 `useStateMachine` + `LoadingState/FormState`。
- **API 响应处理**：统一使用 `utils/apiHelpers.ts`（`isSuccess`/`extractData`/`extractError`）。
- **错误处理**：统一使用 `hooks/useErrorHandler.ts`。
- **样式**：Tailwind CSS + 现有 UI 组件库（`components/common` / `components/layout`）。

---

## 2. 路由规范

### ✅ 必须
- 页面导航必须使用 `useNavigate()`。
- 新页面统一放在 `src/pages` 下，按业务模块分目录。
- 仅使用当前路由配置（`src/router`），禁止恢复/新增旧路由文件或旧导航方案。

### ❌ 禁止
- 禁止使用旧架构相关 Hook（例如旧 `usePageNavigation` / `useAppNavigation`）。
- 禁止依赖旧路由定义文件（如旧 `router/routes`）。

---

## 3. API 响应统一处理规范

### ✅ 必须
- 使用 `isSuccess(response)` 判断成功。
- 使用 `extractData(response)` 提取数据。
- 使用 `extractError(response, defaultMessage)` 提取错误信息。
- 日志/埋点禁止依赖 `response.code`。

### ❌ 禁止
- 直接使用 `response.code === 1/0` 或 `response.code !== 1`。
- 直接访问 `response.msg` 作为业务判断条件。

---

## 4. 状态机规范（Loading / Form）

### 4.1 加载状态（LoadingState）

**适用场景**：页面加载、列表加载、弹窗内容加载、异步拉取数据。

**范式：**
```tsx
const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
  initial: LoadingState.IDLE,
  transitions: {
    [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
    [LoadingState.LOADING]: {
      [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
      [LoadingEvent.ERROR]: LoadingState.ERROR,
    },
    [LoadingState.SUCCESS]: {
      [LoadingEvent.LOAD]: LoadingState.LOADING,
      [LoadingEvent.RETRY]: LoadingState.LOADING,
    },
    [LoadingState.ERROR]: {
      [LoadingEvent.LOAD]: LoadingState.LOADING,
      [LoadingEvent.RETRY]: LoadingState.LOADING,
    },
  },
});
const loading = loadMachine.state === LoadingState.LOADING;
```

### 4.2 表单提交（FormState）

**适用场景**：登录、注册、提交、支付、提现等。

**范式：**
```tsx
const submitMachine = useStateMachine<FormState, FormEvent>({
  initial: FormState.IDLE,
  transitions: {
    [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
    [FormState.VALIDATING]: {
      [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
      [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
    },
    [FormState.SUBMITTING]: {
      [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
      [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
    },
    [FormState.SUCCESS]: {
      [FormEvent.SUBMIT]: FormState.SUBMITTING,
      [FormEvent.RESET]: FormState.IDLE,
    },
    [FormState.ERROR]: {
      [FormEvent.SUBMIT]: FormState.SUBMITTING,
      [FormEvent.RESET]: FormState.IDLE,
    },
  },
});
const submitting = submitMachine.state === FormState.SUBMITTING;
```

### ✅ 必须
- 所有 `loading/submitting` 必须来自状态机。
- 错误路径必须 `SUBMIT_ERROR` 后 `RESET`（必要时用 `setTimeout(..., 0)` 分离 tick）。

---

## 5. 错误处理规范

### ✅ 必须
- 接口异常统一使用 `useErrorHandler`：
  - 页面级错误：`persist: true` + 非 toast 或仅展示。
  - 弹窗/操作错误：`persist: false` + toast。
- 统一日志/错误上报使用 `useErrorHandler` 内置逻辑。

---

## 6. 组件与样式规范

- 页面容器：优先使用 `PageContainer` / `SubPageLayout`。
- 统一加载态组件：`LoadingSpinner`。
- 空状态：`EmptyState`。
- 列表项：`ListItem`（如已有）。
- 不引入新的 UI 框架，避免重复样式体系。

---

## 7. 文件结构规范

```
src/
  pages/           # 页面（按业务模块分目录）
  components/      # 组件
  hooks/           # hooks（统一规范）
  services/        # API 服务
  stores/          # Zustand 全局 store
  utils/           # 工具函数
  types/           # 类型定义
```

---

## 8. 提交与发布规范

- `git status` 不应包含构建产物（如 `dist/`）。
- 提交信息格式：
  - `refactor: ...`、`fix: ...`、`chore: ...`
- 变更后必须通过 `npm run build` 或至少 `npm run lint`（若环境允许）。

---

## 9. 自检清单（每次修改必做）

- [ ] 使用 `useStateMachine` 管理 loading/submitting
- [ ] API 响应使用 `isSuccess/extractData/extractError`
- [ ] 错误处理使用 `useErrorHandler`
- [ ] 路由使用 `useNavigate`
- [ ] 无 `response.code` 判断
- [ ] 无旧架构 Hook/旧路由引用
- [ ] 不提交构建产物

---

## 10. 例外处理

如需引入特殊逻辑或破坏性改动，必须在 PR / 变更说明中显式说明原因，并更新本文档。

---

**本文档为强制规范。后续所有修改必须遵循。**
