import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import BottomNav from './components/BottomNav';
import { Tab, Product, NewsItem, LoginSuccessPayload } from './types';
import { fetchAnnouncements, AnnouncementItem, fetchProfile, fetchRealNameStatus, MyCollectionItem } from './services/api';
import PopupAnnouncementModal from './components/common/PopupAnnouncementModal';
import { STORAGE_KEYS } from './constants/storageKeys';
import useAuth from './hooks/useAuth';
import { isSuccess } from './utils/apiHelpers';
// 路由统一编码/解码工具，逐步替换散落的字符串 subPage
import { encodeRoute, decodeRoute, type Route } from './router/routes';
import { useNavigationStack } from './router/navigation';
import { resolveRouteComponent } from './router/routesConfig';
import { clearNeedLoginHandler, setNeedLoginHandler } from './services/needLoginHandler';
import { readJSON, readStorage, writeJSON, writeStorage } from './utils/storageAccess';
import { bizLog, debugLog, warnLog, errorLog } from './utils/logger';
import useNewsReadState from './hooks/useNewsReadState';
import usePendingNavigation from './hooks/usePendingNavigation';
import useRealNameGuard from './hooks/useRealNameGuard';

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
import FriendDetail from './pages/user/FriendDetail';
import InviteFriends from './pages/user/InviteFriends';
import AccountDeletion from './pages/user/AccountDeletion';
import UserSurvey from './pages/user/UserSurvey';
import NotificationSettings from './pages/user/NotificationSettings';

// CMS / Static pages
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
import ProductDetail from './pages/market/ProductDetail';
import OrderListPage from './pages/market/OrderListPage';
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
import ClaimHistory from './pages/wallet/ClaimHistory';
import ClaimDetail from './pages/wallet/ClaimDetail';
import HashrateExchange from './pages/wallet/HashrateExchange';
import { RealNameRequiredModal } from './components/common';
import { NotificationProvider } from './context/NotificationContext';
import { GlobalNotificationSystem } from './components/common/GlobalNotificationSystem';
import './styles/notifications.css';

// Entry containers
import HomeEntry from './pages/entries/HomeEntry';
import MarketEntry from './pages/entries/MarketEntry';
// import OrdersEntry from './pages/entries/OrdersEntry'; // Removed
import ProfileEntry from './pages/entries/ProfileEntry';
import RightsEntry from './pages/entries/RightsEntry';
import LivePage from './pages/live/LivePage';

const getReadNewsIds = (): string[] => readJSON<string[]>(STORAGE_KEYS.READ_NEWS_IDS_KEY, []) || [];

const saveReadNewsIds = (ids: string[]) => writeJSON(STORAGE_KEYS.READ_NEWS_IDS_KEY, ids);

const AppContent: React.FC = () => {
  // Auth State (using useAuth hook)
  const { isLoggedIn, isRealNameVerified, login: loginFromHook, logout: logoutFromHook, updateRealNameStatus, refreshRealNameStatus } = useAuth();

  // Modal state for real-name verification prompt
  const [showRealNameModal, setShowRealNameModal] = useState<boolean>(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCollectionItem, setSelectedCollectionItem] = useState<MyCollectionItem | null>(null);
  const [productDetailOrigin, setProductDetailOrigin] = useState<'market' | 'artist' | 'trading-zone' | 'reservation-record'>('market');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [checkingRealName, setCheckingRealName] = useState(false);
  const { current: currentRoute, navigate, reset, goBack } = useNavigationStack(null);
  const subPage = useMemo(() => (currentRoute ? encodeRoute(currentRoute) : null), [currentRoute]);

  // 明确定义 BottomNav 显示条件：仅当 currentRoute 为 null 时显示
  // 添加日志帮助调试导航栏消失问题
  const shouldShowBottomNav = useMemo(() => {
    const show = currentRoute === null;
    // Debug: 追踪导航栏显示状态变化
    console.log('[BottomNav] currentRoute:', currentRoute?.name ?? 'null', '| shouldShow:', show);
    return show;
  }, [currentRoute]);

  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);
  // 新闻已读状态统一通过 hook 管理
  const { newsList, initWith: initNews, markAllRead: markAllNewsRead, markReadById } = useNewsReadState([]);
  // 弹窗公告队列状态（支持多个弹窗依次显示）
  const [popupQueue, setPopupQueue] = useState<AnnouncementItem[]>([]);
  const [showPopupAnnouncement, setShowPopupAnnouncement] = useState(false);
  // 待导航页面（用于登录/实名后自动跳转）
  const { pending, setPendingNav, consumePending } = usePendingNavigation();
  // 追踪上一次的路由，用于智能刷新实名状态
  const prevRouteNameRef = useRef<string | null | undefined>(null);

  const navigateRoute = useCallback(
    (route: Route | string | null, options?: { replace?: boolean; back?: Route | null; clearHistory?: boolean }) => {
      navigate(route, { replace: options?.replace, back: options?.back, clearHistory: options?.clearHistory });
    },
    [navigate],
  );

  // 兼容旧的 setSubPage 用法（字符串路由），统一转为 Route 导航
  const setSubPage = React.useCallback(
    (next: string | null) => {
      const route = next ? decodeRoute(next) : null;
      navigateRoute(route);
    },
    [navigateRoute],
  );

  // 全局处理 NeedLoginError：退出登录并回到登录入口
  useEffect(() => {
    const handleNeedLogin = () => {
      logoutFromHook();
      reset();
      navigateRoute(null, { clearHistory: true });
      setActiveTab('home');
    };

    setNeedLoginHandler(handleNeedLogin);
    return () => clearNeedLoginHandler();
  }, [logoutFromHook, navigateRoute, reset]);

  // 智能刷新实名认证状态：只在离开实名认证页面时刷新（避免频繁请求）
  useEffect(() => {
    const prevRouteName = prevRouteNameRef.current;
    const currentRouteName = currentRoute?.name;

    // 从实名认证页面离开时，刷新状态
    if (prevRouteName === 'real-name-auth' && currentRouteName !== 'real-name-auth' && isLoggedIn) {
      console.log('[实名状态] 从实名认证页面返回，刷新状态');
      refreshRealNameStatus();
    }

    // 更新 ref
    prevRouteNameRef.current = currentRouteName;
  }, [currentRoute?.name, isLoggedIn, refreshRealNameStatus]);

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
      const token = readStorage(STORAGE_KEYS.AUTH_TOKEN_KEY);
      const authFlag = readStorage(STORAGE_KEYS.AUTH_KEY);

      // 如果本地存储显示已登录，验证token是否有效
      if (authFlag === 'true' && token) {
        try {
          // 尝试获取用户信息来验证token是否有效
          const response = await fetchProfile(token);
          if (isSuccess(response) && response.data?.userInfo) {
            // Token有效，更新用户信息
            writeJSON(STORAGE_KEYS.USER_INFO_KEY, response.data.userInfo);
            loginFromHook({ token, userInfo: response.data.userInfo });
            debugLog('auth.verify', '登录状态验证成功');
          } else {
            // Token无效，清除登录状态
            warnLog('auth.verify', 'Token无效，清除登录状态');
            handleLogout();
          }
        } catch (error: any) {
          errorLog('auth.verify', '验证登录状态失败', error);
          // 只有在明确的认证错误时才清除登录状态
          // 网络错误等临时问题不应该强制登出用户
          if (error.name === 'NeedLoginError' || error.code === 303) {
            warnLog('auth.verify', 'Token已失效（303错误），清除登录状态并跳转到登录页');
            handleLogout();
          } else if (error.isCorsError || error.name === 'TypeError') {
            // 网络错误或跨域错误，保留登录状态，让用户可以重试
            warnLog('auth.verify', '网络错误，保留登录状态，用户可以重试');
          } else {
            // 其他未知错误：为了安全，清除登录状态
            warnLog('auth.verify', '未知错误，清除登录状态以确保安全');
            handleLogout();
          }
        }
      } else if (authFlag === 'true' && !token) {
        // 有登录标记但没有token，清除状态
        warnLog('auth.verify', '登录标记存在但缺少token，清除登录状态');
        handleLogout();
      }
    };

    verifyLoginStatus();
  }, []); // 只在组件挂载时执行一次

  // 仅在用户登录且进入首页时加载公告
  useEffect(() => {
    // 只有在用户已登录且在首页时才加载公告
    if (!isLoggedIn || activeTab !== 'home') {
      return;
    }

    const loadAnnouncements = async () => {
      try {
        console.log('[公告] 开始加载公告数据...');
        const readIds = getReadNewsIds();

        // 只请求弹窗公告（is_popup=1），同时请求平台公告（normal）和平台动态（important）类型
        const [announcementRes, dynamicRes] = await Promise.all([
          fetchAnnouncements({ page: 1, limit: 10, type: 'normal', is_popup: 1 }),
          fetchAnnouncements({ page: 1, limit: 10, type: 'important', is_popup: 1 }),
        ]);

        console.log('[公告] API响应:', {
          announcementRes,
          dynamicRes,
        });

        const announcementList = announcementRes.data?.list ?? [];
        const dynamicList = dynamicRes.data?.list ?? [];

        console.log('[公告] 获取到的数据:', {
          announcementCount: announcementList.length,
          dynamicCount: dynamicList.length,
          announcementList,
          dynamicList,
        });

        // 合并两种类型的数据
        const allMapped = [
          ...announcementList.map((item) => mapAnnouncementToNewsItem(item, readIds, 'announcement')),
          ...dynamicList.map((item) => mapAnnouncementToNewsItem(item, readIds, 'dynamic')),
        ];

        initNews(allMapped);

        // 检查是否有弹窗公告
        const allAnnouncements = [...announcementList, ...dynamicList];
        console.log('[公告] 检查弹窗公告，总数:', allAnnouncements.length);

        allAnnouncements.forEach((item, index) => {
          console.log(`[公告] 公告 #${index + 1}:`, {
            id: item.id,
            title: item.title,
            is_popup: item.is_popup,
            is_popup_type: typeof item.is_popup,
            is_popup_number: Number(item.is_popup),
            matches: Number(item.is_popup) === 1,
          });
        });

        // 检查所有弹窗公告（支持多个）
        const allPopupAnnouncements = allAnnouncements.filter((item) => Number(item.is_popup) === 1);

        console.log('[公告] 找到的弹窗公告:', allPopupAnnouncements);

        if (allPopupAnnouncements.length > 0) {
          // 过滤掉今天已关闭的公告
          const today = new Date().toDateString();
          const validPopups = allPopupAnnouncements.filter((item) => {
            const dismissedKey = `popup_dismissed_${item.id}`;
            let dismissedDate: string | null = null;
            try {
              dismissedDate = localStorage.getItem(dismissedKey);
            } catch (e) {
              // ignore
            }
            const shouldShow = dismissedDate !== today;
            console.log(`[公告] 公告 #${item.id} "${item.title}" 检查:`, {
              dismissedDate,
              today,
              shouldShow,
            });
            return shouldShow;
          });

          console.log('[公告] 过滤后待显示的弹窗数量:', validPopups.length);

          if (validPopups.length > 0) {
            // 获取第一个公告的延迟时间
            const firstDelay = Number(validPopups[0].popup_delay) || 0;
            console.log(`[公告] 将在 ${firstDelay}ms 后开始显示 ${validPopups.length} 个弹窗`);

            setTimeout(() => {
              console.log('[公告] 显示弹窗队列，共', validPopups.length, '个');
              setPopupQueue(validPopups);
              setShowPopupAnnouncement(true);
            }, firstDelay);
          } else {
            console.log('[公告] 所有弹窗今日都已关闭');
          }
        } else {
          console.log('[公告] 没有找到需要弹窗的公告');
        }
      } catch (error) {
        console.error('[公告] 加载资讯失败:', error);
      }
    };

    loadAnnouncements();
  }, [isLoggedIn, activeTab]); // 只在登录状态或tab变化时触发

  const handleLogin = (payload?: LoginSuccessPayload) => {
    debugLog('auth.login', '开始执行登录', payload);

    // 统一使用 useAuth 管理登录态
    loginFromHook(payload);

    bizLog('auth.login.success', { hasPayload: Boolean(payload), pendingRedirect: Boolean(pending) });

    // 如果有待跳转页面，跳转到那里；否则跳转到首页
    const target = consumePending();
    if (target) {
      debugLog('auth.login', '跳转到待处理页面', target);
      if (target.tab) setActiveTab(target.tab);
      if (target.route) navigateRoute(target.route);
      else navigateRoute(null, { clearHistory: true });
    } else {
      navigateRoute(null, { clearHistory: true });
      setActiveTab('home');
    }
    setSelectedProduct(null);
  };

  const handleLogout = () => {
    // 统一使用 useAuth 管理登录态
    logoutFromHook();
    reset();
    navigateRoute(null, { clearHistory: true });
    setActiveTab('home');
    setSelectedProduct(null);
  };

  // Helper to navigate to product detail
  const handleProductSelect = (product: Product, origin: 'market' | 'artist' | 'trading-zone' | 'reservation-record' = 'market') => {
    setSelectedProduct(product);
    setProductDetailOrigin(origin);

    if (product.productType === 'shop') {
      navigateRoute({ name: 'points-product-detail' });
    } else {
      navigateRoute({ name: 'product-detail' });
    }
  };

  // Helper to mark all news as read
  const handleMarkAllRead = () => {
    markAllNewsRead();
  };

  // Effect to mark single item as read when opening detail
  useEffect(() => {
    if (currentRoute?.name === 'news-detail' && (currentRoute as any).id) {
      markReadById((currentRoute as any).id);
    }
  }, [currentRoute, markReadById]);

  // Handle special navigation: switch to market tab
  useEffect(() => {
    if (currentRoute?.name === 'switch-to-market') {
      setActiveTab('market');
      navigateRoute(null, { clearHistory: true });
    }
  }, [currentRoute, navigateRoute]);

  // Handle URL-based routing: detect /register path and navigate to register page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      // If URL path is /register, navigate to register page
      if (path === '/register') {
        navigateRoute('register');
      }
    }
  }, []); // Only run once on mount to handle direct URL access

  // Authentication Gate
  if (!isLoggedIn) {
    if (currentRoute?.name === 'register') {
      return (
        <Register
          onBack={() => navigateRoute(null)}
          onRegisterSuccess={(loginPayload) => {
            console.log('[App] 收到注册成功回调，loginPayload:', loginPayload);
            if (loginPayload && loginPayload.token) {
              // 注册成功后自动登录
              console.log('[App] 开始自动登录，token:', loginPayload.token);
              handleLogin(loginPayload);
            } else {
              // 如果没有返回登录信息，只关闭注册页面
              console.warn('[App] 没有收到登录信息，只关闭注册页面');
              navigateRoute(null);
            }
          }}
          onNavigateUserAgreement={() => navigateRoute({ name: 'user-agreement' })}
          onNavigatePrivacyPolicy={() => navigateRoute({ name: 'privacy-policy' })}
        />
      );
    }
    if (currentRoute?.name === 'privacy-policy') {
      return (
        <PrivacyPolicy
          onBack={() => goBack()}
        />
      );
    }
    if (currentRoute?.name === 'user-agreement') {
      return (
        <UserAgreement
          onBack={() => goBack()}
        />
      );
    }
    if (currentRoute?.name === 'forgot-password') {
      return (
        <ForgotPassword
          onBack={() => navigateRoute(null)}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onNavigateRegister={() => navigateRoute({ name: 'register' })}
        onNavigateUserAgreement={() => navigateRoute({ name: 'user-agreement' })}
        onNavigatePrivacyPolicy={() => navigateRoute({ name: 'privacy-policy' })}
        onNavigateForgotPassword={() => navigateRoute({ name: 'forgot-password' })}
      />
    );
  }

  const renderContent = () => {
    // 页面访问控制：未实名用户只能访问首页和实名认证页面
    if (!isRealNameVerified) {
      // 允许未实名访问的子路由（用 Route 名称而非字符串前缀）
      const allowedRouteNames: Array<Route['name'] | null> = [null, 'real-name-auth'];

      // 检查是否在尝试访问非首页的 tab
      const isNavigatingToRestrictedTab = activeTab !== 'home' && !subPage;

      // 检查是否在尝试访问受限子路由
      const isNavigatingToRestrictedSubPage =
        currentRoute && !allowedRouteNames.includes(currentRoute.name);

      if (isNavigatingToRestrictedTab || isNavigatingToRestrictedSubPage) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <RealNameRequiredModal
              open={true}
              isRealNameVerified={isRealNameVerified}
              onNavigateToAuth={() => {
                setActiveTab('home');
                navigateRoute({ name: 'real-name-auth' });
              }}
              onBackToHome={() => {
                setActiveTab('home');
                navigateRoute(null);
              }}
              onNavigateToProfile={() => {
                setActiveTab('profile');
                navigateRoute(null);
              }}
            />
          </div>
        );
      }
    }

    // 商品积分详情页：用 Route 判断，减少字符串误拼
    if (currentRoute?.name === 'points-product-detail' && selectedProduct) {
      return (
        <PointsProductDetail
          product={selectedProduct}
          onBack={() => {
            goBack();
            setSelectedProduct(null);
          }}
          onNavigate={(route) => navigateRoute(route)}
        />
      );
    }

    // 优先尝试通过 Route 解析器渲染（参数化路由集中管理），未匹配则走旧分支
    if (currentRoute) {
      const resolved = resolveRouteComponent(currentRoute, {
        newsList,
        navigateRoute,
        handleProductSelect,
        setProductDetailOrigin,
        productDetailOrigin,
        handleLogout: handleLogout,
        selectedCollectionItem,
        setSelectedCollectionItem,
        markAllNewsRead,
        goBack,
      });
      if (resolved) return resolved;
    }

    // Handle Product Detail Page
    if (currentRoute?.name === 'product-detail' && selectedProduct) {
      return (
        <ProductDetail
          product={selectedProduct}
          onBack={() => {
            goBack();
            setSelectedProduct(null);
            setProductDetailOrigin('market'); // Reset to default
          }}
          onNavigate={(route) => navigateRoute(route)} // 兼容旧字符串
        />
      );
    }

    if (currentRoute?.name === 'reservation' && selectedProduct) {
      return (
        <ReservationPage
          product={selectedProduct}
          onBack={() => goBack()}
          onNavigate={(route) => navigateRoute(route)} // 兼容旧字符串
        />
      );
    }

    if (currentRoute?.name === 'reservation-record') {
      return (
        <ReservationRecordPage
          onBack={() => goBack()} // Or back to wherever appropriate
          onNavigate={(route) => navigateRoute(route)} // 兼容旧字符串
          onProductSelect={(product) => handleProductSelect(product, 'reservation-record')}
        />
      );
    }

    if (currentRoute?.name === 'my-collection-detail' && selectedCollectionItem) {
      return (
        <MyCollectionDetail
          item={selectedCollectionItem}
          onBack={() => {
            navigateRoute({ name: 'my-collection' });
            setSelectedCollectionItem(null);
          }}
          onNavigate={(route) => navigateRoute(route)} // 兼容旧字符串
        />
      );
    }

    // Handle Announcement Detail Page: "news-detail:ID"
    if (currentRoute?.name === 'news-detail') {
      const newsId = currentRoute.id;
      const newsItem = newsList.find(item => item.id === newsId);
      if (newsItem) {
        markReadById(newsId);
        // 根据新闻项类型保存标签页状态，确保返回时显示正确的标签
        const targetTab = newsItem.type === 'announcement' ? 'announcement' : 'dynamics';
        try {
          writeStorage(STORAGE_KEYS.NEWS_ACTIVE_TAB_KEY, targetTab);
        } catch (e) {
          // 忽略存储错误
        }
        return <AnnouncementDetail newsItem={newsItem} onBack={() => goBack()} />;
      }
    }

    // Handle Friend Detail Page
    if (currentRoute?.name === 'friend-detail') {
      return (
        <FriendDetail
          id={currentRoute.id}
          friend={currentRoute.friend}
          onBack={() => goBack()}
        />
      );
    }

    // Handle Artist Detail Page: "artist-detail:ID"
    if (currentRoute?.name === 'artist-detail' && currentRoute.id) {
      const artistId = currentRoute.id;
      return (
        <ArtistDetail
          artistId={artistId}
          onBack={() => goBack()}
          onProductSelect={(product) => handleProductSelect(product, 'artist')}
        />
      );
    }

    // Handle Order List Page: "order-list:category:tabIndex"
    if (currentRoute?.name === 'order-list') {
      return (
        <OrderListPage
          category={currentRoute.kind}
          initialTab={currentRoute.status}
          onBack={() => goBack()}
          onNavigate={(route) => navigateRoute(route)} // 兼容旧字符串
        />
      );
    }

    // 已迁移到 resolveRouteComponent 的旧 subPage 分支已移除

    // 其余 legacy subPage 分支已迁移至 resolveRouteComponent

    // Tab Routing 使用 Entry 容器，App 只负责切换
    switch (activeTab) {
      case 'home':
        return (
          <HomeEntry
            onNavigate={(route) => navigateRoute(route)}
            onSwitchTab={(tab) => setActiveTab(tab)}
            announcements={newsList}
          />
        );
      case 'market':
        return <MarketEntry onProductSelect={(product) => handleProductSelect(product, 'market')} />;
      case 'rights':
        return <RightsEntry onNavigate={(route) => navigateRoute(route)} />;
      case 'live':
        return <LivePage />;
      case 'profile':
        return <ProfileEntry onNavigate={(route) => navigateRoute(route)} unreadCount={newsList.filter(n => n.isUnread).length} />;
      default:
        return (
          <HomeEntry
            onNavigate={(route) => navigateRoute(route)}
            onSwitchTab={(tab) => setActiveTab(tab)}
            announcements={newsList}
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
          navigateRoute('real-name-auth');
        }}
        onBackToHome={() => {
          setShowRealNameModal(false);
          setActiveTab('home');
          navigateRoute(null);
        }}
        onNavigateToProfile={() => {
          setShowRealNameModal(false);
          setActiveTab('profile');
          navigateRoute(null);
        }}
      />

      {/* 弹窗公告队列（依次显示） */}
      <PopupAnnouncementModal
        visible={showPopupAnnouncement && popupQueue.length > 0}
        announcement={popupQueue[0] || null}
        onClose={() => {
          // 移除当前显示的公告，显示下一个
          setPopupQueue((prev) => prev.slice(1));
          // 如果队列已空，关闭弹窗
          if (popupQueue.length <= 1) {
            setShowPopupAnnouncement(false);
          }
        }}
        onDontShowToday={() => {
          const currentPopup = popupQueue[0];
          if (currentPopup) {
            const dismissedKey = `popup_dismissed_${currentPopup.id}`;
            try {
              localStorage.setItem(dismissedKey, new Date().toDateString());
            } catch (e) {
              // ignore
            }
          }
        }}
      />

      {/* Hide BottomNav when in a sub-page */}
      {shouldShowBottomNav && (
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
