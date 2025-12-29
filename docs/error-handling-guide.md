# 统一错误处理指南

> **任务卡 #4**: 统一错误处理机制
>
> **版本**: 1.0.0
> **日期**: 2025-12-29
> **状态**: ✅ 设计完成，待迁移

---

## 📋 目录

- [1. 问题背景](#1-问题背景)
- [2. 设计目标](#2-设计目标)
- [3. 核心方案](#3-核心方案)
- [4. 使用指南](#4-使用指南)
- [5. 迁移步骤](#5-迁移步骤)
- [6. 最佳实践](#6-最佳实践)

---

## 1. 问题背景

### 1.1 现状分析

根据代码库分析，目前存在 **5 种不同的错误处理模式**：

| 模式 | 文件数 | 占比 | 主要问题 |
|------|-------|------|---------|
| setError 状态管理 | 23 | 29% | 错误清除时机不统一 |
| showToast 通知 | 26 | 33% | Toast 标题和文案不统一 |
| API 助手函数 | 30+ | 38% | 只处理 API 错误，不够通用 |
| 多层级错误提取 | 30+ | 38% | 提取逻辑重复，优先级不一致 |
| 控制流式处理 | 12 | 15% | 缺少标准化 |

### 1.2 主要不一致点

1. **错误提示文案不统一**
   ```typescript
   // ❌ 不一致
   '加载数据失败'
   '获取XXX失败'
   '操作失败，请稍后重试'
   '网络错误，请稍后重试'
   '请检查网络连接后重试'
   ```

2. **错误日志记录方式不统一**
   ```typescript
   console.error('加载订单失败:', error);          // 方式1
   errorLog('auth.login.page', '登录失败', error);  // 方式2
   // 某些页面不记录日志
   ```

3. **错误类型判断混乱**
   ```typescript
   error.isCorsError ? ...
   error.msg || error.message
   error.response?.msg
   (error as any)?.message
   ```

---

## 2. 设计目标

### 2.1 核心目标

✅ **统一错误状态管理** - 一个 Hook 解决所有错误状态问题
✅ **统一错误通知** - Toast 显示逻辑标准化
✅ **统一错误日志** - 所有错误自动记录，支持分级
✅ **自动错误清除** - 页面切换/表单重置时自动清除
✅ **类型安全** - 完整的 TypeScript 类型定义

### 2.2 设计原则

1. **向后兼容** - 不破坏现有代码，渐进式迁移
2. **开箱即用** - 默认配置适用于 80% 场景
3. **灵活可配** - 支持自定义覆盖
4. **可测试性** - 所有函数可独立测试

---

## 3. 核心方案

### 3.1 架构设计

```
┌─────────────────────────────────────────────────┐
│                   业务组件                       │
│  (Login.tsx, AddressList.tsx, etc.)           │
└───────────────────┬─────────────────────────────┘
                    │
                    ↓
         ┌──────────────────────┐
         │  useErrorHandler()   │  ← React Hook
         │  - handleError()     │
         │  - clearError()      │
         │  - withErrorHandling()│
         └──────────┬───────────┘
                    │
         ┌──────────┴───────────┐
         │                      │
         ↓                      ↓
┌────────────────┐    ┌─────────────────┐
│ errorHelpers   │    │ NotificationCtx │
│ - AppError     │    │ - showToast()   │
│ - wrapError()  │    └─────────────────┘
│ - logError()   │
└────────────────┘
```

### 3.2 文件结构

```
├── utils/
│   └── errorHelpers.ts          ← 错误处理工具函数（370行）
├── hooks/
│   └── useErrorHandler.ts       ← 统一错误处理Hook（220行）
└── docs/
    └── error-handling-guide.md  ← 本文档
```

---

## 4. 使用指南

### 4.1 基础用法

#### **场景1：简单的 Toast 错误提示**

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError } = useErrorHandler();

  const submitForm = async () => {
    try {
      await api.submit(data);
    } catch (error) {
      // ✅ 统一处理：自动显示 Toast + 记录日志
      handleError(error);
    }
  };
};
```

**效果**：
- ✅ 自动显示 Toast 通知
- ✅ 自动记录错误日志
- ✅ 根据错误类型自动选择 Toast 类型（error/warning/info）

---

#### **场景2：持久化错误状态（显示在页面上）**

```typescript
const { error, errorMessage, hasError, handleError, clearError } = useErrorHandler();

const loadData = async () => {
  try {
    const data = await api.fetchData();
    setData(data);
  } catch (err) {
    // ✅ persist: true - 错误会保存到 state
    handleError(err, { persist: true });
  }
};

return (
  <div>
    {hasError && (
      <div className="error-banner">
        {errorMessage}
        <button onClick={clearError}>关闭</button>
      </div>
    )}
    <button onClick={loadData}>加载数据</button>
  </div>
);
```

---

#### **场景3：使用 withErrorHandling 简化代码**

```typescript
const { withErrorHandling } = useErrorHandler();

// ❌ 旧代码：需要 try-catch
const submitForm = async () => {
  try {
    await api.submit(data);
    showToast('success', '提交成功');
  } catch (error) {
    handleError(error);
  }
};

// ✅ 新代码：自动捕获错误
const submitForm = async () => {
  const result = await withErrorHandling(
    () => api.submit(data),
    { toastTitle: '提交失败' }
  );
  if (result) {
    showToast('success', '提交成功');
  }
};
```

---

#### **场景4：自定义错误消息和上下文**

```typescript
const handleLogin = async () => {
  try {
    await loginApi(username, password);
  } catch (error) {
    handleError(error, {
      customMessage: '登录失败，请检查用户名和密码',
      toastTitle: '登录失败',
      context: { username, timestamp: Date.now() },
      persist: true,
    });
  }
};
```

---

#### **场景5：禁用 Toast 或日志**

```typescript
// 只记录日志，不显示 Toast
handleError(error, { showToast: false });

// 只显示 Toast，不记录日志（不推荐）
handleError(error, { logError: false });
```

---

### 4.2 工具函数用法

#### **extractErrorMessage() - 提取错误消息**

```typescript
import { extractErrorMessage } from '../utils/errorHelpers';

const message = extractErrorMessage(error, '操作失败');
// 返回优先级：error.msg > error.response.msg > error.message > defaultMessage
```

---

#### **wrapError() - 包装为标准化错误**

```typescript
import { wrapError } from '../utils/errorHelpers';

try {
  await api.submit();
} catch (err) {
  const appError = wrapError(err, '提交失败');
  console.log(appError.type);      // ErrorType.NETWORK
  console.log(appError.severity);  // ErrorSeverity.ERROR
}
```

---

#### **创建特定类型的错误**

```typescript
import {
  createValidationError,
  createNetworkError,
  createBusinessError,
  createAuthError,
} from '../utils/errorHelpers';

// 验证错误
throw createValidationError('手机号格式不正确', { field: 'phone' });

// 网络错误
throw createNetworkError('网络连接失败');

// 业务错误
throw createBusinessError('余额不足', { balance: 100, required: 200 });

// 认证错误
throw createAuthError('登录已过期，请重新登录');
```

---

## 5. 迁移步骤

### 5.1 迁移检查清单

**迁移前检查**：
- [ ] 页面是否使用 `setError` 状态？
- [ ] 页面是否使用 `showToast('error', ...)`？
- [ ] try-catch 块中是否有错误处理逻辑？
- [ ] 是否需要持久化错误状态？

### 5.2 迁移步骤（逐文件）

#### **步骤1：导入 Hook**

```typescript
// ✅ 添加导入
import { useErrorHandler } from '../hooks/useErrorHandler';
```

---

#### **步骤2：替换 useState**

```typescript
// ❌ 旧代码
const [error, setError] = useState<string | null>(null);

// ✅ 新代码
const { error, errorMessage, hasError, handleError, clearError } = useErrorHandler();
```

---

#### **步骤3：替换错误处理逻辑**

```typescript
// ❌ 旧代码
} catch (error: any) {
  const msg = error?.msg || error?.message || '操作失败';
  setError(msg);
  showToast('error', '操作失败', msg);
  console.error('操作失败:', error);
}

// ✅ 新代码
} catch (error) {
  handleError(error, { persist: true });
}
```

---

#### **步骤4：替换错误显示**

```typescript
// ❌ 旧代码
{error && <div className="error">{error}</div>}

// ✅ 新代码
{hasError && <div className="error">{errorMessage}</div>}
```

---

#### **步骤5：清除错误时机**

```typescript
// ✅ 表单提交前清除错误
const handleSubmit = () => {
  clearError();
  // ... 提交逻辑
};

// ✅ 页面卸载时自动清除（useEffect）
useEffect(() => {
  return () => clearError();
}, [clearError]);
```

---

### 5.3 迁移示例（完整对比）

#### **迁移前**：

```typescript
const AddressList = () => {
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useNotification();

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetchAddressList(token);
      if (isSuccess(res) && res.data?.list) {
        setAddresses(res.data.list);
        setError(null);
      } else {
        setError(extractError(res, '获取地址列表失败'));
      }
    } catch (e: any) {
      setError(e?.message || '获取地址列表失败');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: number) => {
    try {
      const res = await deleteAddressApi(id, token);
      if (isSuccess(res)) {
        showToast('success', '删除成功');
        loadAddresses();
      } else {
        showToast('error', '删除失败', extractError(res, '删除收货地址失败'));
      }
    } catch (e: any) {
      const errorMsg = e?.msg || e?.response?.msg || e?.message || '删除收货地址失败';
      showToast('error', '删除失败', errorMsg);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {/* ... */}
    </div>
  );
};
```

---

#### **迁移后**：

```typescript
const AddressList = () => {
  const { error, errorMessage, hasError, handleError, clearError, withErrorHandling } = useErrorHandler();

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetchAddressList(token);
      if (isSuccess(res) && res.data?.list) {
        setAddresses(res.data.list);
        clearError(); // ✅ 成功时清除错误
      } else {
        handleError(res, { persist: true }); // ✅ 统一处理
      }
    } catch (e) {
      handleError(e, { persist: true }); // ✅ 统一处理
    } finally {
      setLoading(false);
    }
  };

  // ✅ 使用 withErrorHandling 简化
  const deleteAddress = withErrorHandling(
    async (id: number) => {
      const res = await deleteAddressApi(id, token);
      if (isSuccess(res)) {
        showToast('success', '删除成功');
        loadAddresses();
      }
    },
    { toastTitle: '删除失败' }
  );

  return (
    <div>
      {hasError && <div className="error">{errorMessage}</div>}
      {/* ... */}
    </div>
  );
};
```

---

## 6. 最佳实践

### 6.1 何时使用 `persist: true`？

✅ **应该持久化的场景**：
- 列表页面加载失败
- 表单验证失败
- 需要用户手动关闭的错误

❌ **不应该持久化的场景**：
- 按钮点击失败（Toast 即可）
- 快速操作的错误提示
- 不影响页面显示的错误

---

### 6.2 错误消息文案规范

```typescript
// ✅ 好的错误消息
'手机号格式不正确'
'验证码已过期，请重新获取'
'网络连接失败，请检查网络后重试'

// ❌ 不好的错误消息
'失败'
'错误'
'操作失败'
```

---

### 6.3 日志上下文最佳实践

```typescript
// ✅ 提供丰富的上下文信息
handleError(error, {
  context: {
    page: 'AddressList',
    action: 'delete',
    addressId: id,
    timestamp: Date.now(),
  },
});
```

---

### 6.4 错误类型选择

| 场景 | 错误类型 | Toast 类型 | 示例 |
|------|---------|-----------|------|
| 表单验证失败 | VALIDATION | warning | '手机号格式不正确' |
| 网络请求失败 | NETWORK | error | '网络连接失败' |
| API 业务错误 | BUSINESS | warning | '余额不足' |
| 未登录/Token过期 | AUTH | error | '登录已过期' |
| 代码异常 | SYSTEM | error | '系统错误' |

---

## 7. FAQ

### Q1: 为什么不直接使用 showToast？

**A**: `useErrorHandler` 提供了更多功能：
- ✅ 自动错误日志记录
- ✅ 错误类型自动判断
- ✅ 支持错误持久化
- ✅ 统一的错误消息提取
- ✅ 更好的代码可测试性

---

### Q2: 如何与现有的 apiHelpers 集成？

**A**: 完全兼容，可以一起使用：

```typescript
const loadData = async () => {
  try {
    const res = await api.fetchData();
    const data = extractData(res); // ✅ 使用 apiHelpers
    if (data) {
      setData(data);
    } else {
      handleError(res); // ✅ 使用 useErrorHandler
    }
  } catch (error) {
    handleError(error); // ✅ 使用 useErrorHandler
  }
};
```

---

### Q3: 迁移会影响现有功能吗？

**A**: 不会，迁移是渐进式的：
- ✅ 新旧代码可以共存
- ✅ 不需要一次性迁移所有文件
- ✅ 迁移后的代码向后兼容

---

## 8. 迁移计划

### 8.1 第一阶段（P0，1人日）

迁移示例页面（3个文件）：
- [ ] `pages/user/AddressList.tsx`
- [ ] `pages/wallet/CardManagement.tsx`
- [ ] `pages/auth/Login.tsx`

### 8.2 第二阶段（P1，3人日）

迁移高频页面（15个文件）：
- [ ] `pages/wallet/*.tsx` (10个)
- [ ] `pages/market/*.tsx` (5个)

### 8.3 第三阶段（P2，4人日）

迁移所有剩余页面（30+个文件）

---

## 9. 验收标准

- [ ] ✅ `utils/errorHelpers.ts` 创建完成
- [ ] ✅ `hooks/useErrorHandler.ts` 创建完成
- [ ] ✅ 设计文档完成
- [ ] 3个示例页面迁移完成
- [ ] 15个高频页面迁移完成
- [ ] 所有页面迁移完成
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过
- [ ] 文档补充完整

---

## 10. 参考资料

- [任务卡 #4: 统一错误处理机制](../ARCHITECTURE_AUDIT_2025.md#任务卡-4-统一错误处理机制)
- [任务卡 #2: API响应处理完成报告](./changes/task-02-COMPLETION.md)
- [apiHelpers 工具函数](../utils/apiHelpers.ts)

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-29
**维护者**: 树交所前端团队
