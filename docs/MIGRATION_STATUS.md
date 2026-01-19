# 页面路由迁移状态

## 迁移进度: ✅ 已完成

### 已完成的工作

1. **全部页面迁移** - 所有页面已迁移到 `src/pages/` 并使用 `useNavigate`
2. **导航兼容层移除** - `withNavigation` HOC 已删除
3. **旧 Route 类型清理** - `router/routes.ts` 已删除
4. **根目录 pages/ 清理** - 已删除，所有页面统一在 `src/pages/`

### 迁移完成的页面 (使用 useNavigate)

#### 认证页面 (3/3) ✅
- ✅ ForgotPassword.tsx - 使用 PasswordForm 内置导航
- ✅ ResetLoginPassword.tsx - 使用 PasswordForm 内置导航
- ✅ ResetPayPassword.tsx - 内部使用 useNavigate

#### CMS 页面 (6/6) ✅
- ✅ AboutUs.tsx - 使用 StaticContentPage 内置导航
- ✅ AnnouncementDetail.tsx - 内部使用 useNavigate
- ✅ HelpCenter.tsx - 内部使用 useNavigate
- ✅ OnlineService.tsx - 内部使用 useNavigate
- ✅ PrivacyPolicy.tsx - 使用 StaticContentPage 内置导航
- ✅ UserAgreement.tsx - 使用 StaticContentPage 内置导航

#### 用户页面 (8/8) ✅
- ✅ AccountDeletion.tsx - 内部使用 useNavigate
- ✅ AddressList.tsx - 内部使用 useNavigate
- ✅ AgentAuth.tsx - 内部使用 useNavigate
- ✅ MyFriends.tsx - 内部使用 useNavigate
- ✅ NotificationSettings.tsx - 内部使用 useNavigate
- ✅ RealNameAuth.tsx - 内部使用 useNavigate
- ✅ UserSurvey.tsx - 内部使用 useNavigate
- ✅ EditProfile.tsx - 内部使用 useNavigate

#### 市场页面 (7/7) ✅
- ✅ ArtistShowcase.tsx - 内部使用 useNavigate
- ✅ ArtistWorksShowcase.tsx - 内部使用 useNavigate
- ✅ MasterpieceShowcase.tsx - 内部使用 useNavigate
- ✅ MatchingPoolPage.tsx - 内部使用 useNavigate
- ✅ Orders.tsx - 内部使用 useNavigate
- ✅ ProductDetail.tsx - 内部使用 useNavigate
- ✅ PointsProductDetail.tsx - 内部使用 useNavigate

#### 钱包页面 (12/12) ✅
- ✅ CardManagement.tsx - 内部使用 useNavigate
- ✅ ClaimDetail.tsx - 内部使用 useNavigate + useParams
- ✅ ClaimStation.tsx - 内部使用 useNavigate
- ✅ ConsignmentVoucher.tsx - 内部使用 useNavigate
- ✅ MoneyLogDetail.tsx - 内部使用 useNavigate + useParams
- ✅ OrderFundDetail.tsx - 内部使用 useNavigate
- ✅ RechargeOrderDetail.tsx - 内部使用 useNavigate + useParams
- ✅ RechargeOrderList.tsx - 内部使用 useNavigate
- ✅ ServiceRecharge.tsx - 内部使用 useNavigate
- ✅ WithdrawOrderDetail.tsx - 内部使用 useNavigate + useParams
- ✅ AssetView.tsx - 内部使用 useNavigate
- ✅ MyCollection.tsx - 内部使用 useNavigate

## 当前架构状态

### ✅ 已完成
- 所有页面组件内部使用 `useNavigate`
- 所有 Wrapper 层已简化为直接渲染
- 旧导航兼容层已移除
- 根目录 `pages/` 已删除
- 构建通过，无错误

### 📁 目录结构
```
src/pages/
├── auth/           # 认证页面
├── cms/            # 内容页面
├── live/           # 直播页面
├── market/         # 市场页面
├── user/           # 用户页面
└── wallet/         # 钱包页面
```

## 迁移模式

所有页面已遵循统一模式：

```tsx
// 1. 导入 useNavigate Hook
import { useNavigate } from 'react-router-dom';

// 2. 组件内使用
const Page: React.FC = () => {
  const navigate = useNavigate();
  
  // 3. 导航方法
  // navigate(-1) 替代 onBack()
  // navigate('/path') 替代 onNavigate({ name: 'route-name' })
  // navigate(`/path/${id}`) 替代动态路由
};
```

---

## API 响应统一处理状态（扫描：2026-01-19）

**结论**：运行时代码已统一使用 `apiHelpers`（`isSuccess` / `extractError`）。

**备注**：
- 文档与测试中的示例/断言仍保留，不影响运行。

---

## 状态机覆盖情况（扫描：2026-01-19）

**已落地状态机**：
- `hooks/useRealNameAuth.ts` → `src/pages/user/RealNameAuth.tsx`
- `hooks/useCashier.ts` → `src/pages/market/Cashier.tsx`
- `hooks/useAssetActionModal.ts` → `src/pages/wallet/AssetView.tsx`
- `LoadingState` → `src/pages/market/ReservationRecordDetailPage.tsx`（详情加载流程）
- `LoadingState` → `src/pages/market/ReservationRecordPage.tsx`（列表加载/加载更多）
- `LoadingState` → `src/pages/market/ArtistDetail.tsx`（详情加载流程）
- `LoadingState` → `src/pages/market/OrderDetail.tsx`（详情加载流程）
- `LoadingState` → `src/pages/market/OrderListPage.tsx`（订单列表加载）
- `LoadingState` → `src/pages/market/CollectionOrderDetail.tsx`（详情加载流程）
- `LoadingState/FormState` → `src/pages/market/PointsProductDetail.tsx`（详情加载/下单提交流程）
- `LoadingState` → `src/pages/market/MatchingPoolPage.tsx`（列表加载流程）
- `LoadingState` → `src/pages/market/ArtistShowcase.tsx`（列表加载流程）
- `LoadingState` → `src/pages/market/ArtistWorksShowcase.tsx`（列表加载流程）
- `LoadingState` → `src/pages/market/MasterpieceShowcase.tsx`（列表加载流程）
- `LoadingState` → `src/pages/market/Market.tsx`（列表加载/加载更多）
- `LoadingState/FormState` → `src/pages/market/ProductDetail.tsx`（详情加载/购买提交流程）
- `LoadingState` → `src/pages/live/LivePage.tsx`（直播加载/广告视频加载）
- `LoadingState/FormState` → `src/pages/market/ReservationPage.tsx`（用户信息加载/预约提交流程）
- `LoadingState` → `src/pages/wallet/WithdrawOrderList.tsx`（提现记录列表加载）
- `LoadingState` → `src/pages/wallet/WithdrawOrderDetail.tsx`（提现详情加载）
- `LoadingState` → `src/pages/wallet/RechargeOrderList.tsx`（充值记录列表加载）
- `LoadingState/FormState` → `src/pages/wallet/BalanceRecharge.tsx`（收款账户加载/提交与划转流程）
- `LoadingState/FormState` → `src/pages/wallet/ServiceRecharge.tsx`（用户信息加载/确权金划转流程）
- `LoadingState` → `src/pages/wallet/MoneyLogDetail.tsx`（资金明细详情加载）
- `LoadingState` → `src/pages/wallet/OrderFundDetail.tsx`（订单资金明细加载）
- `LoadingState` → `src/pages/wallet/CumulativeRights.tsx`（权益信息加载）
- `LoadingState` → `src/pages/wallet/ClaimDetail.tsx`（确权详情加载）
- `LoadingState` → `src/pages/wallet/ClaimHistory.tsx`（确权历史加载）
- `LoadingState` → `src/pages/wallet/ConsignmentVoucher.tsx`（寄售券加载）
- `LoadingState` → `src/pages/user/InviteFriends.tsx`（邀请好友加载）
- `LoadingState/FormState` → `src/pages/wallet/CardManagement.tsx`（银行卡列表加载/表单提交）
- `LoadingState/FormState` → `src/pages/user/AddressList.tsx`（地址列表加载/表单提交）
- `LoadingState` → `src/pages/user/Profile.tsx`（个人中心加载）
- `LoadingState` → `src/pages/user/ActivityCenter.tsx`（活动中心加载）
- `LoadingState/LoadingState` → `src/pages/user/MyFriends.tsx`（好友列表加载/加载更多）
- `LoadingState` → `src/pages/cms/MessageCenter.tsx`（消息中心加载）
- `LoadingState` → `src/pages/wallet/AssetHistory.tsx`（资产历史加载）
- `LoadingState/FormState` → `src/pages/user/UserSurvey.tsx`（问卷历史加载/提交）
- `LoadingState/FormState/LoadingState` → `src/pages/user/AgentAuth.tsx`（代理商状态加载/提交/上传）
- `FormState` → `src/pages/user/AccountDeletion.tsx`（账户注销提交）
- `FormState` → `src/pages/auth/Login.tsx`（登录提交）
- `FormState` → `src/pages/auth/Register.tsx`（注册提交）
- `LoadingState` → `src/pages/cms/SignIn.tsx`（签到数据加载）
- `LoadingState/FormState` → `src/pages/wallet/ExtensionWithdraw.tsx`（账户加载/提交）
- `LoadingState/LoadingState` → `src/pages/market/TradingZone.tsx`（场次加载/商品加载）
- `LoadingState/FormState/FormState/LoadingState` → `src/pages/wallet/MyCollection.tsx`（列表加载/操作/批量寄售/批量可寄售加载）
- `LoadingState/FormState` → `src/pages/wallet/MyCollectionDetail.tsx`（详情加载/操作）
- `FormState` → `src/pages/wallet/hooks/useClaimSubmit.ts`（确权提交）
- `LoadingState/LoadingState/FormState` → `src/pages/wallet/BalanceWithdraw.tsx`（账户加载/余额加载/提交）

**结论**：状态机目前为“关键页面局部覆盖”，非全量覆盖。

## Wrapper 层简化模式

所有 Wrapper 已简化为：

```tsx
import React from 'react';
import Component from './Component';

const ComponentWrapper: React.FC = () => <Component />;

export default ComponentWrapper;
```

---

**最后更新**: 2026-01-17
**状态**: ✅ 迁移完成
