/**
 * RechargeOrderList - 充值订单列表
 * 已迁移: 使用 React Router 导航
 */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getMyRechargeOrders, RechargeOrderItem } from '@/services/wallet';
import { isSuccess } from '@/utils/apiHelpers';
import { useErrorHandler, useLoadingMachine, LoadingEvent, LoadingState } from '@/hooks';
import { LoadingSpinner } from '@/components/common';
import { getOrderListStatusColor } from '@/constants/statusEnums';

interface RechargeOrderListProps {
    onOrderSelect?: (orderId: string) => void;
}

const RechargeOrderList: React.FC<RechargeOrderListProps> = ({ onOrderSelect }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<RechargeOrderItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeTab, setActiveTab] = useState<number | undefined>(undefined);

    const { handleError } = useErrorHandler({ showToast: true, persist: false });
    const loadRef = useRef(false);
    const loadMachine = useLoadingMachine();
    const loading = loadMachine.state === LoadingState.LOADING;

    useEffect(() => {
        setOrders([]);
        setPage(1);
        setHasMore(true);
        loadRef.current = false;
        loadOrders(1, true, activeTab);
    }, [activeTab]);

    const loadOrders = async (pageNum: number, refresh = false, status?: number, silent = false) => {
        if (loadRef.current) return;
        loadRef.current = true;
        if (!silent) loadMachine.send(LoadingEvent.LOAD);

        try {
            const res = await getMyRechargeOrders({ page: pageNum, limit: 20, status });
            if (isSuccess(res)) {
                const list = res.data.data || [];
                const totalPages = res.data.last_page || 1;
                const more = pageNum < totalPages;

                setOrders(prev => refresh ? list : [...prev, ...list]);
                setHasMore(more);
                if (!silent || refresh) {
                    setPage(pageNum);
                }
                if (!silent) loadMachine.send(LoadingEvent.SUCCESS);
            } else {
                if (!silent) handleError(res, { toastTitle: '加载失败', customMessage: '获取订单列表失败' });
                if (!silent) loadMachine.send(LoadingEvent.ERROR);
            }
        } catch (err) {
            if (!silent) handleError(err, { toastTitle: '加载失败', customMessage: '网络错误' });
            if (!silent) loadMachine.send(LoadingEvent.ERROR);
        } finally {
            // 状态机已处理成功/失败
            loadRef.current = false;
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (page === 1) {
                loadOrders(1, true, activeTab, true);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [activeTab, page]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadOrders(page + 1, false, activeTab);
        }
    };

    const getStatusIcon = (status: number) => {
        switch (status) {
            case 1: return <CheckCircle size={14} />;
            case 2: return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const formatTime = (ts: number) => {
        if (!ts) return '-';
        const date = new Date(ts * 1000);
        return date.toLocaleString('zh-CN', {
            month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const tabs = [
        { label: '全部', value: undefined },
        { label: '待审核', value: 0 },
        { label: '已通过', value: 1 },
        { label: '已拒绝', value: 2 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
                <div className="px-4 py-4 pt-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full text-gray-700 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">充值记录</h1>
                </div>

                {/* Tabs */}
                <div className="flex px-4 border-b border-gray-100 overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={String(tab.value)}
                            onClick={() => setActiveTab(tab.value)}
                            className={`flex-1 py-3 text-sm font-medium relative whitespace-nowrap transition-colors ${activeTab === tab.value
                                ? 'text-red-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.value && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-red-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-4 pb-safe space-y-3">
                {orders.map(order => (
                    <div
                        key={order.id}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors"
                        onClick={() => onOrderSelect?.(String(order.id))}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="text-xs text-gray-400 mb-1">订单号: {order.order_no}</div>
                                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <span className="font-bold text-lg">¥{order.amount || order.money}</span>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">{order.payment_type_text || order.payment_type}</span>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${getOrderListStatusColor(order.status, 'recharge')}`}>
                                {getStatusIcon(order.status)}
                                {order.status_text}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3 mt-1">
                            <span>{formatTime(order.createtime || order.create_time || 0)}</span>
                            {order.audit_remark && (
                                <span className="flex items-center gap-1 text-red-400 max-w-[60%] truncate">
                                    <AlertCircle size={12} />
                                    {order.audit_remark}
                                </span>
                            )}
                        </div>
                        {order.payment_screenshot && (
                            <div className="mt-3 pt-2 border-t border-dashed border-gray-100">
                                <a href={order.payment_screenshot} target="_blank" rel="noopener noreferrer" className="text-xs text-red-600 flex items-center gap-1">
                                    <FileText size={12} /> 查看凭证
                                </a>
                            </div>
                        )}
                    </div>
                ))}

                {!loading && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <FileText size={48} className="mb-4 text-gray-200" />
                        <p className="text-sm">暂无{activeTab !== undefined ? '相关' : ''}充值记录</p>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-4">
                        <LoadingSpinner />
                    </div>
                )}

                {!loading && hasMore && orders.length > 0 && (
                    <button
                        onClick={handleLoadMore}
                        className="w-full py-3 text-sm text-gray-500 text-center hover:text-gray-700"
                    >
                        点击加载更多
                    </button>
                )}

                {!loading && !hasMore && orders.length > 0 && (
                    <div className="text-center py-4 text-xs text-gray-300">
                        - 没有更多了 -
                    </div>
                )}
            </div>
        </div>
    );
};

export default RechargeOrderList;
