# 实名认证状态机设计文档

> **创建时间**: 2025-12-29
> **目标**: 重构 RealNameAuth.tsx，解决状态管理混乱问题

---

## 1. 当前问题

### 问题清单
- ❌ **3个独立boolean**：`loading`, `submitting`, `verifying` 无互斥保证
- ❌ **90行巨型useEffect**：URL参数处理 + API调用 + 错误处理混在一起
- ❌ **状态转换分散**：按钮禁用逻辑 `if (submitting || verifying)` 分散各处
- ❌ **并发问题**：用户快速点击可能导致状态冲突

### 风险场景
1. 用户在加载中点击提交 → `loading && verifying` 同时为true
2. 核身失败刷新页面 → URL参数未清除，重复处理
3. 网络慢时连续点击 → 重复提交

---

## 2. 状态机设计

### 2.1 状态定义

```typescript
enum RealNameState {
  // 核心流程状态
  IDLE = 'idle',              // 初始状态（刚进入页面）
  LOADING = 'loading',        // 加载实名认证状态

  // 未认证分支
  FORM = 'form',              // 显示表单（未认证）
  VERIFYING = 'verifying',    // 跳转H5核身中
  PROCESSING = 'processing',  // 处理核身结果
  SUBMITTING = 'submitting',  // 提交实名认证

  // 已认证分支
  SUCCESS = 'success',        // 已通过实名认证
  PENDING = 'pending',        // 审核中

  // 错误状态
  ERROR = 'error',            // 错误状态（显示错误信息）
}
```

### 2.2 状态转换图

```
┌─────────┐
│  IDLE   │ 初始状态
└────┬────┘
     │
     ▼
┌──────────┐
│ LOADING  │ 加载实名认证状态
└─┬──┬──┬──┘
  │  │  │
  │  │  └──────────────┐
  │  │                 │
  ▼  ▼                 ▼
┌────┐┌────────┐  ┌─────────┐
│FORM││SUCCESS │  │ PENDING │ 审核中
└──┬─┘└────────┘  └─────────┘
   │
   │ 点击"开始认证"
   ▼
┌───────────┐
│ VERIFYING │ 跳转H5核身
└─────┬─────┘
      │
      │ 从H5返回
      ▼
┌────────────┐
│ PROCESSING │ 处理核身结果
└──┬────┬────┘
   │    │
   ▼    ▼
┌──────────┐ ┌───────┐
│SUBMITTING│ │ ERROR │
└────┬─────┘ └───────┘
     │
     ▼
┌─────────┐
│ SUCCESS │ 认证成功
└─────────┘
```

### 2.3 状态转换规则

| 当前状态 | 事件 | 下一状态 | 条件 |
|---------|------|---------|------|
| IDLE | LOAD | LOADING | 组件mount |
| LOADING | LOAD_SUCCESS_VERIFIED | SUCCESS | real_name_status === 2 |
| LOADING | LOAD_SUCCESS_PENDING | PENDING | real_name_status === 1 |
| LOADING | LOAD_SUCCESS_FORM | FORM | real_name_status === 0 |
| LOADING | LOAD_ERROR | ERROR | API失败 |
| FORM | SUBMIT | VERIFYING | 表单验证通过 |
| VERIFYING | VERIFY_CALLBACK | PROCESSING | 从H5页面返回 |
| PROCESSING | VERIFY_SUCCESS | SUBMITTING | 核身通过 |
| PROCESSING | VERIFY_ERROR | ERROR | 核身失败 |
| SUBMITTING | SUBMIT_SUCCESS | SUCCESS | 提交成功 |
| SUBMITTING | SUBMIT_ERROR | ERROR | 提交失败 |
| ERROR | RETRY | FORM | 用户点击重试 |
| ERROR | RETRY_LOAD | LOADING | 重新加载 |

### 2.4 状态派生数据

```typescript
// 按钮禁用规则
const canSubmit = state === 'FORM';

// Loading显示规则
const isLoading = ['LOADING', 'SUBMITTING', 'PROCESSING'].includes(state);

// 表单显示规则
const showForm = state === 'FORM';

// 成功页显示规则
const showSuccess = state === 'SUCCESS';
```

---

## 3. 数据结构设计

### 3.1 Context数据

```typescript
interface RealNameContext {
  // 状态数据
  status: RealNameStatusData | null;  // API返回的状态数据
  error: string | null;               // 错误信息

  // 表单数据
  realName: string;
  idCard: string;

  // URL参数（处理H5回调）
  authToken: string | null;
  callbackCode: string | null;
  callbackSuccess: boolean | null;
}
```

### 3.2 Actions

```typescript
type RealNameAction =
  | { type: 'LOAD' }
  | { type: 'LOAD_SUCCESS_VERIFIED'; payload: RealNameStatusData }
  | { type: 'LOAD_SUCCESS_PENDING'; payload: RealNameStatusData }
  | { type: 'LOAD_SUCCESS_FORM'; payload: RealNameStatusData }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'SUBMIT'; payload: { realName: string; idCard: string } }
  | { type: 'VERIFY_CALLBACK'; payload: { authToken: string; code?: string; success?: string } }
  | { type: 'VERIFY_SUCCESS'; payload: H5RecheckResult }
  | { type: 'VERIFY_ERROR'; payload: string }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'RETRY' }
  | { type: 'RETRY_LOAD' };
```

---

## 4. 技术实现方案

### 4.1 通用状态机Hook

```typescript
// hooks/useStateMachine.ts
interface StateMachineConfig<State, Event> {
  initial: State;
  transitions: Record<State, Partial<Record<Event, State>>>;
  context?: any;
}

export function useStateMachine<State extends string, Event extends string>(
  config: StateMachineConfig<State, Event>
) {
  const [state, setState] = useState<State>(config.initial);
  const [context, setContext] = useState(config.context);

  const can = (event: Event): boolean => {
    return !!config.transitions[state]?.[event];
  };

  const send = (event: Event, payload?: any): boolean => {
    const nextState = config.transitions[state]?.[event];
    if (!nextState) {
      console.warn(`Invalid transition: ${state} + ${event}`);
      return false;
    }

    setState(nextState);
    if (payload !== undefined) {
      setContext((prev: any) => ({ ...prev, ...payload }));
    }
    return true;
  };

  return { state, context, can, send, setState, setContext };
}
```

### 4.2 实名认证业务Hook

```typescript
// hooks/useRealNameAuth.ts
export function useRealNameAuth() {
  const { showToast } = useNotification();

  const { state, context, send, setContext } = useStateMachine<
    RealNameState,
    RealNameEvent
  >({
    initial: RealNameState.IDLE,
    transitions: REAL_NAME_TRANSITIONS,
    context: {
      status: null,
      error: null,
      realName: '',
      idCard: '',
      authToken: null,
    }
  });

  // 初始化：检查URL参数
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('authToken');

    if (authToken) {
      // 清除URL参数
      window.history.replaceState({}, '', window.location.pathname);

      // 触发回调处理
      send('VERIFY_CALLBACK', {
        authToken,
        code: urlParams.get('code'),
        success: urlParams.get('success'),
      });
    } else {
      // 正常加载
      send('LOAD');
    }
  }, []);

  // 加载状态
  useEffect(() => {
    if (state === RealNameState.LOADING) {
      loadRealNameStatus();
    }
  }, [state]);

  // 处理核身回调
  useEffect(() => {
    if (state === RealNameState.PROCESSING) {
      handleAuthCallback();
    }
  }, [state]);

  // 提交实名认证
  useEffect(() => {
    if (state === RealNameState.SUBMITTING && context.authToken) {
      submitRealNameWithAuthToken();
    }
  }, [state]);

  // ... 其他业务逻辑

  return {
    state,
    context,
    canSubmit: state === RealNameState.FORM,
    isLoading: ['LOADING', 'SUBMITTING', 'PROCESSING'].includes(state),
    handleSubmit: () => send('SUBMIT', { realName, idCard }),
    handleRetry: () => send('RETRY'),
    updateForm: (data: Partial<RealNameContext>) => setContext((prev) => ({ ...prev, ...data })),
  };
}
```

---

## 5. 验收标准

- [ ] **状态互斥**: 任意时刻只有一个状态active
- [ ] **转换显式**: 所有状态转换通过 `send()` 触发
- [ ] **按钮绑定**: `disabled={!canSubmit}` 直接绑定状态
- [ ] **无并发问题**: 不存在同时 loading && submitting
- [ ] **URL参数清除**: 从H5返回后立即清除参数
- [ ] **代码精简**: useEffect < 30行，组件 < 300行

---

## 6. 回滚策略

1. **独立文件**: 状态机Hook独立于组件，不影响现有代码
2. **特性开关**: 可通过环境变量控制是否启用状态机
3. **分支开发**: 在feature分支开发，测试通过后合并
4. **保留旧代码**: 重构期间保留注释的旧代码，1个版本后删除

---

## 7. 实施步骤

1. ✅ **Step 1**: 设计状态机（本文档）
2. ⏳ **Step 2**: 实现通用useStateMachine Hook
3. ⏳ **Step 3**: 实现useRealNameAuth Hook
4. ⏳ **Step 4**: 重构RealNameAuth.tsx组件
5. ⏳ **Step 5**: 测试验证（单元测试 + E2E测试）
6. ⏳ **Step 6**: Code Review + 合并

---

## 8. 风险评估

| 风险 | 概率 | 影响 | 应对措施 |
|-----|------|------|---------|
| 学习曲线陡峭 | 中 | 低 | 提供完整文档和示例 |
| 状态转换遗漏 | 低 | 中 | 完善单元测试覆盖 |
| 与现有代码冲突 | 低 | 低 | 特性分支独立开发 |
| 性能影响 | 极低 | 极低 | 状态机无额外开销 |

---

**预计工时**: 1人日（设计30min + 开发4h + 测试2h + Review 1h）
