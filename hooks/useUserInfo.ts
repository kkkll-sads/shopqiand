/**
 * useUserInfo - 用户信息 Hook
 * 
 * 功能说明：
 * - 获取并管理当前登录用户的详细信息
 * - 支持自动拉取和手动刷新
 * - 处理 Token 失效等异常情况
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { UserInfo } from '../types';
import { fetchProfile, AUTH_TOKEN_KEY, USER_INFO_KEY } from '../services/api';
import { isSuccess } from '../utils/apiHelpers';

/**
 * useUserInfo Hook 返回值接口
 */
interface UseUserInfoResult {
    /** 用户信息 */
    userInfo: UserInfo | null;
    /** 是否正在加载 */
    loading: boolean;
    /** 错误信息 */
    error: Error | null;
    /** 刷新用户信息 */
    refreshUserInfo: () => Promise<void>;
    /** 更新本地用户信息（不发请求） */
    setUserInfo: (info: UserInfo | null) => void;
}

/**
 * useUserInfo 用户信息 Hook
 * 
 * @param autoFetch - 是否自动获取用户信息，默认 true
 * @returns 用户信息和操作方法
 * 
 * @example
 * // 自动获取用户信息
 * const { userInfo, loading, refreshUserInfo } = useUserInfo();
 * 
 * @example
 * // 手动获取用户信息
 * const { userInfo, refreshUserInfo } = useUserInfo(false);
 * useEffect(() => {
 *   if (isLoggedIn) {
 *     refreshUserInfo();
 *   }
 * }, [isLoggedIn]);
 */
function useUserInfo(autoFetch: boolean = true): UseUserInfoResult {
    // 用户信息状态（从 localStorage 初始化）
    const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
        try {
            const stored = localStorage.getItem(USER_INFO_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // 加载状态
    const [loading, setLoading] = useState<boolean>(autoFetch);

    // 错误状态
    const [error, setError] = useState<Error | null>(null);

    /**
     * 获取用户信息
     * 从服务器拉取最新的用户资料
     */
    const refreshUserInfo = useCallback(async (): Promise<void> => {
        // 检查是否有 Token
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            setUserInfo(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 调用获取用户信息接口
            const response = await fetchProfile(token);

            if (isSuccess(response) && response.data?.userInfo) {
                const newUserInfo = response.data.userInfo;

                // 更新状态
                setUserInfo(newUserInfo);

                // 持久化到 localStorage
                localStorage.setItem(USER_INFO_KEY, JSON.stringify(newUserInfo));
            } else {
                // 获取失败，可能是 Token 失效
                const errorMsg = response.msg || '获取用户信息失败';
                throw new Error(errorMsg);
            }
        } catch (err) {
            const catchError = err instanceof Error ? err : new Error('获取用户信息失败');
            setError(catchError);
            console.error('获取用户信息失败:', catchError.message);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * 组件挂载时自动获取用户信息
     */
    useEffect(() => {
        if (autoFetch) {
            refreshUserInfo();
        }
    }, [autoFetch, refreshUserInfo]);

    /**
     * 监听用户信息变化（多标签页同步）
     */
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === USER_INFO_KEY) {
                try {
                    const newUserInfo = event.newValue ? JSON.parse(event.newValue) : null;
                    setUserInfo(newUserInfo);
                } catch {
                    setUserInfo(null);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return {
        userInfo,
        loading,
        error,
        refreshUserInfo,
        setUserInfo,
    };
}

export default useUserInfo;
