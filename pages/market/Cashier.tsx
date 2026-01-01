
import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { payOrder, getOrderDetail, ShopOrderItem, fetchProfile } from '../../services/api'; // Added fetchProfile
import { LoadingSpinner } from '../../components/common';
import { Coins, CreditCard, ChevronLeft } from 'lucide-react';
import { AUTH_TOKEN_KEY } from '../../constants/storageKeys';
import { Route } from '../../router/routes';
// ✅ 引入统一 API 处理工具
import { isSuccess, extractData, extractError } from '../../utils/apiHelpers';

interface CashierProps {
    orderId: string;
    onBack: () => void;
    onNavigate: (route: Route) => void;
}

const Cashier: React.FC<CashierProps> = ({ orderId, onBack, onNavigate }) => {
    const { showToast } = useNotification();
    const [order, setOrder] = useState<ShopOrderItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [payType, setPayType] = useState<'money' | 'score'>('money');
    const [userBalance, setUserBalance] = useState<{ score: number; money: string }>({ score: 0, money: '0.00' });

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
                    setPayType(orderData.pay_type as 'money' | 'score');
                }
            } else {
                showToast('error', '获取订单失败', extractError(orderRes, '无法加载订单信息'));
            }

            const profileData = extractData(profileRes);
            if (profileData?.userInfo) {
                setUserBalance({
                    score: profileData.userInfo.score,
                    money: profileData.userInfo.money
                });
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
                onNavigate({
                    name: 'order-list',
                    kind: payType === 'score' ? 'points' : 'product',
                    status: 1,
                    back: { name: 'cashier', orderId: String(orderId) },
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
    const amount = isScore ? order.total_score : order.total_amount;

    // Dynamic Theme Colors
    const themeColor = isScore ? 'orange' : 'blue';
    const btnBgClass = isScore ? 'bg-orange-600 shadow-orange-200' : 'bg-blue-600 shadow-blue-200';
    const iconBgClass = isScore ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600';

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
                    <div className="text-4xl font-bold text-gray-900 font-mono">
                        {amount} <span className="text-sm font-normal text-gray-500">{isScore ? '消费金' : '元'}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Payment Method */}
                    {isScore ? (
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
                    ) : (
                        <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-blue-100 ring-1 ring-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">余额支付</div>
                                    <div className="text-xs text-gray-500">当前余额: ¥{userBalance.money}</div>
                                </div>
                            </div>
                            <div className="w-5 h-5 rounded-full border-[5px] border-blue-600 bg-white"></div>
                        </div>
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
