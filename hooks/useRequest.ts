/**
 * useRequest - 通用请求 Hook
 * 
 * 功能说明：
 * - 封装异步请求的通用逻辑
 * - 自动管理 loading、data、error 状态
 * - 支持手动触发和自动触发两种模式
 * - 支持请求成功/失败回调
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * API 响应基础结构
 */
interface ApiResponse<T> {
    code?: number;
    msg?: string;
    message?: string;
    data?: T;
}

/**
 * useRequest Hook 配置选项
 */
interface UseRequestOptions<T> {
    /** 是否手动触发，默认 false（自动触发） */
    manual?: boolean;
    /** 默认请求参数 */
    defaultParams?: any[];
    /** 请求成功回调 */
    onSuccess?: (data: T) => void;
    /** 请求失败回调 */
    onError?: (error: Error) => void;
    /** 请求完成回调（无论成功失败） */
    onFinally?: () => void;
    /** 成功状态码，默认 1 */
    successCode?: number;
}

/**
 * useRequest Hook 返回值
 */
interface UseRequestResult<T, P extends any[]> {
    /** 请求返回的数据 */
    data: T | null;
    /** 是否正在加载 */
    loading: boolean;
    /** 错误信息 */
    error: Error | null;
    /** 手动触发请求 */
    run: (...params: P) => Promise<T | null>;
    /** 手动设置数据 */
    setData: (data: T | null) => void;
    /** 刷新请求（使用上次的参数） */
    refresh: () => Promise<T | null>;
    /** 重置状态 */
    reset: () => void;
}

/**
 * useRequest 通用请求 Hook
 * 
 * @param service - 请求服务函数，返回 Promise<ApiResponse<T>>
 * @param options - 配置选项
 * @returns 请求状态和控制方法
 * 
 * @example
 * // 自动触发请求
 * const { data, loading, error } = useRequest(
 *   () => fetchUserProfile(),
 *   { onSuccess: (data) => console.log('用户信息:', data) }
 * );
 * 
 * @example
 * // 手动触发请求
 * const { run, loading } = useRequest(
 *   (id: string) => fetchOrderDetail(id),
 *   { manual: true }
 * );
 * // 调用 run('order-123') 触发请求
 * 
 * @example
 * // 带默认参数
 * const { data, refresh } = useRequest(
 *   (page: number, pageSize: number) => fetchOrders(page, pageSize),
 *   { defaultParams: [1, 10] }
 * );
 * // 调用 refresh() 使用相同参数刷新
 */
function useRequest<T, P extends any[] = any[]>(
    service: (...params: P) => Promise<ApiResponse<T>>,
    options: UseRequestOptions<T> = {}
): UseRequestResult<T, P> {
    // 解构配置选项
    const {
        manual = false,
        defaultParams = [],
        onSuccess,
        onError,
        onFinally,
        successCode = 1,
    } = options;

    // 状态定义
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(!manual);
    const [error, setError] = useState<Error | null>(null);

    // 保存最后一次请求的参数，用于 refresh
    const lastParamsRef = useRef<P | null>(defaultParams as P || null);

    // 标记组件是否已卸载，防止内存泄漏
    const unmountedRef = useRef<boolean>(false);

    /**
     * 执行请求的核心函数
     */
    const run = useCallback(async (...params: P): Promise<T | null> => {
        // 保存本次请求参数
        lastParamsRef.current = params;

        // 设置加载状态
        setLoading(true);
        setError(null);

        try {
            // 调用服务函数
            const response = await service(...params);

            // 组件已卸载则不更新状态
            if (unmountedRef.current) return null;

            // 判断请求是否成功
            if (response.code === successCode) {
                const responseData = response.data as T;
                setData(responseData);
                onSuccess?.(responseData);
                return responseData;
            } else {
                // 业务错误
                const errorMessage = response.msg || response.message || '请求失败';
                const businessError = new Error(errorMessage);
                setError(businessError);
                onError?.(businessError);
                return null;
            }
        } catch (err) {
            // 网络错误或其他异常
            if (unmountedRef.current) return null;

            const catchError = err instanceof Error ? err : new Error('未知错误');
            setError(catchError);
            onError?.(catchError);
            return null;
        } finally {
            // 完成请求
            if (!unmountedRef.current) {
                setLoading(false);
                onFinally?.();
            }
        }
    }, [service, successCode, onSuccess, onError, onFinally]);

    /**
     * 刷新请求（使用上次的参数）
     */
    const refresh = useCallback(async (): Promise<T | null> => {
        if (lastParamsRef.current) {
            return run(...lastParamsRef.current);
        }
        return run(...([] as unknown as P));
    }, [run]);

    /**
     * 重置状态
     */
    const reset = useCallback(() => {
        setData(null);
        setLoading(false);
        setError(null);
    }, []);

    /**
     * 组件挂载时自动触发请求（非手动模式）
     */
    useEffect(() => {
        unmountedRef.current = false;

        if (!manual) {
            run(...(defaultParams as P));
        }

        // 组件卸载时标记
        return () => {
            unmountedRef.current = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        data,
        loading,
        error,
        run,
        setData,
        refresh,
        reset,
    };
}

export default useRequest;
