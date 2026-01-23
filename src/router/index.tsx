/**
 * React Router 路由配置
 * 使用懒加载优化首屏加载性能
 * 所有页面使用包装器以保持与现有代码的兼容性
 */
import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { LoadingSpinner } from '../../components/common';
import { MainLayout, AuthLayout } from '../layouts';

// ========================================
// 懒加载页面组件（全部使用包装器）
// ========================================

// 主 Tab 页面
const HomeEntry = lazy(() => import('../pages/HomeEntryWrapper'));
const MarketEntry = lazy(() => import('../pages/MarketEntryWrapper'));
const RightsEntry = lazy(() => import('../pages/RightsEntryWrapper'));
const ProfileEntry = lazy(() => import('../pages/ProfileEntryWrapper'));
const LivePage = lazy(() => import('../pages/live/LivePageWrapper'));

// 认证页面
const Login = lazy(() => import('../pages/auth/LoginWrapper'));
const Register = lazy(() => import('../pages/auth/RegisterWrapper'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPasswordWrapper'));
const ResetLoginPassword = lazy(() => import('../pages/auth/ResetLoginPasswordWrapper'));
const ResetPayPassword = lazy(() => import('../pages/auth/ResetPayPasswordWrapper'));

// 用户页面
const Settings = lazy(() => import('../pages/user/SettingsWrapper'));
const EditProfile = lazy(() => import('../pages/user/EditProfileWrapper'));
const AddressList = lazy(() => import('../pages/user/AddressListWrapper'));
const RealNameAuth = lazy(() => import('../pages/user/RealNameAuthWrapper'));
const AgentAuth = lazy(() => import('../pages/user/AgentAuthWrapper'));
const MyFriends = lazy(() => import('../pages/user/MyFriendsWrapper'));
const FriendDetail = lazy(() => import('../pages/user/FriendDetailWrapper'));
const InviteFriends = lazy(() => import('../pages/user/InviteFriendsWrapper'));
const AccountDeletion = lazy(() => import('../pages/user/AccountDeletionWrapper'));
const NotificationSettings = lazy(() => import('../pages/user/NotificationSettingsWrapper'));
const UserSurvey = lazy(() => import('../pages/user/UserSurveyWrapper'));
const ActivityCenter = lazy(() => import('../pages/user/ActivityCenterWrapper'));

// CMS/内容页面
const News = lazy(() => import('../pages/cms/NewsWrapper'));
const AnnouncementDetail = lazy(() => import('../pages/cms/AnnouncementDetailWrapper'));
const MessageCenter = lazy(() => import('../pages/cms/MessageCenterWrapper'));
const SignIn = lazy(() => import('../pages/cms/SignInWrapper'));
const HelpCenter = lazy(() => import('../pages/cms/HelpCenterWrapper'));
const OnlineService = lazy(() => import('../pages/cms/OnlineServiceWrapper'));
const AboutUs = lazy(() => import('../pages/cms/AboutUsWrapper'));
const PrivacyPolicy = lazy(() => import('../pages/cms/PrivacyPolicyWrapper'));
const UserAgreement = lazy(() => import('../pages/cms/UserAgreementWrapper'));

// 市场/交易页面
const ProductDetail = lazy(() => import('../pages/market/ProductDetailWrapper'));
const TradingZone = lazy(() => import('../pages/market/TradingZoneWrapper'));
const MasterpieceShowcase = lazy(() => import('../pages/market/MasterpieceShowcaseWrapper'));
const ReservationPage = lazy(() => import('../pages/market/ReservationPageWrapper'));
const ReservationRecordPage = lazy(() => import('../pages/market/ReservationRecordPageWrapper'));
const ReservationRecordDetailPage = lazy(() => import('../pages/market/ReservationRecordDetailPageWrapper'));
const SearchPage = lazy(() => import('../pages/market/SearchPageWrapper'));
const ReviewsPage = lazy(() => import('../pages/market/ReviewsPageWrapper'));
const SubmitReview = lazy(() => import('../pages/market/SubmitReviewWrapper'));
const OrderListPage = lazy(() => import('../pages/market/OrderListPageWrapper'));
const OrderDetail = lazy(() => import('../pages/market/OrderDetailWrapper'));
const CollectionOrderDetail = lazy(() => import('../pages/market/CollectionOrderDetailWrapper'));
const Cashier = lazy(() => import('../pages/market/CashierWrapper'));

// 钱包/资产页面
const AssetView = lazy(() => import('../pages/wallet/AssetViewWrapper'));
const AssetHistory = lazy(() => import('../pages/wallet/AssetHistoryWrapper'));
const BalanceRecharge = lazy(() => import('../pages/wallet/BalanceRechargeWrapper'));
const BalanceWithdraw = lazy(() => import('../pages/wallet/BalanceWithdrawWrapper'));
const RechargeOrderDetail = lazy(() => import('../pages/wallet/RechargeOrderDetailWrapper'));
const WithdrawOrderDetail = lazy(() => import('../pages/wallet/WithdrawOrderDetailWrapper'));
const ServiceRecharge = lazy(() => import('../pages/wallet/ServiceRechargeWrapper'));
const ExtensionWithdraw = lazy(() => import('../pages/wallet/ExtensionWithdrawWrapper'));
const CardManagement = lazy(() => import('../pages/wallet/CardManagementWrapper'));
const ConsignmentVoucher = lazy(() => import('../pages/wallet/ConsignmentVoucherWrapper'));
const CumulativeRights = lazy(() => import('../pages/wallet/CumulativeRightsWrapper'));
const MyCollection = lazy(() => import('../pages/wallet/MyCollectionWrapper'));
const MyCollectionDetail = lazy(() => import('../pages/wallet/MyCollectionDetailWrapper'));
const ClaimHistory = lazy(() => import('../pages/wallet/ClaimHistoryWrapper'));
const ClaimDetail = lazy(() => import('../pages/wallet/ClaimDetailWrapper'));
const HashrateExchange = lazy(() => import('../pages/wallet/HashrateExchangeWrapper'));
const MoneyLogDetail = lazy(() => import('../pages/wallet/MoneyLogDetailWrapper'));
const OrderFundDetail = lazy(() => import('../pages/wallet/OrderFundDetailWrapper'));
const RechargeOrderList = lazy(() => import('../pages/wallet/RechargeOrderListWrapper'));
const WithdrawOrderList = lazy(() => import('../pages/wallet/WithdrawOrderListWrapper'));

// ========================================
// 懒加载包装组件
// ========================================

const LazyComponent: React.FC<{ component: React.LazyExoticComponent<any>; props?: any }> = ({
  component: Component,
  props = {},
}) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    }
  >
    <Component {...props} />
  </Suspense>
);

// ========================================
// 路由配置
// ========================================

const routes: RouteObject[] = [
  // 认证相关路由（无底部导航）
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LazyComponent component={Login} />,
      },
      {
        path: '/register',
        element: <LazyComponent component={Register} />,
      },
      {
        path: '/forgot-password',
        element: <LazyComponent component={ForgotPassword} />,
      },
    ],
  },
  // 主应用路由（带底部导航）
  {
    element: <MainLayout />,
    children: [
      // 主 Tab 页面
      {
        path: '/',
        element: <LazyComponent component={HomeEntry} />,
      },
      {
        path: '/home',
        element: <Navigate to="/" replace />,
      },
      {
        path: '/market',
        element: <LazyComponent component={MarketEntry} />,
      },
      {
        path: '/rights',
        element: <LazyComponent component={RightsEntry} />,
      },
      {
        path: '/live',
        element: <LazyComponent component={LivePage} />,
      },
      {
        path: '/profile',
        element: <LazyComponent component={ProfileEntry} />,
      },
      // 用户相关子页面
      {
        path: '/settings',
        element: <LazyComponent component={Settings} />,
      },
      {
        path: '/edit-profile',
        element: <LazyComponent component={EditProfile} />,
      },
      {
        path: '/address-list',
        element: <LazyComponent component={AddressList} />,
      },
      {
        path: '/real-name-auth',
        element: <LazyComponent component={RealNameAuth} />,
      },
      {
        path: '/agent-auth',
        element: <LazyComponent component={AgentAuth} />,
      },
      {
        path: '/my-friends',
        element: <LazyComponent component={MyFriends} />,
      },
      {
        path: '/friend-detail/:id',
        element: <LazyComponent component={FriendDetail} />,
      },
      {
        path: '/invite-friends',
        element: <LazyComponent component={InviteFriends} />,
      },
      {
        path: '/account-deletion',
        element: <LazyComponent component={AccountDeletion} />,
      },
      {
        path: '/notification-settings',
        element: <LazyComponent component={NotificationSettings} />,
      },
      {
        path: '/user-survey',
        element: <LazyComponent component={UserSurvey} />,
      },
      {
        path: '/activity-center',
        element: <LazyComponent component={ActivityCenter} />,
      },
      {
        path: '/reset-login-password',
        element: <LazyComponent component={ResetLoginPassword} />,
      },
      {
        path: '/reset-pay-password',
        element: <LazyComponent component={ResetPayPassword} />,
      },
      // CMS/内容页面
      {
        path: '/news',
        element: <LazyComponent component={News} />,
      },
      {
        path: '/news/:id',
        element: <LazyComponent component={AnnouncementDetail} />,
      },
      {
        path: '/message-center',
        element: <LazyComponent component={MessageCenter} />,
      },
      {
        path: '/sign-in',
        element: <LazyComponent component={SignIn} />,
      },
      {
        path: '/help-center',
        element: <LazyComponent component={HelpCenter} />,
      },
      {
        path: '/online-service',
        element: <LazyComponent component={OnlineService} />,
      },
      {
        path: '/about-us',
        element: <LazyComponent component={AboutUs} />,
      },
      {
        path: '/privacy-policy',
        element: <LazyComponent component={PrivacyPolicy} />,
      },
      {
        path: '/user-agreement',
        element: <LazyComponent component={UserAgreement} />,
      },
      // 市场/交易页面
      {
        path: '/product/:id',
        element: <LazyComponent component={ProductDetail} />,
      },
      {
        path: '/trading-zone',
        element: <LazyComponent component={TradingZone} />,
      },
      {
        path: '/masterpiece-showcase',
        element: <LazyComponent component={MasterpieceShowcase} />,
      },
      {
        path: '/reservation',
        element: <LazyComponent component={ReservationPage} />,
      },
      {
        path: '/reservation-record',
        element: <LazyComponent component={ReservationRecordPage} />,
      },
      {
        path: '/reservation-record/:id',
        element: <LazyComponent component={ReservationRecordDetailPage} />,
      },
      {
        path: '/reviews/:productId',
        element: <LazyComponent component={ReviewsPage} />,
      },
      {
        path: '/submit-review',
        element: <LazyComponent component={SubmitReview} />,
      },
      {
        path: '/search',
        element: <LazyComponent component={SearchPage} />,
      },
      {
        path: '/orders/:category/:status',
        element: <LazyComponent component={OrderListPage} />,
      },
      {
        path: '/order/:orderId',
        element: <LazyComponent component={OrderDetail} />,
      },
      {
        path: '/collection-order',
        element: <LazyComponent component={CollectionOrderDetail} />,
      },
      {
        path: '/collection-order/:id',
        element: <LazyComponent component={CollectionOrderDetail} />,
      },
      {
        path: '/cashier/:orderId',
        element: <LazyComponent component={Cashier} />,
      },
      // 钱包/资产页面
      {
        path: '/asset-view',
        element: <LazyComponent component={AssetView} />,
      },
      {
        path: '/asset-history/:type',
        element: <LazyComponent component={AssetHistory} />,
      },
      {
        path: '/balance-recharge',
        element: <LazyComponent component={BalanceRecharge} />,
      },
      {
        path: '/balance-withdraw',
        element: <LazyComponent component={BalanceWithdraw} />,
      },
      {
        path: '/recharge-order/:orderId',
        element: <LazyComponent component={RechargeOrderDetail} />,
      },
      {
        path: '/withdraw-order/:orderId',
        element: <LazyComponent component={WithdrawOrderDetail} />,
      },
      {
        path: '/service-recharge',
        element: <LazyComponent component={ServiceRecharge} />,
      },
      {
        path: '/extension-withdraw',
        element: <LazyComponent component={ExtensionWithdraw} />,
      },
      {
        path: '/card-management',
        element: <LazyComponent component={CardManagement} />,
      },
      {
        path: '/consignment-voucher',
        element: <LazyComponent component={ConsignmentVoucher} />,
      },
      {
        path: '/cumulative-rights',
        element: <LazyComponent component={CumulativeRights} />,
      },
      {
        path: '/my-collection',
        element: <LazyComponent component={MyCollection} />,
      },
      {
        path: '/my-collection/:id',
        element: <LazyComponent component={MyCollectionDetail} />,
      },
      {
        path: '/claim-history',
        element: <LazyComponent component={ClaimHistory} />,
      },
      {
        path: '/claim-detail/:id',
        element: <LazyComponent component={ClaimDetail} />,
      },
      {
        path: '/hashrate-exchange',
        element: <LazyComponent component={HashrateExchange} />,
      },
      {
        path: '/money-log/:id',
        element: <LazyComponent component={MoneyLogDetail} />,
      },
      {
        path: '/order-fund-detail',
        element: <LazyComponent component={OrderFundDetail} />,
      },
      {
        path: '/order-fund/:id',
        element: <LazyComponent component={OrderFundDetail} />,
      },
      {
        path: '/recharge-orders',
        element: <LazyComponent component={RechargeOrderList} />,
      },
      {
        path: '/withdraw-orders',
        element: <LazyComponent component={WithdrawOrderList} />,
      },
    ],
  },
  // 404 重定向
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export const router = createBrowserRouter(routes);

export default router;
