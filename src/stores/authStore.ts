/**
 * 认证状态管理 Store
 * 使用 Zustand 进行状态管理，支持持久化
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserInfo, LoginSuccessPayload } from '../../types';

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
        set({
          isLoggedIn: true,
          token: payload?.token || get().token,
          user: payload?.userInfo || get().user,
        });
      },

      // 登出
      logout: () => {
        set({
          isLoggedIn: false,
          user: null,
          token: null,
          realNameStatus: null,
          realName: null,
          isRealNameVerified: false,
        });
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
