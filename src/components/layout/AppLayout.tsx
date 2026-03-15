import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { BottomTab } from './BottomTab';
import { FeedbackProvider, useFeedback } from '../ui/FeedbackProvider';
import { isTabPage, PATH_TO_TAB } from '../../lib/navigation';
import { useAuthSession } from '../../hooks/useAuthSession';
import { persistAuthRedirectPath } from '../../lib/auth';
import { useSwipeBack } from '../../hooks/useSwipeBack';
import { StorePage } from '../../pages/Store';
import { RightsPage } from '../../pages/Rights';
import { OrderPage } from '../../pages/Order';
import { MyCollectionPage } from '../../pages/MyCollection';
import { FriendsPage } from '../../pages/Friends';

const KEEP_ALIVE_CONFIG: { path: string; Component: React.ComponentType }[] = [
  { path: '/store', Component: StorePage },
  { path: '/shield', Component: RightsPage },
  { path: '/order', Component: OrderPage },
  { path: '/my-collection', Component: MyCollectionPage },
  { path: '/friends', Component: FriendsPage },
];

const KEEP_ALIVE_PATHS = new Set(KEEP_ALIVE_CONFIG.map(c => c.path));

const PUBLIC_EXACT_PATHS = new Set([
  '/store',
  '/category',
  '/search',
  '/search/result',
  '/service-description',
  '/flash-sale',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/support/chat',
  '/user_agreement',
  '/privacy_policy',
]);

const PUBLIC_PATH_PATTERNS = [
  /^\/product\/[^/]+$/,
  /^\/product\/[^/]+\/qa$/,
  /^\/product\/[^/]+\/reviews$/,
];

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

function AppLayoutContent() {
  const { isAuthenticated } = useAuthSession();
  const { showToast } = useFeedback();
  const location = useLocation();
  const navigate = useNavigate();
  const blockedPathRef = useRef<string | null>(null);

  const isBlocked = !isAuthenticated && !isPublicPath(location.pathname);
  const isTab = isTabPage(location.pathname);
  const showBottomTab = isTab && !isBlocked;
  const activeTab = PATH_TO_TAB[location.pathname] || 'home';

  const isKeepAlive = KEEP_ALIVE_PATHS.has(location.pathname);

  const [mountedPages, setMountedPages] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (isKeepAlive) s.add(location.pathname);
    return s;
  });

  useEffect(() => {
    if (isKeepAlive && !mountedPages.has(location.pathname)) {
      setMountedPages(prev => new Set(prev).add(location.pathname));
    }
  }, [isKeepAlive, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) setMountedPages(new Set());
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isBlocked) {
      blockedPathRef.current = null;
      return;
    }

    if (blockedPathRef.current === location.pathname) {
      return;
    }

    blockedPathRef.current = location.pathname;
    persistAuthRedirectPath(`${location.pathname}${location.search}${location.hash}`);
    showToast({ message: '请先登录后再进入该页面', type: 'warning' });
    navigate('/login', { replace: true });
  }, [isBlocked, location.hash, location.pathname, location.search, navigate, showToast]);

  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const swipeContentRef = useRef<HTMLDivElement>(null);
  const swipeShadowRef = useRef<HTMLDivElement>(null);
  const swipeArrowRef = useRef<HTMLDivElement>(null);

  useSwipeBack({
    containerRef: swipeContainerRef,
    contentRef: swipeContentRef,
    shadowRef: swipeShadowRef,
    arrowRef: swipeArrowRef,
    disabled: isTab || isBlocked,
  });

  return (
    <div className="app-viewport-height flex w-full flex-col overflow-hidden bg-bg-base">
      <div
        ref={swipeContainerRef}
        className="relative flex w-full flex-1 flex-col overflow-hidden bg-bg-base sm:mx-auto sm:max-w-[430px] sm:shadow-2xl"
      >
        <div
          ref={swipeContentRef}
          className="relative flex flex-1 flex-col overflow-hidden"
        >
          {KEEP_ALIVE_CONFIG.map(({ path, Component }) => {
            if (!mountedPages.has(path)) return null;
            const active = location.pathname === path;
            return (
              <div
                key={path}
                className="flex flex-1 flex-col overflow-hidden"
                style={{ display: active ? undefined : 'none' }}
              >
                <Component />
              </div>
            );
          })}

          {!isKeepAlive && !isBlocked && <Outlet />}
        </div>

        <div
          ref={swipeShadowRef}
          className="pointer-events-none absolute inset-y-0 left-0 z-50 w-px"
          style={{ opacity: 0, boxShadow: '4px 0 16px rgba(0,0,0,.35)' }}
        />

        <div
          ref={swipeArrowRef}
          className="pointer-events-none absolute left-3 top-1/2 z-50 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white"
          style={{ opacity: 0 }}
          aria-hidden
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </div>

        {showBottomTab && <BottomTab active={activeTab} />}
      </div>
    </div>
  );
}

export const AppLayout = () => {
  return (
    <FeedbackProvider>
      <AppLayoutContent />
    </FeedbackProvider>
  );
};
