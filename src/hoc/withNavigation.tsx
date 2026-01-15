/**
 * withNavigation - 导航高阶组件
 * 
 * 为页面组件统一注入 onBack 和 onNavigate props
 * 解决 Wrapper 组件未传递导航回调的问题
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Route } from '../../router/routes';

// 路由名称到路径的映射
const routeToPath = (route: Route): string => {
  const { name, ...params } = route;
  
  const mapping: Record<string, string | ((p: any) => string)> = {
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
    'artist-works-showcase': (p) => `/artist-works/${p?.artistId || ''}`,
    'masterpiece-showcase': '/masterpiece-showcase',
    reservation: '/reservation',
    'reservation-record': '/reservation-record',
    'order-list': (p) => `/orders/${p?.kind || 'product'}/${p?.status || 0}`,
    'order-detail': (p) => `/order/${p?.orderId || ''}`,
    cashier: (p) => `/cashier/${p?.orderId || ''}`,
    'switch-to-market': '/market',

    // 钱包/资产
    'asset-view': (p) => (p?.tab !== undefined ? `/asset-view?tab=${p.tab}` : '/asset-view'),
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

  const result = mapping[name];
  if (!result) {
    console.warn(`[withNavigation] 未知路由: ${name}`);
    return '/';
  }
  
  return typeof result === 'function' ? result(params) : result;
};

/**
 * 导航 Props 接口
 */
export interface NavigationProps {
  onBack: () => void;
  onNavigate: (route: Route) => void;
}

/**
 * withNavigation 高阶组件
 * 
 * @param WrappedComponent - 需要注入导航的页面组件
 * @returns 包装后的组件
 * 
 * @example
 * // 使用方式
 * const SignInWithNav = withNavigation(SignIn);
 * <SignInWithNav /> // 自动拥有 onBack 和 onNavigate
 */
export function withNavigation<P extends Partial<NavigationProps>>(
  WrappedComponent: React.ComponentType<P>
): React.FC<Omit<P, keyof NavigationProps>> {
  const WithNavigationComponent: React.FC<Omit<P, keyof NavigationProps>> = (props) => {
    const navigate = useNavigate();

    const handleBack = () => {
      navigate(-1);
    };

    const handleNavigate = (route: Route) => {
      const path = routeToPath(route);
      navigate(path);
    };

    return (
      <WrappedComponent
        {...(props as P)}
        onBack={handleBack}
        onNavigate={handleNavigate}
      />
    );
  };

  // 设置显示名称，方便调试
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithNavigationComponent.displayName = `withNavigation(${displayName})`;

  return WithNavigationComponent;
}

export default withNavigation;
