/**
 * routes.ts - 统一的路由编码/解码管理
 * 
 * 将 subPage 字符串的拼接和解析集中管理，避免字符串散落在各处。
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

/**
 * 路由类型定义
 * 每种路由的参数都明确定义，便于类型检查
 */
export type Route =
    // 简单路由（无参数）
    | { name: 'login' }
    | { name: 'register' }
    | { name: 'forgot-password' }
    | { name: 'privacy-policy' }
    | { name: 'user-agreement' }
    | { name: 'about-us' }
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
    | { name: 'switch-to-market' }
    | { name: 'product-detail' }
    | { name: 'points-product-detail' }
    | { name: 'trading-zone' }
    | { name: 'artist-showcase' }
    | { name: 'masterpiece-showcase' }
    | { name: 'reservation' }
    | { name: 'reservation-record' }
    | { name: 'balance-recharge' }
    | { name: 'balance-withdraw' }
    | { name: 'service-recharge' }
    | { name: 'extension-withdraw' }
    | { name: 'consignment-voucher' }
    | { name: 'cumulative-rights' }
    | { name: 'my-collection' }
    | { name: 'claim-history' }
    // 带参数路由
    | { name: 'news'; activeTab?: 'announcement' | 'dynamic' }
    | { name: 'news-detail'; id: string }
    | { name: 'artist-detail'; id: string }
    | { name: 'artist-works-showcase'; artistId: string }
    | { name: 'cashier'; orderId: string }
    | { name: 'order-detail'; orderId: string }
    | { name: 'order-list'; kind: 'product' | 'transaction' | 'delivery' | 'points'; status: number }
    | { name: 'asset-view'; tab?: 'wallet' | 'balance' | 'points' | 'service-fee' | 'consignment' | 'static-income' }
    | { name: 'asset-history'; type: string; title?: string }
    | { name: 'wallet'; tab?: string; source?: string }
    | { name: 'reset-login-password'; from?: string }
    | { name: 'reset-pay-password'; from?: string }
    | { name: 'hashrate-exchange'; source?: string }
    | { name: 'claim-detail'; id: string }
    | { name: 'my-collection-detail'; id: string };

/**
 * 将 Route 对象编码为 subPage 字符串
 */
export function encodeRoute(r: Route): string {
    switch (r.name) {
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
            return r.tab ? `asset-view:${r.tab}` : 'asset-view';
        case 'asset-history':
            return r.title ? `asset-history:${r.type}:${r.title}` : `asset-history:${r.type}`;
        case 'wallet':
            const params = [];
            if (r.tab) params.push(r.tab);
            if (r.source) params.push(r.source);
            return params.length > 0 ? `wallet:${params.join(':')}` : 'wallet';
        case 'reset-login-password':
            return r.from ? `reset-login-password:${r.from}` : 'reset-login-password';
        case 'reset-pay-password':
            return r.from ? `reset-pay-password:${r.from}` : 'reset-pay-password';
        case 'hashrate-exchange':
            return r.source ? `wallet:hashrate_exchange:${r.source}` : 'wallet:hashrate_exchange';
        case 'claim-detail':
            return `claim-detail:${r.id}`;
        case 'my-collection-detail':
            return `my-collection-detail:${r.id}`;
        default:
            return r.name;
    }
}

/**
 * 将 subPage 字符串解码为 Route 对象
 */
export function decodeRoute(s: string): Route {
    const parts = s.split(':');
    const name = parts[0];

    switch (name) {
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
                status: Number(parts[2]) || 0
            };
        case 'asset-view':
            return { name: 'asset-view', tab: parts[1] as any || undefined };
        case 'asset-history':
            return { name: 'asset-history', type: parts[1] || '', title: parts[2] || undefined };
        case 'wallet':
            // wallet:hashrate_exchange:profile 等形式
            if (parts[1] === 'hashrate_exchange') {
                return { name: 'hashrate-exchange', source: parts[2] || undefined };
            }
            return { name: 'wallet', tab: parts[1] || undefined, source: parts[2] || undefined };
        case 'reset-login-password':
            return { name: 'reset-login-password', from: parts[1] || undefined };
        case 'reset-pay-password':
            return { name: 'reset-pay-password', from: parts[1] || undefined };
        case 'claim-detail':
            return { name: 'claim-detail', id: parts[1] || '' };
        case 'my-collection-detail':
            return { name: 'my-collection-detail', id: parts[1] || '' };
        default:
            // 简单路由直接返回
            return { name: name as any };
    }
}

/**
 * 检查路由是否需要实名认证
 * 返回 false 的路由可以未实名访问
 */
export function routeRequiresRealName(route: Route | string | null): boolean {
    if (!route) return false;

    const routeName = typeof route === 'string' ? route.split(':')[0] : route.name;

    // 不需要实名认证的路由白名单
    const publicRoutes = [
        'login',
        'register',
        'forgot-password',
        'privacy-policy',
        'user-agreement',
        'about-us',
        'real-name-auth',
        'help-center',
    ];

    return !publicRoutes.includes(routeName);
}
