/**
 * ReservationRecordPage - 预约记录页面（现代化UI版）
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Clock, Wallet, Zap, AlertCircle, ArrowRight, Calendar, Loader2, Sparkles, FileText } from 'lucide-react';
import {
    fetchReservations,
    ReservationItem,
    ReservationStatus as ReservationStatusType,
} from '../../../services/api';
import { Product } from '../../../types';
import { getStoredToken } from '../../../services/client';
import { ReservationStatus } from '../../../constants/statusEnums';
import { extractError, isSuccess } from '../../../utils/apiHelpers';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';

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
    onProductSelect,
    source,
    sessionId,
    zoneId,
    sessionTitle,
    sessionStartTime,
    sessionEndTime
}) => {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<ReservationStatusType | undefined>(-1);
    const [records, setRecords] = useState<ReservationItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const listMachine = useStateMachine<LoadingState, LoadingEvent>({
        initial: LoadingState.IDLE,
        transitions: {
            [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
            [LoadingState.LOADING]: {
                [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
                [LoadingEvent.ERROR]: LoadingState.ERROR,
            },
            [LoadingState.SUCCESS]: {
                [LoadingEvent.LOAD]: LoadingState.LOADING,
                [LoadingEvent.RETRY]: LoadingState.LOADING,
            },
            [LoadingState.ERROR]: {
                [LoadingEvent.LOAD]: LoadingState.LOADING,
                [LoadingEvent.RETRY]: LoadingState.LOADING,
            },
        },
    });
    const loadMoreMachine = useStateMachine<LoadingState, LoadingEvent>({
        initial: LoadingState.IDLE,
        transitions: {
            [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
            [LoadingState.LOADING]: {
                [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
                [LoadingEvent.ERROR]: LoadingState.ERROR,
            },
            [LoadingState.SUCCESS]: {
                [LoadingEvent.LOAD]: LoadingState.LOADING,
                [LoadingEvent.RETRY]: LoadingState.LOADING,
            },
            [LoadingState.ERROR]: {
                [LoadingEvent.LOAD]: LoadingState.LOADING,
                [LoadingEvent.RETRY]: LoadingState.LOADING,
            },
        },
    });
    const loading = listMachine.state === LoadingState.LOADING;
    const loadingMore = loadMoreMachine.state === LoadingState.LOADING;

    // Check login status
    useEffect(() => {
        const token = getStoredToken();
        setIsLoggedIn(!!token);
    }, []);

    // Load reservation records
    useEffect(() => {
        if (isLoggedIn) {
            setPage(1);
            setRecords([]);
            loadRecords(1, false);
        } else {
            listMachine.send(LoadingEvent.SUCCESS);
        }
    }, [statusFilter, isLoggedIn]);

    const loadRecords = async (pageNum: number, append: boolean = false) => {
        try {
            if (append) {
                loadMoreMachine.send(LoadingEvent.LOAD);
            } else {
                listMachine.send(LoadingEvent.LOAD);
            }
            setError(null);

            const response = await fetchReservations({
                status: statusFilter,
                page: pageNum,
                limit: PAGE_SIZE,
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
                if (append) {
                    loadMoreMachine.send(LoadingEvent.SUCCESS);
                } else {
                    listMachine.send(LoadingEvent.SUCCESS);
                }
            } else {
                setError(extractError(response, '加载失败'));
                if (append) {
                    loadMoreMachine.send(LoadingEvent.ERROR);
                } else {
                    listMachine.send(LoadingEvent.ERROR);
                }
            }
        } catch (err: any) {
            console.error('加载申购记录失败:', err);
            if (err?.name === 'NeedLoginError') return;
            setError(err?.msg || '网络连接异常');
            if (append) {
                loadMoreMachine.send(LoadingEvent.ERROR);
            } else {
                listMachine.send(LoadingEvent.ERROR);
            }
        }
    };

    // 滚动加载更多
    const handleScroll = useCallback(() => {
        if (!containerRef.current || loadingMore || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadRecords(page + 1, true);
        }
    }, [loadingMore, hasMore, page, statusFilter]);

    const getStatusBadge = (item: ReservationItem) => {
        switch (item.status) {
            case ReservationStatus.PENDING:
                return (
                    <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 border border-amber-200/50 shadow-sm">
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
        if (!onProductSelect) return;
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
            <header className="sticky top-0 z-20 bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between text-white shadow-lg">
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
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <FileText size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">申购记录</p>
                            <p className="text-lg font-bold text-gray-900">{records.length} <span className="text-sm font-normal text-gray-400">条</span></p>
                        </div>
                    </div>
                    <Sparkles size={18} className="text-orange-400" />
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
                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                                statusFilter === status.key
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'text-gray-500'
                            }`}
                        >
                            {status.icon && <status.icon size={12} />}
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div ref={containerRef} onScroll={handleScroll} className="p-4 space-y-3 h-[calc(100vh-220px)] overflow-y-auto">
                {!isLoggedIn ? (
                    <div className="py-16 text-center">
                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">请先登录</h3>
                        <p className="text-sm text-gray-500 mb-6">登录后即可查看您的申购记录</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all"
                        >
                            去登录
                        </button>
                    </div>
                ) : loading ? (
                    <div className="py-20 text-center">
                        <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
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
                            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-bold shadow-lg active:scale-95 transition-transform"
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
                            if (record.status === ReservationStatus.APPROVED && record.product_id) {
                                navigate(`/product/${record.product_id}`, { state: { productType: 'collection' } });
                            } else {
                                navigate(`/reservation-record/${record.id}`);
                            }
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
                                        <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
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
                                        <span className="text-sm font-bold text-orange-600">
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
                                                if (record.product_id) {
                                                    navigate(`/product/${record.product_id}`, { state: { productType: 'collection' } });
                                                } else {
                                                    navigate('/my-collection');
                                                }
                                            }}
                                            className="text-xs font-medium text-white flex items-center gap-1 bg-gradient-to-r from-orange-500 to-orange-600 pl-3 pr-2 py-1.5 rounded-full shadow-sm"
                                        >
                                            {record.product_id ? '查看证书' : '去持仓'} <ArrowRight size={12} />
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
