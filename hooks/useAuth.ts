/**
 * useAuth - 认证状态 Hook
 * 
 * 功能说明：
 * - 集中管理用户认证状态
 * - 从 localStorage 读取和持久化认证信息
 * - 提供登录、登出方法
 * - 提供 Token 和用户信息访问
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { UserInfo, LoginSuccessPayload } from '../types';
import { fetchRealNameStatus, RealNameStatusData } from '../services/api';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { readJSON, readStorage, removeStorage, writeJSON, writeStorage } from '../utils/storageAccess';
import { debugLog, warnLog, errorLog } from '../utils/logger';
import { isSuccess } from '../utils/apiHelpers';

const {
    AUTH_KEY,
    AUTH_TOKEN_KEY,
    USER_INFO_KEY,
    REAL_NAME_STATUS_KEY,
    REAL_NAME_KEY,
} = STORAGE_KEYS;

/**
 * useAuth Hook 返回值接口
 */
interface UseAuthResult {
    /** 是否已登录 */
    isLoggedIn: boolean;
    /** 用户信息 */
    user: UserInfo | null;
    /** 认证令牌 */
    token: string | null;
    /** 实名认证状态 */
    realNameStatus: number | null;
    /** 真实姓名 */
    realName: string | null;
    /** 是否已完成实名认证 */
    isRealNameVerified: boolean;
    /** 登录方法 */
    login: (payload?: LoginSuccessPayload) => void;
    /** 登出方法 */
    logout: () => void;
    /** 更新用户信息 */
    updateUser: (userInfo: UserInfo) => void;
    /** 更新 Token */
    updateToken: (token: string) => void;
    /** 更新实名认证状态 */
    updateRealNameStatus: (status: number, name?: string) => void;
    /** 刷新实名认证状态（从服务器获取最新状态） */
    refreshRealNameStatus: () => Promise<void>;
}

/**
 * useAuth 认证状态 Hook
 * 
 * @returns 认证状态和控制方法
 * 
 * @example
 * // 在组件中使用
 * const { isLoggedIn, user, login, logout } = useAuth();
 *
 * // 登录
 * const handleLogin = async (phone, password) => {
 *   const response = await loginApi({ mobile: phone, password });
 *   if (isSuccess(response)) {
 *     login({
 *       token: response.data.userInfo.token,
 *       userInfo: response.data.userInfo,
 *     });
 *   }
 * };
 *
 * // 登出
 * const handleLogout = () => {
 *   logout();
 *   navigate('/login');
 * };
 */
function useAuth(): UseAuthResult {
    /**
     * 从 localStorage 初始化登录状态
     */
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => readStorage(AUTH_KEY) === 'true');

    /**
     * 从 localStorage 初始化用户信息
     */
    const [user, setUser] = useState<UserInfo | null>(() => readJSON<UserInfo>(USER_INFO_KEY));

    /**
     * 从 localStorage 初始化 Token
     */
    const [token, setToken] = useState<string | null>(() => readStorage(AUTH_TOKEN_KEY));

    /**
     * 从 localStorage 初始化实名认证状态
     */
    const [realNameStatus, setRealNameStatus] = useState<number | null>(() => {
        const stored = readStorage(REAL_NAME_STATUS_KEY);
        return stored ? parseInt(stored, 10) : null;
    });

    /**
     * 从 localStorage 初始化真实姓名
     */
    const [realName, setRealName] = useState<string | null>(() => readStorage(REAL_NAME_KEY));

    /**
     * 计算是否已完成实名认证
     * real_name_status === 2 表示已通过实名认证
     */
    const isRealNameVerified = realNameStatus === 2;

    /**
     * 登录方法
     * 保存认证信息到状态和 localStorage
     * 
     * @param payload - 登录成功后的数据，包含 token 和 userInfo
     */
    const login = useCallback(async (payload?: LoginSuccessPayload) => {
        // 设置登录状态
        setIsLoggedIn(true);
        writeStorage(AUTH_KEY, 'true');

        // 保存 Token
        if (payload?.token) {
            setToken(payload.token);
            writeStorage(AUTH_TOKEN_KEY, payload.token);

            // 获取实名认证状态
            try {
                const response = await fetchRealNameStatus(payload.token);
                if (isSuccess(response) && response.data) {
                    const status = response.data.real_name_status;
                    const name = response.data.real_name;

                    setRealNameStatus(status);
                    writeStorage(REAL_NAME_STATUS_KEY, String(status));

                    if (name) {
                        setRealName(name);
                        writeStorage(REAL_NAME_KEY, name);
                    }
                }
            } catch (error) {
                console.error('获取实名认证状态失败:', error);
                // 失败时不阻止登录流程
            }
        }

        // 保存用户信息
        if (payload?.userInfo) {
            setUser(payload.userInfo);
            writeJSON(USER_INFO_KEY, payload.userInfo);
        }
    }, []);

    /**
     * 登出方法
     * 清除所有认证信息
     */
    const logout = useCallback(() => {
        // 清除状态
        setIsLoggedIn(false);
        setUser(null);
        setToken(null);
        setRealNameStatus(null);
        setRealName(null);

        // 清除 localStorage
        removeStorage(AUTH_KEY);
        removeStorage(AUTH_TOKEN_KEY);
        removeStorage(USER_INFO_KEY);
        removeStorage(REAL_NAME_STATUS_KEY);
        removeStorage(REAL_NAME_KEY);
    }, []);

    /**
     * 更新用户信息
     * 用于用户修改资料后更新本地数据
     * 
     * @param userInfo - 新的用户信息
     */
    const updateUser = useCallback((userInfo: UserInfo) => {
        setUser(userInfo);
        writeJSON(USER_INFO_KEY, userInfo);
    }, []);

    /**
     * 更新 Token
     * 用于刷新 Token 后更新本地数据
     * 
     * @param newToken - 新的 Token
     */
    const updateToken = useCallback((newToken: string) => {
        setToken(newToken);
        writeStorage(AUTH_TOKEN_KEY, newToken);
    }, []);

    /**
     * 更新实名认证状态
     * 用于实名认证完成后更新本地数据
     * 
     * @param status - 实名认证状态
     * @param name - 真实姓名
     */
    const updateRealNameStatus = useCallback((status: number, name?: string) => {
        setRealNameStatus(status);
        writeStorage(REAL_NAME_STATUS_KEY, String(status));

        if (name) {
            setRealName(name);
            writeStorage(REAL_NAME_KEY, name);
        }
    }, []);

    /**
     * 刷新实名认证状态
     * 从服务器获取最新的实名认证状态
     */
    const refreshRealNameStatus = useCallback(async () => {
        const currentToken = token || readStorage(AUTH_TOKEN_KEY);
        if (!currentToken) {
            warnLog('auth.realName.refresh', '无法刷新实名认证状态：未找到token');
            return;
        }

        try {
            const response = await fetchRealNameStatus(currentToken);
            if (isSuccess(response) && response.data) {
                const status = response.data.real_name_status;
                const name = response.data.real_name;

                debugLog('auth.realName.refresh', '刷新实名认证状态成功', { status, name });

                setRealNameStatus(status);
                writeStorage(REAL_NAME_STATUS_KEY, String(status));

                if (name) {
                    setRealName(name);
                    writeStorage(REAL_NAME_KEY, name);
                }
            }
        } catch (error) {
            errorLog('auth.realName.refresh', '刷新实名认证状态失败', error);
            // 失败时不清除现有状态，保持当前状态
        }
    }, [token]);

    /**
     * 监听其他标签页的登录状态变化
     * 实现多标签页同步登出
     */
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            // 监听登录状态变化
            if (event.key === AUTH_KEY) {
                const newIsLoggedIn = event.newValue === 'true';
                setIsLoggedIn(newIsLoggedIn);

                // 如果在其他标签页登出，同步清除本页状态
                if (!newIsLoggedIn) {
                    setUser(null);
                    setToken(null);
                }
            }

            // 监听用户信息变化
            if (event.key === USER_INFO_KEY) {
                try {
                    const newUser = event.newValue ? JSON.parse(event.newValue) : null;
                    setUser(newUser);
                } catch {
                    setUser(null);
                }
            }

            // 监听 Token 变化
            if (event.key === AUTH_TOKEN_KEY) {
                setToken(event.newValue);
            }

            // 监听实名认证状态变化
            if (event.key === REAL_NAME_STATUS_KEY) {
                try {
                    const newStatus = event.newValue ? parseInt(event.newValue, 10) : null;
                    setRealNameStatus(newStatus);
                } catch {
                    setRealNameStatus(null);
                }
            }
        };

        // 添加监听器
        window.addEventListener('storage', handleStorageChange);

        // 清理监听器
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return {
        isLoggedIn,
        user,
        token,
        realNameStatus,
        realName,
        isRealNameVerified,
        login,
        logout,
        updateUser,
        updateToken,
        updateRealNameStatus,
        refreshRealNameStatus,
    };
}

export default useAuth;
