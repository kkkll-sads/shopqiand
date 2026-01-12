# 前端价格分区规律逻辑文档

## 概述

价格分区是藏品交易系统中的核心概念，用于将不同价位的藏品归类到统一的价格区间，实现"申购价按分区统一定价"的机制。

**重要说明：** 价格分区的归类逻辑是在**后端API**完成的，前端只负责处理和展示已归类好的数据。

---

## 0. 归类逻辑位置

### 0.1 后端API归类

**API接口：** `GET /api/collectionItem/bySession`

**位置：** `services/collection.ts` → `fetchCollectionItemsBySession()`

**归类规则：** 后端按 `package_name + zone_id` 进行归类，返回的每条记录代表一个归类组。

**前端处理文件：** `pages/market/TradingZone.tsx` (第205-256行)

```typescript
// 获取商品列表（新 API：官方+寄售按 package_name + zone_id 统一归类）
const response = await fetchCollectionItemsBySession(session.id, { page: 1, limit: 10 });

if (isSuccess(response) && response.data?.list) {
    const allItems = response.data.list.map((item: any) => {
        // 新 API 结构：每条记录代表一个 package_name + zone_id 的归类
        // 前端只负责处理已归类好的数据
        return {
            ...item,
            package_name: item.package_name || item.title,
            displayKey: `pkg-${item.zone_id || item.id}-${item.package_name || item.id}`,
            // ...
        };
    });
}
```

**归类字段：**
- `package_name`: 资产包名称（归类维度1）
- `zone_id`: 价格分区ID（归类维度2）
- `price_zone`: 价格分区名称（如 "500元区"）

**归类结果：**
- 每个 `package_name + zone_id` 组合对应一条记录
- 记录中包含该组合的：
  - `official_stock`: 官方库存
  - `consignment_count`: 寄售数量
  - `total_available`: 总可用数量
  - `price_zone`: 价格分区名称

---

## 1. 价格分区格式

### 1.1 支持的格式

价格分区字符串支持以下两种格式：

| 格式 | 示例 | 说明 |
|------|------|------|
| **数字+元区** | `"500元区"`, `"1000元区"` | 标准格式，直接表示价格 |
| **数字+K区** | `"1K区"`, `"2K区"` | 简化格式，K 表示千元单位 |

### 1.2 数据来源

价格分区信息主要来自以下字段：

```typescript
// 藏品详情数据
collectionDetail?.price_zone        // 优先使用
collectionDetail?.priceZone         // 兼容字段
collectionDetail?.zone_name         // 分区名称
collectionDetail?.zone_id           // 分区ID
collectionDetail?.price_zone_id      // 分区ID（兼容）
```

---

## 2. 价格提取函数

### 2.1 `extractPriceFromZone` 函数

**位置：** 多个文件中重复定义（应提取为公共工具函数）
- `pages/market/ProductDetail.tsx`
- `pages/market/TradingZone.tsx`
- `pages/market/ReservationPage.tsx`

**实现逻辑：**

```typescript
/**
 * 从价格分区字符串中提取价格数字
 * @param priceZone - 价格分区字符串，如 "1000元区" 或 "1K区"
 * @returns 提取的价格数字，如果提取失败返回 0
 */
const extractPriceFromZone = (priceZone?: string): number => {
  if (!priceZone) return 0;
  
  // 1. 处理带单位的情况，如 "1K区" -> 1000, "2K区" -> 2000
  const upperZone = priceZone.toUpperCase();
  if (upperZone.includes('K')) {
    const match = upperZone.match(/(\d+)\s*K/i);
    if (match) {
      return Number(match[1]) * 1000;
    }
  }
  
  // 2. 处理普通数字，如 "500元区" -> 500
  const match = priceZone.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};
```

**处理流程：**

1. **空值检查**：如果 `priceZone` 为空，返回 `0`
2. **K 单位处理**：
   - 转换为大写
   - 检查是否包含 `K`
   - 使用正则 `/(\d+)\s*K/i` 匹配数字+K
   - 提取数字并乘以 1000
3. **普通数字处理**：
   - 使用正则 `/(\d+)/` 提取第一个数字
   - 转换为数字类型

**示例：**

| 输入 | 输出 | 说明 |
|------|------|------|
| `"500元区"` | `500` | 标准格式 |
| `"1000元区"` | `1000` | 标准格式 |
| `"1K区"` | `1000` | K 单位格式 |
| `"2K区"` | `2000` | K 单位格式 |
| `"1.5K区"` | `1000` | 只提取整数部分 |
| `""` | `0` | 空值 |
| `undefined` | `0` | 未定义 |

---

## 3. 价格计算逻辑

### 3.1 显示价格计算

**位置：** `pages/market/ProductDetail.tsx` (第208-231行)

```typescript
// 价格计算：优先使用价格分区，否则使用实际价格
let displayPriceNum: number;
let displayPriceStr: string;

if (isShopProduct) {
  // 积分商品：直接使用价格
  displayPriceNum = Number(shopDetail?.price ?? product.price);
  displayPriceStr = `¥${displayPriceNum.toLocaleString()}`;
} else {
  // 藏品：优先使用价格分区
  const actualPrice = Number(collectionDetail?.price ?? product.price);
  const pZone = collectionDetail?.price_zone || (collectionDetail as any)?.priceZone;

  if (pZone) {
    // 从价格分区（如 "500元区"）中提取数字
    displayPriceNum = extractPriceFromZone(pZone);
    // 如果提取失败，回退到实际价格
    if (displayPriceNum <= 0) displayPriceNum = actualPrice;
    // 统一格式化为标准金额格式
    displayPriceStr = `¥${displayPriceNum.toLocaleString()}`;
  } else {
    // 没有价格分区，使用实际价格
    displayPriceNum = actualPrice;
    displayPriceStr = `¥${displayPriceNum.toLocaleString()}`;
  }
}
```

**优先级规则：**

1. **积分商品**：直接使用 `price` 字段
2. **藏品商品**：
   - **优先**：使用 `price_zone` 提取的价格
   - **回退**：如果提取失败（≤0），使用实际 `price`
   - **兜底**：如果没有 `price_zone`，使用实际 `price`

### 3.2 交易区价格计算

**位置：** `pages/market/TradingZone.tsx` (第225-227行)

```typescript
// 价格计算：优先使用 price_zone 分区价格
const zonePriceValue = extractPriceFromZone(item.price_zone);
const displayPrice = zonePriceValue > 0 ? zonePriceValue : Number(item.min_price || item.price || 0);
```

**逻辑：**
- 优先使用 `price_zone` 提取的价格
- 如果提取失败，使用 `min_price` 或 `price`
- 最终回退到 `0`

---

## 4. 价格分区匹配逻辑

### 4.1 预约页面的分区匹配

**位置：** `pages/market/ReservationPage.tsx` (第142-174行)

当藏品详情中只有 `price_zone` 名称但没有 `zone_id` 时，需要通过场次详情进行匹配：

```typescript
if (detailSessionId && (data.price_zone || !detailZoneId || Number(detailZoneId) === 0)) {
  // 获取场次详情
  const sessionRes = await fetchCollectionSessionDetail(Number(detailSessionId));
  const sessionData = extractData(sessionRes);

  if (sessionData && sessionData.zones && Array.isArray(sessionData.zones)) {
    // A. 优先匹配 price_zone 名称 (e.g. "500元区")
    let matchedZone = sessionData.zones.find((z: any) => z.name === data.price_zone);

    // B. 如果没匹配到，尝试匹配价格
    if (!matchedZone) {
      const targetPrice = Number(data.price);
      matchedZone = sessionData.zones.find((z: any) => {
        // 宽松匹配：如果 zone 名称包含价格数字
        if (z.name && z.name.includes(String(Math.floor(targetPrice)))) return true;
        return false;
      });
    }

    if (matchedZone) {
      detailZoneId = matchedZone.id;
    }
  }
}
```

**匹配策略：**

1. **精确匹配**：优先通过 `zone.name === price_zone` 精确匹配
2. **价格匹配**：如果精确匹配失败，通过价格数字进行宽松匹配
   - 提取藏品的实际价格
   - 在分区名称中查找是否包含该价格数字

---

## 5. 价格分区筛选

### 5.1 交易区价格分区筛选

**位置：** `pages/market/TradingZone.tsx` (第504-543行)

```typescript
// 提取所有唯一的价格分区
const priceZones = ['all', ...Array.from(new Set(
  tradingItems
    .map(item => item.price_zone)
    .filter(zone => zone) // 过滤掉 undefined/null
))];

// 筛选逻辑
.filter(item => {
  if (activePriceZone === 'all') return true;
  // 使用后端字段进行筛选
  return item.price_zone === activePriceZone;
})
```

**逻辑：**
- 从所有商品中提取唯一的 `price_zone` 值
- 添加 `'all'` 作为"全部"选项
- 根据选中的分区筛选商品

---

## 6. 数据字段映射

### 6.1 分区相关字段

| 字段名 | 类型 | 说明 | 来源 |
|--------|------|------|------|
| `price_zone` | `string` | 价格分区名称，如 "500元区" | API 返回 |
| `priceZone` | `string` | 兼容字段名 | API 返回（驼峰格式） |
| `zone_id` | `number` | 价格分区ID | API 返回 |
| `price_zone_id` | `number` | 兼容字段名 | API 返回 |
| `zoneId` | `number` | 兼容字段名（驼峰） | API 返回 |
| `zone_name` | `string` | 分区名称 | API 返回 |
| `zone_min_price` | `number` | 分区最低价 | API 返回 |
| `zone_max_price` | `number` | 分区最高价 | API 返回 |

### 6.2 字段补全逻辑

**位置：** `pages/market/ProductDetail.tsx` (第279-297行)

```typescript
// 预约场次/分区（如果从列表未带上，尝试用详情补全）
const detailSessionId = collectionDetail?.session_id || ...;
const detailZoneId = collectionDetail?.zone_id || 
                     collectionDetail?.price_zone_id || ...;

// 将补全的场次/分区直接写回当前 product 引用，确保预约页能拿到
if (!product.sessionId && detailSessionId) {
  product.sessionId = detailSessionId as any;
}
if (!product.zoneId && detailZoneId) {
  product.zoneId = detailZoneId as any;
}
```

---

## 7. 使用场景

### 7.1 藏品详情页 (`ProductDetail.tsx`)

- **显示价格**：优先显示价格分区价格
- **显示分区标签**：展示 "Price Zone / 价格分区" 标签
- **提示文本**："（申购价按分区统一定价）"

### 7.2 交易区 (`TradingZone.tsx`)

- **价格计算**：使用分区价格作为显示价格
- **分区筛选**：提供分区筛选功能
- **商品展示**：显示分区标签

### 7.3 预约页面 (`ReservationPage.tsx`)

- **分区匹配**：通过 `price_zone` 名称匹配 `zone_id`
- **价格提取**：从分区名称提取冻结金额
- **算力计算**：基于分区价格计算算力需求

---

## 8. 问题与建议

### 8.1 当前问题

1. **代码重复**：`extractPriceFromZone` 函数在多个文件中重复定义
2. **字段不一致**：存在多种字段名（`price_zone` / `priceZone` / `zone_id` / `zoneId`）
3. **匹配逻辑复杂**：预约页面的分区匹配逻辑较为复杂，容易出错

### 8.2 改进建议

1. **提取公共函数**：
   ```typescript
   // utils/priceZone.ts
   export function extractPriceFromZone(priceZone?: string): number {
     // 统一实现
   }
   ```

2. **统一字段映射**：
   ```typescript
   // utils/dataMapper.ts
   export function normalizePriceZone(data: any): {
     priceZone: string;
     zoneId: number;
   } {
     // 统一处理各种字段名
   }
   ```

3. **类型定义**：
   ```typescript
   // types/priceZone.ts
   export interface PriceZone {
     id: number;
     name: string;
     minPrice?: number;
     maxPrice?: number;
   }
   ```

---

## 9. 总结

前端价格分区规律的核心逻辑：

1. **格式支持**：支持 "500元区" 和 "1K区" 两种格式
2. **价格提取**：通过正则表达式提取价格数字
3. **优先级**：价格分区 > 实际价格
4. **匹配策略**：名称精确匹配 > 价格数字匹配
5. **字段兼容**：支持多种字段名格式

**关键原则**：申购价按分区统一定价，而非使用实际价格。

---

**文档生成时间：** 2026-01-04
**最后更新：** 2026-01-04

