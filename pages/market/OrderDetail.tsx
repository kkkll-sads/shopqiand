import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Phone, MapPin, Copy, Check, Truck, Calendar, Gift, CheckCircle } from 'lucide-react';
import { LoadingSpinner, LazyImage } from '../../components/common';
import { formatTime, formatAmount } from '../../utils/format';
import { getOrderDetail, ShopOrderItem, confirmOrder, normalizeAssetUrl, payOrder } from '../../services/api';
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
    const [copiedOrderNo, setCopiedOrderNo] = useState(false);

    // Error handling hooks
    const {
        errorMessage,
        hasError,
        handleError,
    } = useErrorHandler();

    const { handleError: handleOperationError } = useErrorHandler({ showToast: true, persist: false });

    const [order, setOrder] = useState<ShopOrderItem | null>(null);
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
                handleError(response, {
                    persist: true,
                    showToast: false,
                    customMessage: '获取订单详情失败',
                    context: { orderId }
                });
            }
        } catch (err) {
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
        if (order?.pay_type === 'score') {
            showDialog({
                title: '确认支付',
                description: '确定要支付此订单吗？',
                confirmText: '确定支付',
                cancelText: '取消',
                onConfirm: async () => {
                    try {
                        const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
                        const response = await payOrder({ id: targetId, token });

                        if (isSuccess(response)) {
                            showToast('success', '支付成功');
                            loadOrder();
                        } else {
                            handleOperationError(response, {
                                toastTitle: '支付失败',
                                customMessage: '支付失败',
                                context: { orderId: targetId }
                            });
                        }
                    } catch (error) {
                        handleOperationError(error, {
                            toastTitle: '支付失败',
                            customMessage: '网络请求失败',
                            context: { orderId: targetId }
                        });
                    }
                }
            });
        } else {
            onNavigate({ name: 'cashier', orderId: targetId, back: { name: 'order-detail', orderId: targetId } });
        }
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
                        loadOrder();
                    } else {
                        handleOperationError(response, {
                            toastTitle: '操作失败',
                            customMessage: '确认收货失败',
                            context: { orderId: id }
                        });
                    }
                } catch (error) {
                    handleOperationError(error, {
                        toastTitle: '操作失败',
                        customMessage: '网络请求失败',
                        context: { orderId: id }
                    });
                }
            }
        });
    };

    const copyOrderNo = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedOrderNo(true);
        setTimeout(() => setCopiedOrderNo(false), 2000);
    };

    const formatDateTime = (timestamp: number) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;
    if (hasError || !order) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">{errorMessage || '订单不存在'}</div>;

    const isScoreOrder = order.pay_type === 'score';

    // Order status steps
    const orderSteps = [
        { key: 'created', label: '订单创建', time: order.create_time, active: true },
        { key: 'paid', label: '支付成功', time: order.pay_time, active: order.pay_time > 0 },
        { key: 'shipped', label: '商品发货', time: order.ship_time, active: order.ship_time > 0 },
        { key: 'completed', label: '交易完成', time: order.complete_time, active: order.complete_time > 0 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-gray-50 max-w-[480px] mx-auto pb-safe">
            {/* Header */}
            <header className="bg-gradient-to-r from-[#fedab0] to-[#ffd9a8] text-gray-800 shadow-md sticky top-0 z-10">
                <div className="flex items-center h-14 px-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 hover:bg-white/30 rounded-full transition-colors"
                        aria-label="返回"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="flex-1 text-center pr-9 font-medium">订单详情</h1>
                </div>
            </header>

            <div className="pb-24">
                {/* Order Progress */}
                <div className="bg-white mx-3 mt-3 rounded-2xl shadow-md p-5 mb-3">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-5 bg-gradient-to-b from-[#fedab0] to-[#ffd9a8] rounded-full" />
                        <h2 className="font-medium text-gray-800">物流进度</h2>
                    </div>

                    <div className="relative pl-6">
                        {orderSteps.map((step, index) => (
                            <div key={step.key} className="relative pb-8 last:pb-0">
                                {/* Connection line */}
                                {index < orderSteps.length - 1 && (
                                    <div className={`absolute left-2 top-6 w-0.5 h-full ${step.active ? 'bg-[#fedab0]' : 'bg-gray-200'
                                        }`} />
                                )}

                                {/* Node */}
                                <div className="flex items-start gap-3">
                                    <div className={`absolute left-0 w-4 h-4 rounded-full border-2 ${step.active
                                            ? 'bg-[#fedab0] border-[#fedab0] shadow-md'
                                            : 'bg-white border-gray-300'
                                        }`}>
                                        {step.active && (
                                            <Check className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        )}
                                    </div>

                                    <div className="flex-1 pt-0.5">
                                        <p className={`text-sm mb-1 ${step.active ? 'text-gray-800 font-medium' : 'text-gray-400'
                                            }`}>
                                            {step.label}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {step.time > 0 ? formatDateTime(step.time) : '等待中...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logistics Info */}
                {order.shipping_company && (
                    <div className="bg-white mx-3 rounded-2xl shadow-md p-5 mb-3">
                        <div className="flex items-center gap-2 mb-4">
                            <Truck className="w-5 h-5 text-[#fedab0]" />
                            <h2 className="font-medium text-gray-800">物流信息</h2>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">物流公司</span>
                                <span className="text-gray-800 font-medium">{order.shipping_company}</span>
                            </div>
                            {order.shipping_no && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">物流单号</span>
                                    <span className="text-gray-800 font-medium">{order.shipping_no}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Recipient Info */}
                {order.recipient_name && (
                    <div className="bg-white mx-3 rounded-2xl shadow-md p-5 mb-3">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-[#fedab0]" />
                            <h2 className="font-medium text-gray-800">收货信息</h2>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="text-sm text-gray-600 w-16 flex-shrink-0">收货人</span>
                                <span className="text-sm text-gray-800">{order.recipient_name}</span>
                            </div>
                            {order.recipient_phone && (
                                <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <span className="text-sm text-gray-800">{order.recipient_phone}</span>
                                </div>
                            )}
                            {order.recipient_address && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-800 leading-relaxed">{order.recipient_address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Product Info */}
                <div className="bg-white mx-3 rounded-2xl shadow-md p-5 mb-3">
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-[#fedab0]" />
                        <h2 className="font-medium text-gray-800">商品信息</h2>
                    </div>

                    {order.items?.map((item) => (
                        <div key={item.id} className="flex gap-3 pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                            <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-[#fedab0]/30 to-[#ffd9a8]/20 rounded-xl overflow-hidden shadow-sm border border-[#fedab0]/40">
                                <LazyImage
                                    src={normalizeAssetUrl(item.product_thumbnail || '')}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm leading-relaxed line-clamp-2 mb-2 text-gray-800">
                                    {item.product_name}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-gray-800">
                                            {isScoreOrder ? item.score_price : `¥${formatAmount(item.price)}`}
                                        </span>
                                        {isScoreOrder && <span className="text-xs text-gray-600">消费金</span>}
                                    </div>
                                    <span className="text-sm text-gray-500">x{item.quantity}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Total */}
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-[#fedab0]/30">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">合计</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-gray-800">
                                    {isScoreOrder ? order.total_score : `¥${formatAmount(order.total_amount)}`}
                                </span>
                                {isScoreOrder && <span className="text-sm text-gray-600">消费金</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Info */}
                <div className="bg-white mx-3 rounded-2xl shadow-md p-5 mb-3">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-[#fedab0]" />
                        <h2 className="font-medium text-gray-800">订单信息</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-start text-sm">
                            <span className="text-gray-600">订单编号</span>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-800 text-xs">{order.order_no || order.id}</span>
                                <button
                                    onClick={() => copyOrderNo(order.order_no || String(order.id))}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    aria-label="复制订单号"
                                >
                                    {copiedOrderNo ? (
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                        {order.status_text && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">订单状态</span>
                                <span className="text-gray-800 font-medium">{order.status_text}</span>
                            </div>
                        )}
                        {order.pay_type_text && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">支付方式</span>
                                <div className="flex items-center gap-1">
                                    <Gift className="w-3.5 h-3.5 text-[#fedab0]" />
                                    <span className="text-gray-800">{order.pay_type_text}</span>
                                </div>
                            </div>
                        )}
                        {order.product_type_text && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">商品类型</span>
                                <span className="text-gray-800">{order.product_type_text}</span>
                            </div>
                        )}
                        {order.create_time > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">下单时间</span>
                                <span className="text-gray-800 text-xs">{formatDateTime(order.create_time)}</span>
                            </div>
                        )}
                        {order.remark && (
                            <div className="flex justify-between items-start text-sm pt-2 border-t border-gray-100">
                                <span className="text-gray-600">备注</span>
                                <span className="text-gray-800 text-right max-w-[200px]">{order.remark}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg max-w-[480px] mx-auto safe-area-bottom">
                <div className="p-4 flex gap-3">
                    {(order.status === ShopOrderPayStatus.UNPAID || order.status === 'pending' || String(order.status) === '0') && (
                        <button
                            onClick={() => handlePayOrder(order.id)}
                            className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#fedab0] to-[#ffd9a8] text-gray-800 hover:shadow-lg font-medium transition-all active:scale-95"
                        >
                            立即支付
                        </button>
                    )}
                    {(order.status === ShopOrderShippingStatus.SHIPPED || order.status === 'shipped' || String(order.status) === '2') && (
                        <>
                            <button
                                className="flex-1 h-11 rounded-full border-2 border-[#fedab0] text-gray-700 hover:bg-[#fedab0]/20 font-medium transition-all"
                            >
                                查看物流
                            </button>
                            <button
                                onClick={() => handleConfirmReceipt(order.id)}
                                className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#fedab0] to-[#ffd9a8] text-gray-800 hover:shadow-lg font-medium transition-all active:scale-95"
                            >
                                确认收货
                            </button>
                        </>
                    )}
                    {(order.status === ShopOrderShippingStatus.RECEIVED || order.status === 'completed' || String(order.status) === '3') && (
                        <button
                            className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#fedab0] to-[#ffd9a8] text-gray-800 hover:shadow-lg font-medium transition-all active:scale-95"
                        >
                            再次购买
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
