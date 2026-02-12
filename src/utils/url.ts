/**
 * URL 处理工具函数
 */

const rawEnv = (import.meta as any).env ?? {};

const resolveBackendUrl = (): string => {
    const candidates = [rawEnv?.VITE_API_BASE_URL, rawEnv?.VITE_API_TARGET];

    for (const candidate of candidates) {
        if (!candidate || !candidate.startsWith('http')) continue;
        try {
            return new URL(candidate).origin;
        } catch {
            // ignore invalid url and try next candidate
        }
    }

    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    return '';
};

const BACKEND_URL = resolveBackendUrl();

/**
 * 规范化 URL
 * 将以 // 开头的协议相对 URL 转换为 https:// 开头的完整 URL
 * @param url 原始 URL
 * @returns 规范化后的 URL
 */
export const normalizeUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return undefined;

    // 如果是阿里云 OSS 地址，确保是 https
    if (url.includes('aliyuncs.com')) {
        if (url.startsWith('//')) {
            return `https:${url}`;
        }
        return url;
    }

    // 如果是本地存储地址 (通常以 /storage 或 //domain/storage 开头)
    // 统一替换成当前环境的后端地址（优先环境变量，其次当前域名）
    if (!BACKEND_URL) {
        return url;
    }

    if (url.startsWith('//')) {
        // 移除 //domain 部分，保留 path
        const path = url.replace(/^\/\/[^\/]+/, '');
        return `${BACKEND_URL}${path}`;
    }

    if (url.startsWith('/')) {
        return `${BACKEND_URL}${url}`;
    }

    // 其他情况（如已经是 http 开头的完整地址但不是 OSS），直接返回
    return url;
};
