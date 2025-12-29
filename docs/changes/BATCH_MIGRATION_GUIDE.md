# 批量迁移指南 - 剩余 32 个文件

> **状态**: 已完成 P0 核心页面（3个），待迁移 32 个
> **工具**: scripts/migrate-api-helpers.sh
> **预计工时**: 1.5 人日

---

## 📋 待迁移文件清单

### Wallet 模块（14个文件）

| 文件 | API调用数 | 优先级 | 预计工时 | 状态 |
|------|-----------|--------|---------|------|
| `pages/wallet/BalanceRecharge.tsx` | 2处 | P1 | 30分钟 | ⬜️ 待迁移 |
| `pages/wallet/BalanceWithdraw.tsx` | 3处 | P1 | 30分钟 | ⬜️ 待迁移 |
| `pages/wallet/CardManagement.tsx` | 4处 | P1 | 45分钟 | ⬜️ 待迁移 |
| `pages/wallet/ServiceRecharge.tsx` | 2处 | P2 | 30分钟 | ⬜️ 待迁移 |
| `pages/wallet/ExtensionWithdraw.tsx` | 4处 | P2 | 45分钟 | ⬜️ 待迁移 |
| `pages/wallet/HashrateExchange.tsx` | 2处 | P2 | 30分钟 | ⬜️ 待迁移 |
| `pages/wallet/MyCollection.tsx` | 6处 | P2 | 1小时 | ⬜️ 待迁移 |
| `pages/wallet/MyCollectionDetail.tsx` | 3处 | P2 | 45分钟 | ⬜️ 待迁移 |
| `pages/wallet/ClaimHistory.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |
| `pages/wallet/ClaimDetail.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |
| `pages/wallet/CumulativeRights.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |
| `pages/wallet/ConsignmentVoucher.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |
| `pages/wallet/AssetHistory.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |
| `pages/wallet/components/asset/AssetHeaderCard.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |

### Market 模块（6个文件）

| 文件 | API调用数 | 优先级 | 预计工时 | 状态 |
|------|-----------|--------|---------|------|
| `pages/market/OrderListPage.tsx` | 14处 | P1 | 1.5小时 | ⬜️ 待迁移 |
| `pages/market/ReservationPage.tsx` | 2处 | P1 | 30分钟 | ⬜️ 待迁移 |
| `pages/market/OrderDetail.tsx` | 2处 | P2 | 30分钟 | ⬜️ 待迁移 |
| `pages/market/TradingZone.tsx` | 2处 | P2 | 30分钟 | ⬜️ 待迁移 |
| `pages/market/PointsProductDetail.tsx` | 4处 | P2 | 45分钟 | ⬜️ 待迁移 |
| `pages/market/SearchPage.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |
| `pages/market/MatchingPoolPage.tsx` | 2处 | P2 | 30分钟 | ⬜️ 待迁移 |

### User 模块（5个文件）

| 文件 | API调用数 | 优先级 | 预计工时 | 状态 |
|------|-----------|--------|---------|------|
| `pages/user/AgentAuth.tsx` | 3处 | P1 | 45分钟 | ⬜️ 待迁移 |
| `pages/user/AddressList.tsx` | 3处 | P1 | 45分钟 | ⬜️ 待迁移 |
| `pages/user/Profile.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |
| `pages/user/MyFriends.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |
| `pages/user/InviteFriends.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |

### CMS 模块（4个文件）

| 文件 | API调用数 | 优先级 | 预计工时 | 状态 |
|------|-----------|--------|---------|------|
| `pages/cms/SignIn.tsx` | 10处 | P1 | 1小时 | ⬜️ 待迁移 |
| `pages/cms/MessageCenter.tsx` | 7处 | P1 | 1小时 | ⬜️ 待迁移 |
| `pages/cms/Home.tsx` | 1处 | P2 | 15分钟 | ⬜️ 待迁移 |
| `pages/cms/HelpCenter.tsx` | 2处 | P2 | 30分钟 | ⬜️ 待迁移 |

### Auth 模块（2个文件）

| 文件 | API调用数 | 优先级 | 预计工时 | 状态 |
|------|-----------|--------|---------|------|
| `pages/auth/Login.tsx` | 1处 | P1 | 15分钟 | ⬜️ 待迁移 |
| `pages/auth/Register.tsx` | 1处 | P1 | 15分钟 | ⬜️ 待迁移 |

---

## 🚀 快速迁移步骤

### 步骤1：批量添加 import（自动化）

```bash
# 运行批量迁移脚本
bash scripts/migrate-api-helpers.sh
```

这将自动为所有文件添加：
```tsx
// ✅ 引入统一 API 处理工具
import { isSuccess, extractData, extractError } from '../../utils/apiHelpers';
```

### 步骤2：手动替换判断逻辑（每个文件）

#### 模式A：简单判断替换

```tsx
// ❌ 旧代码
if (response.code === 1 && response.data) {
  setData(response.data);
} else {
  setError(response.msg || '操作失败');
}

// ✅ 新代码
const data = extractData(response);
if (data) {
  setData(data);
} else {
  setError(extractError(response, '操作失败'));
}
```

#### 模式B：列表数据处理

```tsx
// ❌ 旧代码
const res = await getList({ page, token });
if (res.code === 1 && res.data) {
  setList(res.data.list || []);
  setHasMore(res.data.has_more);
}

// ✅ 新代码
const res = await getList({ page, token });
const data = extractData(res);
if (data) {
  setList(data.list || []);
  setHasMore(data.has_more);
}
```

#### 模式C：Toast 提示替换

```tsx
// ❌ 旧代码
if (res.code === 1) {
  showToast('success', res.msg || '操作成功');
} else {
  showToast('error', res.msg || '操作失败');
}

// ✅ 新代码
if (isSuccess(res)) {
  showToast('success', extractError(res, '操作成功'));
} else {
  showToast('error', extractError(res, '操作失败'));
}
```

### 步骤3：测试验证

每个文件迁移后立即测试：

```bash
# 1. 编译检查
npm run build

# 2. 运行该页面
# 测试正常流程 + 错误流程

# 3. Git 提交
git add pages/xxx/xxx.tsx
git commit -m "refactor(xxx): 使用 apiHelpers 统一API判断"
```

---

## 📊 迁移进度跟踪

### 已完成（5个文件，16处API调用）

- [x] `pages/user/RealNameAuth.tsx` - 5处 ✅
- [x] `pages/wallet/AssetView.tsx` - 9处 ✅
- [x] `pages/market/ProductDetail.tsx` - 2处 ✅
- [x] `pages/market/Cashier.tsx` - 3处 ✅

**小计**: 19 处 API 调用已迁移

### 待完成（32个文件，96处API调用）

**P1 优先级**（10个文件，需优先迁移）:
- [ ] `pages/market/OrderListPage.tsx` - 14处
- [ ] `pages/cms/SignIn.tsx` - 10处
- [ ] `pages/cms/MessageCenter.tsx` - 7处
- [ ] `pages/wallet/CardManagement.tsx` - 4处
- [ ] `pages/wallet/BalanceWithdraw.tsx` - 3处
- [ ] `pages/user/AgentAuth.tsx` - 3处
- [ ] `pages/user/AddressList.tsx` - 3处
- [ ] `pages/wallet/BalanceRecharge.tsx` - 2处
- [ ] `pages/market/ReservationPage.tsx` - 2处
- [ ] `pages/auth/Login.tsx` + `Register.tsx` - 2处

**P2 优先级**（22个文件，后续迁移）

---

## 🛠 高效迁移技巧

### 技巧1：使用 VSCode 多光标

1. 搜索 `response.code === 1`
2. Ctrl+D 选中所有匹配
3. 统一修改为 `isSuccess(response)`

### 技巧2：使用 Regex 批量替换

```regex
# 查找
if \((\w+)\.code === 1 && \1\.data\)

# 替换为
const data = extractData($1);\nif (data)
```

### 技巧3：保留旧代码注释

```tsx
// ✅ 重构前：
// if (response.code === 1 && response.data) { ... }
// ✅ 重构后：
const data = extractData(response);
if (data) { ... }
```

保留1个版本周期后删除。

---

## ⚠️ 注意事项

### 1. 特殊接口处理

某些接口 `code=0` 也表示成功：

```tsx
// ❌ 不要直接用 isSuccess
if (isSuccess(res)) { ... }

// ✅ 需要特殊判断
if (isSuccess(res) || res.code === 0) { ... }
```

例如：`pages/wallet/AssetView.tsx:426` 的权益分割接口

### 2. 嵌套 data 处理

```tsx
// 某些接口返回 res.data.data
const outerData = extractData(res);
const realData = outerData?.data;
```

### 3. 避免批量替换

**不要使用 sed/awk 批量替换**，必须逐个审查！

---

## 📅 建议迁移计划

### Day 1 上午（3小时）

- [x] ~~AssetView.tsx~~
- [x] ~~ProductDetail.tsx~~
- [x] ~~Cashier.tsx~~
- [ ] OrderListPage.tsx（14处，重点）
- [ ] SignIn.tsx（10处）

### Day 1 下午（3小时）

- [ ] MessageCenter.tsx（7处）
- [ ] CardManagement.tsx（4处）
- [ ] AgentAuth.tsx（3处）
- [ ] AddressList.tsx（3处）
- [ ] BalanceWithdraw.tsx（3处）

### Day 2 上午（3小时）

- [ ] P2 优先级文件（22个，每个15-30分钟）
- [ ] 集中迁移简单文件（1-2处API调用）

### Day 2 下午（2小时）

- [ ] 回归测试
- [ ] Git 提交整理
- [ ] 更新文档

---

## ✅ 验收标准

- [ ] 所有 32 个文件已添加 import
- [ ] 所有 `.code === 1` 判断少于 5 处（仅保留特殊情况）
- [ ] npm run build 成功
- [ ] 关键流程回归测试通过
- [ ] Git 提交信息清晰

---

## 📞 遇到问题？

参考文档：
- `docs/changes/task-02-api-helpers-migration.md` - 详细迁移指南
- `utils/apiHelpers.ts` - 工具源码
- `pages/user/RealNameAuth.tsx` - 完整示例

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-29
**维护人**: 前端架构组
