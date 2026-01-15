import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './src/router';
import { NotificationProvider } from './context/NotificationContext';
import { GlobalNotificationSystem } from './components/common/GlobalNotificationSystem';
import { setNeedLoginHandler, clearNeedLoginHandler } from './services/needLoginHandler';
import { useAuthStore } from './src/stores/authStore';
import { fetchProfile } from './services/api';
import { isSuccess } from './utils/apiHelpers';
import './src/styles/main.css';
import './src/styles/notifications.css';

// 全局认证处理组件
const AuthHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logout = useAuthStore((state) => state.logout);
  const { isLoggedIn, token, login } = useAuthStore();

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

  // 应用启动时，如果已登录则刷新用户信息（包含实名状态）
  useEffect(() => {
    const refreshUserInfo = async () => {
      if (!isLoggedIn || !token) return;
      
      try {
        console.log('[AuthHandler] 刷新用户信息...');
        const profileRes = await fetchProfile(token);
        if (isSuccess(profileRes) && profileRes.data?.userInfo) {
          const userInfo = {
            ...profileRes.data.userInfo,
            token,
          };
          console.log('[AuthHandler] 用户信息刷新成功', {
            real_name_status: userInfo.real_name_status,
            isRealNameVerified: userInfo.real_name_status === 2,
          });
          // 使用 login 方法更新状态（会自动提取实名状态）
          login({ token, userInfo });
        }
      } catch (e) {
        console.warn('[AuthHandler] 刷新用户信息失败:', e);
      }
    };

    refreshUserInfo();
  }, [isLoggedIn, token, login]);

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