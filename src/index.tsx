import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from '@/router';
import { ErrorBoundary } from '@/components/common';
import { NotificationProvider } from '@/context/NotificationContext';
import { GlobalNotificationSystem } from '@/components/common/GlobalNotificationSystem';
import { setNeedLoginHandler, clearNeedLoginHandler } from '@/services/needLoginHandler';
import { useAuthStore } from '@/stores/authStore';
import { fetchProfile, fetchRealNameStatus } from '@/services';
import { isSuccess } from '@/utils/apiHelpers';
import { applyBackdropBlurCompatibilityClass } from '@/utils/backdropCompat';
import { tryRecoverFromChunkLoad } from '@/utils/chunkLoadRecovery';
import { startupDiagnostics } from '@/utils/startupDiagnostics';
import '@/styles/main.css';
import '@/styles/notifications.css';

const AuthHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logout = useAuthStore((state) => state.logout);
  const { isLoggedIn, token, login } = useAuthStore();

  useEffect(() => {
    startupDiagnostics.mark('auth', 'register need-login handler');

    const handleNeedLogin = () => {
      startupDiagnostics.warn('auth', 'need-login handler triggered');
      logout();
      router.navigate('/login', { replace: true });
    };

    setNeedLoginHandler(handleNeedLogin);
    return () => {
      startupDiagnostics.mark('auth', 'clear need-login handler');
      clearNeedLoginHandler();
    };
  }, [logout]);

  useEffect(() => {
    const refreshUserInfo = async () => {
      if (!isLoggedIn || !token) {
        startupDiagnostics.mark('auth', 'skip profile refresh', {
          isLoggedIn,
          hasToken: Boolean(token),
        });
        return;
      }

      const { updateRealNameStatus } = useAuthStore.getState();

      try {
        startupDiagnostics.mark('auth', 'refresh profile start');

        const [profileRes, realNameRes] = await Promise.all([
          fetchProfile(token),
          fetchRealNameStatus(token),
        ]);

        if (isSuccess(profileRes) && profileRes.data?.userInfo) {
          login({
            token,
            userInfo: {
              ...profileRes.data.userInfo,
              token,
            },
          });

          startupDiagnostics.mark('auth', 'profile refresh success');
        } else {
          startupDiagnostics.warn('auth', 'profile refresh returned unexpected payload', {
            code: profileRes?.code,
            msg: profileRes?.msg,
          });
        }

        if (isSuccess(realNameRes) && realNameRes.data) {
          const realNameStatus = realNameRes.data.real_name_status || 0;
          const realName = realNameRes.data.real_name || '';
          updateRealNameStatus(realNameStatus, realName);

          startupDiagnostics.mark('auth', 'real-name refresh success', {
            realNameStatus,
            hasRealName: Boolean(realName),
          });
        } else {
          startupDiagnostics.warn('auth', 'real-name refresh returned unexpected payload', {
            code: realNameRes?.code,
            msg: realNameRes?.msg,
          });
        }
      } catch (error: unknown) {
        startupDiagnostics.warn('auth', 'refresh profile failed', error);
      }
    };

    void refreshUserInfo();
  }, [isLoggedIn, token, login]);

  return <>{children}</>;
};

const ChunkLoadRecoveryHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    startupDiagnostics.mark('runtime', 'register chunk recovery listeners');

    const handleWindowError = (event: ErrorEvent) => {
      const payload = event.error ?? event.message;
      const recoveryStarted = tryRecoverFromChunkLoad(payload);
      if (recoveryStarted) {
        startupDiagnostics.error('runtime.chunk', 'chunk-load recovery triggered', payload);
        startupDiagnostics.show('chunk-load-recovery');
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const recoveryStarted = tryRecoverFromChunkLoad(event.reason);
      if (recoveryStarted) {
        startupDiagnostics.error(
          'runtime.chunk',
          'chunk-load recovery triggered from unhandled rejection',
          event.reason,
        );
        startupDiagnostics.show('chunk-load-recovery');
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
};

const StartupReadyReporter: React.FC = () => {
  useEffect(() => {
    startupDiagnostics.ready({
      href: window.location.href,
      pathname: window.location.pathname,
    });
  }, []);

  return null;
};

startupDiagnostics.mark('bootstrap', 'index module evaluated', {
  href: window.location.href,
  userAgent: navigator.userAgent,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  const error = new Error('Could not find root element to mount to');
  startupDiagnostics.fatal('bootstrap', error);
  startupDiagnostics.show('missing-root-element');
  throw error;
}

startupDiagnostics.mark('bootstrap', 'root element located');

const backdropCompatResult = applyBackdropBlurCompatibilityClass();
startupDiagnostics.mark('bootstrap', 'backdrop compatibility applied', backdropCompatResult);

const root = ReactDOM.createRoot(rootElement);
startupDiagnostics.mark('bootstrap', 'react root created');

startupDiagnostics.mark('bootstrap', 'react render start');
root.render(
  <React.StrictMode>
    <NotificationProvider>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          startupDiagnostics.fatal('react.error_boundary', error, {
            componentStack: errorInfo.componentStack,
          });
          startupDiagnostics.show('react-error-boundary');
        }}
      >
        <ChunkLoadRecoveryHandler>
          <AuthHandler>
            <StartupReadyReporter />
            <GlobalNotificationSystem />
            <RouterProvider router={router} />
          </AuthHandler>
        </ChunkLoadRecoveryHandler>
      </ErrorBoundary>
    </NotificationProvider>
  </React.StrictMode>,
);
