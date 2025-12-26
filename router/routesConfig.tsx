import React from 'react';
import { type Route } from './routes';
import AnnouncementDetail from '../pages/cms/AnnouncementDetail';
import ArtistDetail from '../pages/market/ArtistDetail';
import OrderListPage from '../pages/market/OrderListPage';
import OrderDetail from '../pages/market/OrderDetail';
import Cashier from '../pages/market/Cashier';
import ClaimDetail from '../pages/wallet/ClaimDetail';
import Settings from '../pages/user/Settings';
import ResetLoginPassword from '../pages/auth/ResetLoginPassword';
import ResetPayPassword from '../pages/auth/ResetPayPassword';
import ForgotPassword from '../pages/auth/ForgotPassword';
import NotificationSettings from '../pages/user/NotificationSettings';
import AccountDeletion from '../pages/user/AccountDeletion';
import EditProfile from '../pages/user/EditProfile';
import CardManagement from '../pages/wallet/CardManagement';
import TradingZone from '../pages/market/TradingZone';
import AboutUs from '../pages/cms/AboutUs';
import PrivacyPolicy from '../pages/cms/PrivacyPolicy';
import ArtistShowcase from '../pages/market/ArtistShowcase';
import ArtistWorksShowcase from '../pages/market/ArtistWorksShowcase';
import AssetView from '../pages/wallet/AssetView';
import AssetHistory from '../pages/wallet/AssetHistory';
import BalanceRecharge from '../pages/wallet/BalanceRecharge';
import BalanceWithdraw from '../pages/wallet/BalanceWithdraw';
import ServiceRecharge from '../pages/wallet/ServiceRecharge';
import ExtensionWithdraw from '../pages/wallet/ExtensionWithdraw';
import HashrateExchange from '../pages/wallet/HashrateExchange';
import ConsignmentVoucher from '../pages/wallet/ConsignmentVoucher';
import CumulativeRights from '../pages/wallet/CumulativeRights';
import ClaimHistory from '../pages/wallet/ClaimHistory';
import SignIn from '../pages/cms/SignIn';
import MessageCenter from '../pages/cms/MessageCenter';
import News from '../pages/cms/News';
import InviteFriends from '../pages/user/InviteFriends';
import MyCollection from '../pages/wallet/MyCollection';
import MyCollectionDetail from '../pages/wallet/MyCollectionDetail';
import AddressList from '../pages/user/AddressList';
import RealNameAuth from '../pages/user/RealNameAuth';
import MyFriends from '../pages/user/MyFriends';
import AgentAuth from '../pages/user/AgentAuth';
import HelpCenter from '../pages/cms/HelpCenter';
import UserAgreement from '../pages/cms/UserAgreement';
import UserSurvey from '../pages/user/UserSurvey';
import OnlineService from '../pages/cms/OnlineService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { writeStorage } from '../utils/storageAccess';
import { type NewsItem, type Product } from '../types';
import { type MyCollectionItem } from '../services/api';

/**
 * RouteHelpers - 提供路由渲染所需的上下文
 * 说明：保持轻量，只传递必要的回调与状态
 */
export interface RouteHelpers {
  newsList: NewsItem[];
  navigateRoute: (route: Route | null) => void;
  handleProductSelect: (product: Product, origin?: 'market' | 'artist' | 'trading-zone' | 'reservation-record') => void;
  setProductDetailOrigin: (origin: 'market' | 'artist' | 'trading-zone' | 'reservation-record') => void;
  productDetailOrigin: 'market' | 'artist' | 'trading-zone' | 'reservation-record';
  handleLogout: () => void;
  selectedCollectionItem: MyCollectionItem | null;
  setSelectedCollectionItem: (item: MyCollectionItem | null) => void;
  markAllNewsRead: () => void;
}

type RouteRenderer = (route: Route, helpers: RouteHelpers) => React.ReactNode | null;

/**
 * 路由对应组件映射（仅包含参数化、易出错的路由，其他走原有分支）
 */
export const routeComponents: Partial<Record<Route['name'], RouteRenderer>> = {
  'news-detail': (route, helpers) => {
    const detailRoute = route as Extract<Route, { name: 'news-detail' }>;
    const newsItem = helpers.newsList.find((item) => item.id === detailRoute.id);
    if (!newsItem) return null;
    return (
      <AnnouncementDetail
        newsItem={newsItem}
        onBack={() => helpers.navigateRoute(null)}
      />
    );
  },
  'artist-detail': (route, helpers) => {
    const detailRoute = route as Extract<Route, { name: 'artist-detail' }>;
    if (!detailRoute.id) return null;
    return (
      <ArtistDetail
        artistId={detailRoute.id}
        onBack={() => helpers.navigateRoute(null)}
        onProductSelect={(product) => {
          helpers.setProductDetailOrigin('artist');
          helpers.handleProductSelect(product, 'artist');
        }}
      />
    );
  },
  'order-list': (route, helpers) => (
    <OrderListPage
      category={(route as Extract<Route, { name: 'order-list' }>).kind}
      initialTab={(route as Extract<Route, { name: 'order-list' }>).status}
      onBack={() => helpers.navigateRoute(null)}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'order-detail': (route, helpers) => (
    <OrderDetail
      orderId={(route as Extract<Route, { name: 'order-detail' }>).orderId}
      onBack={() => helpers.navigateRoute((route as Extract<Route, { name: 'order-detail' }>).back ?? { name: 'order-list', kind: 'points', status: 0 })}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  cashier: (route, helpers) => (
    <Cashier
      orderId={(route as Extract<Route, { name: 'cashier' }>).orderId}
      onBack={() => helpers.navigateRoute((route as Extract<Route, { name: 'cashier' }>).back ?? null)}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'claim-detail': (route, helpers) => (
    <ClaimDetail
      id={(route as Extract<Route, { name: 'claim-detail' }>).id}
      onBack={() => helpers.navigateRoute({ name: 'claim-history' } as Route)}
    />
  ),
  settings: (_route, helpers) => (
    <Settings
      onBack={() => helpers.navigateRoute(null)}
      onLogout={helpers.handleLogout}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'reset-login-password': (route, helpers) => (
    <ResetLoginPassword
      onBack={() => helpers.navigateRoute((route as any).from ? { name: 'settings' } : null)}
      onNavigateForgotPassword={() => helpers.navigateRoute({ name: 'forgot-password' })}
    />
  ),
  'reset-pay-password': (route, helpers) => (
    <ResetPayPassword
      onBack={() => helpers.navigateRoute((route as any).from ? { name: 'settings' } : null)}
      onNavigateForgotPassword={() => helpers.navigateRoute({ name: 'forgot-password' })}
    />
  ),
  'forgot-password': (_route, helpers) => (
    <ForgotPassword onBack={() => helpers.navigateRoute({ name: 'settings' })} />
  ),
  'notification-settings': (_route, helpers) => (
    <NotificationSettings onBack={() => helpers.navigateRoute({ name: 'settings' })} />
  ),
  'account-deletion': (_route, helpers) => (
    <AccountDeletion onBack={() => helpers.navigateRoute({ name: 'settings' })} />
  ),
  'edit-profile': (_route, helpers) => (
    <EditProfile onBack={() => helpers.navigateRoute({ name: 'settings' })} onLogout={helpers.handleLogout} />
  ),
  'card-management': (_route, helpers) => <CardManagement onBack={() => helpers.navigateRoute(null)} />,
  'trading-zone': (_route, helpers) => (
    <TradingZone
      onBack={() => helpers.navigateRoute(null)}
      onProductSelect={(product) => helpers.handleProductSelect(product, 'trading-zone')}
    />
  ),
  'artist-showcase': (_route, helpers) => (
    <ArtistShowcase
      onBack={() => helpers.navigateRoute(null)}
      onArtistSelect={(id) => helpers.navigateRoute({ name: 'artist-detail', id })}
    />
  ),
  'masterpiece-showcase': (_route, helpers) => (
    <ArtistWorksShowcase
      onBack={() => helpers.navigateRoute(null)}
      onNavigateToArtist={(artistId) => helpers.navigateRoute({ name: 'artist-detail', id: artistId })}
    />
  ),
  news: (_route, helpers) => (
    <News
      newsList={helpers.newsList}
      onNavigate={(id) => {
        const newsItem = helpers.newsList.find((item) => item.id === id);
        if (newsItem) {
          const targetTab = newsItem.type === 'announcement' ? 'announcement' : 'dynamics';
          writeStorage(STORAGE_KEYS.NEWS_ACTIVE_TAB_KEY, targetTab);
        }
        helpers.navigateRoute({ name: 'news-detail', id });
      }}
      onMarkAllRead={() => helpers.markAllNewsRead()}
      onBack={() => helpers.navigateRoute(null)}
    />
  ),
  'invite-friends': (_route, helpers) => <InviteFriends onBack={() => helpers.navigateRoute({ name: 'my-friends' })} />,
  'my-collection': (_route, helpers) => (
    <MyCollection
      onBack={() => helpers.navigateRoute(null)}
      onItemSelect={(item) => {
        helpers.setSelectedCollectionItem(item);
        helpers.navigateRoute({ name: 'my-collection-detail', id: String(item.id) });
      }}
    />
  ),
  'my-collection-detail': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'my-collection-detail' }>;
    if (!helpers.selectedCollectionItem || String(helpers.selectedCollectionItem.id) !== payload.id) {
      return null;
    }
    return (
      <MyCollectionDetail
        item={helpers.selectedCollectionItem}
        onBack={() => helpers.navigateRoute({ name: 'my-collection' })}
        onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
      />
    );
  },
  'my-collection-consignment': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'my-collection-consignment' }>;
    return (
      <MyCollection
        onBack={() => helpers.navigateRoute(null)}
        onItemSelect={(item) => {
          helpers.setSelectedCollectionItem(item);
          helpers.navigateRoute({ name: 'my-collection-detail', id: String(item.id) });
        }}
        initialConsignItemId={payload.id}
      />
    );
  },
  'address-list': (_route, helpers) => <AddressList onBack={() => helpers.navigateRoute(null)} />,
  'real-name-auth': (_route, helpers) => <RealNameAuth onBack={() => helpers.navigateRoute(null)} />,
  'my-friends': (_route, helpers) => (
    <MyFriends onBack={() => helpers.navigateRoute(null)} onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)} />
  ),
  'agent-auth': (_route, helpers) => <AgentAuth onBack={() => helpers.navigateRoute(null)} />,
  'help-center': (_route, helpers) => <HelpCenter onBack={() => helpers.navigateRoute(null)} />,
  'user-agreement': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'user-agreement' }>;
    const back = payload.from === 'profile' ? { name: 'my-friends' as const } : null;
    return <UserAgreement onBack={() => helpers.navigateRoute(back)} />;
  },
  'user-survey': (_route, helpers) => <UserSurvey onBack={() => helpers.navigateRoute(null)} />,
  'online-service': (_route, helpers) => <OnlineService onBack={() => helpers.navigateRoute(null)} />,
  'about-us': (route, helpers) => (
    <AboutUs onBack={() => helpers.navigateRoute((route as any).from === 'home' ? null : { name: 'settings' })} />
  ),
  'privacy-policy': (route, helpers) => (
    <PrivacyPolicy onBack={() => helpers.navigateRoute((route as any).from ? { name: 'settings' } : null)} />
  ),
  'asset-view': (route, helpers) => (
    <AssetView
      initialTab={(route as Extract<Route, { name: 'asset-view' }>).tab ?? 0}
      onBack={() => helpers.navigateRoute(null)}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
      onProductSelect={(product) => helpers.handleProductSelect(product, 'market')}
    />
  ),
  'asset-history': (_route, helpers) => <AssetHistory onBack={() => helpers.navigateRoute({ name: 'asset-view' } as Route)} />,
  'balance-recharge': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'balance-recharge' }>;
    const back: Route | null =
      payload.source === 'reservation'
        ? { name: 'reservation' }
        : payload.source === 'profile'
          ? null
          : { name: 'asset-view' };
    return <BalanceRecharge onBack={() => helpers.navigateRoute(back)} initialAmount={payload.amount} />;
  },
  'balance-withdraw': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'balance-withdraw' }>;
    const back: Route | null = payload.source === 'profile' ? null : { name: 'asset-view' };
    return <BalanceWithdraw onBack={() => helpers.navigateRoute(back)} onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)} />;
  },
  'service-recharge': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'service-recharge' }>;
    const back: Route | null = payload.source === 'profile' ? null : { name: 'asset-view' };
    return <ServiceRecharge onBack={() => helpers.navigateRoute(back)} />;
  },
  'extension-withdraw': (_route, helpers) => <ExtensionWithdraw onBack={() => helpers.navigateRoute({ name: 'asset-view' } as Route)} />,
  'hashrate-exchange': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'hashrate-exchange' }>;
    const back: Route | null =
      payload.source === 'reservation'
        ? { name: 'reservation' }
        : payload.source === 'profile'
          ? null
          : { name: 'asset-view' };
    return <HashrateExchange onBack={() => helpers.navigateRoute(back)} onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)} />;
  },
  'consignment-voucher': (_route, helpers) => <ConsignmentVoucher onBack={() => helpers.navigateRoute(null)} />,
  'cumulative-rights': (_route, helpers) => <CumulativeRights onBack={() => helpers.navigateRoute(null)} />,
  'claim-history': (_route, helpers) => (
    <ClaimHistory
      onBack={() => helpers.navigateRoute(null)}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'sign-in': (_route, helpers) => <SignIn onBack={() => helpers.navigateRoute(null)} onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)} />,
  'message-center': (_route, helpers) => (
    <MessageCenter
      onBack={() => helpers.navigateRoute(null)}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
};

/**
 * 根据 Route 解析对应组件，未匹配返回 null（由调用方决定后备渲染）
 */
export const resolveRouteComponent = (route: Route, helpers: RouteHelpers) => {
  const renderer = routeComponents[route.name];
  if (!renderer) return null;
  return renderer(route as any, helpers);
};

