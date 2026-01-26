/**
 * storage - 本地存储工具函数
 * 
 * 功能说明：
 * - 封装 localStorage 操作
 * - 提供类型安全的存取方法
 * - 支持数据过期时间设置
 * - 自动处理 JSON 序列化/反序列化
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { errorLog } from './logger';

/**
 * 存储项结构（带过期时间）
 */
interface StorageItem<T> {
    /** 存储的值 */
    value: T;
    /** 过期时间戳（毫秒），undefined 表示永不过期 */
    expireAt?: number;
}

/**
 * 存储配置选项
 */
interface StorageOptions {
    /** 过期时间（毫秒） */
    expireIn?: number;
}

/**
 * storage 本地存储工具对象
 * 
 * @example
 * // 基础存取
 * storage.set('user', { name: '张三', age: 18 });
 * const user = storage.get<{ name: string; age: number }>('user');
 * 
 * @example
 * // 带过期时间
 * storage.set('token', 'abc123', { expireIn: 24 * 60 * 60 * 1000 }); // 24小时后过期
 * 
 * @example
 * // 删除和清空
 * storage.remove('token');
 * storage.clear();
 */
export const storage = {
    /**
     * 存储数据
     * 
     * @param key - 存储键名
     * @param value - 存储的值
     * @param options - 配置选项
     * 
     * @example
     * storage.set('user', { name: '张三' });
     * storage.set('token', 'abc', { expireIn: 3600000 }); // 1小时后过期
     */
    set: <T>(key: string, value: T, options: StorageOptions = {}): void => {
        try {
            const { expireIn } = options;

            const item: StorageItem<T> = {
                value,
                expireAt: expireIn ? Date.now() + expireIn : undefined,
            };

            localStorage.setItem(key, JSON.stringify(item));
        } catch (error) {
            errorLog('storage', `存储数据失败 [${key}]`, error);
        }
    },

    /**
     * 获取数据
     * 
     * @param key - 存储键名
     * @param defaultValue - 默认值（数据不存在或已过期时返回）
     * @returns 存储的值或默认值
     * 
     * @example
     * const user = storage.get<User>('user');
     * const theme = storage.get<string>('theme', 'light');
     */
    get: <T>(key: string, defaultValue: T | null = null): T | null => {
        try {
            const stored = localStorage.getItem(key);

            if (!stored) {
                return defaultValue;
            }

            const item: StorageItem<T> = JSON.parse(stored);

            // 检查是否过期
            if (item.expireAt && Date.now() > item.expireAt) {
                // 已过期，删除数据并返回默认值
                localStorage.removeItem(key);
                return defaultValue;
            }

            return item.value;
        } catch (error) {
            errorLog('storage', `读取数据失败 [${key}]`, error);
            return defaultValue;
        }
    },

    /**
     * 直接获取原始值（不处理过期逻辑，兼容非 storage.set 存储的数据）
     * 
     * @param key - 存储键名
     * @param defaultValue - 默认值
     * @returns 存储的值或默认值
     * 
     * @example
     * const token = storage.getRaw<string>('cat_auth_token');
     */
    getRaw: <T>(key: string, defaultValue: T | null = null): T | null => {
        try {
            const stored = localStorage.getItem(key);

            if (!stored) {
                return defaultValue;
            }

            // 尝试解析 JSON
            try {
                return JSON.parse(stored);
            } catch {
                // 如果不是 JSON，直接返回字符串（需要类型断言）
                return stored as unknown as T;
            }
        } catch (error) {
            errorLog('storage', `读取数据失败 [${key}]`, error);
            return defaultValue;
        }
    },

    /**
     * 直接设置原始值（不添加过期时间包装，兼容现有代码）
     * 
     * @param key - 存储键名
     * @param value - 存储的值
     * 
     * @example
     * storage.setRaw('cat_auth_token', 'token123');
     */
    setRaw: <T>(key: string, value: T): void => {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, stringValue);
        } catch (error) {
            errorLog('storage', `存储数据失败 [${key}]`, error);
        }
    },

    /**
     * 删除指定数据
     * 
     * @param key - 存储键名
     * 
     * @example
     * storage.remove('user');
     */
    remove: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            errorLog('storage', `删除数据失败 [${key}]`, error);
        }
    },

    /**
     * 清空所有数据
     * 
     * @example
     * storage.clear();
     */
    clear: (): void => {
        try {
            localStorage.clear();
        } catch (error) {
            errorLog('storage', '清空存储失败', error);
        }
    },

    /**
     * 检查键是否存在
     * 
     * @param key - 存储键名
     * @returns 是否存在
     * 
     * @example
     * if (storage.has('user')) { ... }
     */
    has: (key: string): boolean => {
        try {
            return localStorage.getItem(key) !== null;
        } catch {
            return false;
        }
    },

    /**
     * 获取所有键名
     * 
     * @returns 所有键名数组
     * 
     * @example
     * const keys = storage.keys();
     */
    keys: (): string[] => {
        try {
            return Object.keys(localStorage);
        } catch {
            return [];
        }
    },
};

/**
 * sessionStorage 工具对象
 * 与 storage 使用方式相同，但数据只在当前会话有效
 */
export const sessionStorage = {
    /**
     * 存储数据到 sessionStorage
     */
    set: <T>(key: string, value: T): void => {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            errorLog('sessionStorage', `会话存储数据失败 [${key}]`, error);
        }
    },

    /**
     * 从 sessionStorage 获取数据
     */
    get: <T>(key: string, defaultValue: T | null = null): T | null => {
        try {
            const stored = window.sessionStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            errorLog('sessionStorage', `读取会话数据失败 [${key}]`, error);
            return defaultValue;
        }
    },

    /**
     * 删除 sessionStorage 中的数据
     */
    remove: (key: string): void => {
        try {
            window.sessionStorage.removeItem(key);
        } catch (error) {
            errorLog('sessionStorage', `删除会话数据失败 [${key}]`, error);
        }
    },

    /**
     * 清空 sessionStorage
     */
    clear: (): void => {
        try {
            window.sessionStorage.clear();
        } catch (error) {
            errorLog('sessionStorage', '清空会话存储失败', error);
        }
    },
};

export default storage;
