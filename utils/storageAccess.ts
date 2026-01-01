import { STORAGE_KEYS } from '../constants/storageKeys';

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** 读取字符串存储 */
export const readStorage = (key: StorageKey): string | null => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

/** 写入字符串存储 */
export const writeStorage = (key: StorageKey, value: string): void => {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.error(`写入存储失败 [${key}]`, error);
    }
};

/** 删除指定键 */
export const removeStorage = (key: StorageKey): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`删除存储失败 [${key}]`, error);
    }
};

/** 读取 JSON 存储 */
export const readJSON = <T>(key: StorageKey, fallback: T | null = null): T | null => {
    try {
        const raw = readStorage(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch (error) {
        console.warn(`解析存储内容失败 [${key}]`, error);
        return fallback;
    }
};

/** 写入 JSON 存储 */
export const writeJSON = <T>(key: StorageKey, value: T): void => {
    try {
        writeStorage(key, JSON.stringify(value));
    } catch (error) {
        console.error(`写入 JSON 存储失败 [${key}]`, error);
    }
};

/** 清空认证相关存储 */
export const clearAuthStorage = (): void => {
    [
        STORAGE_KEYS.AUTH_KEY,
        STORAGE_KEYS.AUTH_TOKEN_KEY,
        STORAGE_KEYS.USER_INFO_KEY,
        STORAGE_KEYS.REAL_NAME_STATUS_KEY,
        STORAGE_KEYS.REAL_NAME_KEY,
    ].forEach(removeStorage);
};

