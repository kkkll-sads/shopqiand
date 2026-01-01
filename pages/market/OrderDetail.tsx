import React, { useState, useEffect } from 'react';
import { Package, X, MapPin, Phone, User, FileText, Calendar, CreditCard, Copy } from 'lucide-react';
import { LoadingSpinner, LazyImage } from '../../components/common';
import { formatTime, formatAmount } from '../../utils/format';
import { getOrderDetail, ShopOrderItemDetail, confirmOrder, normalizeAssetUrl } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { AUTH_TOKEN_KEY } from '../../constants/storageKeys';
import { Route } from '../../router/routes';
import { ShopOrderPayStatus, ShopOrderShippingStatus } from '../../constants/statusEnums';
import { isSuccess, extractError } from '../../utils/apiHelpers';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface OrderDetailProps {
    orderId: string;
    onBack: () => void;
    onNavigate: (route: Route) => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onBack, onNavigate }) => {
    const { showToast, showDialog } = useNotification();

    // ✅ 使用统一错误处理Hook（加载错误 - 持久化显示）
    const {
        errorMessage,
        hasError,
        handleError,
        clearError
    } = useErrorHandler();

    // ✅ 使用统一错误处理Hook（确认收货错误 - Toast模式）
    const { handleError: handleConfirmError } = useErrorHandler({ showToast: true, persist: false });

    const [order, setOrder] = useState<ShopOrderItemDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) return;

            const response = await getOrderDetail({ id: orderId, token });
            if (isSuccess(response) && response.data) {
                setOrder(response.data);
            } else {
                // ✅ 使用统一错误处理
                handleError(response, {
                    persist: true,
                    showToast: false,
                    customMessage: '获取订单详情失败',
                    context: { orderId }
                });
            }
        } catch (err) {
            // ✅ 使用统一错误处理
            handleError(err, {
                persist: true,
                showToast: false,
                customMessage: '网络请求失败',
                context: { orderId }
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePayOrder = (id: number) => {
        const targetId = String(id).trim();
        onNavigate({ name: 'cashier', orderId: targetId, back: { name: 'order-detail', orderId: targetId } });
    };

    const handleConfirmReceipt = async (id: number) => {
        showDialog({
            title: '确认收货',
            description: '请确认您已收到商品，确认后交易将完成。',
            confirmText: '确认收货',
            cancelText: '取消',
            onConfirm: async () => {
                try {
                    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
                    const response = await confirmOrder({ id, token });
                    if (isSuccess(response)) {
                        showToast('success', response.msg || '收货成功');
                        loadOrder(); // Reload to update status
                    } else {
                        // ✅ 使用统一错误处理
                        handleConfirmError(response, {
                            toastTitle: '操作失败',
                            customMessage: '确认收货失败',
                            context: { orderId: id }
                        });
                    }
                } catch (error) {
                    // ✅ 使用统一错误处理
                    handleConfirmError(error, {
                        toastTitle: '操作失败',
                        customMessage: '网络请求失败',
                        context: { orderId: id }
                    });
                }
            }
        });
    };

    // Copy to clipboard helper
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('success', '复制成功');
        }).catch(() => {
            showToast('error', '复制失败');
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;
    if (hasError || !order) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">{errorMessage || '订单不存在'}</div>;

    const getOrderStatus = (order: ShopOrderItemDetail) => {
        if (order.status_text) return order.status_text;
        const statusMap: Record<number, string> = {
            [ShopOrderPayStatus.UNPAID]: '待付款',
            [ShopOrderShippingStatus.NOT_SHIPPED]: '待发货',
            [ShopOrderShippingStatus.SHIPPED]: '待收货',
            [ShopOrderShippingStatus.RECEIVED]: '已完成',
            4: '已关闭',
            '-1': '已取消'
        };
        return statusMap[order.status] || '未知状态';
    };

    // Helper to determine if it's a score product (Points Mall)
    const isScoreOrder = order.pay_type === 'score';

    return (
        <div className="min-h-screen bg-gray-50 pb-safe relative flex flex-col">
            {/* Header */}
            <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-800">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-lg font-bold text-gray-900">订单详情</h1>
                <div className="w-8"></div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {/* Order Info Card */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 p-1 rounded-md">
                                <FileText size={14} />
                            </span>
                            <span className="text-sm text-gray-600">订单号</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-gray-800">{order.order_no || order.id}</span>
                            <button onClick={() => copyToClipboard(order.order_no || String(order.id))} className="text-gray-400 hover:text-gray-600">
                                <Copy size={12} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-600 p-1 rounded-md">
                                <Calendar size={14} />
                            </span>
                            <span className="text-sm text-gray-600">订单状态</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">{getOrderStatus(order)}</span>
                    </div>
                </div>

                {/* Status Banner (Optional visuals based on status) */}
                <div className={`rounded - xl p - 6 text - white shadow - lg ${isScoreOrder ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'} `}>
                    <div className="text-xl font-bold mb-1">{getOrderStatus(order)}</div>
                    <div className="text-white/80 text-sm">
                        {order.status === ShopOrderPayStatus.UNPAID ? '请尽快完成支付' :
                            order.status === ShopOrderShippingStatus.NOT_SHIPPED ? '商家正在备货中' :
                                order.status === ShopOrderShippingStatus.SHIPPED ? '商品运输中，请留意查收' :
                                    order.status === ShopOrderShippingStatus.RECEIVED ? '订单已完成，感谢您的购买' : ''}
                    </div>
                </div>

                {/* Address Info */}
                {order.recipient_name && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                            <MapPin size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900">{order.recipient_name}</span>
                                <span className="text-gray-500 text-sm">{order.recipient_phone}</span>
                            </div>
                            <div className="text-sm text-gray-600 leading-snug">
                                {order.recipient_address}
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
                        <Package size={16} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-700">商品明细</span>
                    </div>

                    <div className="space-y-4">
                        {order.items?.map((item, index) => (
                            <div key={item.id || index} className="flex gap-3">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                    <LazyImage
                                        src={normalizeAssetUrl(item.product_thumbnail || '')}
                                        alt={item.product_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div className="text-sm font-bold text-gray-900 line-clamp-2">{item.product_name}</div>
                                    <div className="text-xs text-gray-400 mt-1">数量: {item.quantity}</div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="font-mono font-bold text-gray-900">
                                            {isScoreOrder ?
                                                <span className="text-orange-600">{item.subtotal_score || item.score_price} 消费金</span> :
                                                <span>¥ {formatAmount(item.subtotal || item.price)}</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">商品总额</span>
                            <span className="font-medium">
                                {isScoreOrder ? `${order.total_score || 0} 消费金` : `¥${formatAmount(order.total_amount)} `}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">运费</span>
                            <span className="font-medium">¥0.00</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-50">
                            <span className="font-bold text-gray-800">实付款</span>
                            <span className="text-xl font-bold font-mono text-orange-600">
                                {isScoreOrder ? `${order.total_score || 0} 消费金` : `¥${formatAmount(order.total_amount)} `}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Logistics Info */}
                {order.shipping_no && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">物流信息</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            {order.shipping_company && (
                                <div className="flex justify-between">
                                    <span>物流公司</span>
                                    <span className="text-gray-900">{order.shipping_company}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>物流单号</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-900 font-mono">{order.shipping_no}</span>
                                    <button onClick={() => copyToClipboard(order.shipping_no!)} className="text-blue-600 text-xs">复制</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Time Info */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 space-y-2">
                    {order.create_time && (
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>创建时间</span>
                            <span>{formatTime(order.create_time)}</span>
                        </div>
                    )}
                    {order.pay_time && order.pay_time > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>支付时间</span>
                            <span>{formatTime(order.pay_time)}</span>
                        </div>
                    )}
                    {order.ship_time && order.ship_time > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>发货时间</span>
                            <span>{formatTime(order.ship_time)}</span>
                        </div>
                    )}
                    {order.complete_time && order.complete_time > 0 && (
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>完成时间</span>
                            <span>{formatTime(order.complete_time)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {/* Debug: Log order status */}
                {console.log('Order status:', order.status, 'Type:', typeof order.status, 'String:', String(order.status))}

                {/* Pending Pay - status: 0 or 'pending' */}
                {(order.status === ShopOrderPayStatus.UNPAID || order.status === 'pending' || String(order.status) === '0') && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <div className="font-medium text-gray-800">待支付</div>
                            <div className="text-xs mt-0.5">请尽快完成支付</div>
                        </div>
                        <button
                            onClick={() => handlePayOrder(order.id)}
                            className={`px - 6 py - 2.5 rounded - full text - white font - bold shadow - lg active: scale - 95 transition - transform ${isScoreOrder ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'} `}
                        >
                            立即付款
                        </button>
                    </div>
                )}

                {/* Paid - Pending Ship - status: 1 or 'paid' */}
                {(order.status === ShopOrderShippingStatus.NOT_SHIPPED || order.status === 'paid' || String(order.status) === '1') && (
                    <div className="text-center">
                        <div className="font-medium text-gray-800 mb-1">等待商家发货</div>
                        <div className="text-xs text-gray-500">商家正在备货中，请耐心等待</div>
                    </div>
                )}

                {/* Shipped -> Pending Receipt - status: 2 or 'shipped' */}
                {(order.status === ShopOrderShippingStatus.SHIPPED || order.status === 'shipped' || String(order.status) === '2') && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <div className="font-medium text-gray-800">待收货</div>
                            <div className="text-xs mt-0.5">商品运输中，请留意查收</div>
                        </div>
                        <button
                            onClick={() => handleConfirmReceipt(order.id)}
                            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-full shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                        >
                            确认收货
                        </button>
                    </div>
                )}

                {/* Completed - status: 3 or 'completed' */}
                {(order.status === ShopOrderShippingStatus.RECEIVED || order.status === 'completed' || String(order.status) === '3') && (
                    <div className="text-center">
                        <div className="font-medium text-gray-800 mb-1">订单已完成</div>
                        <div className="text-xs text-gray-500">感谢您的购买</div>
                    </div>
                )}

                {/* Closed/Canceled - status: 4, -1, 'closed', 'cancelled' */}
                {(order.status === 4 || order.status === -1 || order.status === 'closed' || order.status === 'cancelled' || ['4', '-1'].includes(String(order.status))) && (
                    <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">订单已关闭</div>
                        <div className="text-xs text-gray-400">该订单已取消或关闭</div>
                    </div>
                )}

                {/* Fallback - always show something if no condition matched */}
                {!([ShopOrderPayStatus.UNPAID, ShopOrderShippingStatus.NOT_SHIPPED, ShopOrderShippingStatus.SHIPPED, ShopOrderShippingStatus.RECEIVED, 4, -1, '0', '1', '2', '3', '4', '-1', 'pending', 'paid', 'shipped', 'completed', 'closed', 'cancelled'].includes(order.status as any)) && (
                    <div className="text-center text-gray-500 text-sm">
                        状态未知: {order.status} ({order.status_text || '无状态文本'})
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetail;
