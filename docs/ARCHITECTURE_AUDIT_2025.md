# 前端架构审计报告 & 重构路线图

> **生成时间**: 2025-12-29
> **项目**: 树交所数字资产交易平台
> **框架**: React 19.2.0 + TypeScript 5.8 + Vite 6.2
> **审计范围**: 80+ 页面组件，17个服务模块，完整状态管理与交互逻辑

---

## 📊 A. 代码结构问题清单（按严重程度排序）

### 🔴 P0 - 严重问题（立即处理）

#### 1. 状态管理混乱，多 Boolean 互斥问题

**问题位置**: `pages/user/RealNameAuth.tsx:43-56`, `pages/wallet/AssetView.tsx:42-85`, 40+ 页面

**症状**:
```tsx
// ❌ 当前实现：3个独立boolean + 对象状态
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [verifying, setVerifying] = useState(false);
const [status, setStatus] = useState<Data | null>(null);

// 风险：可能同时 loading && submitting
```

**影响**:
- 无法保证状态互斥性（同时显示多个 loading）
- 派生状态分散，难以追踪
- 状态转换逻辑隐藏在各处 useEffect

**根因**: 未使用状态机模式，依赖人工维护状态一致性

**修复成本**: 高（需重构10+个核心页面）

---

#### 2. useEffect 职责过重，单函数100+行

**问题位置**: `pages/user/RealNameAuth.tsx:59-148` (90行), `pages/wallet/AssetView.tsx:154-267` (113行)

**症状**:
```tsx
useEffect(() => {
  const handleAuthCallback = async () => {
    // 90行代码：URL解析 + 错误处理 + API调用 + 状态更新
    if (!authToken) { loadRealNameStatus(); return; }
    // 各种分支逻辑...
  };
  handleAuthCallback();
}, []);
```

**影响**:
- 难以测试（副作用嵌套深）
- 职责不清（URL解析、API、状态更新混在一起）
- 维护成本高（修改一处影响全局）

**根因**: 缺少自定义 hooks 拆分，所有逻辑写在组件内

---

#### 3. API 响应判断重复 115 次

**问题位置**: 全局 40 个文件，共 115 处 `.code === 1` 硬编码

**症状**:
```tsx
// ❌ 模式1
if (response.code === 1 && response.data) { ... }

// ❌ 模式2
if (res.code === 1 || typeof res.code === 'undefined') { ... }

// ❌ 模式3（容错过度）
if (response.code === 1 || response.data) { ... }
```

**影响**:
- 判断逻辑不一致（有时允许 code=undefined）
- 无法统一修改（后端返回格式调整需改115处）
- 容易漏判（新接口遗忘判断）

**根因**: 缺少统一的 API 响应封装工具

---

### 🟠 P1 - 高风险问题（近期处理）

#### 4. 错误处理模式分散，无统一标准

**问题位置**: 所有页面组件

**症状**:
```tsx
// 模式1：setError + showToast
setError(errorMsg);
showToast('error', '核身失败', errorMsg);

// 模式2：只 showToast
showToast('warning', '请输入真实姓名');

// 模式3：只 setError（用户无感知）
setError('请输入真实姓名');
```

**影响**:
- 用户体验不一致（有时有Toast，有时没有）
- 错误状态管理混乱（何时清除error？）
- 重复代码多

---

#### 5. 表单验证不统一

**问题位置**: `pages/user/RealNameAuth.tsx:259-269`, 20+ 表单页面

**症状**:
```tsx
// ❌ 当前：手工验证
if (!realName?.trim()) {
  setError('请输入真实姓名');
  return;
}
// 缺少：姓名格式、身份证格式、长度校验
```

**存在问题**:
- `utils/validation.ts` 已有完整验证函数，但未使用
- 每个页面自己写验证逻辑（重复）
- 验证规则不一致

---

#### 6. 分页逻辑重复，每页都实现一遍

**问题位置**: `AssetView.tsx`, `OrderListPage.tsx`, `MyCollection.tsx`, 15+ 列表页

**症状**:
```tsx
// ❌ 每个列表页都有类似代码
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(false);
const [loading, setLoading] = useState(false);
// + 50行加载逻辑
```

**已有方案**: `hooks/usePagination.ts` 但未广泛使用

---

### 🟡 P2 - 中风险问题（计划处理）

#### 7. 魔法数字判断状态，可读性差

**问题位置**: `AssetView.tsx:126-146`, `ProductDetail.tsx`, 30+ 页面

**症状**:
```tsx
// ❌ 魔法数字
const isAuthed = status?.real_name_status === 2;  // 2是什么？
const isPending = status?.real_name_status === 1;  // 1是什么？
if (item.consignment_status === 4) { ... }        // 4是什么？
```

**应该**:
```tsx
// ✅ 枚举常量
const isAuthed = status?.real_name_status === RealNameStatus.VERIFIED;
const isPending = status?.real_name_status === RealNameStatus.PENDING;
```

---

#### 8. 巨型组件（1000+ 行）

**问题位置**:
- `AssetView.tsx`: 1342 行
- `ProductDetail.tsx`: 564 行
- `RealNameAuth.tsx`: 461 行

**影响**:
- 难以理解（需要滚动查看）
- 重复渲染风险（React优化困难）

---

#### 9. 样式类名硬编码，难以维护

**症状**:
```tsx
// ❌ 长字符串拼接
className="w-full bg-orange-600 text-white text-base font-semibold py-3.5 rounded-full shadow-lg shadow-orange-200 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
```

**建议**: 使用 Tailwind 组件封装或 CSS Modules

---

### 🟢 P3 - 低风险问题（优化项）

#### 10. 缺少 TypeScript 严格类型约束

- `any` 类型大量使用（`err: any`, `response: any`）
- 可选链过度使用（`item?.title || item?.name || ''`）

#### 11. 注释不足

- 核心业务逻辑无注释（寄售解锁、权益分割）
- 复杂算法无说明（48小时倒计时、Luhn校验）

---

## ⚠️ B. 交互逻辑高风险点清单（按用户路径）

### 🔴 路径1: 登录 → 实名认证 → 购买藏品

#### 风险点1.1: 实名认证回调处理（P0）

**位置**: `RealNameAuth.tsx:59-148`

**场景**:
1. 用户从 H5 核身页面返回
2. URL 带有 `authToken`, `code`, `success` 参数

**风险**:
```tsx
// ❌ 问题代码
const authToken = urlParams.get('authToken');
if (!authToken) {
  loadRealNameStatus();  // 正常流程
  return;
}
// 90行异常处理...
```

**潜在Bug**:
- ✗ **URL参数未清除**：刷新页面会重复处理
- ✗ **并发问题**：用户快速返回时，`verifying` 未正确重置
- ✗ **错误码映射不全**：只处理 code 2-11，其他返回什么？

**触发条件**:
1. 核身失败后刷新页面
2. 核身中途关闭浏览器

**用户影响**: 中 - 可能显示错误状态或重复提交

---

#### 风险点1.2: 状态互斥失败（P0）

**位置**: `RealNameAuth.tsx:43-56`, `AssetView.tsx:42-86`

**场景**: 用户快速点击"提交"按钮

**风险**:
```tsx
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [verifying, setVerifying] = useState(false);

// ❌ 没有互斥检查
const handleSubmit = async () => {
  if (submitting || verifying) return;  // 但可能同时loading=true
  setVerifying(true);
  // ... API 调用
};
```

**潜在Bug**:
- ✗ **连续点击**：loading 和 verifying 同时为 true
- ✗ **按钮未禁用**：`disabled={submitting || verifying}` 但漏了 `loading`

**触发条件**: 网络慢时连续点击

**用户影响**: 高 - 重复提交，产生脏数据

---

### 🟠 路径2: 资产视图 → 提货/寄售操作

#### 风险点2.1: 48小时倒计时不准确（P1）

**位置**: `AssetView.tsx:154-181`, `196-267`

**场景**: 用户购买藏品后，查看倒计时

**风险**:
```tsx
// ❌ 问题1：前后端时间不同步
const check48Hours = (time: number) => {
  const now = Math.floor(Date.now() / 1000);  // 前端时间
  const hoursPassed = (now - time) / 3600;
  // 后端返回的 time 是服务器时间？
};

// ❌ 问题2：多个倒计时逻辑
// - check48Hours (本地计算)
// - consignmentCheckData.remaining_seconds (后端返回)
// - calculateCountdown (组件内计算)
```

**潜在Bug**:
- ✗ **时间漂移**：前端时间不准（用户手动调整）
- ✗ **跨时区问题**：服务器东八区，用户其他时区
- ✗ **倒计时不同步**：前端显示可操作，后端返回未到时间

**触发条件**: 系统时间不准 + 跨时区

**用户影响**: 中 - 点击按钮后才提示"时间未到"

---

#### 风险点2.2: 寄售/提货状态判断复杂（P0）

**位置**: `AssetView.tsx:128-146`, `289-367`

**场景**: 用户查看藏品可操作性

**风险**:
```tsx
// ❌ 8种状态组合
const isConsigning = (item) => item.consignment_status === 2 || === 1;
const hasConsignedSuccessfully = (item) => item.consignment_status === 4;
const hasConsignedBefore = (item) => status !== 0;
const isDelivered = (item) => item.delivery_status === 1;

// 组合逻辑：4 × 2 = 8种
if (isConsigning || hasConsignedSuccessfully) { ... }
else if (hasConsignedBefore) { ... }
else if (isDelivered) { ... }
// ...
```

**潜在Bug**:
- ✗ **状态机缺失**：没有明确的状态转移图
- ✗ **边界条件未覆盖**：同时满足多个条件怎么办？
- ✗ **按钮禁用逻辑分散**：`canPerformAction` 有 50 行判断

**触发条件**: 后端返回异常状态组合

**用户影响**: 高 - 按钮可点但操作失败，或应该可点但被禁用

---

### 🟡 路径3: 商品详情 → 购买 → 支付

#### 风险点3.1: 购买按钮连点（P1）

**位置**: `ProductDetail.tsx:83-127`

**场景**: 用户点击"立即购买"

**风险**:
```tsx
const handleBuy = async () => {
  if (buying) return;  // ✓ 有防抖

  showDialog({
    // ❌ 但 Dialog 确认时没检查 buying 状态
    onConfirm: async () => {
      setBuying(true);
      await buyShopOrder(...);
    }
  });
};
```

**潜在Bug**:
- ✗ **Dialog打开期间再次点击**：可以打开多个Dialog
- ✗ **网络延迟时重复点击确认**：状态检查失效

**触发条件**: 网络慢 + 连续点击

**用户影响**: 高 - 重复扣款

---

#### 风险点3.2: 价格分区提取失败回退（P2）

**位置**: `ProductDetail.tsx:25-29`, `148-171`

**场景**: 后端返回价格分区（如 "500元区"）

**风险**:
```tsx
const extractPriceFromZone = (priceZone?: string): number => {
  if (!priceZone) return 0;
  const match = priceZone.match(/(\d+)/);
  return match ? Number(match[1]) : 0;  // ❌ 返回0会显示¥0
};

// 使用时有回退
if (displayPriceNum <= 0) displayPriceNum = actualPrice;
```

**潜在Bug**:
- ✗ **正则不健壮**：`"区500元"` 会提取 500（错误）
- ✗ **0元商品无法区分**：真的免费 vs 提取失败

**触发条件**: 后端返回异常格式

**用户影响**: 低 - 显示错误价格（但有回退）

---

### 🟢 路径4: 通用交互风险

#### 风险点4.1: 空态/错误态展示不一致（P2）

**场景**: 列表为空时

**问题**:
```tsx
// ❌ 模式1：EmptyState 组件
{list.length === 0 && <EmptyState />}

// ❌ 模式2：自己写
{list.length === 0 && <div>暂无数据</div>}

// ❌ 模式3：条件渲染混乱
{!loading && !error && list.length === 0 && ...}
```

**统计**: 30+ 列表页，15种不同的空态写法

---

#### 风险点4.2: Toast 弹窗叠加（P2）

**场景**: 多个异步操作同时失败

**问题**:
```tsx
// ❌ 无防抖
showToast('error', '操作失败');
showToast('error', '网络错误');
showToast('error', '登录过期');
// 3个Toast同时显示？还是覆盖？
```

**位置**: `context/NotificationContext.tsx`

**需确认**: Toast 队列是否有限制？

---

#### 风险点4.3: 返回按钮刷新问题（P1）

**场景**: 详情页 → 返回列表

**问题**:
```tsx
// ❌ 模式1：不刷新
onBack={() => goBack()}

// ❌ 模式2：强制刷新
onBack={() => { goBack(); loadData(); }}

// ❌ 模式3：依赖 useEffect
useEffect(() => { loadData(); }, [subPage]);
```

**影响**: 用户修改数据后返回，列表不更新

---

## 📋 C. 任务卡列表（可执行重构计划）

### 任务卡 #1: 引入状态机模式（核心）

**目标**: 解决多 Boolean 状态混乱问题

**范围**:
- `pages/user/RealNameAuth.tsx`
- `pages/wallet/AssetView.tsx`
- `pages/market/Cashier.tsx`

**改动文件** (预估):
```
pages/user/RealNameAuth.tsx         [重构 200行]
utils/stateMachine.ts                [新建]
hooks/useStateMachine.ts             [新建]
types/states.ts                      [新建]
```

**技术方案**:

```tsx
// ✅ utils/stateMachine.ts
enum RealNameState {
  IDLE = 'idle',
  LOADING = 'loading',
  FORM = 'form',
  SUBMITTING = 'submitting',
  VERIFYING = 'verifying',
  SUCCESS = 'success',
  ERROR = 'error',
}

type StateTransition = {
  from: RealNameState[];
  to: RealNameState;
  guard?: () => boolean;
};

// ✅ 使用
const { state, transition, can } = useStateMachine({
  initial: RealNameState.IDLE,
  states: {
    [RealNameState.IDLE]: { on: { LOAD: RealNameState.LOADING } },
    [RealNameState.LOADING]: { on: { SUCCESS: RealNameState.FORM, ERROR: RealNameState.ERROR } },
    [RealNameState.FORM]: { on: { SUBMIT: RealNameState.SUBMITTING } },
    // ...
  }
});
```

**验收标准**:
- [ ] 不存在 3个以上独立 loading/submitting 状态
- [ ] 所有状态转换显式声明
- [ ] 按钮 disabled 直接绑定状态：`disabled={!can('SUBMIT')}`
- [ ] 控制台无 "Cannot update a component while rendering" 警告

**回滚策略**:
1. 状态机工具独立文件，不影响现有代码
2. 逐页迁移，保留旧代码注释
3. Git分支开发，测试通过后合并

**预计风险**:
- 中：学习曲线陡峭
- 低：状态转换边界条件测试不全

**工时评估**: 5人日（1人）

---

### 任务卡 #2: 封装统一 API 响应处理

**目标**: 消除 115 处 `.code === 1` 重复判断

**范围**: 全局 40 个文件

**改动文件**:
```
utils/apiHelpers.ts                  [新建]
services/*.ts                        [修改所有服务文件]
pages/**/*.tsx                       [修改调用处]
```

**技术方案**:

```tsx
// ✅ utils/apiHelpers.ts
export const isSuccess = (response: ApiResponse): boolean => {
  return response.code === 1 || typeof response.code === 'undefined';
};

export const extractData = <T>(response: ApiResponse<T>): T | null => {
  return isSuccess(response) ? (response.data as T) : null;
};

export const extractError = (response: ApiResponse): string => {
  return response.msg || response.message || '操作失败';
};

// ✅ 高阶函数：自动处理错误
export const withErrorHandling = <T>(
  apiFn: () => Promise<ApiResponse<T>>,
  onError?: (msg: string) => void
): Promise<T | null> => {
  return apiFn().then(res => {
    if (isSuccess(res)) return extractData(res);
    const errorMsg = extractError(res);
    onError?.(errorMsg);
    return null;
  });
};

// ✅ 使用
const data = await withErrorHandling(
  () => fetchProfile(token),
  (msg) => showToast('error', msg)
);
if (data) { ... }
```

**验收标准**:
- [ ] 代码库中 `.code === 1` 少于 10 处（仅底层工具使用）
- [ ] 所有 API 调用统一格式
- [ ] 新增 API 自动遵循规范

**回滚策略**:
1. 工具函数向后兼容旧写法
2. 批量替换前打 Git 标签

**预计风险**:
- 低：API响应格式一致性高

**工时评估**: 3人日（1人）

---

### 任务卡 #3: 拆分巨型 useEffect 为自定义 Hooks

**目标**: 解决单函数 100+ 行问题

**范围**:
- `RealNameAuth.tsx:59-148` (90行)
- `AssetView.tsx:154-267` (113行)

**改动文件**:
```
hooks/useAuthCallback.ts             [新建]
hooks/useConsignmentCheck.ts         [新建]
pages/user/RealNameAuth.tsx          [重构]
pages/wallet/AssetView.tsx           [重构]
```

**技术方案**:

```tsx
// ✅ hooks/useAuthCallback.ts
export const useAuthCallback = (onSuccess: () => void) => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('authToken');

    if (!authToken) return;

    // 清除URL参数
    window.history.replaceState({}, '', window.location.pathname);

    // 处理核身回调
    handleAuthTokenCallback(authToken).then(onSuccess);
  }, []);
};

// ✅ 使用
const RealNameAuth = () => {
  const { state, transition } = useStateMachine(...);

  useAuthCallback(() => transition('SUCCESS'));

  // 组件简洁了
};
```

**验收标准**:
- [ ] 单个 useEffect 不超过 30 行
- [ ] Hooks 单一职责（URL解析、API调用、状态更新分离）
- [ ] 可独立单元测试

**回滚策略**:
1. Hooks 保留原始 useEffect 注释
2. 测试覆盖率达标后删除旧代码

**预计风险**:
- 中：依赖关系复杂，拆分后可能遗漏状态同步

**工时评估**: 4人日（1人）

---

### 任务卡 #4: 统一错误处理机制

**目标**: 解决 3 种错误处理模式不一致问题

**范围**: 全局所有页面

**改动文件**:
```
hooks/useErrorHandler.ts             [新建]
utils/errorHelpers.ts                [新建]
context/NotificationContext.tsx      [修改]
```

**技术方案**:

```tsx
// ✅ hooks/useErrorHandler.ts
export const useErrorHandler = () => {
  const { showToast } = useNotification();
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: Error | string, options?: {
    toast?: boolean;
    persist?: boolean;
  }) => {
    const message = typeof err === 'string' ? err : err.message;

    if (options?.persist) {
      setError(message);
    }

    if (options?.toast !== false) {
      showToast('error', '操作失败', message);
    }
  }, [showToast]);

  const clearError = useCallback(() => setError(null), []);

  return { error, handleError, clearError };
};

// ✅ 使用
const { error, handleError } = useErrorHandler();

try {
  await submitRealName();
} catch (err) {
  handleError(err, { toast: true, persist: true });
}
```

**验收标准**:
- [ ] 所有错误处理使用统一 Hook
- [ ] 错误态自动清除（切换页面/表单时）
- [ ] Toast 显示逻辑一致

**回滚策略**:
1. Hook 可选启用（options.enable）
2. 保留旧代码 1 个版本周期

**预计风险**:
- 低：改动面广但逻辑简单

**工时评估**: 2人日（1人）

---

### 任务卡 #5: 推广 usePagination Hook

**目标**: 消除分页逻辑重复

**范围**: 15+ 列表页面

**改动文件**:
```
hooks/usePagination.ts               [优化]
pages/wallet/AssetView.tsx           [改造]
pages/market/OrderListPage.tsx       [改造]
pages/wallet/MyCollection.tsx        [改造]
... (15+ 文件)
```

**技术方案**:

```tsx
// ✅ 已有 Hook 优化
// hooks/usePagination.ts (已存在，需推广)

// ✅ 使用
const { list, loading, loadMore, refresh, hasMore } = usePagination(
  (page, pageSize) => getBalanceLog({ page, limit: pageSize, token }),
  { pageSize: 10 }
);

return (
  <>
    {list.map(renderItem)}
    {hasMore && <LoadMoreButton onClick={loadMore} loading={loading} />}
  </>
);
```

**验收标准**:
- [ ] 15+ 列表页迁移完成
- [ ] 删除重复的 `page`, `hasMore`, `loading` 状态定义
- [ ] 统一 LoadMore UI 组件

**回滚策略**:
1. 列表页可独立回滚
2. Hook 向后兼容

**预计风险**:
- 低：Hook 已稳定，风险小

**工时评估**: 3人日（1人）

---

### 任务卡 #6: 引入枚举常量替换魔法数字

**目标**: 解决 `status === 2` 可读性差问题

**范围**: 30+ 文件

**改动文件**:
```
constants/statusEnums.ts             [新建]
pages/**/*.tsx                       [替换魔法数字]
types.ts                             [补充类型]
```

**技术方案**:

```tsx
// ✅ constants/statusEnums.ts
export enum RealNameStatus {
  NOT_VERIFIED = 0,
  PENDING = 1,
  VERIFIED = 2,
  REJECTED = 3,
}

export enum ConsignmentStatus {
  NOT_CONSIGNED = 0,
  PENDING = 1,
  CONSIGNING = 2,
  REJECTED = 3,
  SOLD = 4,
}

export enum DeliveryStatus {
  NOT_DELIVERED = 0,
  DELIVERED = 1,
}

// ✅ 使用
const isAuthed = status?.real_name_status === RealNameStatus.VERIFIED;
const isPending = status?.real_name_status === RealNameStatus.PENDING;
```

**验收标准**:
- [ ] 代码库中数字状态判断少于 10 处
- [ ] 所有枚举有 JSDoc 注释
- [ ] IDE 自动补全枚举值

**回滚策略**:
1. 枚举值与原始数字相同（向后兼容）
2. 批量替换前 Git 标签

**预计风险**:
- 低：纯重构，不影响逻辑

**工时评估**: 2人日（1人）

---

### 任务卡 #7: 组件拆分（AssetView 1342行 → 300行）

**目标**: 解决巨型组件问题

**范围**: `pages/wallet/AssetView.tsx`

**改动文件**:
```
pages/wallet/AssetView.tsx           [保留主逻辑]
pages/wallet/components/
  ├─ AssetTabContent.tsx            [新建]
  ├─ CollectionActionModal.tsx      [新建]
  ├─ ConsignmentCheckInfo.tsx       [新建]
  └─ DeliveryCheckInfo.tsx          [新建]
```

**技术方案**:

```tsx
// ✅ 拆分后
const AssetView = ({ ... }) => {
  const { activeTab, handleTabChange } = useAssetTabs();
  const { showModal, selectedItem, handleAction } = useCollectionActions();

  return (
    <PageContainer>
      <AssetHeader />
      <AssetTabSwitcher activeTab={activeTab} onChange={handleTabChange} />
      <AssetTabContent activeTab={activeTab} />
      {showModal && <CollectionActionModal item={selectedItem} onConfirm={handleAction} />}
    </PageContainer>
  );
};
```

**验收标准**:
- [ ] 主组件不超过 300 行
- [ ] 子组件职责单一（< 200行）
- [ ] Props 类型完整定义

**回滚策略**:
1. 保留原始文件备份
2. 子组件可独立禁用

**预计风险**:
- 中：状态提升可能影响性能

**工时评估**: 4人日（1人）

---

### 任务卡 #8: 实名认证状态机完整实现（示例）

**目标**: 作为状态机改造的完整示例

**范围**: `pages/user/RealNameAuth.tsx`

**改动文件**:
```
pages/user/RealNameAuth.tsx          [完全重构]
hooks/useRealNameAuth.ts             [新建]
utils/realNameStateMachine.ts        [新建]
docs/state-machines/realname.md      [新建]
```

**技术方案**:

```tsx
// ✅ 状态机定义
enum RealNameState {
  IDLE = 'idle',              // 初始状态
  LOADING = 'loading',        // 加载状态
  FORM = 'form',              // 表单填写
  VALIDATING = 'validating',  // 表单验证中
  SUBMITTING = 'submitting',  // 提交中
  VERIFYING = 'verifying',    // H5核身中
  PROCESSING = 'processing',  // 处理核身结果
  SUCCESS = 'success',        // 已通过
  PENDING = 'pending',        // 审核中
  ERROR = 'error',            // 错误
}

// ✅ 状态转换图
const transitions = {
  IDLE: ['LOADING'],
  LOADING: ['FORM', 'SUCCESS', 'PENDING', 'ERROR'],
  FORM: ['VALIDATING', 'VERIFYING'],
  VALIDATING: ['FORM', 'VERIFYING'],
  VERIFYING: ['PROCESSING'],
  PROCESSING: ['SUBMITTING', 'ERROR'],
  SUBMITTING: ['SUCCESS', 'PENDING', 'ERROR'],
  // ...
};

// ✅ 使用
const { state, can, send } = useRealNameStateMachine();

return (
  <PageContainer>
    {state === 'LOADING' && <LoadingSpinner />}
    {state === 'FORM' && <RealNameForm onSubmit={() => send('VERIFY')} />}
    {state === 'SUCCESS' && <SuccessView />}
    {state === 'ERROR' && <ErrorView error={error} onRetry={() => send('RETRY')} />}

    <button disabled={!can('SUBMIT')}>
      {state === 'SUBMITTING' ? '提交中...' : '开始认证'}
    </button>
  </PageContainer>
);
```

**验收标准**:
- [ ] 状态机图可视化（Mermaid 图）
- [ ] 所有边界条件覆盖
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试覆盖关键路径

**回滚策略**:
1. 保留旧版本文件（.backup）
2. Feature Flag 控制启用

**预计风险**:
- 高：改动大，需充分测试

**工时评估**: 6人日（1人）

---

## 🛠 D. 建议的技术规范

### 1. 命名规范

#### 1.1 组件命名

```tsx
// ✅ 组件：大驼峰 + 描述性
const UserProfileCard: React.FC<Props> = () => { ... };

// ✅ 页面组件：名词 + 动作（可选）
const ProductDetail: React.FC = () => { ... };
const OrderListPage: React.FC = () => { ... };

// ❌ 避免
const component1: React.FC = () => { ... };
const Comp: React.FC = () => { ... };
```

#### 1.2 Hooks 命名

```tsx
// ✅ use + 动词/名词
const useAuth = () => { ... };
const useRealNameStatus = () => { ... };
const useAsyncRequest = () => { ... };

// ❌ 避免
const authHook = () => { ... };
const getRealName = () => { ... };  // 非 Hook
```

#### 1.3 事件处理命名

```tsx
// ✅ handle + 动作
const handleSubmit = () => { ... };
const handleProductSelect = (product: Product) => { ... };

// ✅ on + 动作（Props）
<Button onClick={handleClick} onSuccess={handleSuccess} />

// ❌ 避免
const submit = () => { ... };
const click = () => { ... };
```

#### 1.4 状态命名

```tsx
// ✅ 布尔：is/has/should + 形容词
const [isLoading, setIsLoading] = useState(false);
const [hasError, setHasError] = useState(false);
const [shouldRefresh, setShouldRefresh] = useState(true);

// ✅ 数据：名词
const [user, setUser] = useState<User | null>(null);
const [products, setProducts] = useState<Product[]>([]);

// ❌ 避免
const [loading, setLoading] = useState(false);  // 不够明确
const [data, setData] = useState(null);         // 太泛化
```

---

### 2. 目录结构规范

```
src/
├── pages/                   # 页面组件（按功能模块分组）
│   ├── auth/               # 认证相关
│   ├── user/               # 用户中心
│   ├── market/             # 市场交易
│   ├── wallet/             # 资产钱包
│   └── entries/            # 入口容器
│
├── components/             # 可复用组件
│   ├── common/            # 通用组件（Button, Modal, etc.）
│   ├── business/          # 业务组件（跨页面复用）
│   └── layout/            # 布局组件（PageContainer, etc.）
│
├── hooks/                  # 自定义 Hooks
│   ├── useAuth.ts
│   ├── usePagination.ts
│   └── useStateMachine.ts
│
├── services/              # API 服务层
│   ├── api.ts            # 主 API 导出
│   ├── user.ts           # 用户相关 API
│   ├── market.ts         # 市场相关 API
│   └── networking.ts     # 底层网络封装
│
├── utils/                 # 工具函数
│   ├── format.ts         # 格式化工具
│   ├── validation.ts     # 验证工具
│   ├── apiHelpers.ts     # API 辅助工具
│   └── stateMachine.ts   # 状态机工具
│
├── constants/             # 常量定义
│   ├── statusEnums.ts    # 状态枚举
│   ├── storageKeys.ts    # 存储 Key
│   └── routes.ts         # 路由常量
│
├── context/               # React Context
│   └── NotificationContext.tsx
│
├── router/                # 路由系统
│   ├── routes.ts         # 路由定义
│   └── navigation.ts     # 导航逻辑
│
├── types/                 # 全局类型（或 types.ts）
│   ├── user.ts
│   ├── product.ts
│   └── common.ts
│
└── styles/               # 样式文件
    └── notifications.css
```

---

### 3. Store 粒度规范（当前使用 Context + Hooks）

#### 3.1 当前状态管理评估

**✅ 优点**:
- 轻量级（无需 Redux 等库）
- 适合中小型应用
- useAuth Hook 设计良好

**⚠️ 缺点**:
- 跨组件状态共享困难
- 缺少全局状态（购物车、通知队列等）
- Context Re-render 问题

#### 3.2 建议优化

```tsx
// ✅ 保留 Hook 用于局部状态
const useAuth = () => { ... };
const usePagination = () => { ... };

// ✅ 引入轻量级全局状态（Zustand 或 Jotai）
// stores/useCartStore.ts
import create from 'zustand';

export const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
}));

// ✅ 使用
const CartButton = () => {
  const items = useCartStore((state) => state.items);
  return <Badge count={items.length} />;
};
```

**迁移策略**:
1. 保留现有 Hook（向后兼容）
2. 逐步迁移全局状态到 Store
3. 性能敏感组件使用 Store（避免 Context Re-render）

---

### 4. API 封装规范

#### 4.1 分层架构

```
调用方（Page/Hook）
      ↓
  服务层（services/user.ts）
      ↓
  网络层（services/networking.ts + utils/apiHelpers.ts）
      ↓
    后端 API
```

#### 4.2 服务层规范

```tsx
// ✅ services/user.ts

/**
 * 获取用户实名认证状态
 * @param token - 用户 Token
 * @returns 实名认证状态数据
 * @throws {NeedLoginError} Token 过期时抛出
 */
export async function fetchRealNameStatus(
  token: string
): Promise<ApiResponse<RealNameStatusData>> {
  return authedFetch<RealNameStatusData>(
    API_ENDPOINTS.user.realNameStatus,
    { method: 'GET', token }
  );
}

// ✅ 参数对象化（当参数 > 3 个时）
export interface SubmitRealNameParams {
  real_name?: string;
  id_card?: string;
  auth_token?: string;
  token?: string;
}

export async function submitRealName(
  params: SubmitRealNameParams
): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();
  // ...
}
```

#### 4.3 错误处理规范

```tsx
// ✅ 统一错误处理
try {
  const response = await fetchRealNameStatus(token);
  const data = extractData(response);
  if (data) {
    // 成功处理
  } else {
    // 失败处理
    handleError(extractError(response));
  }
} catch (error) {
  if (error instanceof NeedLoginError) {
    // 登录过期，跳转登录页
  } else {
    // 其他错误
    handleError(error.message);
  }
}
```

---

### 5. 状态机规范

#### 5.1 何时使用状态机

**✅ 适用场景**:
- 多步骤表单（注册、实名认证）
- 复杂交互流程（购买流程、支付流程）
- 多状态组件（提货/寄售、订单状态）

**❌ 不适用场景**:
- 简单 Toggle（开关、展开/收起）
- 单一 Loading 状态
- 无状态组件

#### 5.2 状态机设计规范

```tsx
// ✅ 1. 定义状态枚举
enum OrderState {
  IDLE = 'idle',
  CREATING = 'creating',
  PAYING = 'paying',
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDING = 'refunding',
  REFUNDED = 'refunded',
}

// ✅ 2. 定义事件枚举
enum OrderEvent {
  CREATE = 'CREATE',
  PAY = 'PAY',
  SHIP = 'SHIP',
  COMPLETE = 'COMPLETE',
  CANCEL = 'CANCEL',
  REFUND = 'REFUND',
}

// ✅ 3. 定义状态转换
const orderMachine = {
  initial: OrderState.IDLE,
  states: {
    [OrderState.IDLE]: {
      on: { [OrderEvent.CREATE]: OrderState.CREATING },
    },
    [OrderState.CREATING]: {
      on: {
        [OrderEvent.PAY]: OrderState.PAYING,
        [OrderEvent.CANCEL]: OrderState.CANCELLED,
      },
    },
    // ...
  },
};

// ✅ 4. 使用
const { state, send, can } = useStateMachine(orderMachine);

<button onClick={() => send(OrderEvent.PAY)} disabled={!can(OrderEvent.PAY)}>
  {state === OrderState.PAYING ? '支付中...' : '立即支付'}
</button>
```

#### 5.3 状态机文档规范

每个状态机必须配套：
1. **状态转换图**（Mermaid/PlantUML）
2. **状态说明表**
3. **测试用例**

示例：

```markdown
## 实名认证状态机

### 状态转换图
\`\`\`mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> LOADING
    LOADING --> FORM: 未认证
    LOADING --> SUCCESS: 已通过
    LOADING --> PENDING: 审核中
    FORM --> VERIFYING: 提交
    VERIFYING --> PROCESSING: 核身返回
    PROCESSING --> SUBMITTING: 核身通过
    SUBMITTING --> SUCCESS: 提交成功
    SUBMITTING --> PENDING: 等待审核
    SUBMITTING --> ERROR: 提交失败
\`\`\`

### 状态说明
| 状态 | 说明 | 可执行操作 |
|------|------|-----------|
| IDLE | 初始状态 | 加载状态 |
| LOADING | 加载中 | - |
| FORM | 表单填写 | 提交、返回 |
| VERIFYING | H5核身中 | - |
| SUCCESS | 已通过 | 查看证书、返回 |
```

---

### 6. 错误处理规范

#### 6.1 错误分类

```tsx
// ✅ 错误类型枚举
enum ErrorType {
  NETWORK = 'network',      // 网络错误
  BUSINESS = 'business',    // 业务错误（后端返回）
  VALIDATION = 'validation', // 表单验证错误
  AUTH = 'auth',            // 认证错误
  UNKNOWN = 'unknown',      // 未知错误
}

// ✅ 错误处理策略
const errorStrategy = {
  [ErrorType.NETWORK]: {
    toast: true,
    persist: false,
    message: '网络连接失败，请检查网络设置',
  },
  [ErrorType.BUSINESS]: {
    toast: true,
    persist: true,
    message: (err) => err.message,
  },
  [ErrorType.AUTH]: {
    toast: true,
    persist: false,
    action: () => navigateTo('/login'),
    message: '登录已过期，请重新登录',
  },
};
```

#### 6.2 错误边界规范

```tsx
// ✅ 页面级错误边界
<ErrorBoundary fallback={<ErrorPage />}>
  <ProductDetail />
</ErrorBoundary>

// ✅ 组件级错误边界
<ErrorBoundary fallback={<ErrorMessage />}>
  <ProductList />
</ErrorBoundary>
```

---

### 7. 日志埋点规范

#### 7.1 日志分类（已有）

当前已有：
```tsx
debugLog('key', 'message', data);  // 开发环境
bizLog('key', data);               // 业务日志
warnLog('key', 'message');         // 警告日志
errorLog('key', 'message', error); // 错误日志
```

#### 7.2 埋点规范

```tsx
// ✅ 页面访问埋点
useEffect(() => {
  bizLog('page.view', { page: 'ProductDetail', id: product.id });
}, []);

// ✅ 用户操作埋点
const handleBuy = () => {
  bizLog('user.action.buy', { productId: product.id, price: product.price });
  // ...
};

// ✅ 关键业务流程埋点
const handleRealNameSubmit = async () => {
  bizLog('realname.submit.start', { method: 'h5' });
  try {
    await submitRealName();
    bizLog('realname.submit.success');
  } catch (err) {
    errorLog('realname.submit.fail', err.message, err);
  }
};
```

#### 7.3 性能监控埋点

```tsx
// ✅ API 耗时监控
const startTime = performance.now();
await fetchData();
const duration = performance.now() - startTime;
bizLog('api.performance', { endpoint: '/user/profile', duration });
```

---

## 📅 重构路线图时间表

### 阶段1: 基础设施建设（Week 1-2）

| 任务 | 优先级 | 负责人 | 工期 |
|------|--------|--------|------|
| 任务卡 #2：API响应处理封装 | P0 | 开发A | 3天 |
| 任务卡 #6：枚举常量引入 | P0 | 开发B | 2天 |
| 任务卡 #4：统一错误处理 | P1 | 开发A | 2天 |

**交付物**:
- `utils/apiHelpers.ts`
- `constants/statusEnums.ts`
- `hooks/useErrorHandler.ts`

---

### 阶段2: 核心重构（Week 3-4）

| 任务 | 优先级 | 负责人 | 工期 |
|------|--------|--------|------|
| 任务卡 #1：状态机工具 | P0 | 开发C | 3天 |
| 任务卡 #8：实名认证状态机示例 | P0 | 开发C | 6天 |
| 任务卡 #3：拆分巨型useEffect | P0 | 开发A | 4天 |

**交付物**:
- `utils/stateMachine.ts`
- `hooks/useStateMachine.ts`
- `pages/user/RealNameAuth.tsx` (重构版)
- 状态机文档 + 测试用例

---

### 阶段3: 全面推广（Week 5-6）

| 任务 | 优先级 | 负责人 | 工期 |
|------|--------|--------|------|
| 任务卡 #5：推广usePagination | P1 | 开发B | 3天 |
| 任务卡 #7：组件拆分 | P1 | 开发A | 4天 |
| 状态机迁移（5个核心页面） | P1 | 全员 | 5天 |

**交付物**:
- 15+ 列表页迁移完成
- `AssetView.tsx` 组件化
- 5个页面状态机改造

---

### 阶段4: 验收优化（Week 7）

| 任务 | 负责人 | 工期 |
|------|--------|------|
| 单元测试补充 | 测试组 | 3天 |
| 集成测试 | 测试组 | 2天 |
| 性能优化 | 开发组 | 2天 |
| 文档完善 | 全员 | 1天 |

---

## ✅ 验收标准总览

### 代码质量指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 单组件行数 | < 300 | 1342 (AssetView) |
| 单函数行数 | < 50 | 146 (useEffect) |
| API判断重复 | < 10处 | 115处 `.code === 1` |
| 状态Boolean数 | ≤ 2个 | 3+ (loading/submitting/verifying) |
| 空态实现统一性 | 100% | ~50% |

### 交互质量指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 按钮防抖覆盖 | 100% | ~70% |
| 错误提示一致性 | 100% | 3种模式混用 |
| Loading态准确性 | 100% | 状态互斥问题 |
| 返回刷新准确性 | 100% | 部分页面不刷新 |

### 测试覆盖率

| 模块 | 单元测试 | 集成测试 |
|------|----------|----------|
| Hooks | > 80% | - |
| Utils | > 90% | - |
| 核心业务页面 | > 60% | > 70% |

---

## 🚨 风险评估与应对

### 风险1: 状态机学习曲线陡峭

**概率**: 高
**影响**: 中

**应对**:
1. 提供完整示例（任务卡 #8）
2. 内部培训（1天）
3. 结对编程推广

---

### 风险2: 重构期间业务需求冲突

**概率**: 中
**影响**: 高

**应对**:
1. 分支开发，主分支不受影响
2. Feature Flag 控制新旧代码
3. 逐页迁移，保持可回滚

---

### 风险3: 性能回归

**概率**: 低
**影响**: 高

**应对**:
1. 性能基准测试（重构前后对比）
2. React DevTools Profiler 监控
3. Lighthouse 评分 > 90

---

## 📚 附录

### A. 技术选型建议

| 需求 | 推荐方案 | 原因 |
|------|----------|------|
| 状态机 | XState Lite / 自研 | 轻量，学习成本低 |
| 全局状态 | Zustand | 比 Redux 简单，性能好 |
| 表单管理 | React Hook Form | 性能优秀，验证强大 |
| 日期处理 | date-fns | 轻量，Tree-shakable |

### B. 迁移检查清单

**重构前**:
- [ ] 打 Git 标签
- [ ] 备份数据库
- [ ] 性能基准测试
- [ ] 关键路径截图

**重构后**:
- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 性能无回归
- [ ] 部署到 Staging 环境
- [ ] QA 回归测试

### C. 代码审查要点

**必须检查**:
- [ ] 状态转换是否完整
- [ ] 错误处理是否统一
- [ ] API响应是否正确判断
- [ ] 魔法数字是否替换
- [ ] Loading 态是否互斥
- [ ] 按钮是否防抖
- [ ] 空态/错误态是否完整

---

## 📞 支持与反馈

如有疑问，请联系：
- 架构组：@架构师
- 前端组：@前端负责人
- 文档地址：`docs/ARCHITECTURE_AUDIT_2025.md`

---

**生成工具**: Claude Code 审计助手
**版本**: 1.0.0
**最后更新**: 2025-12-29
