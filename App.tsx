import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import { Tab, Product, NewsItem, LoginSuccessPayload } from './types';
import { AUTH_TOKEN_KEY, USER_INFO_KEY, fetchAnnouncements, AnnouncementItem, fetchProfile, fetchRealNameStatus } from './services/api';
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
import ClaimStation from './pages/wallet/ClaimStation';
import HashrateExchange from './pages/wallet/HashrateExchange';
import { RealNameRequiredModal } from './components/common';

const STORAGE_KEY = 'cat_read_news_ids';
const AUTH_KEY = 'cat_is_logged_in';

const getReadNewsIds = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveReadNewsIds = (ids: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

const App: React.FC = () => {
  // Auth State (using useAuth hook)
  const { isLoggedIn: isLoggedInFromHook, isRealNameVerified, login: loginFromHook, updateRealNameStatus } = useAuth();

  // For backward compatibility, maintain local state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });

  // Modal state for real-name verification prompt
  const [showRealNameModal, setShowRealNameModal] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [checkingRealName, setCheckingRealName] = useState(false);
  const [subPage, setSubPage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetailOrigin, setProductDetailOrigin] = useState<'market' | 'artist' | 'trading-zone' | null>(null);

  // Initialize news list based on storage
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

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
    setIsLoggedIn(true);
    localStorage.setItem(AUTH_KEY, 'true');
    if (payload?.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
    }
    if (payload?.userInfo) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(payload.userInfo));
    }

    // Call useAuth login to fetch real-name status
    loginFromHook(payload);

    setSubPage(null);
    setActiveTab('home');
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
    setSubPage('product-detail');
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
          onRegisterSuccess={() => setSubPage(null)}
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
        return <MyCollection onBack={() => setSubPage(null)} />;
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
      return (
        <HashrateExchange
          onBack={() => setSubPage(isFromProfile ? null : 'asset-view')}
          onNavigate={(page) => setSubPage(page)}
        />
      );
    }

    if (subPage?.startsWith('asset:balance-recharge')) {
      const isFromProfile = subPage.includes(':profile');
      return <BalanceRecharge onBack={() => setSubPage(isFromProfile ? null : 'asset-view')} />;
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
      case 'cumulative-rights':
        return <CumulativeRights onBack={() => setSubPage(null)} />;
      case 'consignment-voucher':
        return <ConsignmentVoucher onBack={() => setSubPage(null)} />;
      case 'service-center:message':
        return <MessageCenter onBack={() => setSubPage(null)} />;
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
        return <ClaimStation />;
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
          onTabChange={async (tab) => {
            // 如果点击"我的"tab，先检查实名状态
            if (tab === 'profile') {
              const token = localStorage.getItem(AUTH_TOKEN_KEY);
              if (token) {
                try {
                  setCheckingRealName(true);
                  // 调用获取个人中心接口检查实名状态
                  const profileRes = await fetchProfile(token);
                  if (profileRes.code === 1 && profileRes.data?.userInfo) {
                    // 获取实名认证状态
                    const realNameRes = await fetchRealNameStatus(token);
                    if (realNameRes.code === 1 && realNameRes.data) {
                      const realNameStatus = realNameRes.data.real_name_status;
                      // 更新实名状态 (2=已通过)
                      updateRealNameStatus(realNameStatus, realNameRes.data.real_name);
                      
                      // 如果未实名，显示弹窗
                      if (realNameStatus !== 2) {
                        setShowRealNameModal(true);
                        return; // 不切换tab
                      }
                    }
                  }
                } catch (error) {
                  console.error('检查实名状态失败:', error);
                } finally {
                  setCheckingRealName(false);
                }
              }
            }
            // 正常切换tab
            setActiveTab(tab);
          }}
        />
      )}
    </div>
  );
};

export default App;
