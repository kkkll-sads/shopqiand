/**
 * @file 导航工具函数
 * @description 封装 React Router 导航逻辑，提供 view ID → URL 路径的映射，
 *              简化页面组件中的导航迁移。所有页面只需使用 useAppNavigate() hook。
 */

import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * view ID → URL 路径映射表
 * 将旧版 CustomEvent 中使用的 view ID 映射到 React Router 路径
 */
export const VIEW_TO_PATH: Record<string, string> = {
  // 底部 Tab 页（一级路由）
  home: '/',
  store: '/store',
  shield: '/shield',
  order: '/order',
  user: '/user',

  // 子页面路由
  product_detail: '/product/0',        // 默认 ID，实际使用时传入具体 ID
  category: '/category',
  search: '/search',
  search_result: '/search/result',
  cart: '/cart',
  checkout: '/checkout',
  cashier: '/cashier',
  payment_result: '/payment/result',
  order_detail: '/order/detail/0',     // 默认 ID
  logistics: '/logistics/0',           // 默认 ID
  after_sales: '/after-sales',
  coupon: '/coupon',
  address: '/address',
  favorites: '/favorites',
  message_center: '/messages',
  announcement: '/announcement',
  help_center: '/help',
  settings: '/settings',
  about: '/about',
  security: '/security',
  billing: '/billing',
  real_name_auth: '/auth/real-name',
  invite: '/invite',
  friends: '/friends',
  trading_zone: '/trading',
  trading_detail: '/trading/detail/0', // 默认 ID
  pre_order: '/trading/pre-order/0',   // 默认 ID
  rights_history: '/rights/history',
  recharge: '/recharge',
  transfer: '/transfer',
  rights_transfer: '/rights/transfer',
  withdraw: '/withdraw',
  live: '/live',
  live_webview: '/live/view',
  product_qa: '/product/0/qa',         // 默认 ID
  reviews: '/product/0/reviews',       // 默认 ID
  add_review: '/product/0/review/new', // 默认 ID
  service_description: '/service-description',
  login: '/login',
  register: '/register',
  design: '/design',
};

/**
 * 底部 Tab 页的 path 列表，用于判断是否显示底部 Tab
 */
export const TAB_PATHS = ['/', '/store', '/shield', '/order', '/user'];

/**
 * 底部 Tab 的 path → tab ID 映射（用于 BottomTab 高亮判断）
 */
export const PATH_TO_TAB: Record<string, string> = {
  '/': 'home',
  '/store': 'store',
  '/shield': 'shield',
  '/order': 'order',
  '/user': 'user',
};

/**
 * 判断当前路径是否为底部 Tab 页
 * @param pathname - 当前路径
 * @returns 是否为 Tab 页
 */
export function isTabPage(pathname: string): boolean {
  return TAB_PATHS.includes(pathname);
}

/**
 * 自定义导航 Hook
 * @description 封装 react-router-dom 的 useNavigate，提供 goTo 和 goBack 方法，
 *              支持旧版 view ID 导航方式，简化迁移。
 * 
 * @example
 * ```tsx
 * const { goTo, goBack } = useAppNavigate();
 * 
 * // 跳转到指定页面（使用旧 view ID）
 * goTo('store');
 * goTo('product_detail');
 * 
 * // 返回上一页
 * goBack();
 * ```
 */
export function useAppNavigate() {
  const navigate = useNavigate();

  const canGoBack = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const historyState = window.history.state as { idx?: number } | null;
    if (typeof historyState?.idx === 'number') {
      return historyState.idx > 0;
    }

    return window.history.length > 1;
  }, []);

  /** 
   * 跳转到指定页面
   * @param viewId - 旧版 view ID 或 URL 路径
   */
  const goTo = useCallback((viewId: string) => {
    const path = VIEW_TO_PATH[viewId];
    if (path) {
      navigate(path);
    } else {
      // 如果不在映射表中，尝试直接作为路径使用
      navigate(viewId);
    }
  }, [navigate]);

  /**
   * 返回上一页，如果没有历史记录则回到首页
   */
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goBackOr = useCallback((fallbackViewId: string) => {
    if (canGoBack()) {
      navigate(-1);
      return;
    }

    const fallbackPath = VIEW_TO_PATH[fallbackViewId];
    navigate(fallbackPath ?? fallbackViewId);
  }, [canGoBack, navigate]);

  return useMemo(() => ({ goTo, goBack, goBackOr, navigate }), [goTo, goBack, goBackOr, navigate]);
}
