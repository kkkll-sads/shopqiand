/**
 * @file 路由配置
 * @description 使用 createHashRouter 创建路由配置。
 *   - 5 个 Tab 页同步导入（首屏加载）
 *   - 其余页面使用 React.lazy 懒加载（代码分割）
 *   - 所有路由均为 AppLayout 的子路由
 */

import React, { lazy, Suspense } from 'react';
import { Navigate, createHashRouter, useLocation, useParams, useRouteError } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LEGACY_APP_PATH_TO_ROUTE } from '../lib/navigation';

// ========== 首屏 Tab 页 - 同步导入 ==========
import { HomePage } from '../pages/Home';
import { StorePage } from '../pages/Store';
import { RightsPage } from '../pages/Rights';
import { OrderPage } from '../pages/Order';
import { UserPage } from '../pages/User';

// ========== 非首屏页面 - 懒加载 ==========
const ProductDetailPage = lazy(() => import('../pages/ProductDetail').then(m => ({ default: m.ProductDetailPage })));
const CategoryPage = lazy(() => import('../pages/Category').then(m => ({ default: m.CategoryPage })));
const SearchPage = lazy(() => import('../pages/Search').then(m => ({ default: m.SearchPage })));
const SearchResultPage = lazy(() => import('../pages/SearchResult').then(m => ({ default: m.SearchResultPage })));
const CartPage = lazy(() => import('../pages/Cart').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('../pages/Checkout').then(m => ({ default: m.CheckoutPage })));
const CashierPage = lazy(() => import('../pages/Cashier').then(m => ({ default: m.CashierPage })));
const PaymentResultPage = lazy(() => import('../pages/PaymentResult').then(m => ({ default: m.PaymentResultPage })));
const OrderDetailPage = lazy(() => import('../pages/OrderDetail').then(m => ({ default: m.OrderDetailPage })));
const LogisticsPage = lazy(() => import('../pages/Logistics').then(m => ({ default: m.LogisticsPage })));
const AfterSalesPage = lazy(() => import('../pages/AfterSales').then(m => ({ default: m.AfterSalesPage })));
const AfterSalesApplyPage = lazy(() => import('../pages/AfterSalesApply/index').then(m => ({ default: m.AfterSalesApplyPage })));
const CouponPage = lazy(() => import('../pages/Coupon').then(m => ({ default: m.CouponPage })));
const ActivityCenterPage = lazy(() => import('../pages/ActivityCenter').then(m => ({ default: m.ActivityCenterPage })));
const QuestionnairePage = lazy(() => import('../pages/Questionnaire').then(m => ({ default: m.QuestionnairePage })));
const ConsignmentCouponPage = lazy(() => import('../pages/ConsignmentCoupon').then(m => ({ default: m.ConsignmentCouponPage })));
const AddressPage = lazy(() => import('../pages/Address').then(m => ({ default: m.AddressPage })));
const PaymentAccountsPage = lazy(() => import('../pages/PaymentAccounts').then(m => ({ default: m.PaymentAccountsPage })));
const FavoritesPage = lazy(() => import('../pages/Favorites').then(m => ({ default: m.FavoritesPage })));
const MessageCenterPage = lazy(() => import('../pages/MessageCenter').then(m => ({ default: m.MessageCenterPage })));
const MessageDetailPage = lazy(() => import('../pages/MessageDetail').then(m => ({ default: m.MessageDetailPage })));
const AnnouncementPage = lazy(() => import('../pages/Announcement').then(m => ({ default: m.AnnouncementPage })));
const AnnouncementDetailPage = lazy(() => import('../pages/AnnouncementDetail').then(m => ({ default: m.AnnouncementDetailPage })));
const HelpCenterPage = lazy(() => import('../pages/HelpCenter').then(m => ({ default: m.HelpCenterPage })));
const SettingsPage = lazy(() => import('../pages/Settings').then(m => ({ default: m.SettingsPage })));
const EditProfilePage = lazy(() => import('../pages/EditProfile').then(m => ({ default: m.EditProfilePage })));
const AboutUsPage = lazy(() => import('../pages/AboutUs').then(m => ({ default: m.AboutUsPage })));
const SecurityPage = lazy(() => import('../pages/Security').then(m => ({ default: m.SecurityPage })));
const AgentAuthPage = lazy(() => import('../pages/AgentAuth').then(m => ({ default: m.AgentAuthPage })));
const ChangePasswordPage = lazy(() => import('../pages/ChangePassword').then(m => ({ default: m.ChangePasswordPage })));
const ChangePayPasswordPage = lazy(() => import('../pages/ChangePayPassword').then(m => ({ default: m.ChangePayPasswordPage })));
const ResetPasswordBySmsPage = lazy(() => import('../pages/ResetPasswordBySms').then(m => ({ default: m.ResetPasswordBySmsPage })));
const ResetPayPasswordBySmsPage = lazy(() => import('../pages/ResetPayPasswordBySms').then(m => ({ default: m.ResetPayPasswordBySmsPage })));
const BillingPage = lazy(() => import('../pages/Billing').then(m => ({ default: m.BillingPage })));
const MyCardPacksPage = lazy(() => import('../pages/MyCardPacks').then(m => ({ default: m.MyCardPacksPage })));
const RealNameAuthPage = lazy(() => import('../pages/RealNameAuth').then(m => ({ default: m.RealNameAuthPage })));
const InvitePage = lazy(() => import('../pages/Invite').then(m => ({ default: m.InvitePage })));
const FriendsPage = lazy(() => import('../pages/Friends').then(m => ({ default: m.FriendsPage })));
const TradingZonePage = lazy(() => import('../pages/TradingZone').then(m => ({ default: m.TradingZonePage })));
const TradingDetailPage = lazy(() => import('../pages/TradingDetail').then(m => ({ default: m.TradingDetailPage })));
const PreOrderPage = lazy(() => import('../pages/PreOrder').then(m => ({ default: m.PreOrderPage })));
const ReservationsPage = lazy(() => import('../pages/Reservations').then(m => ({ default: m.ReservationsPage })));
const ReservationDetailPage = lazy(() => import('../pages/ReservationDetail').then(m => ({ default: m.ReservationDetailPage })));
const FlashSalePage = lazy(() => import('../pages/FlashSale').then(m => ({ default: m.FlashSalePage })));
const RightsHistoryPage = lazy(() => import('../pages/RightsHistory').then(m => ({ default: m.RightsHistoryPage })));
const AccumulatedRightsPage = lazy(() => import('../pages/AccumulatedRights').then(m => ({ default: m.AccumulatedRightsPage })));
const GrowthRightsPage = lazy(() => import('../pages/GrowthRights/Page').then(m => ({ default: m.GrowthRightsPage })));
const MyCollectionPage = lazy(() => import('../pages/MyCollection').then(m => ({ default: m.MyCollectionPage })));
const RechargePage = lazy(() => import('../pages/Recharge').then(m => ({ default: m.RechargePage })));
const ServiceFeeRechargePage = lazy(() => import('../pages/ServiceFeeRecharge').then(m => ({ default: m.ServiceFeeRechargePage })));
const TransferPage = lazy(() => import('../pages/Transfer').then(m => ({ default: m.TransferPage })));
const RightsTransferPage = lazy(() => import('../pages/RightsTransfer').then(m => ({ default: m.RightsTransferPage })));
const WithdrawPage = lazy(() => import('../pages/Withdraw').then(m => ({ default: m.WithdrawPage })));
const MatchingPage = lazy(() => import('../pages/Matching').then(m => ({ default: m.MatchingPage })));
const ItemDetailPage = lazy(() => import('../pages/ItemDetail').then(m => ({ default: m.ItemDetailPage })));
const LivePage = lazy(() => import('../pages/Live').then(m => ({ default: m.LivePage })));
const LiveWebViewPage = lazy(() => import('../pages/LiveWebView').then(m => ({ default: m.LiveWebViewPage })));
const ServiceDescriptionPage = lazy(() => import('../pages/ServiceDescription').then(m => ({ default: m.ServiceDescriptionPage })));
const ReviewsPage = lazy(() => import('../pages/Reviews').then(m => ({ default: m.ReviewsPage })));
const AddReviewPage = lazy(() => import('../pages/AddReview'));
const ProductQAPage = lazy(() => import('../pages/ProductQA').then(m => ({ default: m.ProductQAPage })));
const LoginPage = lazy(() => import('../pages/Login').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/Register').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPassword').then(m => ({ default: m.ForgotPasswordPage })));
const CommonPage = lazy(() => import('../pages/CommonPage').then(m => ({ default: m.CommonPage })));
const DesignSystemPage = lazy(() => import('../pages/DesignSystem').then(m => ({ default: m.DesignSystemPage })));
const SignInPage = lazy(() => import('../pages/SignIn').then(m => ({ default: m.SignInPage })));
const HashrateExchangePage = lazy(() => import('../pages/HashrateExchange').then(m => ({ default: m.HashrateExchangePage })));
const NotFoundPage = lazy(() => import('../pages/NotFound').then(m => ({ default: m.NotFoundPage })));

/**
 * 页面加载过渡动画 - Suspense fallback
 */
const PageFallback = () => (
  <div className="flex-1 flex items-center justify-center bg-bg-base">
    <div className="animate-spin w-8 h-8 border-2 border-primary-start border-t-transparent rounded-full" />
  </div>
);

/**
 * 懒加载包装组件
 */
const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageFallback />}>{children}</Suspense>
);

const LegacyTradingItemRedirect = () => {
  const { packageId, sessionId } = useParams();
  const targetPath = packageId
    ? `/trading/detail/${sessionId || 0}/items/${packageId}`
    : `/trading/detail/${sessionId || 0}`;

  return <Navigate replace to={targetPath} />;
};

const LegacyPathRedirect = ({ to }: { to: string }) => {
  const location = useLocation();

  return <Navigate replace to={`${to}${location.search}`} />;
};

const legacyAppPathRoutes = Object.entries(LEGACY_APP_PATH_TO_ROUTE).map(([path, to]) => ({
  path: path.replace(/^\/+/, ''),
  element: <LegacyPathRedirect to={to} />,
}));

/**
 * 根错误边界组件，专用于捕获类似“重新构建后分包文件丢失”或 React 内部抛错
 */
const RootErrorBoundary = () => {
  const error = useRouteError() as Error;

  // 如果判断是资源加载失败（Chunk Load Error 或网络问题）
  const isChunkLoadFailed = error?.message && 
    (error.message.includes('Failed to fetch dynamically imported module') || 
     error.message.includes('Importing a module script failed'));

  if (isChunkLoadFailed) {
    // 按需进行强制自动重新刷新（利用 sessionStorage 防止无限重刷）
    const reloadKey = 'app_reload_count';
    const reloadCount = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
    
    if (reloadCount < 2) {
      sessionStorage.setItem(reloadKey, String(reloadCount + 1));
      window.location.reload();
      return <PageFallback />;
    }
  }

  // 其他错误渲染一个 500 / 全局错误页面提示
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-bg-base relative overflow-hidden h-full min-h-screen text-center p-6">
      <div className="text-red-500/20 mb-6">
        <svg className="w-32 h-32 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-text-main mb-3">糟糕，出了点问题</h2>
      <p className="text-text-sub text-base mb-2">系统发生了一个意外错误，或许是正在发布新版本。</p>
      <p className="text-xs text-text-aux mb-8 break-all max-w-full hidden md:block">{error?.message}</p>
      
      <button
        onClick={() => {
          sessionStorage.removeItem('app_reload_count');
          window.location.href = '/';
        }}
        className="px-8 py-3 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white font-medium shadow-sm active:opacity-80"
      >
        刷新页面并返回首页
      </button>
    </div>
  );
};

/**
 * 应用路由配置
 * 使用 createHashRouter（Hash 模式），因为项目部署为纯静态文件，
 * Hash 路由不需要服务端配置。
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
      // ========== 底部 Tab 页（同步加载） ==========
      { index: true, element: <HomePage /> },
      { path: 'store', element: <StorePage /> },
      { path: 'shield', element: <RightsPage /> },
      { path: 'order', element: <OrderPage /> },
      { path: 'user', element: <UserPage /> },

      // ========== 旧版路径兼容 ========== 
      ...legacyAppPathRoutes,

      // ========== 商品相关 ==========
      { path: 'product/:id', element: <Lazy><ProductDetailPage /></Lazy> },
      { path: 'product/:id/qa', element: <Lazy><ProductQAPage /></Lazy> },
      { path: 'product/:id/reviews', element: <Lazy><ReviewsPage /></Lazy> },
      { path: 'product/:id/review/new', element: <Lazy><AddReviewPage /></Lazy> },
      { path: 'order/:orderId/review', element: <Lazy><AddReviewPage /></Lazy> },
      { path: 'category', element: <Lazy><CategoryPage /></Lazy> },
      { path: 'search', element: <Lazy><SearchPage /></Lazy> },
      { path: 'search/result', element: <Lazy><SearchResultPage /></Lazy> },
      { path: 'service-description', element: <Lazy><ServiceDescriptionPage /></Lazy> },

      // ========== 购物流程 ==========
      { path: 'cart', element: <Lazy><CartPage /></Lazy> },
      { path: 'checkout', element: <Lazy><CheckoutPage /></Lazy> },
      { path: 'cashier', element: <Lazy><CashierPage /></Lazy> },
      { path: 'payment/result', element: <Lazy><PaymentResultPage /></Lazy> },

      // ========== 订单相关 ==========
      { path: 'order/detail/:id', element: <Lazy><OrderDetailPage /></Lazy> },
      { path: 'logistics/:id', element: <Lazy><LogisticsPage /></Lazy> },
      { path: 'after-sales', element: <Lazy><AfterSalesPage /></Lazy> },
      { path: 'after-sales/apply/:orderId', element: <Lazy><AfterSalesApplyPage /></Lazy> },

      // ========== 交易区 ==========
      { path: 'trading', element: <Lazy><TradingZonePage /></Lazy> },
      { path: 'trading/detail/:id', element: <Lazy><TradingDetailPage /></Lazy> },
      { path: 'trading/detail/:sessionId/items/:packageId', element: <Lazy><ItemDetailPage /></Lazy> },
      { path: 'item-detail/:sessionId/:packageId', element: <Lazy><ItemDetailPage /></Lazy> },
      { path: 'legacy/trading/detail/:sessionId/items/:packageId', element: <LegacyTradingItemRedirect /> },
      { path: 'trading/pre-order/:id', element: <Lazy><PreOrderPage /></Lazy> },
      { path: 'reservations', element: <Lazy><ReservationsPage /></Lazy> },
      { path: 'reservation_detail/:id', element: <Lazy><ReservationDetailPage /></Lazy> },
      { path: 'flash-sale', element: <Lazy><FlashSalePage /></Lazy> },

      // ========== 用户资产 ==========
      { path: 'coupon', element: <Lazy><CouponPage /></Lazy> },
      { path: 'activity-center', element: <Lazy><ActivityCenterPage /></Lazy> },
      { path: 'questionnaire', element: <Lazy><QuestionnairePage /></Lazy> },
      { path: 'consignment-voucher', element: <Lazy><ConsignmentCouponPage /></Lazy> },
      { path: 'billing', element: <Lazy><BillingPage /></Lazy> },
      { path: 'my-collection', element: <Lazy><MyCollectionPage /></Lazy> },
      { path: 'my-card-packs', element: <Lazy><MyCardPacksPage /></Lazy> },
      { path: 'accumulated-rights', element: <Lazy><AccumulatedRightsPage /></Lazy> },
      { path: 'growth_rights', element: <Lazy><GrowthRightsPage /></Lazy> },
      { path: 'growth-rights', element: <Lazy><GrowthRightsPage /></Lazy> },
      { path: 'recharge', element: <Lazy><RechargePage /></Lazy> },
      { path: 'service-recharge', element: <Lazy><ServiceFeeRechargePage /></Lazy> },
      { path: 'transfer', element: <Lazy><TransferPage /></Lazy> },
      { path: 'withdraw', element: <Lazy><WithdrawPage /></Lazy> },
      { path: 'rights/history', element: <Lazy><RightsHistoryPage /></Lazy> },
      { path: 'rights/transfer', element: <Lazy><RightsTransferPage /></Lazy> },
      { path: 'rights_transfer', element: <Lazy><RightsTransferPage /></Lazy> },
      { path: 'hashrate-exchange', element: <Lazy><HashrateExchangePage /></Lazy> },

      // ========== 用户中心 ==========
      { path: 'address', element: <Lazy><AddressPage /></Lazy> },
      { path: 'payment-accounts', element: <Lazy><PaymentAccountsPage /></Lazy> },
      { path: 'favorites', element: <Lazy><FavoritesPage /></Lazy> },
      { path: 'messages', element: <Lazy><MessageCenterPage /></Lazy> },
      { path: 'messages/detail/:messageKey', element: <Lazy><MessageDetailPage /></Lazy> },
      { path: 'friends', element: <Lazy><FriendsPage /></Lazy> },
      { path: 'invite', element: <Lazy><InvitePage /></Lazy> },
      { path: 'settings', element: <Lazy><SettingsPage /></Lazy> },
      { path: 'edit-profile', element: <Lazy><EditProfilePage /></Lazy> },
      { path: 'security', element: <Lazy><SecurityPage /></Lazy> },
      { path: 'auth/real-name', element: <Lazy><RealNameAuthPage /></Lazy> },
      { path: 'agent-auth', element: <Lazy><AgentAuthPage /></Lazy> },
      { path: 'real_name_auth', element: <Lazy><RealNameAuthPage /></Lazy> },

      // ========== 签到 ==========
      { path: 'sign-in', element: <Lazy><SignInPage /></Lazy> },

      // ========== 信息页面 ==========
      { path: 'announcement', element: <Lazy><AnnouncementPage /></Lazy> },
      { path: 'announcement/:id', element: <Lazy><AnnouncementDetailPage /></Lazy> },
      { path: 'news/:id', element: <Lazy><AnnouncementDetailPage /></Lazy> },
      { path: 'help', element: <Lazy><HelpCenterPage /></Lazy> },
      { path: 'help_center', element: <Lazy><HelpCenterPage /></Lazy> },
      { path: 'about', element: <Lazy><AboutUsPage /></Lazy> },

      // ========== 直播 ==========
      { path: 'live', element: <Lazy><LivePage /></Lazy> },
      { path: 'live/view', element: <Lazy><LiveWebViewPage /></Lazy> },
      { path: 'matching', element: <Lazy><MatchingPage /></Lazy> },

      // ========== 认证与登录 ==========
      { path: 'login', element: <Lazy><LoginPage /></Lazy> },
      { path: 'register', element: <Lazy><RegisterPage /></Lazy> },
      { path: 'forgot-password', element: <Lazy><ForgotPasswordPage /></Lazy> },
      { path: 'change-password', element: <Lazy><ChangePasswordPage /></Lazy> },
      { path: 'change-pay-password', element: <Lazy><ChangePayPasswordPage /></Lazy> },
      { path: 'reset-password', element: <Lazy><ResetPasswordBySmsPage /></Lazy> },
      { path: 'reset-pay-password', element: <Lazy><ResetPayPasswordBySmsPage /></Lazy> },
      { path: 'user_agreement', element: <Lazy><CommonPage pageType="user_agreement" /></Lazy> },
      { path: 'privacy_policy', element: <Lazy><CommonPage pageType="privacy_policy" /></Lazy> },

      // ========== 开发工具 ==========
      { path: 'design', element: <Lazy><DesignSystemPage /></Lazy> },

      // ========== 404 兜底 ==========
      { path: '*', element: <Lazy><NotFoundPage /></Lazy> },
    ],
  },
], {
  /* 启用 React Router v7 future flags，消除控制台迁移警告 */
  future: {
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_relativeSplatPath: true,
    v7_skipActionErrorRevalidation: true,
  },
});





