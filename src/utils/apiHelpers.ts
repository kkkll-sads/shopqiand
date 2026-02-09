/**
 * apiHelpers - API 响应统一处理工具
 *
 * 功能说明：
 * - 统一 API 响应成功/失败判断逻辑
 * - 提供数据提取、错误提取的辅助函数
 * - 支持自动错误处理的高阶函数
 *
 * 使用场景：
 * - 替换分散的 `response.code === 1` 判断（全局 115+ 处）
 * - 统一错误提示逻辑
 * - 简化业务代码
 *
 * @author 树交所前端团队
 * @version 1.0.0
 * @since 2025-12-29
 */

// 从 networking.ts 导入统一的 API 响应类型
import type { ApiResponse } from '@/services/networking';
export type { ApiResponse };

/**
 * 判断 API 响应是否成功
 *
 * 成功条件：
 * 1. code === 1（主要判断）
 * 2. code === undefined（兼容部分接口不返回 code 的情况）
 *
 * @param response - API 响应对象
 * @returns 是否成功
 *
 * @example
 * const response = await fetchProfile(token);
 * if (isSuccess(response)) {
 *   // 处理成功逻辑
 * }
 */
export const isSuccess = <T = any>(response: ApiResponse<T> | null | undefined): boolean => {
    if (!response) return false;
    return response.code === 1 || typeof response.code === 'undefined';
};

/**
 * 从 API 响应中提取数据
 *
 * 成功条件：
 * - code === 1（主要判断）
 * - code === 0（部分接口如签到、进度接口）
 * - code === undefined（兼容部分接口）
 *
 * @param response - API 响应对象
 * @returns 提取的数据，失败时返回 null
 *
 * @example
 * const response = await fetchProfile(token);
 * const userInfo = extractData(response);
 * if (userInfo) {
 *   console.log(userInfo.nickname);
 * }
 */
export const extractData = <T>(response: ApiResponse<T> | null | undefined): T | null => {
    if (!response) return null;
    // 接受 code === 0, 1, 或 undefined 作为成功标志
    const isSuccessful = response.code === 0 || response.code === 1 || typeof response.code === 'undefined';
    if (!isSuccessful) return null;
    return (response!.data as T) ?? null;
};

/**
 * 从 API 响应中提取错误信息
 *
 * 优先级：response.msg > response.message > 默认错误信息
 *
 * @param response - API 响应对象
 * @param defaultMessage - 默认错误信息
 * @returns 错误信息字符串
 *
 * @example
 * const response = await fetchProfile(token);
 * if (!isSuccess(response)) {
 *   const errorMsg = extractError(response);
 *   showToast('error', errorMsg);
 * }
 */
export const extractError = <T = any>(
    response: ApiResponse<T> | null | undefined,
    defaultMessage: string = '操作失败，请稍后重试'
): string => {
    if (!response) return defaultMessage;
    return response.msg || response.message || defaultMessage;
};

/**
 * 从 Error 对象中提取错误信息
 *
 * 支持：
 * - 标准 Error 对象
 * - 自定义错误对象（包含 msg 字段）
 * - 嵌套错误（err.response.msg）
 *
 * @param error - 错误对象
 * @param defaultMessage - 默认错误信息
 * @returns 错误信息字符串
 *
 * @example
 * try {
 *   await submitRealName();
 * } catch (err) {
 *   const errorMsg = extractErrorFromException(err);
 *   showToast('error', errorMsg);
 * }
 */
export const extractErrorFromException = (
    error: any,
    defaultMessage: string = '操作失败，请稍后重试'
): string => {
    if (!error) return defaultMessage;

    // 优先级：error.msg > error.response.msg > error.message
    if (error.msg) return error.msg;
    if (error.response?.msg) return error.response.msg;
    if (error.message) return error.message;

    return defaultMessage;
};

/**
 * 高阶函数：自动处理 API 响应的成功和错误
 *
 * 特性：
 * - 自动判断响应成功/失败
 * - 成功时返回数据，失败时返回 null
 * - 失败时自动调用错误回调
 *
 * @param apiFn - 返回 Promise<ApiResponse<T>> 的 API 函数
 * @param onError - 错误回调函数（可选）
 * @returns Promise<T | null>
 *
 * @example
 * // 基础用法
 * const userInfo = await withErrorHandling(
 *   () => fetchProfile(token)
 * );
 *
 * @example
 * // 带错误处理
 * const userInfo = await withErrorHandling(
 *   () => fetchProfile(token),
 *   (msg) => showToast('error', '获取用户信息失败', msg)
 * );
 */
export const withErrorHandling = async <T>(
    apiFn: () => Promise<ApiResponse<T>>,
    onError?: (errorMessage: string) => void
): Promise<T | null> => {
    try {
        const response = await apiFn();

        if (isSuccess(response)) {
            return extractData(response);
        } else {
            const errorMsg = extractError(response);
            onError?.(errorMsg);
            return null;
        }
    } catch (error: any) {
        const errorMsg = extractErrorFromException(error);
        onError?.(errorMsg);
        return null;
    }
};

/**
 * 高阶函数：自动处理 API 响应，并在失败时抛出错误
 *
 * 与 withErrorHandling 的区别：
 * - withErrorHandling: 失败时返回 null（适合可选数据）
 * - withErrorThrow: 失败时抛出错误（适合必须成功的操作）
 *
 * @param apiFn - 返回 Promise<ApiResponse<T>> 的 API 函数
 * @returns Promise<T>
 * @throws {Error} API 响应失败或网络错误时抛出
 *
 * @example
 * try {
 *   const result = await withErrorThrow(() => submitRealName(params));
 *   showToast('success', '提交成功');
 * } catch (err) {
 *   showToast('error', err.message);
 * }
 */
export const withErrorThrow = async <T>(
    apiFn: () => Promise<ApiResponse<T>>
): Promise<T> => {
    try {
        const response = await apiFn();

        if (isSuccess(response)) {
            const data = extractData(response);
            if (data === null) {
                throw new Error('服务器返回数据为空');
            }
            return data;
        } else {
            const errorMsg = extractError(response);
            throw new Error(errorMsg);
        }
    } catch (error: any) {
        // 如果是已经抛出的错误，直接传递
        if (error instanceof Error) {
            throw error;
        }
        // 否则包装为标准错误
        const errorMsg = extractErrorFromException(error);
        throw new Error(errorMsg);
    }
};

/**
 * 批量处理多个 API 请求
 *
 * 特性：
 * - 并行执行所有请求
 * - 自动处理每个请求的成功/失败
 * - 返回成功和失败的统计信息
 *
 * @param apiFns - API 函数数组
 * @returns Promise<{ success: T[], failed: string[], total: number }>
 *
 * @example
 * const { success, failed } = await batchApiCalls([
 *   () => fetchUserProfile(token),
 *   () => fetchRealNameStatus(token),
 *   () => fetchBalance(token),
 * ]);
 * console.log(`成功 ${success.length} 个，失败 ${failed.length} 个`);
 */
export const batchApiCalls = async <T>(
    apiFns: Array<() => Promise<ApiResponse<T>>>
): Promise<{
    success: T[];
    failed: string[];
    total: number;
}> => {
    const results = await Promise.allSettled(
        apiFns.map(fn => withErrorHandling(fn))
    );

    const success: T[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value !== null) {
            success.push(result.value);
        } else if (result.status === 'rejected') {
            failed.push(`请求 ${index + 1} 失败: ${result.reason}`);
        } else {
            failed.push(`请求 ${index + 1} 返回空数据`);
        }
    });

    return {
        success,
        failed,
        total: apiFns.length,
    };
};

/**
 * 类型守卫：判断对象是否为有效的 ApiResponse
 *
 * @param obj - 待判断对象
 * @returns 是否为 ApiResponse
 */
export const isApiResponse = (obj: any): obj is ApiResponse => {
    return obj !== null && typeof obj === 'object' && ('code' in obj || 'data' in obj);
};

/**
 * 辅助函数：检查响应是否包含特定错误码
 *
 * @param response - API 响应对象
 * @param errorCode - 错误码
 * @returns 是否匹配
 *
 * @example
 * if (hasErrorCode(response, 401)) {
 *   // 登录过期，跳转登录页
 * }
 */
export const hasErrorCode = <T = any>(
    response: ApiResponse<T> | null | undefined,
    errorCode: number
): boolean => {
    return response?.code === errorCode;
};

/**
 * 辅助函数：检查响应是否为登录过期
 *
 * @param response - API 响应对象
 * @returns 是否登录过期
 */
export const isLoginExpired = <T = any>(response: ApiResponse<T> | null | undefined): boolean => {
    // 根据实际项目调整错误码
    return hasErrorCode(response, 401) || hasErrorCode(response, -1);
};

// ============================================================================
// 使用示例（可删除）
// ============================================================================

/**
 * 示例1：简单判断
 *
 * // ❌ 旧写法
 * const response = await fetchProfile(token);
 * if (response.code === 1 && response.data) {
 *   setUser(response.data.userInfo);
 * } else {
 *   showToast('error', response.msg || '获取用户信息失败');
 * }
 *
 * // ✅ 新写法
 * const response = await fetchProfile(token);
 * const data = extractData(response);
 * if (data) {
 *   setUser(data.userInfo);
 * } else {
 *   showToast('error', extractError(response, '获取用户信息失败'));
 * }
 */

/**
 * 示例2：自动错误处理
 *
 * // ❌ 旧写法
 * try {
 *   const response = await submitRealName(params);
 *   if (response.code === 1) {
 *     showToast('success', '提交成功');
 *     navigate('/success');
 *   } else {
 *     showToast('error', response.msg || '提交失败');
 *   }
 * } catch (err: any) {
 *   showToast('error', err.message || '网络错误');
 * }
 *
 * // ✅ 新写法
 * const result = await withErrorHandling(
 *   () => submitRealName(params),
 *   (msg) => showToast('error', '提交失败', msg)
 * );
 * if (result) {
 *   showToast('success', '提交成功');
 *   navigate('/success');
 * }
 */

/**
 * 示例3：必须成功的操作
 *
 * // ✅ 新写法（使用 withErrorThrow）
 * try {
 *   const result = await withErrorThrow(() => submitRealName(params));
 *   showToast('success', '提交成功');
 *   navigate('/success');
 * } catch (err: any) {
 *   showToast('error', '提交失败', err.message);
 * }
 */
