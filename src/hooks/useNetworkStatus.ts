import { useCallback } from 'react';
import {
  refreshAppLifecycleSnapshot,
  useAppLifecycle,
} from '../lib/appLifecycle';

export const useNetworkStatus = () => {
  const { isOffline } = useAppLifecycle();

  const refreshStatus = useCallback(() => {
    refreshAppLifecycleSnapshot();
  }, []);

  return {
    isOffline,
    refreshStatus,
  };
};
