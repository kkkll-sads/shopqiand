# AssetView 标签页数据加载状态机设计文档

> **创建时间**: 2025-12-29
> **目标**: 重构 AssetView.tsx 标签页数据加载逻辑，消除102行loadData函数
> **策略**: 配置化 + 统一数据管理

---

## 1. 当前问题

### 问题清单
- ❌ **6个独立数据数组**：`balanceLogs`, `incomeLogs`, `withdrawOrders`, `serviceFeeLogs`, `integralLogs`, `myCollections`
- ❌ **102行loadData函数**：包含6个if-else分支，每个分支20-30行
- ❌ **标签切换时手动重置**：useEffect手动清空所有6个数组
- ❌ **全局loading/error状态**：无法区分具体哪个标签页在加载/出错
- ❌ **无数据缓存**：标签切换回来时需要重新加载

### 代码示例
```typescript
// ❌ 旧代码：6个独立数组
const [balanceLogs, setBalanceLogs] = useState([]);
const [incomeLogs, setIncomeLogs] = useState([]);
const [withdrawOrders, setWithdrawOrders] = useState([]);
const [serviceFeeLogs, setServiceFeeLogs] = useState([]);
const [integralLogs, setIntegralLogs] = useState([]);
const [myCollections, setMyCollections] = useState([]);

// ❌ 旧代码：标签切换时手动重置
useEffect(() => {
  setPage(1);
  setBalanceLogs([]);
  setRechargeOrders([]);
  setWithdrawOrders([]);
  setServiceFeeLogs([]);
  setIntegralLogs([]);
  setIncomeLogs([]);
  setMyCollections([]);
}, [activeTab]);

// ❌ 旧代码：102行loadData函数
const loadData = async () => {
  setLoading(true);
  if (activeTab === 0) {
    // 20行：获取余额明细
  } else if (activeTab === 1) {
    // 20行：获取收益明细
  } else if (activeTab === 2) {
    // 20行：获取拓展明细
  } // ... 6个分支
};
```

---

## 2. 解决方案：配置化标签页管理

### 2.1 核心思想

**不使用状态机，使用配置化 + 统一数据管理**：

1. **标签页配置**：每个标签页定义一个配置对象
2. **统一数据结构**：使用Map存储每个标签页的状态
3. **通用加载逻辑**：一个通用的loadTab函数处理所有标签页

### 2.2 数据结构设计

```typescript
/**
 * 标签页状态
 */
interface TabState<T = any> {
  data: T[];           // 数据数组
  page: number;        // 当前页码
  hasMore: boolean;    // 是否有更多数据
  loading: boolean;    // 是否加载中
  error: string | null; // 错误信息
  initialized: boolean; // 是否已初始化（用于缓存判断）
}

/**
 * 标签页配置
 */
interface TabConfig<T = any> {
  id: number;
  name: string;
  fetchData: (params: { page: number; token: string }) => Promise<ApiResponse>;
  parseData: (response: ApiResponse) => {
    list: T[];
    hasMore: boolean;
    extra?: any; // 额外数据（如寄售券数量）
  };
}

/**
 * Hook返回值
 */
interface UseAssetTabsReturn {
  // 当前标签页
  activeTab: number;
  setActiveTab: (tab: number) => void;

  // 当前标签页状态
  currentTabState: TabState;
  isLoading: boolean;
  hasError: boolean;
  error: string | null;
  data: any[];
  hasMore: boolean;

  // 操作
  loadMore: () => void;
  refresh: () => void;

  // 所有标签页配置
  tabs: TabConfig[];
}
```

### 2.3 标签页配置示例

```typescript
const TAB_CONFIGS: TabConfig[] = [
  {
    id: 0,
    name: '专项金明细',
    fetchData: ({ page, token }) => getBalanceLog({ page, limit: 10, token }),
    parseData: (response) => {
      const data = extractData(response);
      return {
        list: data?.list || [],
        hasMore: (data?.list?.length || 0) >= 10,
      };
    },
  },
  {
    id: 1,
    name: '收益明细',
    fetchData: ({ page, token }) => getBalanceLog({ page, limit: 10, token }),
    parseData: (response) => {
      const data = extractData(response);
      return {
        list: data?.list || [],
        hasMore: (data?.list?.length || 0) >= 10,
      };
    },
  },
  {
    id: 2,
    name: '津贴明细',
    fetchData: ({ page, token }) => getMyWithdrawList({ page, limit: 10, token }),
    parseData: (response) => {
      const data = extractData(response);
      return {
        list: data?.list || [],
        hasMore: data?.has_more || false,
      };
    },
  },
  // ... 其他标签页
];
```

---

## 3. 技术实现方案

### 3.1 Hook实现

```typescript
// hooks/useAssetTabs.ts
export function useAssetTabs(
  tabs: TabConfig[],
  initialTab: number = 0
): UseAssetTabsReturn {
  const [activeTab, setActiveTab] = useState(initialTab);

  // 使用Map存储每个标签页的状态
  const [tabStates, setTabStates] = useState<Map<number, TabState>>(
    () => new Map(tabs.map(tab => [tab.id, {
      data: [],
      page: 1,
      hasMore: false,
      loading: false,
      error: null,
      initialized: false,
    }]))
  );

  // 获取当前标签页状态
  const currentTabState = tabStates.get(activeTab) || {
    data: [],
    page: 1,
    hasMore: false,
    loading: false,
    error: null,
    initialized: false,
  };

  // 更新指定标签页的状态
  const updateTabState = useCallback((tabId: number, updates: Partial<TabState>) => {
    setTabStates(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(tabId) || {
        data: [],
        page: 1,
        hasMore: false,
        loading: false,
        error: null,
        initialized: false,
      };
      newMap.set(tabId, { ...current, ...updates });
      return newMap;
    });
  }, []);

  // 加载标签页数据
  const loadTab = useCallback(async (tabId: number, page: number = 1) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      updateTabState(tabId, { error: '请先登录', loading: false });
      return;
    }

    const tabConfig = tabs.find(t => t.id === tabId);
    if (!tabConfig) return;

    updateTabState(tabId, { loading: true, error: null });

    try {
      const response = await tabConfig.fetchData({ page, token });
      const { list, hasMore, extra } = tabConfig.parseData(response);

      const currentState = tabStates.get(tabId);
      const newData = page === 1 ? list : [...(currentState?.data || []), ...list];

      updateTabState(tabId, {
        data: newData,
        page,
        hasMore,
        loading: false,
        error: null,
        initialized: true,
      });

      // 处理额外数据
      if (extra && tabConfig.handleExtra) {
        tabConfig.handleExtra(extra);
      }
    } catch (err: any) {
      updateTabState(tabId, {
        loading: false,
        error: err?.message || '加载失败',
      });
    }
  }, [tabs, tabStates, updateTabState]);

  // 切换标签页时，如果未初始化则加载数据
  useEffect(() => {
    const state = tabStates.get(activeTab);
    if (!state?.initialized && !state?.loading) {
      loadTab(activeTab, 1);
    }
  }, [activeTab, tabStates, loadTab]);

  // 加载更多
  const loadMore = useCallback(() => {
    const state = tabStates.get(activeTab);
    if (state && !state.loading && state.hasMore) {
      loadTab(activeTab, state.page + 1);
    }
  }, [activeTab, tabStates, loadTab]);

  // 刷新当前标签页
  const refresh = useCallback(() => {
    loadTab(activeTab, 1);
  }, [activeTab, loadTab]);

  return {
    activeTab,
    setActiveTab,
    currentTabState,
    isLoading: currentTabState.loading,
    hasError: !!currentTabState.error,
    error: currentTabState.error,
    data: currentTabState.data,
    hasMore: currentTabState.hasMore,
    loadMore,
    refresh,
    tabs,
  };
}
```

---

## 4. 验收标准

- [ ] **消除6个独立数组**：使用Map统一管理
- [ ] **消除102行loadData函数**：使用配置化 + 通用loadTab函数
- [ ] **消除手动重置useEffect**：自动管理标签页状态
- [ ] **独立loading/error状态**：每个标签页有自己的状态
- [ ] **支持数据缓存**：标签切换回来时不重新加载
- [ ] **支持加载更多**：统一的loadMore接口
- [ ] **支持刷新**：统一的refresh接口
- [ ] **代码精简**：
  - ✅ 删除6个useState（数据数组）
  - ✅ 删除1个useEffect（手动重置）
  - ✅ 删除102行loadData函数
  - ✅ 组件代码减少100+行

---

## 5. 预期收益

### 代码精简
- **AssetView组件**: 956行 → ~850行 (减少100+行)
- **loadData函数**: 102行 → 0行（迁移到Hook）
- **数据数组state**: 6个 → 0个（Map管理）

### 可维护性提升
- ✅ 新增标签页只需添加配置对象
- ✅ 标签页逻辑独立，易于测试
- ✅ 数据缓存，减少不必要的API调用

### 性能优化
- ✅ 标签页数据缓存，切换时不重新加载
- ✅ 减少不必要的状态更新
- ✅ 统一的加载逻辑，减少代码重复

---

## 6. 实施步骤

1. ✅ **Step 1**: 设计配置化方案（本文档）
2. ⏳ **Step 2**: 实现useAssetTabs Hook
3. ⏳ **Step 3**: 定义6个标签页配置对象
4. ⏳ **Step 4**: 重构AssetView组件
5. ⏳ **Step 5**: 测试验证
6. ⏳ **Step 6**: 清理旧代码

---

## 7. 风险评估

| 风险 | 概率 | 影响 | 应对措施 |
|-----|------|------|---------|
| Map状态更新问题 | 低 | 中 | 使用不可变更新模式 |
| 数据缓存导致陈旧数据 | 中 | 低 | 提供refresh接口 |
| 标签页切换性能问题 | 极低 | 低 | 数据缓存反而提升性能 |

---

**预计工时**: 0.5人日（设计30min + 开发2h + 测试1h）
