import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, Clock, CheckCircle, XCircle, AlertTriangle, Ban, FileText } from 'lucide-react';
import { getMyWithdrawList, WithdrawRecordItem } from '../../services/wallet';
import { isSuccess } from '../../utils/apiHelpers';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { LoadingSpinner } from '../../components/common';
import { Route } from '../../router/routes';

interface WithdrawOrderListProps {
    onBack: () => void;
    onNavigate: (route: Route) => void;
}

const WithdrawOrderList: React.FC<WithdrawOrderListProps> = ({ onBack, onNavigate }) => {
    const [orders, setOrders] = useState<WithdrawRecordItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeTab, setActiveTab] = useState<number | undefined>(undefined); // undefined=All, 0=Pending, 1=Approved, 2=Rejected, 3=Paid, 4=PayFailed

    const { handleError } = useErrorHandler({ showToast: true, persist: false });
    const loadRef = useRef(false);

    // Tabs configuration
    const tabs = [
        { value: undefined, label: '全部' },
        { value: 0, label: '待审核' },
        { value: 1, label: '已通过' },
        { value: 2, label: '已拒绝' },
        { value: 3, label: '已打款' },
    ];

    // Reload when tab changes
    useEffect(() => {
        setOrders([]);
        setPage(1);
        setHasMore(true);
        loadRef.current = false;
        loadOrders(1, true, activeTab);
    }, [activeTab]);

    const loadOrders = async (pageNum: number, refresh = false, status?: number) => {
        if (loadRef.current) return;
        loadRef.current = true;
        setLoading(true);

        try {
            const res = await getMyWithdrawList({ page: pageNum, limit: 20, status });
            if (isSuccess(res)) {
                const list = res.data.data || [];
                const totalPages = res.data.last_page || 1;
                const more = pageNum < totalPages;

                setOrders(prev => refresh ? list : [...prev, ...list]);
                setHasMore(more);
                setPage(pageNum);
            } else {
                handleError(res, { toastTitle: '加载失败', customMessage: '获取提现列表失败' });
            }
        } catch (err) {
            handleError(err, { toastTitle: '加载失败', customMessage: '网络请求失败' });
        } finally {
            setLoading(false);
            loadRef.current = false;
        }
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadOrders(page + 1, false, activeTab);
        }
    };

    const getStatusColor = (status: number) => {
        const colorMap: Record<number, string> = {
            0: 'text-orange-600 bg-orange-50 border-orange-200', // 待审核
            1: 'text-green-600 bg-green-50 border-green-200',   // 审核通过
            2: 'text-red-600 bg-red-50 border-red-200',         // 审核拒绝
            3: 'text-blue-600 bg-blue-50 border-blue-200',      // 已打款
            4: 'text-gray-600 bg-gray-50 border-gray-200',      // 打款失败
        };
        return colorMap[status] || 'text-gray-600 bg-gray-50 border-gray-200';
    };

    const getStatusIcon = (status: number): React.ReactNode => {
        const iconMap: Record<number, React.ReactNode> = {
            0: <Clock size={14} />,
            1: <CheckCircle size={14} />,
            2: <XCircle size={14} />,
            3: <CheckCircle size={14} />,
            4: <Ban size={14} />,
        };
        return iconMap[status] || <AlertTriangle size={14} />;
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
                <div className="px-4 py-4 pt-4 flex items-center gap-3">
                    <button onClick={onBack} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full text-gray-700 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">提现记录</h1>
                </div>

                {/* Tabs */}
                <div className="flex px-4 border-b border-gray-100 overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={String(tab.value)}
                            onClick={() => setActiveTab(tab.value)}
                            className={`flex-1 py-3 text-sm font-medium relative whitespace-nowrap transition-colors ${activeTab === tab.value
                                ? 'text-orange-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.value && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full" />
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
                        onClick={() => onNavigate({
                            name: 'withdraw-order-detail',
                            orderId: String(order.id),
                            back: { name: 'withdraw-order-list' }
                        })}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="text-xs text-gray-400 mb-1">{order.account_type_text} • {order.account_name}</div>
                                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <span className="font-bold text-lg">¥{order.amount}</span>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
                                        到账 ¥{order.actual_amount}
                                    </span>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {order.status_text}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3 mt-1">
                            <span>{order.create_time_text || formatTime(order.create_time)}</span>
                            {order.audit_reason && (
                                <span className="flex items-center gap-1 text-red-400 max-w-[60%] truncate">
                                    <AlertTriangle size={12} />
                                    {order.audit_reason}
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="py-8">
                        <LoadingSpinner text="加载中..." />
                    </div>
                )}

                {!loading && orders.length === 0 && (
                    <div className="py-20 text-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <FileText size={32} className="text-gray-300" />
                        </div>
                        <div>暂无提现记录</div>
                    </div>
                )}

                {!loading && hasMore && orders.length > 0 && (
                    <button
                        onClick={handleLoadMore}
                        className="w-full py-3 text-sm text-gray-500 hover:text-gray-700"
                    >
                        加载更多
                    </button>
                )}

                {!loading && !hasMore && orders.length > 0 && (
                    <div className="py-4 text-center text-xs text-gray-400">
                        --- 已加载全部 ---
                    </div>
                )}
            </div>
        </div>
    );
};

export default WithdrawOrderList;
