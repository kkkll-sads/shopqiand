/**
 * ReservationRecordPage - 预约记录页面（现代化UI版）
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Clock, Wallet, Zap, AlertCircle, ArrowRight, Calendar, Loader2, Sparkles, FileText } from 'lucide-react';
import {
    fetchReservations,
    fetchCollectionSessions,
    ReservationItem,
    ReservationStatus as ReservationStatusType,
} from '@/services';
import { SelectFilter, SortSelector } from '@/components/common';
import type { SortOrder } from '@/components/common';
import type { SelectOption } from '@/components/common';
import { Product } from '@/types';
import { getStoredToken } from '@/services/client';
import { ReservationStatus } from '@/constants/statusEnums';
import { extractError, isSuccess } from '@/utils/apiHelpers';
import { errorLog, debugLog } from '@/utils/logger';
import { useAppStore, MARKET_CACHE_TTL } from '@/stores/appStore';

interface ReservationRecordPageProps {
    onProductSelect?: (product: Product) => void;
    source?: string;
    sessionId?: string;
    zoneId?: string;
    sessionTitle?: string;
    sessionStartTime?: string;
    sessionEndTime?: string;
}

const PAGE_SIZE = 10;

const ReservationRecordPage: React.FC<ReservationRecordPageProps> = ({
    onProductSelect: propOnProductSelect,
    source,
    sessionId,
    zoneId,
    sessionTitle,
    sessionStartTime,
    sessionEndTime
}) => {
    const navigate = useNavigate();
    const { listCaches, setListCache, setSelectedProduct } = useAppStore();
    
    // 如果没有传入 onProductSelect，使用默认的处理函数
    const onProductSelect = propOnProductSelect || ((product: Product) => {
        setSelectedProduct(product, 'reservation-record');
        navigate(`/product/${product.id}`);
    });

    // 缓存相关 refs
    const restoredFromCacheRef = useRef(false);
    const scrollTopRef = useRef(0);
    // 用于保存最新状态值，解决 cleanup 闭包问题
    const stateRef = useRef<{
        records: ReservationItem[];
        page: number;
        hasMore: boolean;
        statusFilter: ReservationStatusType | undefined;
        sessionFilter: string;
        zoneFilter: string;
        sortField: string;
        sortOrder: string;
    }>({
        records: [],
        page: 1,
        hasMore: true,
        statusFilter: -1,
        sessionFilter: 'all',
        zoneFilter: 'all',
        sortField: 'create_time',
        sortOrder: 'desc'
    });

    const [statusFilter, setStatusFilter] = useState<ReservationStatusType | undefined>(-1);
    const [sessionFilter, setSessionFilter] = useState<string>('all');
    const [zoneFilter, setZoneFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<'create_time' | 'weight' | 'freeze_amount'>('create_time');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [sessionOptions, setSessionOptions] = useState<SelectOption[]>([]);
    const [records, setRecords] = useState<ReservationItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // ========================================
    // 缓存恢复逻辑：组件挂载时检查并恢复缓存
    // ========================================
    useEffect(() => {
        const cache = listCaches.reservationRecord;
        if (cache && Date.now() - cache.timestamp < MARKET_CACHE_TTL) {
            debugLog('ReservationRecordPage', '从缓存恢复状态', {
                dataCount: cache.data.length,
                page: cache.page,
                statusFilter: cache.filters?.statusFilter,
                scrollTop: cache.scrollTop
            });

            // 恢复状态
            setRecords(cache.data as ReservationItem[]);
            setPage(cache.page);
            setHasMore(cache.hasMore);
            if (cache.filters?.statusFilter !== undefined) {
                setStatusFilter(cache.filters.statusFilter);
            }
            if (cache.filters?.sessionFilter) setSessionFilter(cache.filters.sessionFilter);
            if (cache.filters?.zoneFilter) setZoneFilter(cache.filters.zoneFilter);
            if (cache.filters?.sortField) setSortField(cache.filters.sortField);
            if (cache.filters?.sortOrder) setSortOrder(cache.filters.sortOrder as SortOrder);

            // 标记已从缓存恢复
            restoredFromCacheRef.current = true;
            // 保存滚动位置到 ref，等待数据渲染完成后再恢复
            scrollTopRef.current = cache.scrollTop;

            // 设置登录状态
            const token = getStoredToken();
            setIsLoggedIn(!!token);
        }
    }, []); // 仅在组件挂载时执行一次

    // ========================================
    // 同步状态到 ref，确保 cleanup 能获取最新值
    // ========================================
    useEffect(() => {
        stateRef.current = {
            records,
            page,
            hasMore,
            statusFilter,
            sessionFilter,
            zoneFilter,
            sortField,
            sortOrder
        };
    }, [records, page, hasMore, statusFilter, sessionFilter, zoneFilter, sortField, sortOrder]);

    // ========================================
    // 滚动位置恢复：在数据渲染完成后恢复
    // ========================================
    useEffect(() => {
        // 只有在从缓存恢复且数据已渲染时才恢复滚动位置
        if (restoredFromCacheRef.current && records.length > 0 && scrollTopRef.current > 0) {
            const restoreScroll = () => {
                if (containerRef.current && scrollTopRef.current > 0) {
                    const targetScroll = scrollTopRef.current;
                    containerRef.current.scrollTo({ top: targetScroll, behavior: 'instant' });
                    // 验证是否恢复成功
                    if (Math.abs(containerRef.current.scrollTop - targetScroll) > 10) {
                        // 如果恢复失败，重试
                        setTimeout(() => {
                            if (containerRef.current) {
                                containerRef.current.scrollTo({ top: targetScroll, behavior: 'instant' });
                            }
                        }, 100);
                    }
                }
            };

            // 使用多次 rAF + setTimeout 确保 DOM 完全渲染后再恢复
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    restoreScroll();
                    // 延迟恢复，确保列表项完全渲染
                    setTimeout(restoreScroll, 100);
                    setTimeout(restoreScroll, 300);
                });
            });

            // 恢复完成后，重置标志
            restoredFromCacheRef.current = false;
        }
    }, [records.length]); // 监听数据长度变化

    // ========================================
    // 缓存保存逻辑：组件卸载时保存状态
    // ========================================
    useEffect(() => {
        // 更新滚动位置 ref
        const handleScrollForCache = () => {
            if (containerRef.current) {
                scrollTopRef.current = containerRef.current.scrollTop;
            }
        };

        const container = containerRef.current;
        container?.addEventListener('scroll', handleScrollForCache);

        return () => {
            container?.removeEventListener('scroll', handleScrollForCache);

            // 组件卸载时保存缓存（使用 stateRef 获取最新值）
            const state = stateRef.current;
            if (state.records.length > 0) {
                debugLog('ReservationRecordPage', '保存缓存状态', {
                    dataCount: state.records.length,
                    page: state.page,
                    statusFilter: state.statusFilter,
                    scrollTop: scrollTopRef.current
                });

                setListCache('reservationRecord', {
                    data: state.records,
                    page: state.page,
                    hasMore: state.hasMore,
                    scrollTop: scrollTopRef.current,
                    filters: {
                        statusFilter: state.statusFilter,
                        sessionFilter: state.sessionFilter,
                        zoneFilter: state.zoneFilter,
                        sortField: state.sortField,
                        sortOrder: state.sortOrder
                    },
                    timestamp: Date.now()
                });
            }
        };
    }, [setListCache]); // 只依赖 setListCache，其他值通过 stateRef 获取

    // Check login status
    useEffect(() => {
        const token = getStoredToken();
        setIsLoggedIn(!!token);
    }, []);

    // Fetch session options for filter
    useEffect(() => {
        if (!isLoggedIn) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetchCollectionSessions();
                if (cancelled) return;
                if (isSuccess(res) && res.data?.list?.length) {
                    const opts: SelectOption[] = [
                        { value: 'all', label: '全部场次' },
                        ...res.data.list.map((s: { id: number; title: string }) => ({ value: String(s.id), label: s.title })),
                    ];
                    setSessionOptions(opts);
                }
            } catch (e) {
                if (!cancelled) errorLog('ReservationRecordPage', '获取场次列表失败', e);
            }
        })();
        return () => { cancelled = true; };
    }, [isLoggedIn]);

    const zoneOptions: SelectOption[] = useMemo(() => [
        { value: 'all', label: '全部分区' },
    ], []);

    const sortOptions = useMemo(() => [
        { value: 'create_time', label: '创建时间' },
        { value: 'weight', label: '权重' },
        { value: 'freeze_amount', label: '冻结金额' },
    ], []);

    // Load reservation records
    useEffect(() => {
        // 如果是从缓存恢复的，跳过首次加载
        if (restoredFromCacheRef.current) {
            restoredFromCacheRef.current = false;
            debugLog('ReservationRecordPage', '跳过首次加载（从缓存恢复）');
            return;
        }

        if (isLoggedIn) {
            setPage(1);
            setRecords([]);
            loadRecords(1, false);
        }
    }, [statusFilter, isLoggedIn, sessionFilter, zoneFilter, sortField, sortOrder]);

    const loadRecords = useCallback(async (pageNum: number, append: boolean = false) => {
        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await fetchReservations({
                status: statusFilter,
                page: pageNum,
                limit: PAGE_SIZE,
                session_id: sessionFilter === 'all' ? undefined : sessionFilter,
                zone_id: zoneFilter === 'all' ? undefined : zoneFilter,
                sort: sortField,
                order: sortOrder,
            });

            if (isSuccess(response) && response.data) {
                const newList = response.data.list || [];
                const total = response.data.total || 0;
                if (append) {
                    setRecords(prev => [...prev, ...newList]);
                } else {
                    setRecords(newList);
                }
                setPage(pageNum);
                setHasMore(pageNum * PAGE_SIZE < total);
            } else {
                setError(extractError(response, '加载失败'));
            }
        } catch (err: any) {
            errorLog('ReservationRecordPage', '加载申购记录失败', err);
            if (err?.name === 'NeedLoginError') return;
            setError(err?.msg || '网络连接异常');
        } finally {
            if (append) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    }, [statusFilter, sessionFilter, zoneFilter, sortField, sortOrder]);

    // 滚动加载更多
    const handleScroll = useCallback(() => {
        if (!containerRef.current || loadingMore || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadRecords(page + 1, true);
        }
    }, [loadingMore, hasMore, page, loadRecords]);

    const getStatusBadge = (item: ReservationItem) => {
        switch (item.status) {
            case ReservationStatus.PENDING:
                return (
                    <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-red-500/10 text-amber-600 border border-amber-200/50 shadow-sm">
                        <Clock size={12} className="animate-pulse" /> 待撮合
                    </span>
                );
            case ReservationStatus.APPROVED:
                return (
                    <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 border border-emerald-200/50 shadow-sm">
                        <CheckCircle2 size={12} /> 已撮合
                    </span>
                );
            case ReservationStatus.REFUNDED:
                return (
                    <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 bg-gray-100 text-gray-500 border border-gray-200/50 shadow-sm">
                        <AlertCircle size={12} /> 已退款
                    </span>
                );
            default:
                return (
                    <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 bg-gray-50 text-gray-500 border border-gray-200/50">
                        <Clock size={12} /> {item.status_text || '未知'}
                    </span>
                );
        }
    };

    const formatTime = (time: number | string | undefined) => {
        if (!time) return '';
        if (typeof time === 'string' && (time.includes('-') || time.includes('/'))) {
            return time;
        }
        let timeMs = 0;
        if (typeof time === 'string') {
            const parsed = parseInt(time);
            if (isNaN(parsed)) return time;
            timeMs = parsed < 10000000000 ? parsed * 1000 : parsed;
        } else {
            timeMs = time < 10000000000 ? time * 1000 : time;
        }
        const date = new Date(timeMs);
        if (isNaN(date.getTime())) return String(time);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPriceZone = (price: number): string => {
        if (price < 1000) return '1k以下';
        if (price < 2000) return '1k';
        if (price < 3000) return '2k';
        if (price < 4000) return '3k';
        return '4k';
    };

    const handleProductClick = (record: ReservationItem) => {
        const product: Product = {
            id: String(record.item_id),
            title: record.item_title || '商品详情',
            image: record.item_image || '',
            price: record.item_price || 0,
            productType: 'collection',
            reservationId: record.id,
            reservationStatus: record.status_text || String(record.status),
            artist: '',
            category: '',
        };
        onProductSelect(product);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 flex items-center justify-between text-white shadow-lg">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full active:bg-white/20 transition-all"
                >
                    <ChevronLeft size={22} />
                </button>
                <h1 className="text-lg font-bold">申购记录</h1>
                <div className="w-10" />
            </header>

            {/* 统计卡片 */}
            <div className="mx-4 mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <FileText size={20} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">申购记录</p>
                            <p className="text-lg font-bold text-gray-900">{records.length} <span className="text-sm font-normal text-gray-400">条</span></p>
                        </div>
                    </div>
                    <Sparkles size={18} className="text-red-400" />
                </div>
            </div>

            {/* Filters */}
            <div className="mt-4 mx-4 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                <div className="flex">
                    {[
                        { key: -1 as ReservationStatusType, label: '全部', icon: null },
                        { key: ReservationStatus.PENDING as ReservationStatusType, label: '待撮合', icon: Clock },
                        { key: ReservationStatus.APPROVED as ReservationStatusType, label: '已撮合', icon: CheckCircle2 },
                        { key: ReservationStatus.REFUNDED as ReservationStatusType, label: '已退款', icon: AlertCircle }
                    ].map(status => (
                        <button
                            key={status.key}
                            onClick={() => setStatusFilter(status.key)}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${statusFilter === status.key
                                ? 'bg-red-500 text-white shadow-sm'
                                : 'text-gray-500'
                                }`}
                        >
                            {status.icon && <status.icon size={12} />}
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 筛选栏：场次、价格区、排序 */}
            {isLoggedIn && (
                <div className="mt-3 mx-4 flex gap-2 overflow-x-auto pb-1">
                    <SelectFilter
                        label="场次"
                        value={sessionFilter}
                        options={sessionOptions.length ? sessionOptions : [{ value: 'all', label: '全部场次' }]}
                        onChange={setSessionFilter}
                        placeholder="全部场次"
                    />
                    <SelectFilter
                        label="价格区"
                        value={zoneFilter}
                        options={zoneOptions}
                        onChange={setZoneFilter}
                        placeholder="全部分区"
                    />
                    <SortSelector
                        sortField={sortField}
                        sortOrder={sortOrder}
                        options={sortOptions}
                        onSortChange={(field, order) => {
                            setSortField(field as 'create_time' | 'weight' | 'freeze_amount');
                            setSortOrder(order);
                        }}
                    />
                </div>
            )}

            {/* List */}
            <div ref={containerRef} onScroll={handleScroll} className="p-4 space-y-3 h-[calc(100vh-260px)] overflow-y-auto">
                {!isLoggedIn ? (
                    <div className="py-16 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">请先登录</h3>
                        <p className="text-sm text-gray-500 mb-6">登录后即可查看您的申购记录</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 active:scale-95 transition-all"
                        >
                            去登录
                        </button>
                    </div>
                ) : loading ? (
                    <div className="py-20 text-center">
                        <div className="w-12 h-12 border-4 border-red-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm text-gray-500">加载中...</p>
                    </div>
                ) : error ? (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={28} className="text-red-400" />
                        </div>
                        <p className="text-red-500 text-sm mb-4">{error}</p>
                        <button
                            onClick={() => loadRecords(1, false)}
                            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-bold shadow-lg active:scale-95 transition-transform"
                        >
                            重试
                        </button>
                    </div>
                ) : records.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={28} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 text-sm">暂无申购记录</p>
                    </div>
                ) : (
                    records.map((record, index) => {
                        const handleCardClick = () => {
                            // 点击卡片进入申购记录详情
                            navigate(`/reservation-record/${record.id}`);
                        };

                        return (
                            <div
                                key={record.id}
                                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition-all"
                                onClick={handleCardClick}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-50">
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {record.create_time || ''}
                                    </div>
                                    {getStatusBadge(record)}
                                </div>

                                {/* Session & Zone Info */}
                                <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-gray-900 font-bold text-sm">{record.session_title || '盲盒预约'}</h3>
                                        <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                            {record.zone_name || `分区${record.zone_id}`}
                                        </span>
                                    </div>
                                    {(record.session_start_time || record.session_end_time) && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Clock size={11} className="text-gray-400" />
                                            <span>场次: {record.session_start_time || '--:--'} - {record.session_end_time || '--:--'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Grid */}
                                <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-2 mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5">
                                            <Wallet size={10} /> 冻结金额
                                        </span>
                                        <span className="text-sm font-bold text-red-600">
                                            ¥{Number(record.freeze_amount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    {record.status === ReservationStatus.APPROVED && record.actual_buy_price !== undefined && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 mb-0.5">实际金额</span>
                                            <span className="text-sm font-bold text-green-600">
                                                ¥{Number(record.actual_buy_price || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5">
                                            <Zap size={10} /> 消耗算力
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">{record.power_used || 5}</span>
                                    </div>
                                </div>

                                {/* 退款差价提示 */}
                                {record.status === ReservationStatus.APPROVED && record.refund_diff !== undefined && Number(record.refund_diff) > 0 && (
                                    <div className="mb-3 p-2.5 bg-green-50 rounded-lg border border-green-100">
                                        <div className="flex items-center gap-2 text-xs text-green-700">
                                            <CheckCircle2 size={14} className="flex-shrink-0" />
                                            <span className="font-medium">已退还差价：¥{Number(record.refund_diff).toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex justify-between items-center text-xs">
                                    <div className="text-gray-400">
                                        {record.status === ReservationStatus.PENDING && record.session_end_time && `预计 ${record.session_end_time} 结束撮合`}
                                        {record.status === ReservationStatus.APPROVED && record.match_time && `撮合时间: ${record.match_time}`}
                                        {record.status === ReservationStatus.REFUNDED && '未中签，冻结金额已退回'}
                                    </div>

                                    {record.status === ReservationStatus.APPROVED && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // 跳转到我的藏品页面查看持仓
                                                // 注意：申购系统和藏品系统是两个独立系统，product_id 不是藏品 ID
                                                navigate('/my-collection');
                                            }}
                                            className="text-xs font-medium text-white flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 pl-3 pr-2 py-1.5 rounded-full shadow-sm"
                                        >
                                            去持仓 <ArrowRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                {/* 加载更多 */}
                {loadingMore && (
                    <div className="py-4 flex items-center justify-center text-gray-400 text-xs">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        加载中...
                    </div>
                )}

                {/* 没有更多数据 */}
                {!loading && !hasMore && records.length > 0 && (
                    <div className="py-4 text-center text-gray-400 text-xs">
                        — 已加载全部 —
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReservationRecordPage;
