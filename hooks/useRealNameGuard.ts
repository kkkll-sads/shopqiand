import { useMemo } from 'react';
import { type Route } from '../router/routes';

interface RealNameGuardOptions {
  isRealNameVerified: boolean;
  activeTab: string;
  currentRoute: Route | null;
}

/**
 * useRealNameGuard - 未实名访问控制
 * 返回是否需要拦截及允许的路由列表，具体 UI 由调用方决定
 */
export function useRealNameGuard({ isRealNameVerified, activeTab, currentRoute }: RealNameGuardOptions) {
  const allowedRouteNames: Array<Route['name'] | null> = [null, 'real-name-auth'];

  const shouldBlock = useMemo(() => {
    if (isRealNameVerified) return false;
    const isRestrictedTab = activeTab !== 'home' && !currentRoute;
    const isRestrictedRoute = currentRoute && !allowedRouteNames.includes(currentRoute.name);
    return isRestrictedTab || isRestrictedRoute;
  }, [isRealNameVerified, activeTab, currentRoute, allowedRouteNames]);

  return { shouldBlock };
}

export default useRealNameGuard;
