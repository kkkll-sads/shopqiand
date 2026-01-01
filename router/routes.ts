/**
 * routes.ts - 统一的路由类型与编解码
 *
 * 将散落的字符串路由统一收敛为 Route 对象，提供编码/解码与类型辅助。
 */

import { TeamMember } from '../types';

// Route 主体定义（不含 back 字段，避免递归定义）
export type RoutePayload =
  // 基础/静态页面
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'forgot-password' }
  | { name: 'reset-login-password'; from?: string }
  | { name: 'reset-pay-password'; from?: string }
  | { name: 'privacy-policy'; from?: string }
  | { name: 'user-agreement'; from?: string }
  | { name: 'about-us'; from?: 'home' | 'settings' | string }
  | { name: 'real-name-auth' }
  | { name: 'edit-profile' }
  | { name: 'address-list' }
  | { name: 'card-management' }
  | { name: 'settings' }
  | { name: 'agent-auth' }
  | { name: 'my-friends' }
  | { name: 'invite-friends' }
  | { name: 'account-deletion' }
  | { name: 'notification-settings' }
  | { name: 'user-survey' }
  | { name: 'sign-in' }
  | { name: 'online-service' }
  | { name: 'help-center' }
  | { name: 'message-center' }
  | { name: 'asset-trace' }
  | { name: 'search'; code?: string }
  | { name: 'switch-to-market' }
  // 新闻/内容
  | { name: 'news'; activeTab?: 'announcement' | 'dynamic' }
  | { name: 'news-detail'; id: string; from?: RoutePayload | null }
  // 市场/订单
  | { name: 'product-detail'; origin?: 'market' | 'artist' | 'trading-zone' | 'reservation-record'; productType?: 'shop' | 'collection' }
  | { name: 'points-product-detail'; origin?: 'market' | 'artist' | 'trading-zone' | 'reservation-record' }
  | { name: 'reservation'; from?: RoutePayload | null }
  | { name: 'reservation-record' }
  | { name: 'reservation-detail'; id: number | string }
  | { name: 'trading-zone' }
  | { name: 'trading-zone-items'; sessionId: string; sessionTitle?: string; sessionStartTime?: string; sessionEndTime?: string }
  | { name: 'artist-showcase' }
  | { name: 'artist-detail'; id: string }
  | { name: 'artist-works-showcase'; artistId: string }
  | { name: 'masterpiece-showcase' }
  | { name: 'order-list'; kind: 'product' | 'transaction' | 'delivery' | 'points'; status: number }
  | { name: 'order-detail'; orderId: string; back?: RoutePayload | null }
  | { name: 'cashier'; orderId: string; back?: RoutePayload | null }
  // 钱包/资产
  | { name: 'asset-view'; tab?: number }
  | { name: 'asset-history'; type: string; title?: string }
  | { name: 'hashrate-exchange'; source?: 'profile' | 'reservation' | 'asset-view' }
  | { name: 'balance-recharge'; source?: 'profile' | 'reservation' | 'asset-view'; amount?: string }
  | { name: 'balance-withdraw'; source?: 'profile' | 'asset-view' }
  | { name: 'service-recharge'; source?: 'profile' | 'asset-view' }
  | { name: 'extension-withdraw' }
  | { name: 'consignment-voucher' }
  | { name: 'cumulative-rights' }
  | { name: 'my-collection' }
  | { name: 'my-collection-detail'; id: string }
  | { name: 'my-collection-consignment'; id: string }
  | { name: 'claim-history' }
  | { name: 'claim-detail'; id: string }
  | { name: 'recharge-order-list' }
  | { name: 'recharge-order-detail'; orderId: string }
  | { name: 'withdraw-order-list' }
  | { name: 'withdraw-order-detail'; orderId: string }
  | { name: 'friend-detail'; id: string; friend?: TeamMember };

// 导航过程中可携带 back，类型安全的回退路径
export type Route = RoutePayload & { back?: RoutePayload | null };

// 外部输入可兼容旧字符串
export type RouteInput = Route | RoutePayload | string | null;

/**
 * 将 RoutePayload 编码为字符串（保留与旧逻辑兼容）
 */
export function encodeRoute(r: RoutePayload): string {
  switch (r.name) {
    case 'settings':
      return 'service-center:settings';
    case 'reset-login-password':
      return r.from ? `service-center:reset-login-password` : 'reset-login-password';
    case 'reset-pay-password':
      return r.from ? `service-center:reset-pay-password` : 'reset-pay-password';
    case 'notification-settings':
      return 'service-center:notification-settings';
    case 'account-deletion':
      return 'service-center:account-deletion';
    case 'edit-profile':
      return 'service-center:edit-profile';
    case 'message-center':
      return 'service-center:message';
    case 'about-us':
      return r.from === 'home' ? 'home:about-us' : 'about-us';
    case 'user-agreement':
      return r.from === 'profile' ? 'profile:user-agreement' : 'user-agreement';
    case 'news':
      return r.activeTab ? `news:${r.activeTab}` : 'news';
    case 'news-detail':
      return `news-detail:${r.id}`;
    case 'artist-detail':
      return `artist-detail:${r.id}`;
    case 'artist-works-showcase':
      return `artist-works-showcase:${r.artistId}`;
    case 'cashier':
      return `cashier:${r.orderId}`;
    case 'order-detail':
      return `order-detail:${r.orderId}`;
    case 'order-list':
      return `order-list:${r.kind}:${r.status}`;
    case 'asset-view':
      return typeof r.tab === 'number' ? `asset-view:${r.tab}` : 'asset-view';
    case 'asset-history':
      return r.title ? `asset-history:${r.type}:${r.title}` : `asset-history:${r.type}`;
    case 'hashrate-exchange':
      return r.source ? `wallet:hashrate_exchange:${r.source}` : 'wallet:hashrate_exchange';
    case 'balance-recharge': {
      const parts = ['asset', 'balance-recharge'];
      if (r.source) parts.push(r.source);
      if (r.amount) parts.push(r.amount);
      return parts.join(':');
    }
    case 'balance-withdraw': {
      const parts = ['asset', 'balance-withdraw'];
      if (r.source) parts.push(r.source);
      return parts.join(':');
    }
    case 'service-recharge': {
      const parts = ['asset', 'service-recharge'];
      if (r.source) parts.push(r.source);
      return parts.join(':');
    }
    case 'claim-detail':
      return `claim-detail:${r.id}`;
    case 'my-collection-detail':
      return `my-collection-detail:${r.id}`;
    case 'my-collection-consignment':
      return `my-collection-action:consignment:${r.id}`;
    case 'friend-detail':
      return `friend-detail:${r.id}`;
    default:
      return r.name;
  }
}

/**
 * 将字符串解码为 RoutePayload
 * 兼容旧的子页面字符串格式
 */
export function decodeRoute(s: string): RoutePayload {
  const parts = s.split(':');
  const name = parts[0];

  switch (name) {
    case 'news-center':
      return { name: 'news' };
    case 'news':
      return { name: 'news', activeTab: (parts[1] as 'announcement' | 'dynamic') || undefined };
    case 'news-detail':
      return { name: 'news-detail', id: parts[1] || '' };
    case 'artist-detail':
      return { name: 'artist-detail', id: parts[1] || '' };
    case 'artist-works-showcase':
      return { name: 'artist-works-showcase', artistId: parts[1] || '' };
    case 'cashier':
      return { name: 'cashier', orderId: parts[1] || '' };
    case 'order-detail':
      return { name: 'order-detail', orderId: parts[1] || '' };
    case 'order-list':
      return {
        name: 'order-list',
        kind: (parts[1] as 'product' | 'transaction' | 'delivery' | 'points') || 'product',
        status: Number(parts[2]) || 0,
      };
    case 'asset-view':
      return { name: 'asset-view', tab: parts[1] ? Number(parts[1]) : undefined };
    case 'asset-history':
      return { name: 'asset-history', type: parts[1] || '', title: parts[2] || undefined };
    case 'wallet':
      if (parts[1] === 'hashrate_exchange') {
        return { name: 'hashrate-exchange', source: parts[2] as any || undefined };
      }
      return { name: 'asset-view' };
    case 'asset':
      if (parts[1] === 'balance-recharge') {
        return { name: 'balance-recharge', source: parts[2] as any, amount: parts[3] };
      }
      if (parts[1] === 'balance-withdraw') {
        return { name: 'balance-withdraw', source: parts[2] as any };
      }
      if (parts[1] === 'service-recharge') {
        return { name: 'service-recharge', source: parts[2] as any };
      }
      if (parts[1] === 'extension-withdraw') {
        return { name: 'extension-withdraw' };
      }
      return { name: 'asset-view' };
    case 'hashrate-exchange':
      return { name: 'hashrate-exchange', source: (parts[1] as any) || undefined };
    case 'reset-login-password':
      return { name: 'reset-login-password', from: parts[1] || undefined };
    case 'reset-pay-password':
      return { name: 'reset-pay-password', from: parts[1] || undefined };
    case 'claim-detail':
      return { name: 'claim-detail', id: parts[1] || '' };
    case 'my-collection-detail':
      return { name: 'my-collection-detail', id: parts[1] || '' };
    case 'my-collection-action':
      if (parts[1] === 'consignment') {
        return { name: 'my-collection-consignment', id: parts[2] || '' };
      }
      return { name: 'my-collection' };
    case 'friend-detail':
      return { name: 'friend-detail', id: parts[1] || '' };
    case 'service-center':
      switch (parts[1]) {
        case 'settings':
          return { name: 'settings' };
        case 'reset-login-password':
          return { name: 'reset-login-password', from: 'settings' };
        case 'reset-pay-password':
          return { name: 'reset-pay-password', from: 'settings' };
        case 'forgot-password':
          return { name: 'forgot-password' };
        case 'notification-settings':
          return { name: 'notification-settings' };
        case 'account-deletion':
          return { name: 'account-deletion' };
        case 'edit-profile':
          return { name: 'edit-profile' };
        case 'message':
          return { name: 'message-center' };
        default:
          return { name: 'settings' };
      }
    case 'home':
      if (parts[1] === 'about-us') return { name: 'about-us', from: 'home' };
      return { name: 'login' };
    case 'profile':
      if (parts[1] === 'user-agreement') return { name: 'user-agreement', from: 'profile' };
      return { name: 'my-friends' };
    case 'artist-showcase':
      return { name: 'artist-showcase' };
    case 'masterpiece-showcase':
      return { name: 'masterpiece-showcase' };
    case 'trading-zone':
      return { name: 'trading-zone' };
    case 'reservation':
      return { name: 'reservation' };
    case 'reservation-record':
      return { name: 'reservation-record' };
    case 'card-management':
      return { name: 'card-management' };
    case 'help-center':
      return { name: 'help-center' };
    case 'online-service':
      return { name: 'online-service' };
    case 'sign-in':
      return { name: 'sign-in' };
    case 'cumulative-rights':
      return { name: 'cumulative-rights' };
    case 'consignment-voucher':
      return { name: 'consignment-voucher' };
    case 'my-collection':
      return { name: 'my-collection' };
    case 'claim-history':
      return { name: 'claim-history' };
    case 'asset-trace':
      return { name: 'asset-trace' };
    case 'search':
      return { name: 'search' };
    case 'switch-to-market':
      return { name: 'switch-to-market' };
    case 'invite-friends':
      return { name: 'invite-friends' };
    default:
      // Fallback to login for safety
      return { name: 'login' };
  }
}

/**
 * 输入归一化：字符串 → RoutePayload，保留 back 字段
 */
export function normalizeRoute(input: RouteInput): Route | null {
  if (!input) return null;
  if (typeof input === 'string') {
    return { ...decodeRoute(input), back: null };
  }
  if ('name' in input) {
    return { ...(input as RoutePayload), back: (input as Route).back ?? null };
  }
  return null;
}

/**
 * 检查路由是否需要实名认证
 * 返回 false 的路由可以未实名访问
 */
export function routeRequiresRealName(route: RouteInput): boolean {
  if (!route) return false;

  const routeName = typeof route === 'string' ? route.split(':')[0] : route.name;

  const publicRoutes: string[] = [
    'login',
    'register',
    'forgot-password',
    'privacy-policy',
    'user-agreement',
    'about-us',
    'real-name-auth',
    'help-center',
    'online-service',
  ];

  return !publicRoutes.includes(routeName);
}
