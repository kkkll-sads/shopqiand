/**
 * 应用导航工具 Hook
 * 
 * 封装 React Router 的 useNavigate，提供与旧版 CustomEvent 兼容的导航接口：
 * - goTo(view, params?) — 替代 CustomEvent('change-view')
 * - goBack() — 替代 CustomEvent('go-back')
 * 
 * view ID 会自动映射到对应的 URL 路径，Tab 页跳转使用 replace 模式（不入栈）。
 */
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

// ============================================================
// view ID → URL 路径的完整映射表
// ============================================================
const VIEW_TO_PATH: Record<string, string> = {
  // 底部 Tab 页
  home: '/',
  store: '/store',
  shield: '/shield',
  order: '/order',
  user: '/user',

  // 商品相关
  product_detail: '/product/:id',
  category: '/category',
  search: '/search',
  search_result: '/search/result',
  product_qa: '/product/:id/qa',
  reviews: '/product/:id/reviews',
  add_review: '/product/:id/review/new',
  service_description: '/service-description',

  // 购物流程
  cart: '/cart',
  checkout: '/checkout',
  cashier: '/cashier',
  payment_result: '/payment/result',

  // 订单相关
  order_detail: '/order/:id',
  logistics: '/logistics/:id',
  after_sales: '/after-sales',

  // 用户中心
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

  // 交易相关
  trading_zone: '/trading',
  trading_detail: '/trading/:id',
  pre_order: '/trading/:id/pre-order',

  // 权益相关
  rights_history: '/rights/history',
  recharge: '/recharge',
  transfer: '/transfer',
  rights_transfer: '/rights/transfer',
  withdraw: '/withdraw',

  // 直播
  live: '/live',
  live_webview: '/live/view',

  // 认证
  login: '/login',
  register: '/register',

  // 开发工具
  design: '/design',
};

/** 底部 Tab 页 view ID 列表 */
const TAB_VIEWS = ['home', 'store', 'shield', 'order', 'user'];

/**
 * 应用导航 Hook
 * 
 * @returns {{ goTo, goBack, navigate }}
 * - goTo(view, params?) - 根据 view ID 跳转到对应页面
 * - goBack() - 返回上一页
 * - navigate - 原始的 useNavigate 返回值，用于高级场景
 */
export function useAppNavigate() {
  const navigate = useNavigate();

  /**
   * 跳转到指定页面（替代 change-view 事件）
   * 
   * @param view - 页面的 view ID（如 'product_detail'、'order' 等）
   * @param params - 可选的路径参数（如 { id: '123' }）
   * 
   * @example
   * goTo('product_detail', { id: '123' })  // 跳转到 /product/123
   * goTo('store')                            // 跳转到 /store（Tab 页，使用 replace）
   */
  const goTo = useCallback((view: string, params?: Record<string, string>) => {
    let path = VIEW_TO_PATH[view];
    if (!path) {
      console.warn(`[useAppNavigate] 未知的 view ID: ${view}`);
      return;
    }

    // 替换路径中的参数占位符（如 :id → 实际值）
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        path = path!.replace(`:${key}`, value);
      });
    } else {
      // 没有传参数时，为含参数路由提供默认值
      path = path.replace(/:id/g, '1');
    }

    // Tab 页使用 replace 模式（不入浏览器历史栈）
    if (TAB_VIEWS.includes(view)) {
      navigate(path, { replace: true });
    } else {
      navigate(path);
    }
  }, [navigate]);

  /**
   * 返回上一页（替代 go-back 事件）
   * 使用浏览器原生历史记录后退
   */
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return { goTo, goBack, navigate };
}
