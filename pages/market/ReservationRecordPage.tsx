import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, CheckCircle2, Clock, Wallet, Zap, AlertCircle, ArrowRight, Calendar, Loader2 } from 'lucide-react';
import {
    fetchReservations,
    ReservationItem,
    ReservationStatus as ReservationStatusType,
} from '../../services/api';
import { Product } from '../../types';
import { Route } from '../../router/routes';
import { getStoredToken } from '../../services/client';
import { ReservationStatus } from '../../constants/statusEnums';

interface ReservationRecordPageProps {
    onBack: () => void;
    onNavigate: (route: Route) => void;
    onProductSelect?: (product: Product) => void;
}

const PAGE_SIZE = 10;

const ReservationRecordPage: React.FC<ReservationRecordPageProps> = ({ onBack, onNavigate, onProductSelect }) => {
    const [statusFilter, setStatusFilter] = useState<ReservationStatusType | undefined>(-1);
    const [records, setRecords] = useState<ReservationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

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
            setLoading(false);
        }
    }, [statusFilter, isLoggedIn]);

    const loadRecords = async (pageNum: number, append: boolean = false) => {
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
            });

            if (Number(response.code) === 1 && response.data) {
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
                setError(response.msg || '加载失败');
            }
        } catch (err: any) {
            console.error('加载申购记录失败:', err);
            if (err?.name === 'NeedLoginError') return;
            setError(err?.msg || '网络连接异常');
        } finally {
            setLoading(false);
            setLoadingMore(false);
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
                    <span className="text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 bg-orange-50 text-orange-600 border-orange-200">
                        <Clock size={10} className="text-orange-500" /> 待撮合
                    </span>
                );
            case ReservationStatus.APPROVED:
                return (
                    <span className="text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 bg-green-50 text-green-600 border-green-200">
                        <CheckCircle2 size={10} className="text-green-500" /> 已撮合
                    </span>
                );
            case ReservationStatus.REJECTED:
                return (
                    <span className="text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 bg-gray-100 text-gray-500 border-gray-200">
                        <AlertCircle size={10} className="text-gray-400" /> 已退款
                    </span>
                );
            default:
                return (
                    <span className="text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 bg-gray-50 text-gray-500 border-gray-200">
                        <Clock size={10} /> {item.status_text || '未知'}
                    </span>
                );
        }
    };

    // Format time - 后端返回的时间字段已是格式化字符串，直接使用
    // 如果是数字时间戳（如公告的 createtime），则需要转换
    const formatTime = (time: number | string | undefined) => {
        if (!time) return '';

        // 如果已经是格式化好的日期字符串（包含"-"或"/"），直接返回
        if (typeof time === 'string' && (time.includes('-') || time.includes('/'))) {
            return time;
        }

        // 数字时间戳处理
        let timeMs = 0;
        if (typeof time === 'string') {
            const parsed = parseInt(time);
            if (isNaN(parsed)) return time; // 无法解析，直接返回原始值
            timeMs = parsed < 10000000000 ? parsed * 1000 : parsed;
        } else {
            timeMs = time < 10000000000 ? time * 1000 : time;
        }

        const date = new Date(timeMs);
        if (isNaN(date.getTime())) return String(time); // 无效日期，返回原始值

        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get price zone based on price
    const getPriceZone = (price: number): string => {
        if (price < 1000) return '1k以下';
        if (price < 2000) return '1k';
        if (price < 3000) return '2k';
        if (price < 4000) return '3k';
        return '4k';
    };

    const handleProductClick = (record: ReservationItem) => {
        if (!onProductSelect) return;

        // Construct a partial Product object for navigation
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
            <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-gray-100">
                <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">申购记录</h1>
                <div className="w-8"></div>
            </header>

            {/* Filters */}
            <div className="sticky top-[53px] z-10 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex px-4">
                    {[
                        { key: -1 as ReservationStatusType, label: '全部' },
                        { key: ReservationStatus.PENDING as ReservationStatusType, label: '待撮合' },
                        { key: ReservationStatus.APPROVED as ReservationStatusType, label: '已撮合' },
                        { key: ReservationStatus.REJECTED as ReservationStatusType, label: '已退款' }
                    ].map(status => (
                        <button
                            key={status.key}
                            onClick={() => setStatusFilter(status.key)}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${statusFilter === status.key
                                ? 'border-[#8B0000] text-[#8B0000]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div ref={containerRef} onScroll={handleScroll} className="p-4 space-y-4 h-[calc(100vh-110px)] overflow-y-auto">
                {!isLoggedIn ? (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">请先登录</h3>
                        <p className="text-sm text-gray-500 mb-6">登录后即可查看您的申购记录</p>
                        <button
                            onClick={() => onNavigate({ name: 'login' })}
                            className="px-6 py-3 bg-[#8B0000] text-white rounded-lg font-bold shadow-md shadow-red-900/10 hover:bg-[#A00000] transition-colors"
                        >
                            去登录
                        </button>
                    </div>
                ) : loading ? (
                    <div className="py-20 text-center text-gray-400">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm">加载中...</p>
                    </div>
                ) : error ? (
                    <div className="py-20 text-center">
                        <div className="text-red-500 mb-4">{error}</div>
                        <button
                            onClick={() => loadRecords(1, false)}
                            className="text-sm font-bold text-orange-500 bg-orange-50 px-4 py-2 rounded-lg"
                        >
                            重试
                        </button>
                    </div>
                ) : records.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={24} />
                        </div>
                        <p className="text-sm">暂无申购记录</p>
                    </div>
                ) : (
                    records.map(record => (
                        <div key={record.id} className="bg-white rounded-xl p-5 shadow-lg border border-gray-100 mb-4 hover:shadow-xl transition-shadow duration-200">
                            {/* Header: Status & Time */}
                            <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-50">
                                <div className="text-xs text-gray-400">
                                    {record.create_time || ''}
                                </div>
                                {getStatusBadge(record)}
                            </div>

                            {/* Session & Zone Info */}
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-gray-900 font-bold text-base">{record.session_title || '盲盒预约'}</h3>
                                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100 font-bold">
                                        {record.zone_name || `分区${record.zone_id}`}
                                    </span>
                                </div>
                                {(record.session_start_time || record.session_end_time) && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar size={12} />
                                        <span>场次时间: {record.session_start_time || '--:--'} - {record.session_end_time || '--:--'}</span>
                                    </div>
                                )}

                            </div>

                            {/* Stats Grid */}
                            <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-y-2 gap-x-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><Wallet size={10} /> 冻结金额</span>
                                    <span className="text-xs font-bold text-red-600 font-mono">¥{Number(record.freeze_amount || 0).toLocaleString()}</span>
                                </div>
                                {record.status === ReservationStatus.APPROVED && record.item_price && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">实际金额</span>
                                        <span className="text-xs font-bold text-green-600 font-mono">¥{Number(record.item_price || 0).toLocaleString()}</span>
                                    </div>
                                )}
                                {record.status !== ReservationStatus.APPROVED && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1"><Zap size={10} /> 权重</span>
                                        <span className="text-xs font-bold text-gray-900 font-mono">{record.weight || 0}</span>
                                    </div>
                                )}
                                {(record.power_used > 0) && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1"><Zap size={10} /> 消耗算力</span>
                                        <span className="text-xs font-bold text-gray-900 font-mono">{record.power_used}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* 退款差价提示（仅已中签且有差价时显示） */}
                            {record.status === ReservationStatus.APPROVED && record.item_price && Number(record.freeze_amount) > Number(record.item_price) && (
                                <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-100">
                                    <div className="flex items-center gap-2 text-xs text-green-700">
                                        <CheckCircle2 size={12} className="flex-shrink-0" />
                                        <span>已退还差价：¥{(Number(record.freeze_amount) - Number(record.item_price)).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            {/* Footer Status/Action */}
                            <div className="flex justify-between items-center text-xs">
                                <div className="text-gray-400">
                                    {record.status === ReservationStatus.PENDING && record.session_end_time && `预计 ${record.session_end_time} 结束撮合`}
                                    {record.status === ReservationStatus.APPROVED && record.match_time && `撮合时间: ${record.match_time}`}
                                    {record.status === ReservationStatus.REJECTED && '未中签，冻结金额已退回'}
                                </div>

                                {record.status === ReservationStatus.APPROVED && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate({ name: 'my-collection', back: { name: 'reservation-record' } });
                                        }}
                                        className="text-xs font-bold text-[#8B0000] flex items-center gap-1 bg-red-50 pl-3 pr-2 py-1.5 rounded-full"
                                    >
                                        去持仓查看 <ArrowRight size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* 加载更多指示器 */}
                {loadingMore && (
                    <div className="py-3 flex items-center justify-center text-gray-400 text-xs">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        加载中...
                    </div>
                )}

                {/* 没有更多数据 */}
                {!loading && !hasMore && records.length > 0 && (
                    <div className="py-3 text-center text-gray-400 text-xs">
                        已加载全部
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper for session info rendering
const renderSessionInfo = (record: ReservationItem) => {
    if (!record.session_title) return null;
    return (
        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold truncate max-w-[120px]">
            {record.session_title}
        </span>
    );
}

export default ReservationRecordPage;
