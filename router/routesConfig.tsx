import React, { useState, useEffect } from 'react';
import { type Route } from './routes';
import AnnouncementDetail from '../pages/cms/AnnouncementDetail';
import { LoadingSpinner } from '../components/common';
import { fetchAnnouncements } from '../services/api';
import { extractData } from '../utils/apiHelpers';
import ArtistDetail from '../pages/market/ArtistDetail';
import OrderListPage from '../pages/market/OrderListPage';
import OrderDetail from '../pages/market/OrderDetail';
import CollectionOrderDetail from '../pages/market/CollectionOrderDetail';
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
import OrderFundDetail from '../pages/wallet/OrderFundDetail';
import MoneyLogDetail from '../pages/wallet/MoneyLogDetail';
import ClaimHistory from '../pages/wallet/ClaimHistory';
import RechargeOrderDetail from '../pages/wallet/RechargeOrderDetail';
import RechargeOrderList from '../pages/wallet/RechargeOrderList';
import WithdrawOrderList from '../pages/wallet/WithdrawOrderList';
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
import SearchPage from '../pages/market/SearchPage';
import ReservationRecordDetailPage from '../pages/market/ReservationRecordDetailPage';
import ReservationRecordPage from '../pages/market/ReservationRecordPage';
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
  goBack: () => void;
}

type RouteRenderer = (route: Route, helpers: RouteHelpers) => React.ReactNode | null;

/**
 * 从 API 加载公告详情的组件
 * 用于处理 newsList 中不包含的公告（如从消息中心点击的情况）
 */
const AnnouncementDetailLoader: React.FC<{ id: string; onBack: () => void }> = ({ id, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [loadedNewsItem, setLoadedNewsItem] = useState<NewsItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 尝试从两种类型的公告中查找
        const [normalRes, importantRes] = await Promise.all([
          fetchAnnouncements({ page: 1, limit: 100, type: 'normal' }),
          fetchAnnouncements({ page: 1, limit: 100, type: 'important' }),
        ]);

        const normalData = extractData(normalRes) as any;
        const importantData = extractData(importantRes) as any;
        const normalList = normalData?.data || normalData?.list || [];
        const importantList = importantData?.data || importantData?.list || [];
        
        // 在所有公告中查找
        const allAnnouncements = [...normalList, ...importantList];
        const foundItem = allAnnouncements.find((item: any) => String(item.id) === id);
        
        if (foundItem) {
          // 读取已读状态
          const readIds: string[] = [];
          try {
            const stored = localStorage.getItem(STORAGE_KEYS.READ_NEWS_IDS_KEY);
            if (stored) {
              readIds.push(...JSON.parse(stored));
            }
          } catch {}
          
          const isRead = readIds.includes(String(foundItem.id));
          
          // 转换内容格式
          let content = foundItem.content || '';
          content = content
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/li>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n\n');
          content = content.replace(/<\/?[^>]+(>|$)/g, '');
          
          // 判断类型
          const newsType: 'announcement' | 'dynamic' = foundItem.type === 'important' ? 'dynamic' : 'announcement';
          
          setLoadedNewsItem({
            id: String(foundItem.id),
            date: foundItem.createtime || '',
            title: foundItem.title || '',
            isUnread: !isRead,
            type: newsType,
            content,
          });
        } else {
          setError('公告不存在');
        }
      } catch (err: any) {
        console.error('加载公告详情失败:', err);
        setError(err?.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="加载中..." />
      </div>
    );
  }

  if (error || !loadedNewsItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">{error || '公告不存在'}</div>
      </div>
    );
  }

  return <AnnouncementDetail newsItem={loadedNewsItem} onBack={onBack} />;
};

/**
 * 路由对应组件映射（仅包含参数化、易出错的路由，其他走原有分支）
 */
export const routeComponents: Partial<Record<Route['name'], RouteRenderer>> = {
  'news-detail': (route, helpers) => {
    const detailRoute = route as Extract<Route, { name: 'news-detail' }>;
    const newsItem = helpers.newsList.find((item) => item.id === detailRoute.id);
    
    // 如果找不到 newsItem，使用加载器组件从 API 加载
    // 这样可以处理从消息中心点击的情况（newsList 可能不包含该公告）
    if (!newsItem) {
      return (
        <AnnouncementDetailLoader
          id={detailRoute.id}
          onBack={() => {
            // 如果路由中有 back 字段，使用 goBack() 会自动使用它
            // 否则使用默认的 news 页面
            if (detailRoute.back !== undefined) {
              helpers.goBack();
            } else {
              helpers.navigateRoute({ name: 'news' });
            }
          }}
        />
      );
    }
    
    return (
      <AnnouncementDetail
        newsItem={newsItem}
        onBack={() => {
          // 如果路由中有 back 字段，使用 goBack() 会自动使用它
          // 否则使用默认的 news 页面
          if (detailRoute.back !== undefined) {
            helpers.goBack();
          } else {
            helpers.navigateRoute({ name: 'news' });
          }
        }}
      />
    );
  },
  'artist-detail': (route, helpers) => {
    const detailRoute = route as Extract<Route, { name: 'artist-detail' }>;
    if (!detailRoute.id) return null;
    return (
      <ArtistDetail
        artistId={detailRoute.id}
        onBack={() => helpers.goBack()}
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
      onBack={() => helpers.goBack()}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'order-detail': (route, helpers) => {
    const detailRoute = route as Extract<Route, { name: 'order-detail' }>;
    return (
      <OrderDetail
        orderId={detailRoute.orderId}
        onBack={() => {
          // 如果路由中有 back 字段，使用 goBack() 会自动使用它
          // 否则使用默认的订单列表页面
          if (detailRoute.back !== undefined) {
            helpers.goBack();
          } else {
            helpers.navigateRoute({ name: 'order-list', kind: 'product', status: 0 });
          }
        }}
        onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
      />
    );
  },
  'collection-order-detail': (route, helpers) => {
    const detailRoute = route as Extract<Route, { name: 'collection-order-detail' }>;
    return (
      <CollectionOrderDetail
        id={detailRoute.id}
        orderNo={detailRoute.orderNo}
        onBack={() => {
          if (detailRoute.back !== undefined) {
            helpers.goBack();
          } else {
            helpers.navigateRoute({ name: 'order-list', kind: 'product', status: 0 });
          }
        }}
      />
    );
  },
  cashier: (route, helpers) => (
    <Cashier
      orderId={(route as Extract<Route, { name: 'cashier' }>).orderId}
      onBack={() => helpers.goBack()}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'claim-detail': (route, helpers) => (
    <ClaimDetail
      id={(route as Extract<Route, { name: 'claim-detail' }>).id}
      onBack={() => helpers.goBack()}
    />
  ),
  settings: (_route, helpers) => (
    <Settings
      onBack={() => helpers.goBack()}
      onLogout={helpers.handleLogout}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'reset-login-password': (route, helpers) => (
    <ResetLoginPassword
      onBack={() => helpers.goBack()}
      onNavigateForgotPassword={() => helpers.navigateRoute({ name: 'forgot-password' })}
    />
  ),
  'reset-pay-password': (route, helpers) => (
    <ResetPayPassword
      onBack={() => helpers.goBack()}
      onNavigateForgotPassword={() => helpers.navigateRoute({ name: 'forgot-password' })}
    />
  ),
  'forgot-password': (_route, helpers) => (
    <ForgotPassword onBack={() => helpers.goBack()} />
  ),
  'notification-settings': (_route, helpers) => (
    <NotificationSettings onBack={() => helpers.goBack()} />
  ),
  'account-deletion': (_route, helpers) => (
    <AccountDeletion onBack={() => helpers.goBack()} />
  ),
  'edit-profile': (_route, helpers) => (
    <EditProfile onBack={() => helpers.goBack()} onLogout={helpers.handleLogout} />
  ),
  'card-management': (_route, helpers) => <CardManagement onBack={() => helpers.goBack()} />,
  'trading-zone': (_route, helpers) => (
    <TradingZone
      onBack={() => helpers.goBack()}
      onProductSelect={(product) => helpers.handleProductSelect(product, 'trading-zone')}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'trading-zone-items': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'trading-zone-items' }>;
    return (
      <TradingZone
        onBack={() => helpers.goBack()}
        onProductSelect={(product) => helpers.handleProductSelect(product, 'trading-zone')}
        onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
        initialSessionId={payload.sessionId}
        initialSessionTitle={payload.sessionTitle}
        initialSessionStartTime={payload.sessionStartTime}
        initialSessionEndTime={payload.sessionEndTime}
      />
    );
  },
  'artist-showcase': (_route, helpers) => (
    <ArtistShowcase
      onBack={() => helpers.goBack()}
      onArtistSelect={(id) => helpers.navigateRoute({ name: 'artist-detail', id })}
    />
  ),
  'masterpiece-showcase': (_route, helpers) => (
    <ArtistWorksShowcase
      onBack={() => helpers.goBack()}
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
      onBack={() => helpers.goBack()}
    />
  ),
  'invite-friends': (_route, helpers) => <InviteFriends onBack={() => helpers.goBack()} />,
  'my-collection': (_route, helpers) => (
    <MyCollection
      onBack={() => helpers.goBack()}
      onItemSelect={(item) => {
        helpers.setSelectedCollectionItem(item);
        helpers.navigateRoute({ name: 'my-collection-detail', id: String(item.id) });
      }}
    />
  ),
  'my-collection-detail': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'my-collection-detail' }>;
    return (
      <MyCollectionDetail
        item={helpers.selectedCollectionItem}
        onBack={() => helpers.navigateRoute({ name: 'my-collection' })}
        onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
        onSetSelectedItem={(item) => helpers.setSelectedCollectionItem(item)}
      />
    );
  },
  'my-collection-consignment': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'my-collection-consignment' }>;
    return (
      <MyCollection
        onBack={() => helpers.goBack()}
        onItemSelect={() => {
          // Do nothing - modal should handle item interaction
          // Navigating here causes infinite loop
        }}
        initialConsignItemId={payload.id}
        preSelectedItem={helpers.selectedCollectionItem}
      />
    );
  },
  'address-list': (_route, helpers) => <AddressList onBack={() => helpers.goBack()} />,
  'real-name-auth': (_route, helpers) => <RealNameAuth onBack={() => helpers.goBack()} />,
  'my-friends': (_route, helpers) => (
    <MyFriends onBack={() => helpers.goBack()} onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)} />
  ),
  'agent-auth': (_route, helpers) => <AgentAuth onBack={() => helpers.goBack()} />,
  'help-center': (_route, helpers) => <HelpCenter onBack={() => helpers.goBack()} />,
  'user-agreement': (_route, helpers) => {
    return <UserAgreement onBack={() => helpers.goBack()} />;
  },
  'user-survey': (_route, helpers) => <UserSurvey onBack={() => helpers.goBack()} />,
  'online-service': (_route, helpers) => <OnlineService onBack={() => helpers.goBack()} />,
  'search': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'search' }>;
    return <SearchPage onBack={() => helpers.goBack()} onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)} initialCode={payload.code} />;
  },
  'reservation-detail': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'reservation-detail' }>;
    if (!payload.id) return null;
    return (
      <ReservationRecordDetailPage
        reservationId={payload.id}
        onBack={() => helpers.goBack()}
        onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
      />
    );
  },
  'reservation-record': (route, helpers) => (
    <ReservationRecordPage
      onBack={() => helpers.goBack()}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'about-us': (route, helpers) => (
    <AboutUs onBack={() => helpers.goBack()} />
  ),
  'privacy-policy': (route, helpers) => (
    <PrivacyPolicy onBack={() => helpers.goBack()} />
  ),
  'asset-view': (route, helpers) => (
    <AssetView
      initialTab={(route as Extract<Route, { name: 'asset-view' }>).tab ?? 0}
      onBack={() => helpers.goBack()}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
      onProductSelect={(product) => helpers.handleProductSelect(product, 'market')}
    />
  ),
  'asset-history': (_route, helpers) => <AssetHistory onBack={() => helpers.goBack()} />,
  'balance-recharge': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'balance-recharge' }>;
    const back: Route | null =
      payload.source === 'reservation'
        ? { name: 'reservation' }
        : payload.source === 'profile'
          ? null
          : { name: 'asset-view' };
    return <BalanceRecharge onBack={() => helpers.goBack()} initialAmount={payload.amount} />;
  },
  'balance-withdraw': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'balance-withdraw' }>;
    const back: Route | null = payload.source === 'profile' 
      ? null 
      : payload.source === 'sign-in'
        ? { name: 'sign-in' }
        : { name: 'asset-view' };
    return <BalanceWithdraw onBack={() => helpers.goBack()} onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)} />;
  },
  'service-recharge': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'service-recharge' }>;
    const back: Route | null = payload.source === 'profile' ? null : { name: 'asset-view' };
    return <ServiceRecharge onBack={() => helpers.goBack()} />;
  },
  'extension-withdraw': (_route, helpers) => <ExtensionWithdraw onBack={() => helpers.goBack()} />,
  'hashrate-exchange': (route, helpers) => {
    const payload = route as Extract<Route, { name: 'hashrate-exchange' }>;
    const back: Route | null =
      payload.source === 'reservation'
        ? { name: 'reservation' }
        : payload.source === 'profile'
          ? null
          : { name: 'asset-view' };
    return <HashrateExchange onBack={() => helpers.goBack()} onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)} />;
  },
  'consignment-voucher': (_route, helpers) => <ConsignmentVoucher onBack={() => helpers.goBack()} />,
  'cumulative-rights': (_route, helpers) => <CumulativeRights onBack={() => helpers.goBack()} onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)} />,
  'order-fund-detail': (_route, helpers) => <OrderFundDetail onBack={() => helpers.goBack()} />,
  'money-log-detail': (route, helpers) => {
    const detailRoute = route as Extract<Route, { name: 'money-log-detail' }>;
    return (
      <MoneyLogDetail
        id={detailRoute.id}
        flowNo={detailRoute.flowNo}
        onBack={() => helpers.goBack()}
      />
    );
  },
  'claim-history': (_route, helpers) => (
    <ClaimHistory
      onBack={() => helpers.goBack()}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'sign-in': (_route, helpers) => <SignIn onBack={() => helpers.goBack()} onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)} />,
  'recharge-order-detail': (route, helpers) => (
    <RechargeOrderDetail
      orderId={(route as Extract<Route, { name: 'recharge-order-detail' }>).orderId}
      onBack={() => helpers.goBack()}
    />
  ),
  'recharge-order-list': (_route, helpers) => (
    <RechargeOrderList
      onBack={() => helpers.goBack()}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'withdraw-order-list': (_route, helpers) => (
    <WithdrawOrderList
      onBack={() => helpers.goBack()}
      onNavigate={(nextRoute) => helpers.navigateRoute(nextRoute)}
    />
  ),
  'message-center': (_route, helpers) => (
    <MessageCenter
      onBack={() => helpers.goBack()}
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

