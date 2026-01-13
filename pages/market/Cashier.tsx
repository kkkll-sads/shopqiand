
import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { payOrder, getOrderDetail, ShopOrderItem, fetchProfile } from '../../services/api'; // Added fetchProfile
import { LoadingSpinner } from '../../components/common';
import { Coins, CreditCard, ChevronLeft } from 'lucide-react';
import { AUTH_TOKEN_KEY } from '../../constants/storageKeys';
import { Route, RoutePayload } from '../../router/routes';
// ✅ 引入统一 API 处理工具
import { isSuccess, extractData, extractError } from '../../utils/apiHelpers';

interface CashierProps {
    orderId: string;
    backRoute?: RoutePayload | null;
    onBack: () => void;
    onNavigate: (route: Route) => void;
}

const Cashier: React.FC<CashierProps> = ({ orderId, backRoute, onBack, onNavigate }) => {
    const { showToast } = useNotification();
    const [order, setOrder] = useState<ShopOrderItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [payType, setPayType] = useState<'money' | 'score'>('money');
    const [userBalance, setUserBalance] = useState<{ score: number; balance_available: string }>({ score: 0, balance_available: '0.00' });

    useEffect(() => {
        loadData();
    }, [orderId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';

            // Parallel fetch for order and user profile
            const [orderRes, profileRes] = await Promise.all([
                getOrderDetail({ id: orderId, token }),
                fetchProfile(token)
            ]);

            // ✅ 使用统一判断
            const orderData = extractData(orderRes);
            if (orderData) {
                setOrder(orderData);
                if (orderData.pay_type) {
                    setPayType(orderData.pay_type as 'money' | 'score' | 'combined');
                }
            } else {
                showToast('error', '获取订单失败', extractError(orderRes, '无法加载订单信息'));
            }

            const profileData = extractData(profileRes);
            if (profileData?.userInfo) {
                // 优先使用订单API返回的余额信息
                const finalBalance = {
                    score: profileData.userInfo.score,
                    balance_available: profileData.userInfo.money
                };

                // 如果订单数据存在，覆盖余额信息
                if (orderData) {
                    if (orderData.score !== undefined && orderData.score !== null) {
                        finalBalance.score = Number(orderData.score);
                    }
                    if (orderData.balance_available !== undefined && orderData.balance_available !== null) {
                        finalBalance.balance_available = String(orderData.balance_available);
                    }
                }

                setUserBalance(finalBalance);
            }
        } catch (e) {
            console.error('Load cashier data failed', e);
            showToast('error', '加载失败', '网络错误');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        if (paying) return;
        try {
            setPaying(true);
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const res = await payOrder({ id: orderId, token: token || '' });
            // ✅ 使用统一判断
            if (isSuccess(res)) {
                showToast('success', extractError(res, '支付成功'));
                // 支付成功后跳转到订单列表，back参数使用收银台的back参数（通常是商品详情页面）
                // 这样用户在订单列表点击返回时，会返回到商品详情页面，而不是收银台
                onNavigate({
                    name: 'order-list',
                    kind: payType === 'score' ? 'points' : 'product',
                    status: 1,
                    back: backRoute || null,
                });
            } else {
                showToast('error', '支付失败', extractError(res, '操作失败'));
            }
        } catch (e: any) {
            console.error('Pay failed', e);
            showToast('error', '支付失败', e.message || '系统错误');
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;
    if (!order) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">订单不存在</div>;

    const isScore = payType === 'score';
    const isCombined = payType === 'combined';

    // Calculate total amounts from order items
    const totalAmount = order.items?.reduce((sum, item) => sum + (Number(item.price) || 0), 0) || 0;
    const totalScoreAmount = order.items?.reduce((sum, item) => sum + (Number(item.score_price) || 0), 0) || 0;

    // Dynamic Theme Colors
    const themeColor = isScore ? 'orange' : isCombined ? 'purple' : 'blue';
    const btnBgClass = isScore ? 'bg-orange-600 shadow-orange-200' : isCombined ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200';

    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
            {/* Header */}
            <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-800">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">收银台</h1>
                <div className="w-8"></div>
            </header>

            <div className="p-6">
                <div className="text-center mb-8">
                    <div className="text-sm text-gray-500 mb-2">订单号：{order.order_no}</div>
                    <div className="flex items-baseline justify-center gap-1">
                        {totalAmount > 0 ? (
                            <>
                                <div className="text-2xl font-bold text-orange-600 font-mono">
                                    ¥{String(totalAmount)}
                                </div>
                                {totalScoreAmount > 0 && (
                                    <span className="text-2xl font-bold text-orange-600 font-mono ml-2">
                                        +{totalScoreAmount}消费金
                                    </span>
                                )}
                            </>
                        ) : (
                            totalScoreAmount > 0 && (
                                <div className="text-2xl font-bold text-orange-600 font-mono">
                                    {totalScoreAmount}消费金
                                </div>
                            )
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Payment Method */}
                    {isCombined ? (
                        <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-purple-100 ring-1 ring-purple-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <div className="flex gap-1">
                                        <Coins size={16} />
                                        <CreditCard size={16} />
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">组合支付</div>
                                    <div className="text-xs text-gray-500">
                                        ¥{totalAmount} + {totalScoreAmount}消费金
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        余额: ¥{userBalance.balance_available} | 消费金: {Math.floor(Number(userBalance.score))}
                                    </div>
                                </div>
                            </div>
                            <div className="w-5 h-5 rounded-full border-[5px] border-purple-500 bg-white"></div>
                        </div>
                    ) : (
                        <>
                            {totalScoreAmount > 0 && (
                                <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-orange-100 ring-1 ring-orange-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Coins size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">消费金支付</div>
                                            <div className="text-xs text-gray-500">当前余额: {userBalance.score} 消费金</div>
                                        </div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-[5px] border-orange-500 bg-white"></div>
                                </div>
                            )}
                            {totalAmount > 0 && (
                                <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-blue-100 ring-1 ring-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">余额支付</div>
                                            <div className="text-xs text-gzray-500">当前余额: ¥{userBalance.balance_available}</div>
                                        </div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-[5px] border-blue-600 bg-white"></div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-12">
                    <button
                        onClick={handlePay}
                        disabled={paying}
                        className={`w-full text-white font-bold py-3.5 rounded-full shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${btnBgClass}`}
                    >
                        {paying ? <LoadingSpinner size={20} color="white" /> : '确认支付'}
                    </button>
                    {paying && <p className="text-center text-xs text-gray-400 mt-4">正在支付，请稍候...</p>}
                </div>
            </div>
        </div>
    );
};

export default Cashier;
