/**
 * usePagination - 分页 Hook
 *
 * 功能说明：
 * - 封装列表分页加载的通用逻辑
 * - 支持下拉刷新和上拉加载更多
 * - 自动管理分页状态和数据合并
 *
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { isSuccess } from '../utils/apiHelpers';

/**
 * 分页响应数据结构
 */
interface PaginationResponse<T> {
    code?: number;
    msg?: string;
    data?: {
        list: T[];
        total?: number;
        page?: number;
        per_page?: number;
        current_page?: number;
        last_page?: number;
        has_more?: boolean;
    };
}

/**
 * usePagination Hook 配置选项
 */
interface UsePaginationOptions {
    /** 每页数量，默认 10 */
    pageSize?: number;
    /** 是否自动加载第一页，默认 true */
    autoLoad?: boolean;
}

/**
 * usePagination Hook 返回值
 */
interface UsePaginationResult<T> {
    /** 列表数据 */
    list: T[];
    /** 是否正在加载 */
    loading: boolean;
    /** 是否正在刷新 */
    refreshing: boolean;
    /** 是否还有更多数据 */
    hasMore: boolean;
    /** 当前页码 */
    page: number;
    /** 总数量 */
    total: number;
    /** 错误信息 */
    error: Error | null;
    /** 加载更多 */
    loadMore: () => Promise<void>;
    /** 刷新列表（重新加载第一页） */
    refresh: () => Promise<void>;
    /** 重置列表 */
    reset: () => void;
    /** 手动设置列表数据 */
    setList: (list: T[]) => void;
}

/**
 * usePagination 分页 Hook
 * 
 * @param fetchFn - 获取数据的函数，接收 page 和 pageSize 参数
 * @param options - 配置选项
 * @returns 分页状态和控制方法
 * 
 * @example
 * // 基础用法
 * const { list, loading, loadMore, refresh, hasMore } = usePagination(
 *   (page, pageSize) => fetchOrders(page, pageSize)
 * );
 * 
 * @example
 * // 自定义每页数量
 * const { list, loading, loadMore } = usePagination(
 *   (page, pageSize) => fetchProducts(page, pageSize),
 *   { pageSize: 20 }
 * );
 * 
 * @example
 * // 在列表底部使用
 * {hasMore && (
 *   <button onClick={loadMore} disabled={loading}>
 *     {loading ? '加载中...' : '加载更多'}
 *   </button>
 * )}
 */
function usePagination<T>(
    fetchFn: (page: number, pageSize: number) => Promise<PaginationResponse<T>>,
    options: UsePaginationOptions = {}
): UsePaginationResult<T> {
    // 解构配置选项
    const { pageSize = 10, autoLoad = true } = options;

    // 列表数据
    const [list, setList] = useState<T[]>([]);
    // 当前页码
    const [page, setPage] = useState<number>(1);
    // 总数量
    const [total, setTotal] = useState<number>(0);
    // 是否正在加载
    const [loading, setLoading] = useState<boolean>(false);
    // 是否正在刷新
    const [refreshing, setRefreshing] = useState<boolean>(false);
    // 是否还有更多数据
    const [hasMore, setHasMore] = useState<boolean>(true);
    // 错误信息
    const [error, setError] = useState<Error | null>(null);

    // 标记组件是否已卸载
    const unmountedRef = useRef<boolean>(false);
    // 标记是否正在加载，防止重复请求
    const loadingRef = useRef<boolean>(false);

    /**
     * 加载数据的核心函数
     * @param pageNum - 要加载的页码
     * @param isRefresh - 是否是刷新操作
     */
    const loadData = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
        // 防止重复加载
        if (loadingRef.current) return;

        // 设置加载状态
        loadingRef.current = true;
        setLoading(true);
        if (isRefresh) {
            setRefreshing(true);
        }
        setError(null);

        try {
            // 调用获取数据函数
            const response = await fetchFn(pageNum, pageSize);

            // 组件已卸载则不更新状态
            if (unmountedRef.current) return;

            if (isSuccess(response) && response.data) {
                const { list: newList = [], total: newTotal = 0, has_more, last_page } = response.data;

                // 判断是否还有更多数据
                const noMore = has_more === false ||
                    (last_page !== undefined && pageNum >= last_page) ||
                    newList.length < pageSize;

                setHasMore(!noMore);
                setTotal(newTotal);

                // 根据是否刷新决定数据处理方式
                if (isRefresh || pageNum === 1) {
                    // 刷新或第一页：替换数据
                    setList(newList);
                } else {
                    // 加载更多：追加数据
                    setList(prev => [...prev, ...newList]);
                }

                // 更新页码
                setPage(pageNum);
            } else {
                // 请求失败
                const errorMsg = response.msg || '获取数据失败';
                throw new Error(errorMsg);
            }
        } catch (err) {
            if (unmountedRef.current) return;

            const catchError = err instanceof Error ? err : new Error('获取数据失败');
            setError(catchError);
            console.error('分页加载失败:', catchError.message);
        } finally {
            if (!unmountedRef.current) {
                setLoading(false);
                setRefreshing(false);
                loadingRef.current = false;
            }
        }
    }, [fetchFn, pageSize]);

    /**
     * 加载更多
     */
    const loadMore = useCallback(async () => {
        if (!hasMore || loading) return;
        await loadData(page + 1, false);
    }, [hasMore, loading, page, loadData]);

    /**
     * 刷新列表
     */
    const refresh = useCallback(async () => {
        if (loading) return;
        await loadData(1, true);
    }, [loading, loadData]);

    /**
     * 重置列表
     */
    const reset = useCallback(() => {
        setList([]);
        setPage(1);
        setTotal(0);
        setHasMore(true);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        loadingRef.current = false;
    }, []);

    /**
     * 组件挂载时自动加载第一页
     */
    useEffect(() => {
        unmountedRef.current = false;

        if (autoLoad) {
            loadData(1, false);
        }

        return () => {
            unmountedRef.current = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        list,
        loading,
        refreshing,
        hasMore,
        page,
        total,
        error,
        loadMore,
        refresh,
        reset,
        setList,
    };
}

export default usePagination;
