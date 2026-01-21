/**
 * URL 处理工具函数
 */

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
    // 后端返回的可能是 //domain/path，我们需要替换域名为真实的后端地址
    // 或者如果是相对路径 /storage/xxx，也需要加上后端地址
    const BACKEND_URL = 'http://47.76.239.170:8080';

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
