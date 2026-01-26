/**
 * 认证状态管理 Store
 * 使用 Zustand 进行状态管理，支持持久化
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserInfo, LoginSuccessPayload } from '@/types';
import { STORAGE_KEYS as GLOBAL_STORAGE_KEYS } from '@/constants/storageKeys';
import { useAppStore } from './appStore';
import { errorLog } from '@/utils/logger';

// 存储键名常量
const STORAGE_KEYS = {
  AUTH_STORE: 'auth-storage',
};

interface AuthState {
  // 状态
  isLoggedIn: boolean;
  user: UserInfo | null;
  token: string | null;
  realNameStatus: number | null;
  realName: string | null;

  // 计算属性
  isRealNameVerified: boolean;

  // 操作
  login: (payload?: LoginSuccessPayload) => void;
  logout: () => void;
  updateUser: (user: UserInfo) => void;
  updateToken: (token: string) => void;
  updateRealNameStatus: (status: number, name?: string) => void;
  setRealNameVerified: (verified: boolean, name?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isLoggedIn: false,
      user: null,
      token: null,
      realNameStatus: null,
      realName: null,
      isRealNameVerified: false,

      // 登录
      login: (payload) => {
        const userInfo = payload?.userInfo || get().user;
        // 从 userInfo 中提取实名状态 (real_name_status === 2 表示已通过)
        const realNameStatus = userInfo?.real_name_status ?? null;
        const isVerified = realNameStatus === 2;
        
        set({
          isLoggedIn: true,
          token: payload?.token || get().token,
          user: userInfo,
          realNameStatus: realNameStatus,
          realName: userInfo?.real_name || get().realName,
          isRealNameVerified: isVerified,
        });
      },

      // 登出
      logout: () => {
        // 清空认证状态
        set({
          isLoggedIn: false,
          user: null,
          token: null,
          realNameStatus: null,
          realName: null,
          isRealNameVerified: false,
        });

        // 清空应用缓存
        try {
          // 清空 appStore 中的缓存
          const appStore = useAppStore.getState();
          appStore.clearAllListCaches();
          appStore.clearMarketCache();
          appStore.clearSelectedProduct();
          appStore.setSelectedCollectionItem(null);
          appStore.setNewsList([]);
          appStore.setExtraUnreadCount(0);
          appStore.setPopupQueue([]);
          appStore.setShowPopupAnnouncement(false);

          // 清空 localStorage 中的业务缓存
          const cacheKeysToRemove = [
            GLOBAL_STORAGE_KEYS.READ_MESSAGE_IDS_KEY,
            GLOBAL_STORAGE_KEYS.READ_NEWS_IDS_KEY,
            GLOBAL_STORAGE_KEYS.NEWS_ACTIVE_TAB_KEY,
            'chat_button_position', // 客服悬浮按钮位置
            'cat_notification_settings', // 通知设置
            'search_history', // 搜索历史
          ];

          cacheKeysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              // 忽略单个键删除失败
            }
          });

          // 清空 sessionStorage 中的缓存
          try {
            sessionStorage.clear();
          } catch (e) {
            // 忽略 sessionStorage 清空失败
          }
        } catch (error) {
          errorLog('authStore', '清空缓存失败', error);
        }
      },

      // 更新用户信息
      updateUser: (user) => {
        set({ user });
      },

      // 更新 Token
      updateToken: (token) => {
        set({ token });
      },

      // 更新实名状态
      updateRealNameStatus: (status, name) => {
        set({
          realNameStatus: status,
          realName: name || get().realName,
          isRealNameVerified: status === 2,
        });
      },

      // 设置实名验证状态
      setRealNameVerified: (verified, name) => {
        set({
          isRealNameVerified: verified,
          realNameStatus: verified ? 2 : get().realNameStatus,
          realName: name || get().realName,
        });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_STORE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        token: state.token,
        realNameStatus: state.realNameStatus,
        realName: state.realName,
        isRealNameVerified: state.isRealNameVerified,
      }),
    }
  )
);

// 选择器 hooks（优化性能）
export const useIsLoggedIn = () => useAuthStore((state) => state.isLoggedIn);
export const useUser = () => useAuthStore((state) => state.user);
export const useToken = () => useAuthStore((state) => state.token);
export const useIsRealNameVerified = () => useAuthStore((state) => state.isRealNameVerified);
export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    logout: state.logout,
    updateUser: state.updateUser,
    updateToken: state.updateToken,
    updateRealNameStatus: state.updateRealNameStatus,
    setRealNameVerified: state.setRealNameVerified,
  }));
