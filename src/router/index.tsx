/**
 * @file 路由配置
 * @description 使用 createHashRouter 创建路由配置。
 *   - 5 个 Tab 页同步导入（首屏加载）
 *   - 其余页面使用 React.lazy 懒加载（代码分割）
 *   - 所有路由均为 AppLayout 的子路由
 */

import React, { lazy, Suspense } from 'react';
import { createHashRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';

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
const CouponPage = lazy(() => import('../pages/Coupon').then(m => ({ default: m.CouponPage })));
const AddressPage = lazy(() => import('../pages/Address').then(m => ({ default: m.AddressPage })));
const FavoritesPage = lazy(() => import('../pages/Favorites').then(m => ({ default: m.FavoritesPage })));
const MessageCenterPage = lazy(() => import('../pages/MessageCenter').then(m => ({ default: m.MessageCenterPage })));
const AnnouncementPage = lazy(() => import('../pages/Announcement').then(m => ({ default: m.AnnouncementPage })));
const HelpCenterPage = lazy(() => import('../pages/HelpCenter').then(m => ({ default: m.HelpCenterPage })));
const SettingsPage = lazy(() => import('../pages/Settings').then(m => ({ default: m.SettingsPage })));
const AboutUsPage = lazy(() => import('../pages/AboutUs').then(m => ({ default: m.AboutUsPage })));
const SecurityPage = lazy(() => import('../pages/Security').then(m => ({ default: m.SecurityPage })));
const BillingPage = lazy(() => import('../pages/Billing').then(m => ({ default: m.BillingPage })));
const RealNameAuthPage = lazy(() => import('../pages/RealNameAuth').then(m => ({ default: m.RealNameAuthPage })));
const InvitePage = lazy(() => import('../pages/Invite').then(m => ({ default: m.InvitePage })));
const FriendsPage = lazy(() => import('../pages/Friends').then(m => ({ default: m.FriendsPage })));
const TradingZonePage = lazy(() => import('../pages/TradingZone').then(m => ({ default: m.TradingZonePage })));
const TradingDetailPage = lazy(() => import('../pages/TradingDetail').then(m => ({ default: m.TradingDetailPage })));
const PreOrderPage = lazy(() => import('../pages/PreOrder').then(m => ({ default: m.PreOrderPage })));
const RightsHistoryPage = lazy(() => import('../pages/RightsHistory').then(m => ({ default: m.RightsHistoryPage })));
const RechargePage = lazy(() => import('../pages/Recharge').then(m => ({ default: m.RechargePage })));
const TransferPage = lazy(() => import('../pages/Transfer').then(m => ({ default: m.TransferPage })));
const RightsTransferPage = lazy(() => import('../pages/RightsTransfer').then(m => ({ default: m.RightsTransferPage })));
const WithdrawPage = lazy(() => import('../pages/Withdraw').then(m => ({ default: m.WithdrawPage })));
const LivePage = lazy(() => import('../pages/Live').then(m => ({ default: m.LivePage })));
const LiveWebViewPage = lazy(() => import('../pages/LiveWebView').then(m => ({ default: m.LiveWebViewPage })));
const ServiceDescriptionPage = lazy(() => import('../pages/ServiceDescription').then(m => ({ default: m.ServiceDescriptionPage })));
const ReviewsPage = lazy(() => import('../pages/Reviews').then(m => ({ default: m.ReviewsPage })));
const AddReviewPage = lazy(() => import('../pages/AddReview'));
const ProductQAPage = lazy(() => import('../pages/ProductQA').then(m => ({ default: m.ProductQAPage })));
const LoginPage = lazy(() => import('../pages/Login').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/Register').then(m => ({ default: m.RegisterPage })));
const DesignSystemPage = lazy(() => import('../pages/DesignSystem').then(m => ({ default: m.DesignSystemPage })));

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

/**
 * 应用路由配置
 * 使用 createHashRouter（Hash 模式），因为项目部署为纯静态文件，
 * Hash 路由不需要服务端配置。
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // ========== 底部 Tab 页（同步加载） ==========
      { index: true, element: <HomePage /> },
      { path: 'store', element: <StorePage /> },
      { path: 'shield', element: <RightsPage /> },
      { path: 'order', element: <OrderPage /> },
      { path: 'user', element: <UserPage /> },

      // ========== 商品相关 ==========
      { path: 'product/:id', element: <Lazy><ProductDetailPage /></Lazy> },
      { path: 'product/:id/qa', element: <Lazy><ProductQAPage /></Lazy> },
      { path: 'product/:id/reviews', element: <Lazy><ReviewsPage /></Lazy> },
      { path: 'product/:id/review/new', element: <Lazy><AddReviewPage /></Lazy> },
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

      // ========== 交易区 ==========
      { path: 'trading', element: <Lazy><TradingZonePage /></Lazy> },
      { path: 'trading/detail/:id', element: <Lazy><TradingDetailPage /></Lazy> },
      { path: 'trading/pre-order/:id', element: <Lazy><PreOrderPage /></Lazy> },

      // ========== 用户资产 ==========
      { path: 'coupon', element: <Lazy><CouponPage /></Lazy> },
      { path: 'billing', element: <Lazy><BillingPage /></Lazy> },
      { path: 'recharge', element: <Lazy><RechargePage /></Lazy> },
      { path: 'transfer', element: <Lazy><TransferPage /></Lazy> },
      { path: 'withdraw', element: <Lazy><WithdrawPage /></Lazy> },
      { path: 'rights/history', element: <Lazy><RightsHistoryPage /></Lazy> },
      { path: 'rights/transfer', element: <Lazy><RightsTransferPage /></Lazy> },

      // ========== 用户中心 ==========
      { path: 'address', element: <Lazy><AddressPage /></Lazy> },
      { path: 'favorites', element: <Lazy><FavoritesPage /></Lazy> },
      { path: 'messages', element: <Lazy><MessageCenterPage /></Lazy> },
      { path: 'friends', element: <Lazy><FriendsPage /></Lazy> },
      { path: 'invite', element: <Lazy><InvitePage /></Lazy> },
      { path: 'settings', element: <Lazy><SettingsPage /></Lazy> },
      { path: 'security', element: <Lazy><SecurityPage /></Lazy> },
      { path: 'auth/real-name', element: <Lazy><RealNameAuthPage /></Lazy> },

      // ========== 信息页面 ==========
      { path: 'announcement', element: <Lazy><AnnouncementPage /></Lazy> },
      { path: 'help', element: <Lazy><HelpCenterPage /></Lazy> },
      { path: 'about', element: <Lazy><AboutUsPage /></Lazy> },

      // ========== 直播 ==========
      { path: 'live', element: <Lazy><LivePage /></Lazy> },
      { path: 'live/view', element: <Lazy><LiveWebViewPage /></Lazy> },

      // ========== 认证与登录 ==========
      { path: 'login', element: <Lazy><LoginPage /></Lazy> },
      { path: 'register', element: <Lazy><RegisterPage /></Lazy> },

      // ========== 开发工具 ==========
      { path: 'design', element: <Lazy><DesignSystemPage /></Lazy> },
    ],
  },
]);
