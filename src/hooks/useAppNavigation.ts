/**
 * 应用导航 Hook
 * 提供与旧系统兼容的导航方法
 */
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import type { Route } from '../../router/routes';

// 旧路由到新路由的映射
const routeToPath: Record<string, string | ((params?: any) => string)> = {
  // 基础页面
  login: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
  'reset-login-password': '/reset-login-password',
  'reset-pay-password': '/reset-pay-password',
  'privacy-policy': '/privacy-policy',
  'user-agreement': '/user-agreement',
  'about-us': '/about-us',
  'real-name-auth': '/real-name-auth',
  'edit-profile': '/edit-profile',
  'address-list': '/address-list',
  'card-management': '/card-management',
  settings: '/settings',
  'agent-auth': '/agent-auth',
  'my-friends': '/my-friends',
  'invite-friends': '/invite-friends',
  'account-deletion': '/account-deletion',
  'notification-settings': '/notification-settings',
  'user-survey': '/user-survey',
  'sign-in': '/sign-in',
  'online-service': '/online-service',
  'help-center': '/help-center',
  'message-center': '/message-center',
  news: '/news',
  'trading-zone': '/trading-zone',
  'artist-showcase': '/artist-showcase',
  'masterpiece-showcase': '/masterpiece-showcase',
  'asset-view': '/asset-view',
  'balance-recharge': '/balance-recharge',
  'balance-withdraw': '/balance-withdraw',
  'service-recharge': '/service-recharge',
  'extension-withdraw': '/extension-withdraw',
  'consignment-voucher': '/consignment-voucher',
  'cumulative-rights': '/cumulative-rights',
  'my-collection': '/my-collection',
  'claim-history': '/claim-history',
  'hashrate-exchange': '/hashrate-exchange',
  reservation: '/reservation',
  'reservation-record': '/reservation-record',

  // 带参数的路由
  'news-detail': (params) => `/news/${params?.id || ''}`,
  'artist-detail': (params) => `/artist/${params?.id || ''}`,
  'friend-detail': (params) => `/friend-detail/${params?.id || ''}`,
  'product-detail': (params) => `/product/${params?.id || ''}`,
  'points-product-detail': (params) => `/points-product/${params?.id || ''}`,
  'order-detail': (params) => `/order/${params?.orderId || ''}`,
  'order-list': (params) => `/orders/${params?.kind || 'product'}/${params?.status || 0}`,
  cashier: (params) => `/cashier/${params?.orderId || ''}`,
  'asset-history': (params) => `/asset-history/${params?.type || ''}`,
  'my-collection-detail': (params) => `/my-collection/${params?.id || ''}`,
  'claim-detail': (params) => `/claim-detail/${params?.id || ''}`,
  'artist-works-showcase': (params) => `/artist-works/${params?.artistId || ''}`,
};

export function useAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { setActiveTab } = useAppStore();

  // 导航到指定路由
  const navigateRoute = useCallback(
    (route: Route | string | null, options?: { replace?: boolean }) => {
      if (route === null) {
        // 返回主页
        navigate('/', { replace: options?.replace });
        return;
      }

      let path: string;

      if (typeof route === 'string') {
        // 兼容旧的字符串路由
        const mapping = routeToPath[route];
        path = typeof mapping === 'function' ? mapping() : mapping || '/';
      } else {
        // 新的 Route 对象
        const mapping = routeToPath[route.name];
        path = typeof mapping === 'function' ? mapping(route) : mapping || '/';
      }

      navigate(path, { replace: options?.replace });
    },
    [navigate]
  );

  // 返回上一页
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // 切换 Tab
  const switchTab = useCallback(
    (tab: 'home' | 'market' | 'rights' | 'live' | 'profile') => {
      const tabPaths = {
        home: '/',
        market: '/market',
        rights: '/rights',
        live: '/live',
        profile: '/profile',
      };
      setActiveTab(tab);
      navigate(tabPaths[tab]);
    },
    [navigate, setActiveTab]
  );

  return {
    navigate,
    navigateRoute,
    goBack,
    switchTab,
    location,
    params,
  };
}

export default useAppNavigation;
