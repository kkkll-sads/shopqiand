import { useCallback, useState } from 'react';
import { type Tab } from '../types';
import { type Route } from '../router/routes';

interface PendingNavigation {
  tab?: Tab;
  route?: Route | null;
}

/**
 * usePendingNavigation - 管理登录/实名后的待跳转目标
 */
export function usePendingNavigation() {
  const [pending, setPending] = useState<PendingNavigation | null>(null);

  const setPendingNav = useCallback((next: PendingNavigation | null) => {
    setPending(next);
  }, []);

  const consumePending = useCallback(() => {
    const target = pending;
    setPending(null);
    return target;
  }, [pending]);

  return { pending, setPendingNav, consumePending };
}

export default usePendingNavigation;
