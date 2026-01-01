# AssetView 操作弹窗状态机设计文档

> **创建时间**: 2025-12-29
> **目标**: 重构 AssetView.tsx 操作弹窗部分，解决提货/寄售状态管理混乱问题
> **策略**: 渐进式改造 - 先改造操作弹窗，再改造标签页加载

---

## 1. 当前问题（仅操作弹窗部分）

### 问题清单
- ❌ **6个独立state**：`showActionModal`, `selectedItem`, `actionTab`, `actionLoading`, `actionError`, `consignmentCheckData`, `consignmentRemaining` 无互斥保证
- ❌ **4个useEffect**：倒计时更新 + 寄售检查 + 实时倒计时 + 强制切换标签，职责混乱
- ❌ **复杂的条件判断**：`canPerformAction()` 371行，`handleConfirmAction()` 145行
- ❌ **状态不明确**：弹窗关闭/打开/加载/提交中没有清晰的状态定义

### 风险场景
1. 用户点击藏品 → 弹窗打开 → 立即点击确认 → `actionLoading && !consignmentCheckData`
2. 倒计时结束时弹窗关闭 → 内存泄漏
3. 快速切换标签页 → 寄售检查API重复调用

---

## 2. 状态机设计

### 2.1 状态定义

```typescript
enum ActionModalState {
  // 核心流程状态
  CLOSED = 'closed',                    // 弹窗关闭

  // 提货分支
  OPEN_DELIVERY = 'open_delivery',      // 打开提货标签
  CHECKING_DELIVERY = 'checking_delivery', // 检查提货条件（48小时）
  SUBMITTING_DELIVERY = 'submitting_delivery', // 提交提货
  DELIVERY_SUCCESS = 'delivery_success', // 提货成功
  DELIVERY_ERROR = 'delivery_error',    // 提货失败

  // 寄售分支
  OPEN_CONSIGNMENT = 'open_consignment', // 打开寄售标签
  CHECKING_CONSIGNMENT = 'checking_consignment', // 检查寄售条件（API调用）
  SUBMITTING_CONSIGNMENT = 'submitting_consignment', // 提交寄售
  CONSIGNMENT_SUCCESS = 'consignment_success', // 寄售成功
  CONSIGNMENT_ERROR = 'consignment_error', // 寄售失败
}
```

### 2.2 状态转换图

```
┌─────────┐
│ CLOSED  │ 初始状态（弹窗关闭）
└────┬────┘
     │
     │ OPEN_ITEM（点击藏品）
     ▼
   ┌─────────────────┐
   │ 路由逻辑判断：    │
   │ - 已提货 → OPEN_DELIVERY（只读）
   │ - 寄售中 → OPEN_DELIVERY（只读）
   │ - 未提货 → OPEN_DELIVERY
   │ - 未寄售 → OPEN_CONSIGNMENT
   └─┬───────────┬────┘
     │           │
     ▼           ▼
┌──────────────┐ ┌────────────────────┐
│OPEN_DELIVERY │ │ OPEN_CONSIGNMENT   │
└──┬───────────┘ └───┬────────────────┘
   │                 │
   │ CHECK           │ CHECK
   ▼                 ▼
┌─────────────────┐ ┌──────────────────────┐
│CHECKING_DELIVERY│ │CHECKING_CONSIGNMENT  │
└──┬──────────┬───┘ └───┬────────────┬─────┘
   │          │         │            │
   │ PASS     │ FAIL    │ PASS       │ FAIL
   ▼          ▼         ▼            ▼
┌──────────┐ ┌───────┐ ┌──────────┐ ┌───────┐
│ READY    │ │BLOCKED│ │ READY    │ │BLOCKED│
└────┬─────┘ └───────┘ └────┬─────┘ └───────┘
     │                      │
     │ SUBMIT               │ SUBMIT
     ▼                      ▼
┌────────────────┐ ┌──────────────────────┐
│SUBMITTING_...  │ │SUBMITTING_...        │
└──┬─────────┬───┘ └───┬──────────┬───────┘
   │         │         │          │
   │SUCCESS  │ERROR    │SUCCESS   │ERROR
   ▼         ▼         ▼          ▼
┌─────────┐┌───────┐┌─────────┐┌───────┐
│SUCCESS  ││ERROR  ││SUCCESS  ││ERROR  │
└────┬────┘└───┬───┘└────┬────┘└───┬───┘
     │         │         │         │
     └─────────┴─────────┴─────────┘
               │ CLOSE / RETRY
               ▼
          ┌─────────┐
          │ CLOSED  │
          └─────────┘
```

### 2.3 状态转换规则

| 当前状态 | 事件 | 下一状态 | 条件 |
|---------|------|---------|------|
| CLOSED | OPEN_DELIVERY | OPEN_DELIVERY | 点击藏品 → 提货路由 |
| CLOSED | OPEN_CONSIGNMENT | OPEN_CONSIGNMENT | 点击藏品 → 寄售路由 |
| OPEN_DELIVERY | CHECK | CHECKING_DELIVERY | 用户点击提货按钮 |
| CHECKING_DELIVERY | CHECK_PASS | SUBMITTING_DELIVERY | 48小时已过 |
| CHECKING_DELIVERY | CHECK_FAIL | OPEN_DELIVERY | 48小时未过 |
| SUBMITTING_DELIVERY | SUCCESS | DELIVERY_SUCCESS | API成功 |
| SUBMITTING_DELIVERY | ERROR | DELIVERY_ERROR | API失败 |
| OPEN_CONSIGNMENT | CHECK | CHECKING_CONSIGNMENT | 打开寄售标签 |
| CHECKING_CONSIGNMENT | CHECK_PASS | OPEN_CONSIGNMENT | API检查通过 |
| CHECKING_CONSIGNMENT | CHECK_FAIL | OPEN_CONSIGNMENT | API检查失败（显示倒计时） |
| OPEN_CONSIGNMENT | SUBMIT | SUBMITTING_CONSIGNMENT | 用户点击寄售按钮 |
| SUBMITTING_CONSIGNMENT | SUCCESS | CONSIGNMENT_SUCCESS | API成功 |
| SUBMITTING_CONSIGNMENT | ERROR | CONSIGNMENT_ERROR | API失败 |
| * | CLOSE | CLOSED | 用户关闭弹窗 |
| * | SWITCH_TAB | OPEN_DELIVERY/OPEN_CONSIGNMENT | 切换标签 |

### 2.4 状态派生数据

```typescript
// 按钮禁用规则
const canSubmit =
  (state === 'OPEN_DELIVERY' && deliveryCheckPassed) ||
  (state === 'OPEN_CONSIGNMENT' && consignmentCheckPassed && hasTicket);

// Loading显示规则
const isLoading = [
  'CHECKING_DELIVERY',
  'CHECKING_CONSIGNMENT',
  'SUBMITTING_DELIVERY',
  'SUBMITTING_CONSIGNMENT',
].includes(state);

// 弹窗显示规则
const showModal = state !== 'CLOSED';
```

---

## 3. 数据结构设计

### 3.1 Context数据

```typescript
interface ActionModalContext {
  // 藏品数据
  selectedItem: MyCollectionItem | null;

  // 检查结果
  deliveryCheckResult: {
    can48Hours: boolean;
    hoursLeft: number;
    isConsigning: boolean;
    hasConsignedBefore: boolean;
    isDelivered: boolean;
  } | null;

  consignmentCheckResult: {
    unlocked: boolean;
    remainingSeconds: number | null;
    remainingText: string | null;
    hasTicket: boolean;
    ticketCount: number;
  } | null;

  // 错误信息
  error: string | null;

  // 倒计时数据（实时更新）
  countdown: {
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}
```

### 3.2 Events

```typescript
type ActionModalEvent =
  | { type: 'OPEN_DELIVERY'; payload: MyCollectionItem }
  | { type: 'OPEN_CONSIGNMENT'; payload: MyCollectionItem }
  | { type: 'SWITCH_TAB'; payload: 'delivery' | 'consignment' }
  | { type: 'CHECK' }
  | { type: 'CHECK_PASS'; payload: DeliveryCheckResult | ConsignmentCheckResult }
  | { type: 'CHECK_FAIL'; payload: string }
  | { type: 'SUBMIT' }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; payload: string }
  | { type: 'CLOSE' }
  | { type: 'RETRY' };
```

---

## 4. 技术实现方案

### 4.1 业务Hook

```typescript
// hooks/useAssetActionModal.ts
export function useAssetActionModal() {
  const { showToast, showDialog } = useNotification();

  const { state, context, send, setContext } = useStateMachine<
    ActionModalState,
    ActionModalEvent,
    ActionModalContext
  >({
    initial: ActionModalState.CLOSED,
    transitions: ACTION_MODAL_TRANSITIONS,
    context: {
      selectedItem: null,
      deliveryCheckResult: null,
      consignmentCheckResult: null,
      error: null,
      countdown: null,
    },
  });

  // 打开提货弹窗
  const openDelivery = (item: MyCollectionItem) => {
    send('OPEN_DELIVERY', { selectedItem: item });
  };

  // 打开寄售弹窗
  const openConsignment = (item: MyCollectionItem) => {
    send('OPEN_CONSIGNMENT', { selectedItem: item });
  };

  // 切换标签
  const switchTab = (tab: 'delivery' | 'consignment') => {
    send('SWITCH_TAB', { tab });
  };

  // 检查提货条件
  useEffect(() => {
    if (state === ActionModalState.CHECKING_DELIVERY && context.selectedItem) {
      const result = checkDeliveryConditions(context.selectedItem);
      if (result.can48Hours && !result.isConsigning && !result.isDelivered) {
        send('CHECK_PASS', { deliveryCheckResult: result });
      } else {
        send('CHECK_FAIL', { error: '不满足提货条件' });
      }
    }
  }, [state]);

  // 检查寄售条件（API调用）
  useEffect(() => {
    if (state === ActionModalState.CHECKING_CONSIGNMENT && context.selectedItem) {
      const collectionId = resolveCollectionId(context.selectedItem);
      getConsignmentCheck({ user_collection_id: collectionId, token })
        .then((res) => {
          const result = parseConsignmentCheckResult(res.data);
          if (result.unlocked && result.hasTicket) {
            send('CHECK_PASS', { consignmentCheckResult: result });
          } else {
            send('CHECK_FAIL', { consignmentCheckResult: result });
          }
        })
        .catch(() => {
          send('CHECK_FAIL', { error: 'API调用失败' });
        });
    }
  }, [state]);

  // 实时倒计时
  useEffect(() => {
    if (state !== ActionModalState.OPEN_CONSIGNMENT || !context.consignmentCheckResult) {
      return;
    }

    let remainingSeconds = context.consignmentCheckResult.remainingSeconds;
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      remainingSeconds = Math.max(0, remainingSeconds - 1);
      setContext((prev) => ({
        ...prev,
        countdown: formatCountdown(remainingSeconds),
      }));

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        // 触发重新检查
        send('CHECK');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, context.consignmentCheckResult]);

  // 提交提货
  const handleDeliverySubmit = async () => {
    if (!context.selectedItem) return;

    send('SUBMIT');

    try {
      const res = await rightsDeliver({
        user_collection_id: resolveCollectionId(context.selectedItem),
        token,
      });

      if (isSuccess(res) || res.code === 0) {
        showToast('success', '操作成功', '权益分割已提交');
        send('SUCCESS');
        // 刷新数据
        onSuccess?.();
      } else {
        send('ERROR', { error: extractError(res, '权益分割失败') });
      }
    } catch (err: any) {
      send('ERROR', { error: err?.message || '提交失败' });
    }
  };

  // 提交寄售
  const handleConsignmentSubmit = async () => {
    if (!context.selectedItem) return;

    send('SUBMIT');

    try {
      const res = await consignCollectionItem({
        user_collection_id: resolveCollectionId(context.selectedItem),
        price: parseFloat(context.selectedItem.price || '0'),
        token,
      });

      if (isSuccess(res)) {
        showToast('success', '提交成功', '寄售申请已提交');
        send('SUCCESS');
        // 刷新数据
        onSuccess?.();
      } else {
        send('ERROR', { error: extractError(res, '寄售申请失败') });
      }
    } catch (err: any) {
      send('ERROR', { error: err?.message || '寄售失败' });
    }
  };

  return {
    state,
    context,
    isOpen: state !== ActionModalState.CLOSED,
    isLoading: [
      ActionModalState.CHECKING_DELIVERY,
      ActionModalState.CHECKING_CONSIGNMENT,
      ActionModalState.SUBMITTING_DELIVERY,
      ActionModalState.SUBMITTING_CONSIGNMENT,
    ].includes(state),
    canSubmit:
      (state === ActionModalState.OPEN_DELIVERY && context.deliveryCheckResult?.can48Hours) ||
      (state === ActionModalState.OPEN_CONSIGNMENT && context.consignmentCheckResult?.unlocked && context.consignmentCheckResult?.hasTicket),
    openDelivery,
    openConsignment,
    switchTab,
    handleDeliverySubmit,
    handleConsignmentSubmit,
    close: () => send('CLOSE'),
  };
}
```

---

## 5. 验收标准

- [ ] **状态互斥**: 任意时刻只有一个状态active（弹窗打开/关闭，提货/寄售）
- [ ] **转换显式**: 所有状态转换通过 `send()` 触发
- [ ] **按钮绑定**: `disabled={!canSubmit}` 直接绑定状态
- [ ] **无内存泄漏**: 弹窗关闭时清除所有定时器
- [ ] **API调用优化**: 寄售检查API只在必要时调用一次
- [ ] **代码精简**:
  - ✅ useEffect < 30行（每个检查逻辑独立）
  - ✅ canPerformAction() 逻辑简化为派生状态
  - ✅ handleConfirmAction() 拆分为两个独立函数

---

## 6. 回滚策略

1. **Hook独立**: 操作弹窗Hook独立于组件，不影响标签页加载逻辑
2. **特性开关**: 可通过props控制是否启用新Hook
3. **保留旧代码**: 重构期间保留注释的旧代码

---

## 7. 实施步骤

1. ✅ **Step 1**: 设计状态机（本文档）
2. ⏳ **Step 2**: 实现 useAssetActionModal Hook
3. ⏳ **Step 3**: 重构 AssetView.tsx 操作弹窗部分
4. ⏳ **Step 4**: 测试验证（手动测试）
5. ⏳ **Step 5**: 清理旧代码
6. ⏳ **Step 6**: （后续）设计标签页加载状态机

---

## 8. 预期收益

- **减少state变量**: 6个 → 1个（state枚举）
- **减少useEffect**: 4个 → 3个（每个<30行）
- **提升可维护性**: 状态转换逻辑集中在Hook
- **消除bug**: 修复倒计时内存泄漏、重复API调用等问题

---

**预计工时**: 0.5人日（设计30min + 开发2h + 测试1h）
