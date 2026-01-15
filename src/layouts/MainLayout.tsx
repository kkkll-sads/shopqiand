/**
 * 主布局组件
 * 包含底部导航栏和认证守卫
 */
import React from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import BottomNav from '../../components/BottomNav';
import { useAuthStore } from '../stores/authStore';
import type { Tab } from '../../types';

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
  '/',
  '/home',
  '/market',
  '/privacy-policy',
  '/user-agreement',
  '/about-us',
  '/help-center',
  '/online-service',
  '/news',
  '/artist-showcase',
  '/masterpiece-showcase',
];

// 需要登录但不需要实名的路由
const authOnlyRoutes = ['/real-name-auth', '/settings', '/profile', '/live', '/rights'];

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, isRealNameVerified } = useAuthStore();
  const currentPath = location.pathname;

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

  // 需要登录但未登录
  if (!isPublicRoute && !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 需要实名但未实名（排除不需要实名的路由）
  if (!isPublicRoute && !isAuthOnlyRoute && isLoggedIn && !isRealNameVerified) {
    return <Navigate to="/real-name-auth" state={{ from: location }} replace />;
  }

  const handleTabChange = (tab: Tab) => {
    navigate(tabToPath[tab]);
  };

  return (
    <div className="bg-gray-100 min-h-screen-dynamic font-sans antialiased text-gray-900 max-w-md mx-auto relative shadow-2xl">
      <div className="min-h-screen-dynamic bg-gray-50 pb-safe">
        <Outlet />
      </div>
      {showBottomNav && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  );
};

export default MainLayout;
