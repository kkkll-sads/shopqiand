import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Phone, MapPin, Copy, Check, Truck, Calendar, Gift, Star } from 'lucide-react';
import { LoadingSpinner, LazyImage } from '../../../components/common';
import { formatAmount } from '../../../utils/format';
import { getOrderDetail, ShopOrderItem, confirmOrder, normalizeAssetUrl, payOrder, cancelOrder } from '../../../services/api';
import { getStoredToken } from '../../../services/client';
import { useNotification } from '../../../context/NotificationContext';
import { ShopOrderPayStatus, ShopOrderShippingStatus } from '../../../constants/statusEnums';
import { isSuccess, extractError } from '../../../utils/apiHelpers';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';

const OrderDetail: React.FC = () => {
    const navigate = useNavigate();
    const { orderId = '' } = useParams<{ orderId?: string }>();
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

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            loadMachine.send(LoadingEvent.LOAD);
            const token = getStoredToken();
            if (!token) return;

            const response = await getOrderDetail({ id: orderId, token });
            if (isSuccess(response) && response.data) {
                setOrder(response.data);
                loadMachine.send(LoadingEvent.SUCCESS);
            } else {
                const errorMsg = extractError(response, '获取订单详情失败');
                // 检查是否为订单不存在的情况
                if (errorMsg.includes('订单不存在')) {
                    showToast('error', '订单不存在', errorMsg);
                    // 延迟一下再跳转，让用户看到提示
                    setTimeout(() => {
                        navigate('/orders/product/0');
                    }, 1500);
                    loadMachine.send(LoadingEvent.ERROR);
                    return;
                }
                handleError(response, {
                    persist: true,
                    showToast: false,
                    customMessage: errorMsg,
                    context: { orderId }
                });
                loadMachine.send(LoadingEvent.ERROR);
            }
        } catch (err) {
            handleError(err, {
                persist: true,
                showToast: false,
                customMessage: '网络请求失败',
                context: { orderId }
            });
            loadMachine.send(LoadingEvent.ERROR);
        } finally {
            // 状态机已处理成功/失败
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
                        const token = getStoredToken() || '';
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
            navigate(`/cashier/${targetId}`);
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
                    const token = getStoredToken() || '';
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

    const handleCancelOrder = async (id: number) => {
        showDialog({
            title: '取消订单',
            description: '确定要取消此订单吗？取消后无法恢复。',
            confirmText: '确定取消',
            cancelText: '再想想',
            onConfirm: async () => {
                try {
                    const token = getStoredToken() || '';
                    const response = await cancelOrder({ id, token });
                    if (isSuccess(response)) {
                        showToast('success', response.msg || '订单取消成功');
                        loadOrder();
                    } else {
                        handleOperationError(response, {
                            toastTitle: '取消失败',
                            customMessage: '订单取消失败',
                            context: { orderId: id }
                        });
                    }
                } catch (error) {
                    handleOperationError(error, {
                        toastTitle: '取消失败',
                        customMessage: '网络请求失败',
                        context: { orderId: id }
                    });
                }
            }
        });
    };

    const copyOrderNo = async (text: string) => {
        // 兼容非 HTTPS 环境
        const copyText = (text: string) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(text);
            }
            // fallback: 使用传统方式
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                return Promise.resolve();
            } catch (e) {
                return Promise.reject(e);
            } finally {
                document.body.removeChild(textarea);
            }
        };
        
        try {
            await copyText(text);
            setCopiedOrderNo(true);
            showToast('success', '复制成功', '订单号已复制到剪贴板');
            setTimeout(() => setCopiedOrderNo(false), 2000);
        } catch (error) {
            showToast('error', '复制失败', '请手动复制');
        }
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-gray-50">
            <div className="text-center">
                {/* 骨架屏 */}
                <div className="space-y-4 w-80">
                    <div className="skeleton h-32 rounded-2xl" />
                    <div className="skeleton h-24 rounded-2xl" />
                    <div className="skeleton h-40 rounded-2xl" />
                </div>
            </div>
        </div>
    );
    if (hasError || !order) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-center">{errorMessage || '订单不存在'}</p>
            <button 
                onClick={() => navigate(-1)}
                className="mt-6 px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-medium shadow-lg shadow-red-500/30 active:scale-95 transition-transform"
            >
                返回
            </button>
        </div>
    );

    const isScoreOrder = order.pay_type === 'score';

    // Order status steps
    const orderSteps = [
        { key: 'created', label: '订单创建', time: order.create_time, active: true },
        { key: 'paid', label: '支付成功', time: order.pay_time, active: order.pay_time > 0 },
        { key: 'shipped', label: '商品发货', time: order.ship_time, active: order.ship_time > 0 },
        { key: 'completed', label: '交易完成', time: order.complete_time, active: order.complete_time > 0 },
    ];

    // 计算当前步骤
    const currentStep = orderSteps.filter(s => s.active).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-gray-50/30 max-w-[480px] mx-auto pb-safe">
            {/* 顶部渐变背景装饰 - 京东红 */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-red-500 via-red-500 to-red-600 opacity-95" />
            <div className="absolute top-0 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
            
            {/* Header */}
            <header className="relative z-20 sticky top-0">
                <div className="flex items-center h-14 px-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all active:scale-95"
                        aria-label="返回"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="flex-1 text-center pr-9 font-bold text-white text-lg drop-shadow-sm">订单详情</h1>
                </div>
                
                {/* 订单状态卡片 */}
                <div className="mx-4 mt-2 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-red-500/10 border border-white/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">订单状态</p>
                            <p className="text-lg font-bold text-gray-900">{order.status_text || '处理中'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map((step) => (
                                <div 
                                    key={step}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        step <= currentStep 
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 scale-110' 
                                            : 'bg-gray-200'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <div className="relative z-10 pb-24 pt-6">
                {/* Order Progress */}
                <div className="bg-white/80 backdrop-blur-sm mx-4 mt-0 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-6 mb-4">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full" />
                        <h2 className="font-semibold text-gray-900 text-base">物流进度</h2>
                    </div>

                    <div className="relative">
                        {orderSteps.map((step, index) => (
                            <div key={step.key} className="relative pb-8 last:pb-0 flex items-start">
                                {/* Connection line - 在节点中心位置 */}
                                {index < orderSteps.length - 1 && (
                                    <div className={`absolute left-3 top-8 w-0.5 h-full transition-colors z-0 ${
                                        step.active 
                                            ? 'bg-gradient-to-b from-red-500 to-red-400' 
                                            : 'bg-gray-200'
                                    }`} />
                                )}

                                {/* Node - 固定在左边 */}
                                <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                    step.active
                                        ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-500 shadow-lg shadow-red-500/30 scale-110'
                                        : 'bg-white border-gray-300'
                                }`}>
                                    {step.active && (
                                        <Check className="w-3.5 h-3.5 text-white font-bold" strokeWidth={3} />
                                    )}
                                </div>

                                {/* Text content - 在节点右边，有足够间距 */}
                                <div className="flex-1 ml-4 pt-0.5 min-w-0">
                                    <p className={`text-sm mb-1.5 transition-colors ${
                                        step.active 
                                            ? 'text-gray-900 font-semibold' 
                                            : 'text-gray-400'
                                    }`}>
                                        {step.label}
                                    </p>
                                    <p className={`text-xs transition-colors ${
                                        step.active ? 'text-gray-600' : 'text-gray-400'
                                    }`}>
                                        {step.time > 0 ? formatDateTime(step.time) : '等待中...'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logistics Info */}
                {order.shipping_company && (
                    <div className="bg-white/80 backdrop-blur-sm mx-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-5 mb-4">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                <Truck className="w-4 h-4 text-red-500" />
                            </div>
                            <h2 className="font-semibold text-gray-900 text-base">物流信息</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-500">物流公司</span>
                                <span className="text-sm text-gray-900 font-medium">{order.shipping_company}</span>
                            </div>
                            {order.shipping_no && (
                                <div className="flex justify-between items-center py-2 border-t border-gray-50 pt-4">
                                    <span className="text-sm text-gray-500">物流单号</span>
                                    <span className="text-sm text-gray-900 font-medium font-mono">{order.shipping_no}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Recipient Info */}
                {order.recipient_name && (
                    <div className="bg-white/80 backdrop-blur-sm mx-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-5 mb-4">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-blue-500" />
                            </div>
                            <h2 className="font-semibold text-gray-900 text-base">收货信息</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 py-2">
                                <span className="text-sm text-gray-500 w-16 flex-shrink-0">收货人</span>
                                <span className="text-sm text-gray-900 font-medium">{order.recipient_name}</span>
                            </div>
                            {order.recipient_phone && (
                                <div className="flex items-center gap-3 py-2 border-t border-gray-50 pt-4">
                                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-gray-900 font-medium">{order.recipient_phone}</span>
                                </div>
                            )}
                            {order.recipient_address && (
                                <div className="flex items-start gap-3 py-2 border-t border-gray-50 pt-4">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-900 leading-relaxed">{order.recipient_address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Product Info */}
                <div className="bg-white/80 backdrop-blur-sm mx-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-5 mb-4">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Package className="w-4 h-4 text-purple-500" />
                        </div>
                        <h2 className="font-semibold text-gray-900 text-base">商品信息</h2>
                    </div>

                    {order.items?.map((item) => (
                        <div key={item.id} className="flex gap-4 pb-5 mb-5 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                            <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                <LazyImage
                                    src={normalizeAssetUrl(item.product_thumbnail || '')}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <p className="text-sm leading-relaxed line-clamp-2 text-gray-900 mb-3 font-medium">
                                    {item.product_name}
                                </p>
                                <div className="flex items-end justify-between">
                                    <div className="text-red-500 font-bold text-base leading-none">
                                        {item.price > 0 ? (
                                            <>
                                                <span className="text-xs">¥</span>{formatAmount(item.price)}
                                                {item.score_price && item.score_price > 0 && (
                                                    <span className="text-sm">
                                                        +{item.score_price}消费金
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            item.score_price && item.score_price > 0 && (
                                                <span className="text-sm">
                                                    {item.score_price}消费金
                                                </span>
                                            )
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">x{item.quantity}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Total */}
                    <div className="mt-5 pt-5 border-t-2 border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-base text-gray-600 font-medium">合计</span>
                            <div className="text-red-500 font-bold text-base leading-none">
                                {order.total_amount > 0 ? (
                                    <>
                                        <span className="text-xs">¥</span>{formatAmount(order.total_amount)}
                                        {order.total_score && order.total_score > 0 && (
                                            <span className="text-sm">
                                                +{typeof order.total_score === 'string'
                                                    ? parseFloat(order.total_score)
                                                    : order.total_score}消费金
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    order.total_score && order.total_score > 0 && (
                                        <span className="text-sm">
                                            {typeof order.total_score === 'string'
                                                ? parseFloat(order.total_score)
                                                : order.total_score}消费金
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Info */}
                <div className="bg-white/80 backdrop-blur-sm mx-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-5 mb-4">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-green-500" />
                        </div>
                        <h2 className="font-semibold text-gray-900 text-base">订单信息</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-500">订单编号</span>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-900 text-xs font-mono">{order.order_no || order.id}</span>
                                <button
                                    onClick={() => copyOrderNo(order.order_no || String(order.id))}
                                    className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
                                    aria-label="复制订单号"
                                >
                                    {copiedOrderNo ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                        {order.status_text && (
                            <div className="flex justify-between items-center py-2 border-t border-gray-50 pt-4">
                                <span className="text-sm text-gray-500">订单状态</span>
                                <span className="text-sm text-gray-900 font-medium">{order.status_text}</span>
                            </div>
                        )}
                        {order.pay_type_text && (
                            <div className="flex justify-between items-center py-2 border-t border-gray-50 pt-4">
                                <span className="text-sm text-gray-500">支付方式</span>
                                <div className="flex items-center gap-1.5">
                                    <Gift className="w-4 h-4 text-red-500" />
                                    <span className="text-sm text-gray-900 font-medium">{order.pay_type_text}</span>
                                </div>
                            </div>
                        )}
                        {order.product_type_text && (
                            <div className="flex justify-between items-center py-2 border-t border-gray-50 pt-4">
                                <span className="text-sm text-gray-500">商品类型</span>
                                <span className="text-sm text-gray-900 font-medium">{order.product_type_text}</span>
                            </div>
                        )}
                        {order.create_time > 0 && (
                            <div className="flex justify-between items-center py-2 border-t border-gray-50 pt-4">
                                <span className="text-sm text-gray-500">下单时间</span>
                                <span className="text-sm text-gray-900">{formatDateTime(order.create_time)}</span>
                            </div>
                        )}
                        {order.remark && (
                            <div className="flex justify-between items-start py-2 pt-4 border-t border-gray-100">
                                <span className="text-sm text-gray-500 flex-shrink-0">备注</span>
                                <span className="text-sm text-gray-900 text-right max-w-[200px] leading-relaxed">{order.remark}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-w-[480px] mx-auto safe-area-bottom">
                <div className="p-4 flex gap-3">
                    {(order.status === ShopOrderPayStatus.UNPAID || order.status === 'pending' || String(order.status) === '0') && (
                        <>
                            <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="flex-1 h-12 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all active:scale-[0.98]"
                            >
                                取消订单
                            </button>
                            <button
                                onClick={() => handlePayOrder(order.id)}
                                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-600 font-semibold shadow-lg shadow-red-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                立即支付
                            </button>
                        </>
                    )}
                    {(order.status === ShopOrderPayStatus.PAID || order.status === 'paid' || String(order.status) === '1') && (
                        <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="flex-1 h-12 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 font-semibold transition-all active:scale-[0.98]"
                        >
                            取消订单
                        </button>
                    )}
                    {(order.status === ShopOrderShippingStatus.SHIPPED || order.status === 'shipped' || String(order.status) === '2') && (
                        <>
                            <button
                                className="flex-1 h-12 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all active:scale-[0.98]"
                            >
                                查看物流
                            </button>
                            <button
                                onClick={() => handleConfirmReceipt(order.id)}
                                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-600 font-semibold shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
                            >
                                确认收货
                            </button>
                        </>
                    )}
                    {(order.status === ShopOrderShippingStatus.RECEIVED || order.status === 'completed' || String(order.status) === '3') && (
                        <>
                            <button
                                onClick={() => {
                                    // 获取第一个商品用于评价
                                    const firstItem = order.items?.[0];
                                    if (firstItem) {
                                        const params = new URLSearchParams({
                                            order_id: String(order.id),
                                            product_id: String(firstItem.product_id),
                                            name: firstItem.product_name || '',
                                            image: normalizeAssetUrl(firstItem.product_thumbnail || firstItem.product_image || ''),
                                        });
                                        navigate(`/submit-review?${params.toString()}`);
                                    }
                                }}
                                className="flex-1 h-12 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Star size={18} />
                                去评价
                            </button>
                            <button
                                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-600 font-semibold shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
                            >
                                再次购买
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
