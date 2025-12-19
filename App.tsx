import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import { Tab, Product, NewsItem, LoginSuccessPayload } from './types';
import { fetchAnnouncements, AnnouncementItem, fetchProfile, fetchRealNameStatus, MyCollectionItem } from './services/api';
import { AUTH_KEY, AUTH_TOKEN_KEY, USER_INFO_KEY, STORAGE_KEYS } from './constants/storageKeys';
import useAuth from './hooks/useAuth';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetLoginPassword from './pages/auth/ResetLoginPassword';
import ResetPayPassword from './pages/auth/ResetPayPassword';

// User pages
import Profile from './pages/user/Profile';
import EditProfile from './pages/user/EditProfile';
import AddressList from './pages/user/AddressList';
import RealNameAuth from './pages/user/RealNameAuth';
import Settings from './pages/user/Settings';
import AgentAuth from './pages/user/AgentAuth';
import MyFriends from './pages/user/MyFriends';
import InviteFriends from './pages/user/InviteFriends';
import AccountDeletion from './pages/user/AccountDeletion';
import UserSurvey from './pages/user/UserSurvey';
import NotificationSettings from './pages/user/NotificationSettings';

// CMS / Static pages
import Home from './pages/cms/Home';
import SignIn from './pages/cms/SignIn';
import News from './pages/cms/News';
import MessageCenter from './pages/cms/MessageCenter';
import OnlineService from './pages/cms/OnlineService';
import HelpCenter from './pages/cms/HelpCenter';
import AnnouncementDetail from './pages/cms/AnnouncementDetail';
import AboutUs from './pages/cms/AboutUs';
import PrivacyPolicy from './pages/cms/PrivacyPolicy';
import UserAgreement from './pages/cms/UserAgreement';

// Market pages
import Market from './pages/market/Market';
import ProductDetail from './pages/market/ProductDetail';
import OrderListPage from './pages/market/OrderListPage';
import Orders from './pages/market/Orders';
import TradingZone from './pages/market/TradingZone';
import ArtistShowcase from './pages/market/ArtistShowcase';
import ArtistDetail from './pages/market/ArtistDetail';
import ArtistWorksShowcase from './pages/market/ArtistWorksShowcase';
import MasterpieceShowcase from './pages/market/MasterpieceShowcase';
import ReservationPage from './pages/market/ReservationPage';
import ReservationRecordPage from './pages/market/ReservationRecordPage';
import PointsProductDetail from './pages/market/PointsProductDetail';
import Cashier from './pages/market/Cashier';
import OrderDetail from './pages/market/OrderDetail';

// Wallet pages
import AssetView from './pages/wallet/AssetView';
import AssetHistory from './pages/wallet/AssetHistory';
import BalanceRecharge from './pages/wallet/BalanceRecharge';
import BalanceWithdraw from './pages/wallet/BalanceWithdraw';
import CardManagement from './pages/wallet/CardManagement';
import ServiceRecharge from './pages/wallet/ServiceRecharge';
import ExtensionWithdraw from './pages/wallet/ExtensionWithdraw';
import ConsignmentVoucher from './pages/wallet/ConsignmentVoucher';
import CumulativeRights from './pages/wallet/CumulativeRights';
import MyCollection from './pages/wallet/MyCollection';
import MyCollectionDetail from './pages/wallet/MyCollectionDetail';
import ClaimStation from './pages/wallet/ClaimStation';
import ClaimHistory from './pages/wallet/ClaimHistory';
import ClaimDetail from './pages/wallet/ClaimDetail';
import HashrateExchange from './pages/wallet/HashrateExchange';
import { RealNameRequiredModal } from './components/common';
import { NotificationProvider } from './context/NotificationContext';
import { GlobalNotificationSystem } from './components/common/GlobalNotificationSystem';
import './styles/notifications.css';

const getReadNewsIds = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.READ_NEWS_IDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveReadNewsIds = (ids: string[]) => {
  localStorage.setItem(STORAGE_KEYS.READ_NEWS_IDS_KEY, JSON.stringify(ids));
};

const AppContent: React.FC = () => {
  // Auth State (using useAuth hook)
  const { isLoggedIn: isLoggedInFromHook, isRealNameVerified, login: loginFromHook, updateRealNameStatus, refreshRealNameStatus } = useAuth();

  // For backward compatibility, maintain local state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });

  // Modal state for real-name verification prompt
  const [showRealNameModal, setShowRealNameModal] = useState<boolean>(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCollectionItem, setSelectedCollectionItem] = useState<MyCollectionItem | null>(null);
  const [productDetailOrigin, setProductDetailOrigin] = useState<'market' | 'artist' | 'trading-zone'>('market');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [checkingRealName, setCheckingRealName] = useState(false);
  const [subPage, setSubPage] = useState<string | null>(null);
  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  // 待导航页面（用于登录/实名后自动跳转）
  const [pendingPage, setPendingPage] = useState<{ tab?: Tab; subPage?: string } | null>(null);

  // 刷新实名认证状态当页面切换时
  useEffect(() => {
    // 当用户已登录且切换tab或subPage时，刷新实名认证状态
    if (isLoggedIn) {
      refreshRealNameStatus();
    }
  }, [activeTab, subPage, isLoggedIn, refreshRealNameStatus]);

  // 将公告接口返回的数据转换为前端使用的 NewsItem 结构
  const mapAnnouncementToNewsItem = (item: AnnouncementItem, readIds: string[], newsType: 'announcement' | 'dynamic'): NewsItem => {
    const id = String(item.id);
    const isRead = readIds.includes(id);

    // 简单将 HTML 内容转换为纯文本并保留段落换行
    let content = item.content || '';
    // 将常见块级标签转换为换行
    content = content
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n');
    // 去掉其余 HTML 标签
    content = content.replace(/<\/?[^>]+(>|$)/g, '');

    return {
      id,
      date: item.createtime || '',
      title: item.title || '',
      isUnread: !isRead,
      type: newsType,
      content,
    };
  };

  // 应用启动时验证登录状态
  useEffect(() => {
    const verifyLoginStatus = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const authFlag = localStorage.getItem(AUTH_KEY);

      // 如果本地存储显示已登录，验证token是否有效
      if (authFlag === 'true' && token) {
        try {
          // 尝试获取用户信息来验证token是否有效
          const response = await fetchProfile(token);
          if (response.code === 1 && response.data?.userInfo) {
            // Token有效，更新用户信息
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.userInfo));
            setIsLoggedIn(true);
            loginFromHook({ token, userInfo: response.data.userInfo });
            console.log('登录状态验证成功');
          } else {
            // Token无效，清除登录状态
            console.warn('Token无效，清除登录状态');
            handleLogout();
          }
        } catch (error: any) {
          // 如果是need login错误（code 303），已经在networking.ts中处理了跳转
          console.error('验证登录状态失败:', error);
          // 只有在非303错误时才清除登录状态
          if (error.code !== 303 && !error.needLogin) {
            handleLogout();
          }
        }
      } else if (authFlag === 'true' && !token) {
        // 有登录标记但没有token，清除状态
        console.warn('登录标记存在但缺少token，清除登录状态');
        handleLogout();
      }
    };

    verifyLoginStatus();
  }, []); // 只在组件挂载时执行一次

  // 首次加载时从接口获取平台公告和平台动态列表
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const readIds = getReadNewsIds();

        // 同时请求平台公告（normal）和平台动态（important）
        const [announcementRes, dynamicRes] = await Promise.all([
          fetchAnnouncements({ page: 1, limit: 10, type: 'normal' }),
          fetchAnnouncements({ page: 1, limit: 10, type: 'important' }),
        ]);

        const announcementList = announcementRes.data?.list ?? [];
        const dynamicList = dynamicRes.data?.list ?? [];

        // 合并两种类型的数据
        const allMapped = [
          ...announcementList.map((item) => mapAnnouncementToNewsItem(item, readIds, 'announcement')),
          ...dynamicList.map((item) => mapAnnouncementToNewsItem(item, readIds, 'dynamic')),
        ];

        setNewsList(allMapped);
      } catch (error) {
        console.error('加载资讯失败:', error);
      }
    };

    loadAnnouncements();
  }, []);

  const handleLogin = (payload?: LoginSuccessPayload) => {
    console.log('[handleLogin] 开始执行登录，payload:', payload);
    setIsLoggedIn(true);
    localStorage.setItem(AUTH_KEY, 'true');
    if (payload?.token) {
      console.log('[handleLogin] 保存token:', payload.token);
      localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
    }
    if (payload?.userInfo) {
      console.log('[handleLogin] 保存用户信息:', payload.userInfo);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(payload.userInfo));
    }

    // Call useAuth login to fetch real-name status
    loginFromHook(payload);

    console.log('[handleLogin] 设置登录状态完成');

    // 如果有待跳转页面，跳转到那里；否则跳转到首页
    if (pendingPage) {
      console.log('[handleLogin] 跳转到待处理页面:', pendingPage);
      if (pendingPage.tab) setActiveTab(pendingPage.tab);
      if (pendingPage.subPage) setSubPage(pendingPage.subPage);
      else setSubPage(null);
      setPendingPage(null);
    } else {
      setSubPage(null);
      setActiveTab('home');
    }
    setSelectedProduct(null);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    setSubPage(null);
    setActiveTab('home');
    setSelectedProduct(null);
  };

  // Helper to navigate to product detail
  const handleProductSelect = (product: Product, origin: 'market' | 'artist' | 'trading-zone' = 'market') => {
    setSelectedProduct(product);
    setProductDetailOrigin(origin);

    if (product.productType === 'shop') {
      setSubPage('points-product-detail');
    } else {
      setSubPage('product-detail');
    }
  };

  // Helper to mark all news as read
  const handleMarkAllRead = () => {
    const allIds = newsList.map(n => n.id);
    // Merge with existing read IDs in storage to preserve history if news list changes
    const currentReadIds = getReadNewsIds();
    const newReadIds = Array.from(new Set([...currentReadIds, ...allIds]));

    saveReadNewsIds(newReadIds);
    setNewsList(prev => prev.map(item => ({ ...item, isUnread: false })));
  };

  // Effect to mark single item as read when opening detail
  useEffect(() => {
    if (subPage && subPage.startsWith('news-detail:')) {
      const id = subPage.split(':')[1];

      setNewsList(prev => {
        // Check if we need to update state
        const target = prev.find(p => p.id === id);
        if (target && target.isUnread) {
          return prev.map(item =>
            item.id === id ? { ...item, isUnread: false } : item
          );
        }
        return prev;
      });

      // Update storage
      const readIds = getReadNewsIds();
      if (!readIds.includes(id)) {
        saveReadNewsIds([...readIds, id]);
      }
    }
  }, [subPage]);

  // Handle special navigation: switch to market tab
  useEffect(() => {
    if (subPage === 'switch-to-market') {
      setActiveTab('market');
      setSubPage(null);
    }
  }, [subPage]);

  // Handle URL-based routing: detect /register path and navigate to register page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      // If URL path is /register, navigate to register page
      if (path === '/register') {
        setSubPage('register');
      }
    }
  }, []); // Only run once on mount to handle direct URL access

  // Authentication Gate
  if (!isLoggedIn) {
    if (subPage === 'register') {
      return (
        <Register
          onBack={() => setSubPage(null)}
          onRegisterSuccess={(loginPayload) => {
            console.log('[App] 收到注册成功回调，loginPayload:', loginPayload);
            if (loginPayload && loginPayload.token) {
              // 注册成功后自动登录
              console.log('[App] 开始自动登录，token:', loginPayload.token);
              handleLogin(loginPayload);
            } else {
              // 如果没有返回登录信息，只关闭注册页面
              console.warn('[App] 没有收到登录信息，只关闭注册页面');
              setSubPage(null);
            }
          }}
          onNavigateUserAgreement={() => setSubPage('user-agreement')}
          onNavigatePrivacyPolicy={() => setSubPage('privacy-policy')}
        />
      );
    }
    if (subPage === 'privacy-policy') {
      return (
        <PrivacyPolicy
          onBack={() => setSubPage(null)}
        />
      );
    }
    if (subPage === 'user-agreement') {
      return (
        <UserAgreement
          onBack={() => setSubPage(null)}
        />
      );
    }
    if (subPage === 'forgot-password') {
      return (
        <ForgotPassword
          onBack={() => setSubPage(null)}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onNavigateRegister={() => setSubPage('register')}
        onNavigateUserAgreement={() => setSubPage('user-agreement')}
        onNavigatePrivacyPolicy={() => setSubPage('privacy-policy')}
        onNavigateForgotPassword={() => setSubPage('forgot-password')}
      />
    );
  }

  const renderContent = () => {
    // 页面访问控制：未实名用户只能访问首页和实名认证页面
    if (!isRealNameVerified) {
      // 允许访问的子页面
      const allowedSubPages = [null, 'real-name-auth'];

      // 检查是否在尝试访问非首页的tab
      const isNavigatingToRestrictedTab = activeTab !== 'home' && !subPage;

      // 检查是否在尝试访问受限子页面
      const isNavigatingToRestrictedSubPage = subPage && !allowedSubPages.includes(subPage);

      if (isNavigatingToRestrictedTab || isNavigatingToRestrictedSubPage) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <RealNameRequiredModal
              open={true}
              isRealNameVerified={isRealNameVerified}
              onNavigateToAuth={() => {
                setActiveTab('home');
                setSubPage('real-name-auth');
              }}
              onBackToHome={() => {
                setActiveTab('home');
                setSubPage(null);
              }}
              onNavigateToProfile={() => {
                setActiveTab('profile');
                setSubPage(null);
              }}
            />
          </div>
        );
      }
    }

    if (subPage === 'points-product-detail' && selectedProduct) {
      return (
        <PointsProductDetail
          product={selectedProduct}
          onBack={() => {
            setSubPage(null);
            setSelectedProduct(null);
          }}
          onNavigate={(page) => setSubPage(page)}
        />
      );
    }

    // Handle Product Detail Page
    if (subPage === 'product-detail' && selectedProduct) {
      return (
        <ProductDetail
          product={selectedProduct}
          onBack={() => {
            if (productDetailOrigin === 'trading-zone') {
              setSubPage('trading-zone');
            } else {
              setSubPage(null);
            }
            setSelectedProduct(null);
            setProductDetailOrigin(null);
          }}
          onNavigate={(page) => setSubPage(page)}
        />
      );
    }

    if (subPage === 'reservation' && selectedProduct) {
      return (
        <ReservationPage
          product={selectedProduct}
          onBack={() => setSubPage('product-detail')}
          onNavigate={(page) => setSubPage(page)}
        />
      );
    }

    if (subPage === 'reservation-record') {
      return (
        <ReservationRecordPage
          onBack={() => setSubPage(null)} // Or back to wherever appropriate
          onNavigate={(page) => setSubPage(page)}
        />
      );
    }

    if (subPage?.startsWith('my-collection-detail') && selectedCollectionItem) {
      return (
        <MyCollectionDetail
          item={selectedCollectionItem}
          onBack={() => {
            setSubPage('my-collection');
            setSelectedCollectionItem(null);
          }}
          onNavigate={(page) => setSubPage(page)}
        />
      );
    }

    // Handle Announcement Detail Page: "news-detail:ID"
    if (subPage?.startsWith('news-detail:')) {
      const newsId = subPage.split(':')[1];
      const newsItem = newsList.find(item => item.id === newsId);
      if (newsItem) {
        // 根据新闻项类型保存标签页状态，确保返回时显示正确的标签
        const targetTab = newsItem.type === 'announcement' ? 'announcement' : 'dynamics';
        try {
          localStorage.setItem('cat_news_active_tab', targetTab);
        } catch (e) {
          // 忽略存储错误
        }
        return <AnnouncementDetail newsItem={newsItem} onBack={() => setSubPage(null)} />;
      }
    }

    // Handle Artist Detail Page: "artist-detail:ID"
    if (subPage?.startsWith('artist-detail:')) {
      const artistId = subPage.split(':')[1];
      if (artistId) {
        return (
          <ArtistDetail
            artistId={artistId}
            onBack={() => setSubPage(null)}
            onProductSelect={(product) => handleProductSelect(product, 'artist')}
          />
        );
      }
    }

    // Handle Order List Page: "order-list:category:tabIndex"
    if (subPage?.startsWith('order-list:')) {
      const [_, category, tabIndex] = subPage.split(':');
      return (
        <OrderListPage
          category={category}
          initialTab={parseInt(tabIndex, 10)}
          onBack={() => setSubPage(null)}
          onNavigate={(page) => setSubPage(page)}
        />
      );
    }

    // Sub page Routing
    switch (subPage) {
      case 'service-center:settings':
        return (
          <Settings
            onBack={() => setSubPage(null)}
            onLogout={handleLogout}
            onNavigate={(page) => setSubPage(page)}
          />
        );
      case 'service-center:reset-login-password':
        return (
          <ResetLoginPassword
            onBack={() => setSubPage('service-center:settings')}
            onNavigateForgotPassword={() => setSubPage('service-center:forgot-password')}
          />
        );
      case 'service-center:reset-pay-password':
        return (
          <ResetPayPassword
            onBack={() => setSubPage('service-center:settings')}
            onNavigateForgotPassword={() => setSubPage('service-center:forgot-password')}
          />
        );
      case 'service-center:forgot-password':
        return <ForgotPassword onBack={() => setSubPage('service-center:settings')} />;
      case 'service-center:notification-settings':
        return <NotificationSettings onBack={() => setSubPage('service-center:settings')} />;
      case 'service-center:account-deletion':
        return <AccountDeletion onBack={() => setSubPage('service-center:settings')} />;
      case 'service-center:edit-profile':
        return (
          <EditProfile
            onBack={() => setSubPage('service-center:settings')}
            onLogout={handleLogout}
          />
        );
      case 'card-management':
        return <CardManagement onBack={() => setSubPage(null)} />;
      case 'trading-zone':
        return (
          <TradingZone
            onBack={() => setSubPage(null)}
            onProductSelect={(product) => handleProductSelect(product, 'trading-zone')}
          />
        );
      case 'home:about-us':
        // 从首页入口进入「中心介绍」，返回时应回到首页
        return <AboutUs onBack={() => setSubPage(null)} />;
      case 'about-us':
        // 从设置页进入「关于我们」，返回时回到设置
        return <AboutUs onBack={() => setSubPage('service-center:settings')} />;
      case 'privacy-policy':
        return (
          <PrivacyPolicy onBack={() => setSubPage('service-center:settings')} />
        );
      case 'artist-showcase':
        return (
          <ArtistShowcase
            onBack={() => setSubPage(null)}
            onArtistSelect={(id) => setSubPage(`artist-detail:${id}`)}
          />
        );
      case 'masterpiece-showcase':
        return (
          <ArtistWorksShowcase
            onBack={() => setSubPage(null)}
            onNavigateToArtist={(artistId) => setSubPage(`artist-detail:${artistId}`)}
          />
        );
      case 'asset-view':
      case 'asset-view:0':
      case 'asset-view:1':
      case 'asset-view:2':
      case 'asset-view:3':
        const initialTab = subPage?.split(':')[1] ? parseInt(subPage.split(':')[1]) : 0;
        return (
          <AssetView
            initialTab={initialTab}
            onBack={() => setSubPage(null)}
            onNavigate={(page) => setSubPage(page)}
            onProductSelect={(product) => handleProductSelect(product, 'market')}
          />
        );
      case 'my-collection':
        return (
          <MyCollection
            onBack={() => setSubPage(null)}
            onItemSelect={(item) => {
              setSelectedCollectionItem(item);
              setSubPage(`my-collection-detail:${item.id}`);
            }}
          />
        );
      case 'address-list':
        return <AddressList onBack={() => setSubPage(null)} />;
      case 'real-name-auth':
        return <RealNameAuth onBack={() => setSubPage(null)} />;
      case 'my-friends':
        return <MyFriends onBack={() => setSubPage(null)} onNavigate={(page) => setSubPage(page)} />;
      case 'agent-auth':
        return <AgentAuth onBack={() => setSubPage(null)} />;
      case 'help-center':
        return <HelpCenter onBack={() => setSubPage(null)} />;
      case 'profile:user-agreement':
        return <UserAgreement onBack={() => setSubPage(null)} />;
      case 'user-survey':
        return <UserSurvey onBack={() => setSubPage(null)} />;
      case 'online-service':
        return <OnlineService onBack={() => setSubPage(null)} />;
    }

    if (subPage?.startsWith('wallet:hashrate_exchange')) {
      // Check for return path: wallet:hashrate_exchange:fromPath
      const isFromProfile = subPage.includes(':profile');
      const isFromReservation = subPage.includes(':reservation');
      return (
        <HashrateExchange
          onBack={() => setSubPage(isFromReservation ? 'reservation' : isFromProfile ? null : 'asset-view')}
          onNavigate={(page) => setSubPage(page)}
        />
      );
    }

    if (subPage?.startsWith('asset:balance-recharge')) {
      const isFromProfile = subPage.includes(':profile');
      const isFromReservation = subPage.includes(':reservation');

      // Extract amount if present (format: asset:balance-recharge:source:amount)
      const parts = subPage.split(':');
      const initialAmount = parts.length > 3 ? parts[parts.length - 1] : undefined;

      return <BalanceRecharge
        onBack={() => setSubPage(isFromReservation ? 'reservation' : isFromProfile ? null : 'asset-view')}
        initialAmount={initialAmount}
      />;
    }

    if (subPage?.startsWith('asset:balance-withdraw')) {
      const isFromProfile = subPage.includes(':profile');
      return (
        <BalanceWithdraw
          onBack={() => setSubPage(isFromProfile ? null : 'asset-view')}
          onNavigate={(page) => setSubPage(page)}
        />
      );
    }

    if (subPage?.startsWith('asset:service-recharge')) {
      const isFromProfile = subPage.includes(':profile');
      return <ServiceRecharge onBack={() => setSubPage(isFromProfile ? null : 'asset-view')} />;
    }

    if (subPage?.startsWith('claim-detail:')) {
      const id = subPage.split(':')[1];
      return <ClaimDetail id={id} onBack={() => setSubPage('claim-history')} />;
    }

    switch (subPage) {
      case 'asset:extension-withdraw':
        return <ExtensionWithdraw onBack={() => setSubPage('asset-view')} />;
      case 'sign-in':
        return <SignIn onBack={() => setSubPage(null)} onNavigate={(page) => setSubPage(page)} />;
      case 'asset-history':
        return (
          <AssetHistory
            onBack={() => setSubPage('asset-view')}
          />
        );
      case 'claim-history':
        return (
          <ClaimHistory
            onBack={() => setSubPage(null)}
            onNavigate={(page) => setSubPage(page)}
          />
        );

      case 'cumulative-rights':
        return <CumulativeRights onBack={() => setSubPage(null)} />;
      case 'consignment-voucher':
        return <ConsignmentVoucher onBack={() => setSubPage(null)} />;
      case 'service-center:message':
        return <MessageCenter onBack={() => setSubPage(null)} onNavigate={(page) => setSubPage(page)} />;
      case 'news-center':
        return (
          <News
            newsList={newsList}
            onNavigate={(id) => {
              // 根据新闻项类型保存标签页状态，确保返回时显示正确的标签
              const newsItem = newsList.find(item => item.id === id);
              if (newsItem) {
                const targetTab = newsItem.type === 'announcement' ? 'announcement' : 'dynamics';
                try {
                  localStorage.setItem('cat_news_active_tab', targetTab);
                } catch (e) {
                  // 忽略存储错误
                }
              }
              setSubPage(`news-detail:${id}`);
            }}
            onMarkAllRead={handleMarkAllRead}
            onBack={() => setSubPage(null)}
          />
        );
      case 'invite-friends':
        return <InviteFriends onBack={() => setSubPage('my-friends')} />;
    }

    // Handle special navigation: switch to market tab
    if (subPage === 'switch-to-market') {
      return null; // Will be handled by useEffect below
    }

    // Handle Cashier Page: "cashier:ORDER_ID"
    if (subPage?.startsWith('cashier:')) {
      const orderId = subPage.split(':')[1];
      return (
        <Cashier
          orderId={orderId}
          onBack={() => setSubPage(null)}
          onNavigate={(page) => setSubPage(page)}
        />
      );
    }

    // Handle Order Detail Page: "order-detail:ORDER_ID"
    if (subPage?.startsWith('order-detail:')) {
      const orderId = subPage.split(':')[1];
      // Extract the source page from the order-detail string if it exists
      // Format: "order-detail:sourceCategory:sourceTab:orderId"
      const parts = subPage.split(':');
      let backPage = null;

      if (parts.length >= 4) {
        // Has source info: order-detail:points:0:123
        const sourceCategory = parts[1];
        const sourceTab = parts[2];
        const actualOrderId = parts[3];
        backPage = `order-list:${sourceCategory}:${sourceTab}`;

        return (
          <OrderDetail
            orderId={actualOrderId}
            onBack={() => setSubPage(backPage)}
            onNavigate={(page) => setSubPage(page)}
          />
        );
      } else {
        // No source info, try to go back to a reasonable default
        return (
          <OrderDetail
            orderId={orderId}
            onBack={() => {
              // Try to determine which order list to return to based on URL history
              // Default to points order list if unknown
              setSubPage('order-list:points:0');
            }}
            onNavigate={(page) => setSubPage(page)}
          />
        );
      }
    }

    // Tab Routing
    switch (activeTab) {
      case 'home':
        return (
          <Home
            onNavigate={(page) => setSubPage(page)}
            onSwitchTab={(tab) => setActiveTab(tab)}
            announcements={newsList}
          />
        );
      case 'market':
        return <Market onProductSelect={(product) => handleProductSelect(product, 'market')} />;
      case 'rights':
        return <ClaimStation onNavigate={(page) => setSubPage(page)} />;
      case 'orders':
        return <Orders onNavigate={(page) => setSubPage(page)} />;
      case 'profile':
        return <Profile onNavigate={(page) => setSubPage(page)} />;
      default:
        return (
          <Home
            onNavigate={(page) => setSubPage(page)}
            onSwitchTab={(tab) => setActiveTab(tab)}
          />
        );
    }
  };


  return (
    <div className="bg-gray-100 min-h-screen font-sans antialiased text-gray-900 max-w-md mx-auto relative shadow-2xl">
      <div className="min-h-screen bg-gray-50 pb-safe">
        {renderContent()}
      </div>
      {/* 实名认证提示弹窗 */}
      <RealNameRequiredModal
        open={showRealNameModal}
        isRealNameVerified={isRealNameVerified}
        onNavigateToAuth={() => {
          setShowRealNameModal(false);
          setActiveTab('home');
          setSubPage('real-name-auth');
        }}
        onBackToHome={() => {
          setShowRealNameModal(false);
          setActiveTab('home');
          setSubPage(null);
        }}
        onNavigateToProfile={() => {
          setShowRealNameModal(false);
          setActiveTab('profile');
          setSubPage(null);
        }}
      />

      {/* Hide BottomNav when in a sub-page */}
      {!subPage && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            // 不需要额外验证，实名检查已在 renderContent 中统一处理
            // 直接切换 tab，renderContent 会根据 isRealNameVerified 显示弹窗
            setActiveTab(tab);
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <GlobalNotificationSystem />
      <AppContent />
    </NotificationProvider>
  );
};

export default App;
