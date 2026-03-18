/**
 * @file 瀵艰埅宸ュ叿鍑芥暟
 * @description 灏佽 React Router 瀵艰埅閫昏緫锛屾彁渚?view ID 鈫?URL 璺緞鐨勬槧灏勶紝
 *              绠€鍖栭〉闈㈢粍浠朵腑鐨勫鑸縼绉汇€傛墍鏈夐〉闈㈠彧闇€浣跨敤 useAppNavigate() hook銆?
 */

import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export const LEGACY_APP_PATH_TO_ROUTE: Record<string, string> = {
  '/pages/market': '/store',
  '/pages/market/index': '/store',
  '/pages/recharge': '/recharge',
  '/pages/recharge/index': '/recharge',
  '/pages/user/poster': '/invite',
  '/pages/user/poster/index': '/invite',
  '/pages/questionnaire': '/questionnaire',
  '/pages/questionnaire/index': '/questionnaire',
};

function normalizeAppPath(path: string) {
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    return {
      pathname: '',
      search: '',
    };
  }

  const hashlessPath = trimmedPath.startsWith('#') ? trimmedPath.slice(1) : trimmedPath;
  const queryIndex = hashlessPath.indexOf('?');
  const rawPathname = queryIndex >= 0 ? hashlessPath.slice(0, queryIndex) : hashlessPath;
  const pathnameWithSlash = rawPathname.startsWith('/') ? rawPathname : `/${rawPathname}`;
  const normalizedPathname = pathnameWithSlash.replace(/\/+$/, '') || '/';

  return {
    pathname: normalizedPathname,
    search: queryIndex >= 0 ? hashlessPath.slice(queryIndex) : '',
  };
}

export function resolveLegacyAppPath(path: string) {
  const { pathname, search } = normalizeAppPath(path);
  const targetPath = LEGACY_APP_PATH_TO_ROUTE[pathname];

  if (!targetPath) {
    return null;
  }

  return `${targetPath}${search}`;
}

/** 静态资源扩展名，这些路径不进行重定向 */
const STATIC_FILE_EXTENSIONS = /\.(txt|html?|js|mjs|cjs|css|ico|png|jpe?g|gif|webp|svg|woff2?|ttf|eot|map)(\?|$)/i;

/** 明确不重定向的路径（如 1.txt） */
const NO_REDIRECT_PATHS = new Set(['/1.txt']);

export function rewriteLegacyBrowserLocationToHashRoute() {
  if (typeof window === 'undefined') {
    return;
  }

  const { pathname, search, hash, origin } = window.location;
  const normalizedPath = normalizeAppPath(pathname).pathname;

  if (!normalizedPath || normalizedPath === '/' || hash) {
    return;
  }

  // 静态文件或明确排除的路径不重定向
  if (NO_REDIRECT_PATHS.has(normalizedPath) || STATIC_FILE_EXTENSIONS.test(normalizedPath)) {
    return;
  }

  const targetPath = resolveLegacyAppPath(normalizedPath) ?? normalizedPath;
  const nextUrl = `${origin}/#${targetPath}${search}`;

  window.history.replaceState(window.history.state, '', nextUrl);
}

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
  questionnaire: '/questionnaire',
  help_center: '/help',
  settings: '/settings',
  edit_profile: '/edit-profile',
  change_password: '/change-password',
  change_pay_password: '/change-pay-password',
  reset_password: '/reset-password',
  reset_pay_password: '/reset-pay-password',
  about: '/about',
  user_agreement: '/user_agreement',
  privacy_policy: '/privacy_policy',
  security: '/security',
  agent_auth: '/agent-auth',
  billing: '/billing',
  my_collection: '/my-collection',
  my_collection_detail: '/my-collection/detail/0',
  my_card_packs: '/my-card-packs',
  genesis_node_activity: '/node-purchase/genesis',
  my_genesis_nodes: '/node-purchase/genesis/records',
  accumulated_rights: '/accumulated-rights',
  growth_rights: '/growth_rights',
  service_fee_recharge: '/service-recharge',
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
  hashrate_exchange: '/hashrate-exchange',
  live: '/live',
  live_webview: '/live/view',
  customer_service: '/support/chat',
  reservations: '/reservations',
  item_detail: '/item-detail/0/0',
  matching: '/matching',
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
    const path = VIEW_TO_PATH[viewId] ?? resolveLegacyAppPath(viewId);
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

    const fallbackPath = VIEW_TO_PATH[fallbackViewId] ?? resolveLegacyAppPath(fallbackViewId);
    navigate(fallbackPath ?? fallbackViewId);
  }, [canGoBack, navigate]);

  return useMemo(() => ({ goTo, goBack, goBackOr, navigate }), [goTo, goBack, goBackOr, navigate]);
}
