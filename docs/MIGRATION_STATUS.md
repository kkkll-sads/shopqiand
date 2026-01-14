# 页面路由迁移状态

## 迁移进度: 约 35/67 页面 (52%)

## 已完成迁移的页面

### 认证页面 (3个)
- ✅ ForgotPassword.tsx
- ✅ ResetLoginPassword.tsx
- ✅ ResetPayPassword.tsx

### CMS页面 (11个)
- ✅ AboutUs.tsx
- ✅ HelpCenter.tsx
- ✅ Home.tsx
- ✅ MessageCenter.tsx
- ✅ OnlineService.tsx
- ✅ PrivacyPolicy.tsx
- ✅ SignIn.tsx
- ✅ UserAgreement.tsx

### 用户页面 (8个)
- ✅ AccountDeletion.tsx
- ✅ AddressList.tsx
- ✅ AgentAuth.tsx
- ✅ Profile.tsx
- ✅ RealNameAuth.tsx
- ✅ Settings.tsx
- ✅ UserSurvey.tsx
- ✅ ActivityCenter.tsx

### 市场页面 (5个)
- ✅ ArtistShowcase.tsx
- ✅ Market.tsx
- ✅ MasterpieceShowcase.tsx
- ✅ TradingZone.tsx
- ✅ MatchingPoolPage.tsx
- ✅ Orders.tsx

### 钱包页面 (12个)
- ✅ AssetHistory.tsx
- ✅ BalanceRecharge.tsx
- ✅ BalanceWithdraw.tsx
- ✅ CardManagement.tsx
- ✅ ClaimDetail.tsx
- ✅ ClaimHistory.tsx
- ✅ ConsignmentVoucher.tsx
- ✅ CumulativeRights.tsx
- ✅ ExtensionWithdraw.tsx
- ✅ HashrateExchange.tsx
- ✅ MyCollectionDetail.tsx
- ✅ OrderFundDetail.tsx
- ✅ ServiceRecharge.tsx

## 待迁移的页面 (约 32个)

### 认证页面 (2个)
- Login.tsx (复杂：需要处理登录流程)
- Register.tsx (复杂：需要处理注册流程)

### CMS页面 (2个)
- AnnouncementDetail.tsx
- News.tsx

### 市场页面 (14个)
- ArtistDetail.tsx
- ArtistWorksShowcase.tsx
- Cashier.tsx
- CollectionOrderDetail.tsx
- OrderDetail.tsx
- OrderListPage.tsx
- PointsProductDetail.tsx
- ProductDetail.tsx
- ReservationPage.tsx
- ReservationRecordDetailPage.tsx
- ReservationRecordPage.tsx
- SearchPage.tsx

### 用户页面 (4个)
- EditProfile.tsx
- FriendDetail.tsx
- InviteFriends.tsx
- MyFriends.tsx

### 钱包页面 (10个)
- AssetView.tsx
- ClaimStation.tsx
- MoneyLogDetail.tsx
- MyCollection.tsx
- RechargeOrderDetail.tsx
- RechargeOrderList.tsx
- WithdrawOrderDetail.tsx
- WithdrawOrderList.tsx

## 迁移模式

所有已迁移页面遵循统一模式：

```tsx
// 1. 导入 Hook
import { usePageNavigation } from '../../src/hooks/usePageNavigation';

// 2. 使用 Hook
const Page: React.FC = () => {
  const { goBack, navigateTo, onLogout } = usePageNavigation();
  
  // 3. 使用方法替代 props
  // goBack() 替代 onBack()
  // navigateTo({ name: 'route-name' }) 替代 onNavigate({ name: 'route-name' })
  // onLogout() 替代 props.onLogout()
};
```

## 下一步工作

1. 继续迁移剩余的复杂页面
2. 特别关注认证页面 (Login, Register) 的迁移
3. 迁移完成后移除 Wrapper 层
4. 清理未使用的旧路由代码
