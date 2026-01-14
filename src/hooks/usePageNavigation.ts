/**
 * usePageNavigation - 统一的页面导航 Hook
 *
 * 替代旧的 onNavigate props，直接使用 React Router
 * 提供类型安全的路由跳转方法
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

// 路由路径映射
const routePaths: Record<string, string | ((params?: any) => string)> = {
  // 认证
  login: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
  'reset-login-password': '/reset-login-password',
  'reset-pay-password': '/reset-pay-password',

  // 主页面
  home: '/',
  market: '/market',
  rights: '/rights',
  live: '/live',
  profile: '/profile',

  // 用户
  settings: '/settings',
  'edit-profile': '/edit-profile',
  'address-list': '/address-list',
  'real-name-auth': '/real-name-auth',
  'agent-auth': '/agent-auth',
  'my-friends': '/my-friends',
  'friend-detail': (p) => `/friend-detail/${p?.id || ''}`,
  'invite-friends': '/invite-friends',
  'account-deletion': '/account-deletion',
  'notification-settings': '/notification-settings',
  'user-survey': '/user-survey',

  // CMS/内容
  news: '/news',
  'news-detail': (p) => `/news/${p?.id || ''}`,
  'message-center': '/message-center',
  'sign-in': '/sign-in',
  'help-center': '/help-center',
  'online-service': '/online-service',
  'about-us': '/about-us',
  'privacy-policy': '/privacy-policy',
  'user-agreement': '/user-agreement',

  // 市场/交易
  'product-detail': (p) => `/product/${p?.id || ''}`,
  'points-product-detail': (p) => `/points-product/${p?.id || ''}`,
  'trading-zone': '/trading-zone',
  'artist-showcase': '/artist-showcase',
  'artist-detail': (p) => `/artist/${p?.id || ''}`,
  'artist-works': (p) => `/artist-works/${p?.artistId || ''}`,
  'masterpiece-showcase': '/masterpiece-showcase',
  reservation: '/reservation',
  'reservation-record': '/reservation-record',
  'order-list': (p) => `/orders/${p?.kind || 'product'}/${p?.status || 0}`,
  'order-detail': (p) => `/order/${p?.orderId || ''}`,
  cashier: (p) => `/cashier/${p?.orderId || ''}`,

  // 钱包/资产
  'asset-view': '/asset-view',
  'asset-history': (p) => `/asset-history/${p?.type || ''}`,
  'balance-recharge': '/balance-recharge',
  'balance-withdraw': '/balance-withdraw',
  'service-recharge': '/service-recharge',
  'extension-withdraw': '/extension-withdraw',
  'card-management': '/card-management',
  'consignment-voucher': '/consignment-voucher',
  'cumulative-rights': '/cumulative-rights',
  'my-collection': '/my-collection',
  'my-collection-detail': (p) => `/my-collection/${p?.id || ''}`,
  'claim-history': '/claim-history',
  'claim-detail': (p) => `/claim-detail/${p?.id || ''}`,
  'hashrate-exchange': '/hashrate-exchange',
};

export interface NavigateOptions {
  replace?: boolean;
  state?: any;
}

/**
 * 页面导航 Hook
 */
export function usePageNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * 通过路由名称导航
   */
  const navigateTo = useCallback(
    (routeName: string, params?: Record<string, any>, options?: NavigateOptions) => {
      const pathOrFn = routePaths[routeName];
      if (!pathOrFn) {
        console.warn(`未知路由: ${routeName}`);
        return;
      }

      const path = typeof pathOrFn === 'function' ? pathOrFn(params) : pathOrFn;
      navigate(path, options);
    },
    [navigate]
  );

  /**
   * 直接通过路径导航
   */
  const navigateToPath = useCallback(
    (path: string, options?: NavigateOptions) => {
      navigate(path, options);
    },
    [navigate]
  );

  /**
   * 返回上一页
   */
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /**
   * 返回首页
   */
  const goHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /**
   * 切换 Tab
   */
  const switchTab = useCallback(
    (tab: 'home' | 'market' | 'rights' | 'live' | 'profile') => {
      const tabPaths = {
        home: '/',
        market: '/market',
        rights: '/rights',
        live: '/live',
        profile: '/profile',
      };
      navigate(tabPaths[tab]);
    },
    [navigate]
  );

  /**
   * 兼容旧的 Route 对象格式
   * @deprecated 请直接使用 navigateTo
   */
  const handleLegacyRoute = useCallback(
    (route: { name: string; [key: string]: any }) => {
      const { name, ...params } = route;
      navigateTo(name, params);
    },
    [navigateTo]
  );

  return {
    navigate,
    navigateTo,
    navigateToPath,
    goBack,
    goHome,
    switchTab,
    handleLegacyRoute,
    currentPath: location.pathname,
    location,
  };
}

export default usePageNavigation;
