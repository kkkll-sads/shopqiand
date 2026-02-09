import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from '@/router';
import { NotificationProvider } from '@/context/NotificationContext';
import { GlobalNotificationSystem } from '@/components/common/GlobalNotificationSystem';
import { setNeedLoginHandler, clearNeedLoginHandler } from '@/services/needLoginHandler';
import { useAuthStore } from '@/stores/authStore';
import { fetchProfile, fetchRealNameStatus } from '@/services';
import { isSuccess } from '@/utils/apiHelpers';
import { applyBackdropBlurCompatibilityClass } from '@/utils/backdropCompat';
import '@/styles/main.css';
import '@/styles/notifications.css';

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

  // 应用启动时，如果已登录则刷新用户信息和实名状态
  useEffect(() => {
    const refreshUserInfo = async () => {
      if (!isLoggedIn || !token) return;
      
      const { updateRealNameStatus } = useAuthStore.getState();
      
      try {
        console.log('[AuthHandler] 刷新用户信息...');
        
        // 并行获取用户信息和实名状态
        const [profileRes, realNameRes] = await Promise.all([
          fetchProfile(token),
          fetchRealNameStatus(token),
        ]);
        
        // 处理用户信息
        if (isSuccess(profileRes) && profileRes.data?.userInfo) {
          const userInfo = {
            ...profileRes.data.userInfo,
            token,
          };
          console.log('[AuthHandler] 用户信息刷新成功');
          login({ token, userInfo });
        }
        
        // 处理实名状态（独立接口，确保准确）
        if (isSuccess(realNameRes) && realNameRes.data) {
          const realNameStatus = realNameRes.data.real_name_status || 0;
          const realName = realNameRes.data.real_name || '';
          console.log('[AuthHandler] 实名状态刷新成功', {
            real_name_status: realNameStatus,
            real_name: realName,
            isRealNameVerified: realNameStatus === 2,
          });
          updateRealNameStatus(realNameStatus, realName);
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

// 启动时根据设备能力切换 backdrop 兼容模式，避免低端机样式异常
applyBackdropBlurCompatibilityClass();

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
