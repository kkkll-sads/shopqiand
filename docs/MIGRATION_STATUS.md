# 页面路由迁移状态

## 迁移进度: ✅ 已完成

### 已完成的工作

1. **全部页面迁移** - 所有页面已完成内部导航迁移，使用 `useNavigate` hook
2. **Wrapper 层简化** - 所有 Wrapper 已移除 `withNavigation` HOC，改为直接渲染组件
3. **Route 类型清理** - `pages/` 目录下所有 Route 导入已清理

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

#### 用户页面 (6/6) ✅
- ✅ AccountDeletion.tsx - 内部使用 useNavigate
- ✅ AddressList.tsx - 内部使用 useNavigate
- ✅ AgentAuth.tsx - 内部使用 useNavigate
- ✅ NotificationSettings.tsx - 内部使用 useNavigate
- ✅ RealNameAuth.tsx - 内部使用 useNavigate
- ✅ UserSurvey.tsx - 内部使用 useNavigate

#### 市场页面 (4/4) ✅
- ✅ ArtistShowcase.tsx - 内部使用 useNavigate
- ✅ ArtistWorksShowcase.tsx - 内部使用 useNavigate
- ✅ MasterpieceShowcase.tsx - 内部使用 useNavigate
- ✅ MatchingPoolPage.tsx - 内部使用 useNavigate

#### 钱包页面 (9/9) ✅
- ✅ CardManagement.tsx - 内部使用 useNavigate
- ✅ ClaimDetail.tsx - 内部使用 useNavigate + useParams
- ✅ ConsignmentVoucher.tsx - 内部使用 useNavigate
- ✅ MoneyLogDetail.tsx - 内部使用 useNavigate + useParams
- ✅ OrderFundDetail.tsx - 内部使用 useNavigate
- ✅ RechargeOrderDetail.tsx - 内部使用 useNavigate + useParams
- ✅ RechargeOrderList.tsx - 内部使用 useNavigate
- ✅ ServiceRecharge.tsx - 内部使用 useNavigate
- ✅ WithdrawOrderDetail.tsx - 内部使用 useNavigate + useParams

## 当前架构状态

### ✅ 已完成
- 所有页面组件内部使用 `useNavigate`
- 所有 Wrapper 层已简化为直接渲染
- 构建通过，无错误

### 🔄 待优化（可选）
- 可删除 `router/routes.ts` 文件
- 可删除 `src/hoc/withNavigation.tsx` 文件（当前虽然存在但未被使用）

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

## Wrapper 层简化模式

所有 Wrapper 已简化为：

```tsx
import React from 'react';
import Component from '../../../pages/module/Component';

const ComponentWrapper: React.FC = () => <Component />;

export default ComponentWrapper;
```

---

**最后更新**: 2026-01-16
**状态**: ✅ 迁移完成
