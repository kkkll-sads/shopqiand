import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './src/router';
import { NotificationProvider } from './context/NotificationContext';
import { GlobalNotificationSystem } from './components/common/GlobalNotificationSystem';
import { setNeedLoginHandler, clearNeedLoginHandler } from './services/needLoginHandler';
import { useAuthStore } from './src/stores/authStore';
import './src/styles/main.css';
import './src/styles/notifications.css';

// 全局认证处理组件
const AuthHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handleNeedLogin = () => {
      console.log('[AuthHandler] 处理 NeedLoginError，执行登出');
      logout();
      // 使用 router.navigate 跳转到登录页
      router.navigate('/login', { replace: true });
    };

    setNeedLoginHandler(handleNeedLogin);
    return () => clearNeedLoginHandler();
  }, [logout]);

  return <>{children}</>;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthHandler>
        <GlobalNotificationSystem />
        <RouterProvider router={router} />
      </AuthHandler>
    </NotificationProvider>
  </React.StrictMode>
);