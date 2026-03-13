import { useEffect } from 'react';
import { shopCartApi } from '../api';
import { useAuthSession } from './useAuthSession';
import { useRequest } from './useRequest';

const EMPTY_CART_COUNT = { count: 0 };
const CART_COUNT_SYNC_EVENT = 'cart-count:sync';

export function notifyCartCountSync() {
  window.dispatchEvent(new CustomEvent(CART_COUNT_SYNC_EVENT));
}

export function useCartCount() {
  const { isAuthenticated } = useAuthSession();
  const { data, loading, reload, setData } = useRequest(
    (signal) => shopCartApi.count(signal),
    {
      cacheKey: 'shop-cart:count',
      deps: [isAuthenticated],
      initialData: EMPTY_CART_COUNT,
      manual: !isAuthenticated,
    },
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setData(EMPTY_CART_COUNT);
    }
  }, [isAuthenticated, setData]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const handleSync = () => {
      void reload().catch(() => undefined);
    };

    window.addEventListener(CART_COUNT_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(CART_COUNT_SYNC_EVENT, handleSync);
  }, [isAuthenticated, reload]);

  return {
    cartCount: isAuthenticated ? Math.max(0, data?.count ?? 0) : 0,
    loading: isAuthenticated ? loading : false,
    reloadCartCount: reload,
  };
}
