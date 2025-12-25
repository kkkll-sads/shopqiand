import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, Clock, Wallet, Zap, AlertCircle, ArrowRight, Calendar } from 'lucide-react';
import {
    fetchMatchingPool,
    MatchingPoolItem,
    MatchingPoolStatus,
    AUTH_TOKEN_KEY
} from '../../services/api';
import { Product } from '../../types';

interface ReservationRecordPageProps {
    onBack: () => void;
    onNavigate: (page: string) => void;
    onProductSelect?: (product: Product) => void;
}

const ReservationRecordPage: React.FC<ReservationRecordPageProps> = ({ onBack, onNavigate, onProductSelect }) => {
    const [statusFilter, setStatusFilter] = useState<'all' | MatchingPoolStatus>('all');
    const [records, setRecords] = useState<MatchingPoolItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check login status
    useEffect(() => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        setIsLoggedIn(!!token);
    }, []);

    // Load matching pool records
    useEffect(() => {
        if (isLoggedIn) {
            loadRecords();
        } else {
            setLoading(false);
        }
    }, [statusFilter, isLoggedIn]);

    const loadRecords = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetchMatchingPool({
                status: statusFilter === 'all' ? undefined : statusFilter,
                page: 1,
                limit: 100,
            });

            if (response.code === 0 && response.data) { // API success coe is 0
                setRecords(response.data.list || []);
            } else if (response.code === 1 && response.data) { // Handle potential legacy code 1
                setRecords(response.data.list || []);
            } else {
                setError(response.msg || '加载失败');
            }
        } catch (err: any) {
            console.error('加载申购记录失败:', err);
            // Don't show error for login issues - handle separately
            if (err?.name !== 'NeedLoginError') {
                setError(err?.msg || '网络连接异常');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (item: any) => {
        // 优先使用 status_text 字段，如果没有则使用 status 字段
        const displayText = item.status_text || (() => {
            switch (item.status) {
                case 'pending': return '待匹配';
                case 'matched': return '中签';
                case 'cancelled': return '已取消';
                default: return item.status;
            }
        })();

        // 根据状态设置不同的样式
        const getStatusStyle = (status: string, displayText: string) => {
            // 如果有 status_text，使用特殊的样式
            if (item.status_text) {
                // 根据 status_text 的内容设置样式
                if (displayText.includes('寄售') || displayText.includes('出售')) {
                    return 'bg-blue-50 text-blue-600 border-blue-200';
                } else if (displayText.includes('确权') || displayText.includes('成功')) {
                    return 'bg-green-50 text-green-600 border-green-200';
                } else if (displayText.includes('失败') || displayText.includes('取消')) {
                    return 'bg-red-50 text-red-600 border-red-200';
                }
            }

            // 默认根据 status 设置样式
            switch (status) {
                case 'pending':
                    return 'bg-orange-50 text-orange-600 border-orange-200';
                case 'matched':
                    return 'bg-green-50 text-green-600 border-green-200';
                case 'cancelled':
                    return 'bg-gray-50 text-gray-500 border-gray-200';
                default:
                    return 'bg-gray-50 text-gray-500 border-gray-200';
            }
        };

        const styleClass = getStatusStyle(item.status, displayText);

        // 根据状态选择图标
        const getStatusIcon = (status: string, displayText: string) => {
            if (item.status_text) {
                if (displayText.includes('寄售') || displayText.includes('出售')) {
                    return <Clock size={10} />;
                } else if (displayText.includes('确权') || displayText.includes('成功')) {
                    return <CheckCircle2 size={10} />;
                }
            }

            switch (status) {
                case 'pending':
                    return <Clock size={10} />;
                case 'matched':
                    return <CheckCircle2 size={10} />;
                case 'cancelled':
                    return <AlertCircle size={10} />;
                default:
                    return <Clock size={10} />;
            }
        };

        return (
            <span className={`text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${styleClass}`}>
                {getStatusIcon(item.status, displayText)} {displayText}
            </span>
        );
    };

    // Format timestamp to date string
    const formatTime = (timestamp: number | string | undefined) => {
        if (!timestamp) return '';
        // If string and looks like seconds (10 digits), multiply by 1000
        // If number and small (seconds), multiply by 1000
        let timeMs = 0;
        if (typeof timestamp === 'string') {
            const parsed = parseInt(timestamp);
            timeMs = parsed < 10000000000 ? parsed * 1000 : parsed;
        } else {
            timeMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
        }

        const date = new Date(timeMs);
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

    const handleProductClick = (record: MatchingPoolItem) => {
        if (!onProductSelect) return;

        // Construct a partial Product object for navigation
        const product: Product = {
            id: String(record.item_id),
            title: record.item_title || '商品详情',
            image: record.item_image || '',
            price: record.item_price || 0,
            productType: 'collection',
            reservationId: record.id,
            reservationStatus: record.status,
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
                        { key: 'all', label: '全部' },
                        { key: 'pending', label: '待匹配' },
                        { key: 'matched', label: '中签' },
                        { key: 'cancelled', label: '已取消' }
                    ].map(status => (
                        <button
                            key={status.key}
                            onClick={() => setStatusFilter(status.key as 'all' | MatchingPoolStatus)}
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
            <div className="p-4 space-y-4">
                {!isLoggedIn ? (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">请先登录</h3>
                        <p className="text-sm text-gray-500 mb-6">登录后即可查看您的申购记录</p>
                        <button
                            onClick={() => onNavigate('login')}
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
                            onClick={loadRecords}
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
                        <div key={record.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            {/* Header: Status & Session info */}
                            <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-50">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-400 font-mono">ID: {record.id}</span>
                                        {renderSessionInfo(record)}
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                        创建: {formatTime(record.create_time || record.created_at)}
                                    </div>
                                </div>
                                {getStatusBadge(record)}
                            </div>

                            {/* Product Info - Clickable */}
                            <div
                                className="flex gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleProductClick(record)}
                            >
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                    {(record.item_image || record.image) ? (
                                        <img
                                            src={record.item_image || record.image}
                                            alt={record.item_title || '藏品'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h3 className="text-gray-900 font-bold truncate text-sm mb-1">{record.item_title || record.title || '藏品详情'}</h3>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {record.item_price && (
                                                <>
                                                    <span className="text-sm font-bold text-red-600 font-mono">¥{record.item_price}</span>
                                                    <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100 font-bold">
                                                        {getPriceZone(Number(record.item_price))}区
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <ArrowRight size={14} className="text-gray-300" />
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-y-2 gap-x-4 mb-4">
                                {(record.power_used || record.power) && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1"><Zap size={10} /> 消耗算力</span>
                                        <span className="text-xs font-bold text-gray-900 font-mono">{record.power_used || record.power}</span>
                                    </div>
                                )}
                                {record.weight && (
                                    <div className="flex justify-between items-center hidden">
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">权重值</span>
                                        <span className="text-xs font-bold text-gray-900 font-mono">{record.weight}</span>
                                    </div>
                                )}
                                {(record.item_price || record.price) && (
                                    <div className="col-span-2 flex justify-between items-center pt-1 mt-1 border-t border-gray-200/50">
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <Wallet size={10} /> {record.status === 'cancelled' ? '解冻金额' : '冻结金额'}
                                        </span>
                                        <span className="text-xs font-bold text-gray-900 font-mono">¥{Number(record.item_price || record.price).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer Status/Action */}
                            <div className="flex justify-between items-center text-xs">
                                <div className="text-gray-400">
                                    {record.status === 'pending' && record.session_end_time && `预计 ${record.session_end_time} 结束`}
                                    {record.status === 'matched' && record.match_time && `撮合时间: ${formatTime(record.match_time)}`}
                                    {record.status === 'cancelled' && record.status_text && `${record.status_text}`}
                                </div>

                                {record.status === 'matched' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent product click
                                            onNavigate('my-collection');
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
            </div>
        </div>
    );
};

// Helper for session info rendering
const renderSessionInfo = (record: MatchingPoolItem) => {
    if (!record.session_title) return null;
    return (
        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold truncate max-w-[120px]">
            {record.session_title}
        </span>
    );
}

export default ReservationRecordPage;
