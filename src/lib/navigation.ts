/**
 * @file 瀵艰埅宸ュ叿鍑芥暟
 * @description 灏佽 React Router 瀵艰埅閫昏緫锛屾彁渚?view ID 鈫?URL 璺緞鐨勬槧灏勶紝
 *              绠€鍖栭〉闈㈢粍浠朵腑鐨勫鑸縼绉汇€傛墍鏈夐〉闈㈠彧闇€浣跨敤 useAppNavigate() hook銆?
 */

import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * view ID 鈫?URL 璺緞鏄犲皠琛?
 * 灏嗘棫鐗?CustomEvent 涓娇鐢ㄧ殑 view ID 鏄犲皠鍒?React Router 璺緞
 */
export const VIEW_TO_PATH: Record<string, string> = {
  // 搴曢儴 Tab 椤碉紙涓€绾ц矾鐢憋級
  home: '/',
  store: '/store',
  shield: '/shield',
  order: '/order',
  user: '/user',

  // 瀛愰〉闈㈣矾鐢?
  product_detail: '/product/0',        // 榛樿 ID锛屽疄闄呬娇鐢ㄦ椂浼犲叆鍏蜂綋 ID
  category: '/category',
  search: '/search',
  search_result: '/search/result',
  cart: '/cart',
  checkout: '/checkout',
  cashier: '/cashier',
  payment_result: '/payment/result',
  order_detail: '/order/detail/0',     // 榛樿 ID
  logistics: '/logistics/0',           // 榛樿 ID
  after_sales: '/after-sales',
  coupon: '/coupon',
  consignment_voucher: '/consignment-voucher',
  address: '/address',
  payment_accounts: '/payment-accounts',
  favorites: '/favorites',
  message_center: '/messages',
  announcement: '/announcement',
  activity_center: '/activity-center',
  help_center: '/help',
  settings: '/settings',
  change_password: '/change-password',
  change_pay_password: '/change-pay-password',
  reset_password: '/reset-password',
  reset_pay_password: '/reset-pay-password',
  about: '/about',
  user_agreement: '/user_agreement',
  privacy_policy: '/privacy_policy',
  security: '/security',
  billing: '/billing',
  my_collection: '/my-collection',
  my_card_packs: '/my-card-packs',
  accumulated_rights: '/accumulated-rights',
  growth_rights: '/accumulated-rights',
  real_name_auth: '/auth/real-name',
  invite: '/invite',
  friends: '/friends',
  trading_zone: '/trading',
  trading_detail: '/trading/detail/0', // 榛樿 ID
  pre_order: '/trading/pre-order/0',   // 榛樿 ID
  rights_history: '/rights/history',
  recharge: '/recharge',
  transfer: '/transfer',
  rights_transfer: '/rights/transfer',
  withdraw: '/withdraw',
  live: '/live',
  live_webview: '/live/view',
  reservations: '/reservations',
  flash_sale: '/flash-sale',
  product_qa: '/product/0/qa',         // 榛樿 ID
  reviews: '/product/0/reviews',       // 榛樿 ID
  add_review: '/product/0/review/new', // 榛樿 ID
  service_description: '/service-description',
  sign_in: '/sign-in',
  login: '/login',
  register: '/register',
  design: '/design',
};

/**
 * 搴曢儴 Tab 椤电殑 path 鍒楄〃锛岀敤浜庡垽鏂槸鍚︽樉绀哄簳閮?Tab
 */
export const TAB_PATHS = ['/', '/store', '/shield', '/order', '/user'];

/**
 * 搴曢儴 Tab 鐨?path 鈫?tab ID 鏄犲皠锛堢敤浜?BottomTab 楂樹寒鍒ゆ柇锛?
 */
export const PATH_TO_TAB: Record<string, string> = {
  '/': 'home',
  '/store': 'store',
  '/shield': 'shield',
  '/order': 'order',
  '/user': 'user',
};

/**
 * 鍒ゆ柇褰撳墠璺緞鏄惁涓哄簳閮?Tab 椤?
 * @param pathname - 褰撳墠璺緞
 * @returns 鏄惁涓?Tab 椤?
 */
export function isTabPage(pathname: string): boolean {
  return TAB_PATHS.includes(pathname);
}

/**
 * 鑷畾涔夊鑸?Hook
 * @description 灏佽 react-router-dom 鐨?useNavigate锛屾彁渚?goTo 鍜?goBack 鏂规硶锛?
 *              鏀寔鏃х増 view ID 瀵艰埅鏂瑰紡锛岀畝鍖栬縼绉汇€?
 * 
 * @example
 * ```tsx
 * const { goTo, goBack } = useAppNavigate();
 * 
 * // 璺宠浆鍒版寚瀹氶〉闈紙浣跨敤鏃?view ID锛?
 * goTo('store');
 * goTo('product_detail');
 * 
 * // 杩斿洖涓婁竴椤?
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
   * 璺宠浆鍒版寚瀹氶〉闈?
   * @param viewId - 鏃х増 view ID 鎴?URL 璺緞
   */
  const goTo = useCallback((viewId: string) => {
    const path = VIEW_TO_PATH[viewId];
    if (path) {
      navigate(path);
    } else {
      // 濡傛灉涓嶅湪鏄犲皠琛ㄤ腑锛屽皾璇曠洿鎺ヤ綔涓鸿矾寰勪娇鐢?
      navigate(viewId);
    }
  }, [navigate]);

  /**
   * 杩斿洖涓婁竴椤碉紝濡傛灉娌℃湁鍘嗗彶璁板綍鍒欏洖鍒伴椤?
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


