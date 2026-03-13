import { useEffect, useState } from 'react';
import {
  clearAuthSession,
  getAuthSessionSnapshot,
  subscribeAuthSessionChange,
} from '../lib/auth';

export function useAuthSession() {
  const [session, setSession] = useState(() => getAuthSessionSnapshot());

  useEffect(() => {
    return subscribeAuthSessionChange(() => {
      setSession(getAuthSessionSnapshot());
    });
  }, []);

  return {
    clearAuthSession,
    isAuthenticated: !!session?.isAuthenticated,
    session,
  };
}
