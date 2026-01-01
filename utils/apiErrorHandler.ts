/**
 * 统一 API 错误处理工具
 * 
 * 后端接口约定：
 * - code === 1 表示成功
 * - code === 0 或其他值表示失败，msg 字段包含错误信息
 * - 速率限制等通用错误也通过 msg 返回
 */

import { ApiResponse } from '../services/networking';

/**
 * 从 API 响应中提取错误消息
 * 优先级：response.msg > response.message > response.data?.msg > 默认消息
 */
export function getApiErrorMessage(
    response: ApiResponse<any> | null | undefined,
    defaultMessage: string = '操作失败，请重试'
): string {
    if (!response) return defaultMessage;

    // 优先使用 msg 字段
    if (response.msg && typeof response.msg === 'string') {
        return response.msg;
    }

    // 兼容 message 字段
    if (response.message && typeof response.message === 'string') {
        return response.message;
    }

    // 检查 data 中的消息
    if (response.data) {
        if (response.data.msg && typeof response.data.msg === 'string') {
            return response.data.msg;
        }
        if (response.data.message && typeof response.data.message === 'string') {
            return response.data.message;
        }
    }

    return defaultMessage;
}

/**
 * 检查 API 响应是否成功
 * 后端约定 code === 1 为成功
 */
export function isApiSuccess(response: ApiResponse<any> | null | undefined): boolean {
    if (!response) return false;
    // 兼容 Number 类型转换
    return Number(response.code) === 1;
}

/**
 * 检查是否是速率限制错误
 */
export function isRateLimitError(response: ApiResponse<any> | null | undefined): boolean {
    if (!response) return false;
    const msg = response.msg || response.message || '';
    return msg.toLowerCase().includes('frequently') ||
        msg.includes('请求频繁') ||
        msg.includes('请稍后') ||
        msg.toLowerCase().includes('try again');
}

/**
 * 从错误对象中提取消息
 * 支持 Error 对象、API 响应对象、字符串等
 */
export function getErrorMessage(
    error: unknown,
    defaultMessage: string = '操作失败，请重试'
): string {
    if (!error) return defaultMessage;

    // 字符串直接返回
    if (typeof error === 'string') return error;

    // Error 对象
    if (error instanceof Error) {
        // 检查是否有 msg 属性（后端返回的错误）
        const anyError = error as any;
        if (anyError.msg && typeof anyError.msg === 'string') {
            return anyError.msg;
        }
        return error.message || defaultMessage;
    }

    // 对象类型（可能是 API 响应）
    if (typeof error === 'object') {
        const obj = error as any;

        // 优先使用 msg
        if (obj.msg && typeof obj.msg === 'string') {
            return obj.msg;
        }

        // 兼容 message
        if (obj.message && typeof obj.message === 'string') {
            return obj.message;
        }

        // 检查嵌套的 data
        if (obj.data?.msg && typeof obj.data.msg === 'string') {
            return obj.data.msg;
        }
    }

    return defaultMessage;
}

/**
 * 格式化速率限制错误消息
 * 将英文消息转换为中文提示
 */
export function formatRateLimitMessage(msg: string): string {
    // 匹配 "Try again in X seconds" 格式
    const match = msg.match(/try again in (\d+) seconds?/i);
    if (match) {
        const seconds = match[1];
        return `请求过于频繁，请${seconds}秒后重试`;
    }

    // 其他频繁请求的消息
    if (msg.toLowerCase().includes('frequently')) {
        return '请求过于频繁，请稍后重试';
    }

    return msg;
}

/**
 * 处理 API 错误并返回用户友好的消息
 * 综合处理速率限制、通用错误等场景
 */
export function handleApiError(
    error: unknown,
    defaultMessage: string = '操作失败，请重试'
): string {
    const msg = getErrorMessage(error, defaultMessage);

    // 如果是速率限制错误，格式化消息
    if (isRateLimitError({ msg } as ApiResponse<any>)) {
        return formatRateLimitMessage(msg);
    }

    return msg;
}
