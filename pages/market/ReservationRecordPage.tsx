import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, Clock, Wallet, Zap, AlertCircle, ArrowRight } from 'lucide-react';
import {
    fetchMatchingPool,
    MatchingPoolItem,
    MatchingPoolStatus,
    AUTH_TOKEN_KEY
} from '../../services/api';

interface ReservationRecordPageProps {
    onBack: () => void;
    onNavigate: (page: string) => void;
}

const ReservationRecordPage: React.FC<ReservationRecordPageProps> = ({ onBack, onNavigate }) => {
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

            if (response.code === 1 && response.data) {
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

    const getStatusBadge = (status: MatchingPoolStatus) => {
        switch (status) {
            case 'pending':
                return <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-500 border border-orange-100 flex items-center gap-1"><Clock size={10} /> 待匹配</span>;
            case 'matched':
                return <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-50 text-green-500 border border-green-100 flex items-center gap-1"><CheckCircle2 size={10} /> 中签</span>;
            case 'cancelled':
                return <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-100 flex items-center gap-1"><AlertCircle size={10} /> 已取消</span>;
        }
    };

    // Format timestamp to date string
    const formatTime = (timestamp: number | string) => {
        if (!timestamp) return '';
        const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
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
                {/* Status Tabs */}
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
                            {/* Header: ID + Status */}
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
                                <span className="text-xs text-gray-400 font-mono">ID: {record.id}</span>
                                {getStatusBadge(record.status)}
                            </div>

                            {/* Product Info */}
                            <div className="flex gap-3 mb-4">
                                {record.item_image && (
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        <img src={record.item_image} alt={record.item_title || '藏品'} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-gray-900 font-bold truncate text-sm mb-1">{record.item_title || '藏品'}</h3>
                                    {record.price && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100 font-bold">
                                                {getPriceZone(Number(record.price))}区
                                            </span>
                                        </div>
                                    )}
                                    {record.created_at && (
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock size={10} />
                                            <span>提交: {formatTime(record.created_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-y-2 gap-x-4 mb-4">
                                {record.power && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1"><Zap size={10} /> 消耗算力</span>
                                        <span className="text-xs font-bold text-gray-900 font-mono">{record.power}</span>
                                    </div>
                                )}
                                {record.price && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <Wallet size={10} /> {record.status === 'cancelled' ? '解冻金额' : '冻结金额'}
                                        </span>
                                        <span className="text-xs font-bold text-gray-900 font-mono">¥{Number(record.price).toLocaleString()}</span>
                                    </div>
                                )}
                                {record.updated_at && (
                                    <div className="col-span-2 text-[10px] text-gray-400 border-t border-gray-200/50 pt-2 mt-1">
                                        {record.status === 'pending' && `预计撮合时间：${formatTime(record.updated_at)}`}
                                        {record.status === 'matched' && `撮合成功时间：${formatTime(record.updated_at)}`}
                                        {record.status === 'cancelled' && `取消时间：${formatTime(record.updated_at)}`}
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <div className="flex justify-end">
                                {record.status === 'pending' && (
                                    <button className="text-sm font-bold text-orange-500 bg-orange-50 px-4 py-2 rounded-lg w-full">等待撮合...</button>
                                )}
                                {record.status === 'matched' && (
                                    <button
                                        onClick={() => onNavigate('my-collection')}
                                        className="text-sm font-bold text-white bg-[#8B0000] px-4 py-2 rounded-lg w-full flex items-center justify-center gap-1 shadow-md shadow-red-900/10"
                                    >
                                        去持仓查看 <ArrowRight size={14} />
                                    </button>
                                )}
                                {record.status === 'cancelled' && (
                                    <button className="text-sm font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-lg w-full">
                                        查看详情 (算力已消耗)
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

export default ReservationRecordPage;
