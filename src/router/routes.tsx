import type { ComponentType, LazyExoticComponent } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { MainLayout, AuthLayout } from '../layouts';
import LazyComponent from './LazyComponent';
import * as pages from './lazy-pages';

type LazyPage = LazyExoticComponent<ComponentType<any>>;

const lazyRoute = (path: string, component: LazyPage): RouteObject => ({
  path,
  element: <LazyComponent component={component} />,
});

const authRoutes: RouteObject[] = [
  lazyRoute('/login', pages.Login),
  lazyRoute('/register', pages.Register),
  lazyRoute('/forgot-password', pages.ForgotPassword),
];

const mainTabRoutes: RouteObject[] = [
  lazyRoute('/', pages.HomeEntry),
  lazyRoute('/market', pages.MarketEntry),
  lazyRoute('/rights', pages.RightsEntry),
  lazyRoute('/live', pages.LivePage),
  lazyRoute('/profile', pages.ProfileEntry),
];

const userRoutes: RouteObject[] = [
  lazyRoute('/settings', pages.Settings),
  lazyRoute('/edit-profile', pages.EditProfile),
  lazyRoute('/address-list', pages.AddressList),
  lazyRoute('/real-name-auth', pages.RealNameAuth),
  lazyRoute('/agent-auth', pages.AgentAuth),
  lazyRoute('/my-friends', pages.MyFriends),
  lazyRoute('/friend-detail/:id', pages.FriendDetail),
  lazyRoute('/invite-friends', pages.InviteFriends),
  lazyRoute('/account-deletion', pages.AccountDeletion),
  lazyRoute('/notification-settings', pages.NotificationSettings),
  lazyRoute('/user-survey', pages.UserSurvey),
  lazyRoute('/activity-center', pages.ActivityCenter),
  lazyRoute('/reset-login-password', pages.ResetLoginPassword),
  lazyRoute('/reset-pay-password', pages.ResetPayPassword),
  lazyRoute('/activity/team-leaderboard', pages.TeamLeaderboard),
];

const cmsRoutes: RouteObject[] = [
  lazyRoute('/news', pages.News),
  lazyRoute('/news/:id', pages.AnnouncementDetail),
  lazyRoute('/message-center', pages.MessageCenter),
  lazyRoute('/sign-in', pages.SignIn),
  lazyRoute('/help-center', pages.HelpCenter),
  lazyRoute('/online-service', pages.OnlineService),
  lazyRoute('/about-us', pages.AboutUs),
  lazyRoute('/privacy-policy', pages.PrivacyPolicy),
  lazyRoute('/user-agreement', pages.UserAgreement),
];

const marketRoutes: RouteObject[] = [
  lazyRoute('/product/:id', pages.ProductDetail),
  lazyRoute('/trading-zone', pages.TradingZone),
  lazyRoute('/masterpiece-showcase', pages.MasterpieceShowcase),
  lazyRoute('/reservation', pages.ReservationPage),
  lazyRoute('/reservation-record', pages.ReservationRecordPage),
  lazyRoute('/reservation-record/:id', pages.ReservationRecordDetailPage),
  lazyRoute('/reviews/:productId', pages.ReviewsPage),
  lazyRoute('/submit-review', pages.SubmitReview),
  lazyRoute('/search', pages.SearchPage),
  lazyRoute('/orders/:category/:status', pages.OrderListPage),
  lazyRoute('/order/:orderId', pages.OrderDetail),
  lazyRoute('/collection-order', pages.CollectionOrderDetail),
  lazyRoute('/collection-order/:id', pages.CollectionOrderDetail),
  lazyRoute('/cashier/:orderId', pages.Cashier),
];

const walletRoutes: RouteObject[] = [
  lazyRoute('/asset-view', pages.AssetView),
  lazyRoute('/asset-history/:type', pages.AssetHistory),
  lazyRoute('/balance-recharge', pages.BalanceRecharge),
  lazyRoute('/balance-withdraw', pages.BalanceWithdraw),
  lazyRoute('/recharge-order/:orderId', pages.RechargeOrderDetail),
  lazyRoute('/withdraw-order/:orderId', pages.WithdrawOrderDetail),
  lazyRoute('/service-recharge', pages.ServiceRecharge),
  lazyRoute('/extension-withdraw', pages.ExtensionWithdraw),
  lazyRoute('/card-management', pages.CardManagement),
  lazyRoute('/consignment-voucher', pages.ConsignmentVoucher),
  lazyRoute('/cumulative-rights', pages.CumulativeRights),
  lazyRoute('/my-collection', pages.MyCollection),
  lazyRoute('/my-collection/:id', pages.MyCollectionDetail),
  lazyRoute('/claim-history', pages.ClaimHistory),
  lazyRoute('/claim-detail/:id', pages.ClaimDetail),
  lazyRoute('/hashrate-exchange', pages.HashrateExchange),
  lazyRoute('/money-log/:id', pages.MoneyLogDetail),
  lazyRoute('/order-fund-detail', pages.OrderFundDetail),
  lazyRoute('/order-fund/:id', pages.OrderFundDetail),
  lazyRoute('/recharge-orders', pages.RechargeOrderList),
  lazyRoute('/withdraw-orders', pages.WithdrawOrderList),
];

const mainLayoutRoutes: RouteObject[] = [
  ...mainTabRoutes,
  {
    path: '/home',
    element: <Navigate to="/" replace />,
  },
  ...userRoutes,
  ...cmsRoutes,
  ...marketRoutes,
  ...walletRoutes,
];

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: authRoutes,
  },
  {
    element: <MainLayout />,
    children: mainLayoutRoutes,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export default routes;
