/**
 * 路由导航统一工具
 * 提供类型安全的路由导航方法
 */
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

// 路由路径常量
export const ROUTES = {
  // 主 Tab
  HOME: '/',
  MARKET: '/market',
  RIGHTS: '/rights',
  LIVE: '/live',
  PROFILE: '/profile',

  // 认证
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // 用户
  SETTINGS: '/settings',
  EDIT_PROFILE: '/edit-profile',
  ADDRESS_LIST: '/address-list',
  REAL_NAME_AUTH: '/real-name-auth',
  AGENT_AUTH: '/agent-auth',
  MY_FRIENDS: '/my-friends',
  INVITE_FRIENDS: '/invite-friends',
  ACCOUNT_DELETION: '/account-deletion',
  NOTIFICATION_SETTINGS: '/notification-settings',
  USER_SURVEY: '/user-survey',
  RESET_LOGIN_PASSWORD: '/reset-login-password',
  RESET_PAY_PASSWORD: '/reset-pay-password',

  // CMS
  NEWS: '/news',
  MESSAGE_CENTER: '/message-center',
  SIGN_IN: '/sign-in',
  HELP_CENTER: '/help-center',
  ONLINE_SERVICE: '/online-service',
  ABOUT_US: '/about-us',
  PRIVACY_POLICY: '/privacy-policy',
  USER_AGREEMENT: '/user-agreement',

  // 市场
  TRADING_ZONE: '/trading-zone',
  ARTIST_SHOWCASE: '/artist-showcase',
  MASTERPIECE_SHOWCASE: '/masterpiece-showcase',
  RESERVATION: '/reservation',
  RESERVATION_RECORD: '/reservation-record',

  // 资产
  ASSET_VIEW: '/asset-view',
  BALANCE_RECHARGE: '/balance-recharge',
  BALANCE_WITHDRAW: '/balance-withdraw',
  SERVICE_RECHARGE: '/service-recharge',
  EXTENSION_WITHDRAW: '/extension-withdraw',
  CARD_MANAGEMENT: '/card-management',
  CONSIGNMENT_VOUCHER: '/consignment-voucher',
  CUMULATIVE_RIGHTS: '/cumulative-rights',
  MY_COLLECTION: '/my-collection',
  CLAIM_HISTORY: '/claim-history',
  HASHRATE_EXCHANGE: '/hashrate-exchange',
} as const;

// 动态路由生成器
export const generatePath = {
  newsDetail: (id: string) => `/news/${id}`,
  productDetail: (id: string) => `/product/${id}`,
  artistDetail: (id: string) => `/artist/${id}`,
  artistWorks: (artistId: string) => `/artist-works/${artistId}`,
  friendDetail: (id: string) => `/friend-detail/${id}`,
  orderDetail: (orderId: string) => `/order/${orderId}`,
  orderList: (category: string, status: number | string) => `/orders/${category}/${status}`,
  cashier: (orderId: string) => `/cashier/${orderId}`,
  assetHistory: (type: string) => `/asset-history/${type}`,
  collectionDetail: (id: string) => `/my-collection/${id}`,
  claimDetail: (id: string) => `/claim-detail/${id}`,
};

/**
 * 路由导航 Hook
 */
export function useRouteNavigation() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  // 返回上一页
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // 导航到指定路径
  const goTo = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      navigate(path, { replace: options?.replace });
    },
    [navigate]
  );

  // 导航到 Tab
  const goToTab = useCallback(
    (tab: 'home' | 'market' | 'rights' | 'live' | 'profile') => {
      const paths = {
        home: ROUTES.HOME,
        market: ROUTES.MARKET,
        rights: ROUTES.RIGHTS,
        live: ROUTES.LIVE,
        profile: ROUTES.PROFILE,
      };
      navigate(paths[tab]);
    },
    [navigate]
  );

  // 带参数导航
  const goToDetail = useCallback(
    (type: keyof typeof generatePath, id: string | number, options?: { replace?: boolean }) => {
      const generator = generatePath[type];
      if (typeof generator === 'function') {
        navigate(generator(String(id)), { replace: options?.replace });
      }
    },
    [navigate]
  );

  return {
    navigate,
    goBack,
    goTo,
    goToTab,
    goToDetail,
    params,
    location,
    currentPath: location.pathname,
  };
}

export default useRouteNavigation;
