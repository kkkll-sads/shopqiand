/**
 * MatchingPoolPage - 撮合池页面
 * 已迁移: 使用 React Router 导航
 * 
 * @author 树交所前端团队
 * @version 2.1.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader, TrendingUp, Zap } from 'lucide-react';
import { LoadingSpinner } from '../../../components/common';
import {
    fetchMatchingPool,
    cancelBid,
    MatchingPoolItem,
    MatchingPoolStatus,
} from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { isSuccess, extractError } from '../../../utils/apiHelpers';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';

// 状态显示配置
const STATUS_CONFIG: Record<MatchingPoolStatus, {
    label: string;
    icon: React.ReactNode;
    className: string;
    bgClassName: string;
}> = {
    pending: {
        label: '待撮合',
        icon: <Clock size={16} className="animate-spin" />,
        className: 'text-orange-600 bg-orange-50 border-orange-200',
        bgClassName: 'bg-orange-50/30',
    },
    matched: {
        label: '已撮合',
        icon: <CheckCircle size={16} />,
        className: 'text-green-600 bg-green-50 border-green-200',
        bgClassName: 'bg-green-50/30',
    },
    cancelled: {
        label: '已取消',
        icon: <XCircle size={16} />,
        className: 'text-gray-500 bg-gray-50 border-gray-200',
        bgClassName: 'bg-gray-50/30',
    },
};

const MatchingPoolPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useNotification();

    // 从 URL 参数获取 itemId 和 sessionId
    const itemId = searchParams.get('itemId') ? Number(searchParams.get('itemId')) : undefined;
    const sessionId = searchParams.get('sessionId') ? Number(searchParams.get('sessionId')) : undefined;

    // 状态管理
    const [activeTab, setActiveTab] = useState<'all' | MatchingPoolStatus>('all');
    const [matchingList, setMatchingList] = useState<MatchingPoolItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
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
    const loading = loadMachine.state === LoadingState.LOADING;

    // 加载撮合池数据
    const loadMatchingPool = async (pageNum: number, statusFilter?: MatchingPoolStatus) => {
        try {
            loadMachine.send(LoadingEvent.LOAD);
            setError(null);

            const response = await fetchMatchingPool({
                item_id: itemId,
                session_id: sessionId,
                status: statusFilter,
                page: pageNum,
                limit: 20,
            });

            if (isSuccess(response) && response.data) {
                const newList = response.data.list || [];
                if (pageNum === 1) {
                    setMatchingList(newList);
                } else {
                    setMatchingList(prev => [...prev, ...newList]);
                }
                setTotal(response.data.total || 0);
                setHasMore(newList.length === 20);
                loadMachine.send(LoadingEvent.SUCCESS);
            } else {
                setError(extractError(response, '加载失败'));
                loadMachine.send(LoadingEvent.ERROR);
            }
        } catch (err: any) {
            console.error('加载撮合池列表失败:', err);
            setError(err?.msg || '网络连接异常');
            loadMachine.send(LoadingEvent.ERROR);
        } finally {
            // 状态机已处理成功/失败
        }
    };

    // 初始加载
    useEffect(() => {
        loadMatchingPool(1, activeTab === 'all' ? undefined : activeTab);
    }, [activeTab, itemId, sessionId]);

    // 切换筛选标签
    const handleTabChange = (tab: 'all' | MatchingPoolStatus) => {
        setActiveTab(tab);
        setPage(1);
    };

    // 取消竞价
    const handleCancelBid = async (matchingPoolId: number) => {
        if (cancellingId) return;

        try {
            setCancellingId(matchingPoolId);

            const response = await cancelBid({ matching_pool_id: matchingPoolId });

            if (isSuccess(response)) {
                showToast(`取消成功，返还算力 ${response.data?.power_returned || 0}`, 'success');
                loadMatchingPool(1, activeTab === 'all' ? undefined : activeTab);
            } else {
                showToast(extractError(response, '取消失败'), 'error');
            }
        } catch (err: any) {
            console.error('取消竞价失败:', err);
            showToast(err?.msg || '操作失败', 'error');
        } finally {
            setCancellingId(null);
        }
    };

    // 加载更多
    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadMatchingPool(nextPage, activeTab === 'all' ? undefined : activeTab);
        }
    };

    // 格式化时间
    const formatTime = (timestamp: number | string) => {
        if (!timestamp) return '-';
        const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 统计各状态数量
    const statusCounts = {
        all: total,
        pending: matchingList.filter(item => item.status === 'pending').length,
        matched: matchingList.filter(item => item.status === 'matched').length,
        cancelled: matchingList.filter(item => item.status === 'cancelled').length,
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans pb-safe">
            {/* 顶部背景渐变 */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#FFE4C4] via-[#FFF0E0] to-[#F8F9FA] z-0" />

            {/* 内容区域 */}
            <div className="relative z-10">
                {/* 顶部导航栏 */}
                <div className="px-5 pt-4 pb-2 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-gray-700 active:bg-black/5 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="font-bold text-xl text-gray-900 tracking-tight">撮合池记录</h1>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-white/60">
                        <TrendingUp size={14} className="text-orange-500" />
                        <span className="text-xs font-bold text-gray-700">总计 {total}</span>
                    </div>
                </div>

                {/* 状态筛选标签 */}
                <div className="px-5 py-4">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            onClick={() => handleTabChange('all')}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'all'
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            全部 {statusCounts.all > 0 && `(${statusCounts.all})`}
                        </button>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                            <button
                                key={status}
                                onClick={() => handleTabChange(status as MatchingPoolStatus)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === status
                                        ? config.className.replace('border-', 'shadow-md shadow-').replace('bg-', 'bg-gradient-to-r from-') + ' text-white border-0'
                                        : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                {config.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 列表内容 */}
                <div className="px-5 space-y-3 pb-20">
                    {loading && page === 1 ? (
                        <div className="py-20 flex justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center">
                            <div className="text-gray-400 text-sm mb-2">{error}</div>
                            <button
                                onClick={() => loadMatchingPool(1, activeTab === 'all' ? undefined : activeTab)}
                                className="text-orange-500 text-sm font-bold"
                            >
                                重试
                            </button>
                        </div>
                    ) : matchingList.length === 0 ? (
                        <div className="py-20 text-center">
                            <Zap size={48} className="mx-auto text-gray-300 mb-3" />
                            <div className="text-gray-400 text-sm">暂无记录</div>
                        </div>
                    ) : (
                        <>
                            {matchingList.map((item) => {
                                const statusConfig = STATUS_CONFIG[item.status];
                                const isCancelling = cancellingId === item.id;
                                const canCancel = item.status === 'pending';

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:border-gray-200 transition-all"
                                    >
                                        {/* 卡片内容 */}
                                        <div className="p-4">
                                            {/* 顶部：藏品信息 & 状态 */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <div className="text-xs text-gray-400 mb-1">撮合池ID</div>
                                                    <div className="text-base font-bold text-gray-900">#{item.id}</div>
                                                    {item.item_id && (
                                                        <div className="text-xs text-gray-500 mt-1">藏品ID: {item.item_id}</div>
                                                    )}
                                                </div>
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.className}`}>
                                                    {statusConfig.icon}
                                                    <span>{statusConfig.label}</span>
                                                </div>
                                            </div>

                                            {/* 详细信息 */}
                                            <div className={`rounded-xl p-3 mb-3 ${statusConfig.bgClassName}`}>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {item.session_id && (
                                                        <div>
                                                            <div className="text-gray-500 mb-0.5">时段ID</div>
                                                            <div className="font-bold text-gray-900">{item.session_id}</div>
                                                        </div>
                                                    )}
                                                    {item.created_at && (
                                                        <div>
                                                            <div className="text-gray-500 mb-0.5">创建时间</div>
                                                            <div className="font-mono font-bold text-gray-900 text-[10px]">
                                                                {formatTime(item.created_at)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {item.price && (
                                                        <div>
                                                            <div className="text-gray-500 mb-0.5">价格</div>
                                                            <div className="font-bold text-orange-600">¥{Number(item.price).toLocaleString()}</div>
                                                        </div>
                                                    )}
                                                    {item.power && (
                                                        <div>
                                                            <div className="text-gray-500 mb-0.5">算力消耗</div>
                                                            <div className="font-bold text-blue-600">{item.power}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 操作按钮 */}
                                            {canCancel && (
                                                <button
                                                    onClick={() => handleCancelBid(item.id)}
                                                    disabled={isCancelling}
                                                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isCancelling
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md shadow-red-200 active:scale-[0.98]'
                                                        }`}
                                                >
                                                    {isCancelling ? (
                                                        <>
                                                            <Loader size={16} className="animate-spin" />
                                                            <span>取消中...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle size={16} />
                                                            <span>取消竞价</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* 加载更多 */}
                            {hasMore && (
                                <div className="py-4 flex justify-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-white text-orange-500 border border-orange-200 rounded-full text-sm font-bold hover:bg-orange-50 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? '加载中...' : '加载更多'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MatchingPoolPage;
