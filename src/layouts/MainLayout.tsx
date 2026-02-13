/**
 * 主布局组件
 * 包含底部导航栏和认证守卫
 */
import React, { useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import BottomNav from '@/layouts/BottomNav';
import ScrollToTop from '@/components/common/ScrollToTop';
import { ChatWidget, DraggableChatButton, PullToRefresh } from '@/components/common';
import PopupAnnouncementModal from '@/components/common/PopupAnnouncementModal';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { fetchAnnouncements } from '@/services/cms';
import type { AnnouncementItem } from '@/services/cms';
import { extractData } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';
import type { Tab } from '@/types';

// 路径到 Tab 的映射
const pathToTab: Record<string, Tab> = {
  '/': 'home',
  '/home': 'home',
  '/market': 'market',
  '/rights': 'rights',
  '/live': 'live',
  '/profile': 'profile',
};

// Tab 到路径的映射
const tabToPath: Record<Tab, string> = {
  home: '/',
  market: '/market',
  rights: '/rights',
  live: '/live',
  profile: '/profile',
};

// 公开路由（不需要登录）
const publicRoutes = [
  '/market',
  '/privacy-policy',
  '/user-agreement',
  '/about-us',
  '/help-center',
  '/online-service',
  '/news',
  '/masterpiece-showcase',
];

// 需要登录但不需要实名的路由
// 包含首页，确保新注册用户可先进入首页浏览
const authOnlyRoutes = ['/', '/home', '/real-name-auth', '/settings', '/profile', '/live', '/rights'];

const POPUP_DISMISSED_KEY_PREFIX = 'popup_dismissed_';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, isRealNameVerified } = useAuthStore();
  const {
    clearMarketCache,
    popupQueue,
    setPopupQueue,
    showPopupAnnouncement,
    setShowPopupAnnouncement,
  } = useAppStore();
  const currentPath = location.pathname;

  // 拉取弹窗公告（进入主布局时）
  useEffect(() => {
    const loadPopupAnnouncements = async () => {
      try {
        const response = await fetchAnnouncements({
          page: 1,
          limit: 10,
          type: 'normal',
          is_popup: 1,
        });
        const data = extractData(response) as { list?: AnnouncementItem[] } | null;
        const rawList = data?.list ?? [];
        const list = rawList.filter((item) => item.is_popup === 1);
        const filtered = list.filter((item) => {
          const dismissed = localStorage.getItem(
            `${POPUP_DISMISSED_KEY_PREFIX}${item.id}`
          );
          const today = new Date().toDateString();
          return dismissed !== today;
        });
        if (filtered.length > 0) {
          setPopupQueue(filtered);
          setShowPopupAnnouncement(true);
        }
      } catch (err) {
        errorLog('MainLayout', '拉取弹窗公告失败', err);
      }
    };
    loadPopupAnnouncements();
  }, [setPopupQueue, setShowPopupAnnouncement]);

  // 根据当前路径确定激活的 Tab
  const activeTab = pathToTab[location.pathname] || 'home';

  // 判断是否显示底部导航
  const showBottomNav = Object.keys(pathToTab).includes(location.pathname);

  // 检查路由权限
  const isPublicRoute = publicRoutes.some(
    (route) => currentPath === route || currentPath.startsWith(route + '/')
  );

  const isAuthOnlyRoute = authOnlyRoutes.some(
    (route) => currentPath === route || currentPath.startsWith(route + '/')
  );

  const handlePullRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  // 需要登录但未登录
  if (!isPublicRoute && !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 需要实名但未实名（排除不需要实名的路由）
  if (!isPublicRoute && !isAuthOnlyRoute && isLoggedIn && !isRealNameVerified) {
    return <Navigate to="/real-name-auth" state={{ from: location }} replace />;
  }

  const handleTabChange = (tab: Tab) => {
    // 如果点击"商城" Tab 且当前已在商城页面，清除缓存强制刷新
    if (tab === 'market' && currentPath === '/market') {
      clearMarketCache();
    }
    // 导航到目标 Tab（如果已经在目标页面，BottomNav 会处理滚动到顶部）
    if (currentPath !== tabToPath[tab]) {
      navigate(tabToPath[tab]);
    }
  };

  const handlePopupClose = () => {
    const next = popupQueue.slice(1);
    setPopupQueue(next);
    if (next.length === 0) {
      setShowPopupAnnouncement(false);
    }
  };

  const handlePopupDontShowToday = () => {
    const current = popupQueue[0];
    if (current?.id != null) {
      try {
        localStorage.setItem(
          `${POPUP_DISMISSED_KEY_PREFIX}${current.id}`,
          new Date().toDateString()
        );
      } catch (e) {
        // ignore
      }
    }
    handlePopupClose();
  };

  const isPopupVisible = showPopupAnnouncement && popupQueue.length > 0;
  const isPageLevelPullRefreshRoute =
    currentPath.startsWith('/activity/team-leaderboard') ||
    currentPath.startsWith('/product/');

  return (
    <div className="bg-gray-100 min-h-screen-dynamic font-sans antialiased text-gray-900 max-w-md mx-auto relative shadow-2xl">
      <ScrollToTop />
      {/* 在线客服组件 */}
      <ChatWidget autoOpen={0} />
      {/* 可拖动客服悬浮按钮 */}
      <DraggableChatButton />
      {/* 全局弹窗公告 */}
      <PopupAnnouncementModal
        visible={isPopupVisible}
        announcement={popupQueue[0] ?? null}
        onClose={handlePopupClose}
        onDontShowToday={handlePopupDontShowToday}
      />
      <PullToRefresh
        onRefresh={handlePullRefresh}
        disabled={isPopupVisible || isPageLevelPullRefreshRoute}
        className="min-h-screen-dynamic"
      >
        <div className="min-h-screen-dynamic bg-gray-50 pb-safe">
          <Outlet />
        </div>
      </PullToRefresh>
      {showBottomNav && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  );
};

export default MainLayout;
