import React, { useState, useEffect } from 'react';
import { ChevronLeft, Shield, Zap, Wallet, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Product, UserInfo } from '../../types';
import { fetchProfile, bidBuy, fetchCollectionItemDetail } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { getStoredToken } from '../../services/client';
import { Route } from '../../router/routes';
import { isSuccess, extractData } from '../../utils/apiHelpers';

interface ReservationPageProps {
    product: Product;
    onBack: () => void;
    onNavigate: (route: Route) => void;
}

const ReservationPage: React.FC<ReservationPageProps> = ({ product, onBack, onNavigate }) => {
    const { showToast } = useNotification();
    const [extraHashrate, setExtraHashrate] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [loading, setLoading] = useState(false);
    // 新版预约需要后端提供的场次/分区，若入参缺失则尝试自动补全
    const [sessionId, setSessionId] = useState<number | string | undefined>(product.sessionId);
    const [zoneId, setZoneId] = useState<number | string | undefined>(product.zoneId);
    
    // 分区最高价（用于计算冻结金额）
    const [zoneMaxPrice, setZoneMaxPrice] = useState<number>(product.price);

    // 基础算力需求（根据商品价格计算）
    const baseHashrate = Math.ceil(product.price / 100);

    // 额外算力（用户可调节）
    const totalRequiredHashrate = baseHashrate + extraHashrate;

    // 当前用户持有算力（这里应该从API获取，暂时模拟）
    const [availableHashrate, setAvailableHashrate] = useState(10);

    // 冻结金额计算（按场次分区的最高价冻结，撮合后退还差价）
    const frozenAmount = zoneMaxPrice;

    // 账户余额（应该从API获取）
    const [accountBalance, setAccountBalance] = useState(1000);

    // 检查算力是否充足
    const isHashrateSufficient = availableHashrate >= totalRequiredHashrate;

    // 检查资金是否充足
    const isFundSufficient = accountBalance >= frozenAmount;

    // 计算额外算力可调节范围
    const maxExtraHashrate = Math.max(0, availableHashrate - baseHashrate);
    const canIncreaseHashrate = extraHashrate < maxExtraHashrate;

    // 标记是否已尝试过详情补全，避免重复请求
    const [triedFillFromDetail, setTriedFillFromDetail] = useState(false);

    const fillSessionZoneFromDetail = async () => {
        if (triedFillFromDetail) return { sessionId: sessionId ?? product.sessionId, zoneId: zoneId ?? product.zoneId };
        setTriedFillFromDetail(true);
        if (!product?.id) return { sessionId, zoneId };
        try {
            const res = await fetchCollectionItemDetail(Number(product.id));
            const data = extractData(res);
            if (data) {
                const detailSessionId =
                    data.session_id ??
                    data.sessionId ??
                    data.session?.id ??
                    data.session?.session_id;
                const detailZoneId =
                    data.zone_id ??
                    data.price_zone_id ??
                    data.zoneId ??
                    data.priceZoneId ??
                    data.zone?.id;
                
                // 获取分区最高价，用于冻结金额计算
                const detailZoneMaxPrice =
                    data.zone_max_price ??
                    data.zoneMaxPrice ??
                    data.max_price ??
                    data.maxPrice ??
                    data.price;  // 如果没有分区最高价，使用商品价格

                if (detailSessionId) setSessionId(detailSessionId);
                if (detailZoneId) setZoneId(detailZoneId);
                if (detailZoneMaxPrice) setZoneMaxPrice(Number(detailZoneMaxPrice));
                
                return { sessionId: detailSessionId ?? sessionId ?? product.sessionId, zoneId: detailZoneId ?? zoneId ?? product.zoneId };
            }
        } catch (error) {
            console.warn('补全场次/分区失败', error);
        }
        return { sessionId: sessionId ?? product.sessionId, zoneId: zoneId ?? product.zoneId };
    };

    // 如果缺少场次/分区，从详情接口补全
    useEffect(() => {
        if (sessionId && zoneId) return;
        if (!product?.id) return;

        fillSessionZoneFromDetail();
    }, [product?.id, sessionId, zoneId]);

    useEffect(() => {
        // 获取用户信息（算力和余额）
        const loadUserInfo = async () => {
            const token = getStoredToken();
            if (!token) {
                // 用户未登录，使用默认值
                console.log('用户未登录，使用默认算力和余额');
                return;
            }

            try {
                const response = await fetchProfile(token);
                if (isSuccess(response)) {
                    // 设置真实的算力和余额
                    setAvailableHashrate(Number(response.data.userInfo.green_power) || 0);
                    setAccountBalance(Number(response.data.userInfo.balance_available) || 0);
                }
            } catch (error: any) {
                console.error('获取用户信息失败:', error);
                if (error?.name === 'NeedLoginError') return;
                // 可以在这里设置错误状态或显示提示
            }
        };

        loadUserInfo();
    }, []);

    const handleReservation = () => {
        if (!isHashrateSufficient || !isFundSufficient) {
            return;
        }
        setShowConfirmModal(true);
    };

    const handleRecharge = () => {
        if (!isHashrateSufficient) {
            // 跳转到算力充值页面，指定来源为reservation
            onNavigate({ name: 'hashrate-exchange', source: 'reservation', back: { name: 'reservation' } });
        } else if (!isFundSufficient) {
            // 跳转到资金充值页面，指定来源为reservation
            onNavigate({ name: 'balance-recharge', source: 'reservation', back: { name: 'reservation' } });
        }
    };

    const confirmSubmit = async () => {
        try {
            setLoading(true);

            // 统一使用 bidBuy 接口 (盲盒预约模式: session_id + zone_id)
            const finalSessionId = sessionId ?? product.sessionId;
            const finalZoneId = zoneId ?? product.zoneId;

            // 若初始缺失或为 0，先尝试详情补全一次
            let ensuredSessionId = finalSessionId;
            let ensuredZoneId = finalZoneId;
            if (!ensuredSessionId || Number(ensuredSessionId) <= 0 || !ensuredZoneId || Number(ensuredZoneId) <= 0) {
                const filled = await fillSessionZoneFromDetail();
                ensuredSessionId = filled.sessionId;
                ensuredZoneId = filled.zoneId;
            }

            const response = await bidBuy({
                session_id: ensuredSessionId,
                zone_id: ensuredZoneId,
                extra_hashrate: extraHashrate,
            });

            if (Number(response.code) === 1) {
                setShowConfirmModal(false);
                showToast('success', '预约成功', response.msg || '预约成功');
                onNavigate({ name: 'reservation-record' });
            } else {
                // 失败时完全使用后端返回的 msg
                showToast('error', '预约失败', response.msg || '预约失败');
            }
        } catch (error: any) {
            console.error('操作失败:', error);
            if (error?.name === 'NeedLoginError') return;
            // 异常时也使用后端/错误对象的 msg
            showToast('error', '操作失败', error?.msg || error?.message || '网络错误，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">预约确权</h1>
                <div className="w-8"></div>
            </header>

            <div className="p-4 space-y-4">
                {/* Product Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900 line-clamp-2">{product.title}</h2>
                        <div className="text-xs text-gray-500 mt-1">艺术家: {product.artist}</div>
                        <div className="text-xs text-gray-400 font-mono mt-2">
                            确权编号: 37-DATA-2025-{String(product.id).padStart(4, '0')}
                        </div>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-xs text-gray-400">起购价</span>
                            <span className="text-xl font-bold text-red-600 font-mono">¥{product.price.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Configuration */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-orange-500 fill-orange-500" />
                        算力配置
                    </h3>

                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>基础算力需求</span>
                            <span className="font-mono font-bold">{baseHashrate}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-4">
                            <span>额外加注算力 (提升中签率)</span>
                            <span className="font-mono font-bold text-orange-600">+{extraHashrate}</span>
                        </div>

                        {/* Stepper/Slider for extra hashrate */}
                        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                            <button
                                onClick={() => setExtraHashrate(Math.max(0, extraHashrate - 0.5))}
                                disabled={extraHashrate <= 0}
                                className={`w-8 h-8 flex items-center justify-center bg-white rounded-full shadow font-bold transition-all ${extraHashrate <= 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 active:scale-95'}`}
                            >-</button>
                            <div className="flex-1 text-center font-mono font-bold text-lg text-gray-900">
                                {extraHashrate.toFixed(1)}
                            </div>
                            <button
                                onClick={() => canIncreaseHashrate && setExtraHashrate(extraHashrate + 0.5)}
                                disabled={!canIncreaseHashrate}
                                className={`w-8 h-8 flex items-center justify-center bg-white rounded-full shadow font-bold transition-all ${!canIncreaseHashrate ? 'text-gray-300 cursor-not-allowed' : 'text-orange-600 active:scale-95'}`}
                            >+</button>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500">当前持有绿色算力</span>
                            <span className={`font-mono font-bold ${isHashrateSufficient ? 'text-gray-900' : 'text-red-500'}`}>
                                {availableHashrate.toFixed(1)}
                            </span>
                        </div>
                        {!isHashrateSufficient && (
                            <div className="text-xs text-red-500 flex items-center justify-end gap-1">
                                <AlertCircle size={12} />
                                算力不足，请前往【我的-算力兑换】获取
                            </div>
                        )}
                    </div>
                </div>

                {/* Fund Check */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Wallet size={18} className="text-blue-500 fill-blue-500" />
                        资金冻结
                    </h3>

                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>需冻结专项金（该场次最高价）</span>
                        <span className="font-mono font-bold">¥{frozenAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">当前专项金余额</span>
                        <span className={`font-mono font-bold ${isFundSufficient ? 'text-gray-900' : 'text-red-500'}`}>
                            ¥{accountBalance.toLocaleString()}
                        </span>
                    </div>
                    
                    {/* 差价退还说明 */}
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-start gap-2">
                            <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                预约时将冻结该场次的最高金额，撮合成功后若实际藏品金额低于冻结金额，将自动退还差价
                            </p>
                        </div>
                    </div>
                    
                    {!isFundSufficient && (
                        <div className="text-xs text-red-500 flex items-center gap-1 mt-2">
                            <AlertCircle size={12} />
                            余额不足，请充值
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe">
                <button
                    onClick={(!isHashrateSufficient || !isFundSufficient) ? handleRecharge : handleReservation}
                    className={`w-full py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${isHashrateSufficient && isFundSufficient
                        ? 'bg-[#8B0000] text-amber-50 shadow-red-900/20 hover:bg-[#A00000]'
                        : 'bg-[#8B0000] text-white opacity-90'
                        }`}
                >
                    {!isHashrateSufficient ? '前往获取算力' : !isFundSufficient ? '前往充值专项金' : '确认预约'}
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-center mb-6">确认提交预约</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-500 text-sm">消耗算力</span>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900 font-mono">{totalRequiredHashrate.toFixed(1)}</div>
                                    <div className="text-[10px] text-gray-400">基础 {baseHashrate} + 加注 {extraHashrate}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-500 text-sm">冻结金额</span>
                                <div className="font-bold text-gray-900 font-mono">¥{frozenAmount.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmSubmit}
                                disabled={loading}
                                className="flex-1 py-3 rounded-lg bg-[#8B0000] text-white font-bold hover:bg-[#A00000] flex justify-center items-center"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '确认提交'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationPage;