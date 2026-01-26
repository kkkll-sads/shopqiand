/**
 * ReservationPage - 预约页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Zap, Wallet, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Product, UserInfo } from '@/types';
import { fetchProfile, bidBuy, fetchCollectionItemDetail, fetchCollectionSessionDetail } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { getStoredToken } from '@/services/client';
import { isSuccess, extractData, extractError } from '@/utils/apiHelpers';
import { debugLog, warnLog, errorLog } from '@/utils/logger';
import { useAppStore } from '@/stores/appStore';

// 全局预加载数据存储
declare global {
    var __preloadedReservationData: {
        userInfo?: { availableHashrate: number; accountBalance: number };
        sessionDetail?: any;
        zoneMaxPrice?: number;
        sessionId?: number | string;
        zoneId?: number | string;
        packageId?: number | string;
    } | null;
}

/**
 * 从价格分区字符串中提取价格数字
 * @param priceZone - 价格分区字符串，如 "500元区" 或 "1K区"
 * @returns 提取的价格数字，如果提取失败返回 0
 */
const extractPriceFromZone = (priceZone?: string): number => {
    if (!priceZone) return 0;

    // 处理带单位的情况，如 "1K区" -> 1000, "2K区" -> 2000
    const upperZone = priceZone.toUpperCase();
    if (upperZone.includes('K')) {
        const match = upperZone.match(/(\d+)\s*K/i);
        if (match) {
            return Number(match[1]) * 1000;
        }
    }

    // 处理普通数字，如 "500元区" -> 500
    const match = priceZone.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
};

interface ReservationPageProps {
    product?: Product;
    preloadedUserInfo?: { availableHashrate: number; accountBalance: number } | null;
}

const ReservationPage: React.FC<ReservationPageProps> = ({ product: propProduct, preloadedUserInfo }) => {
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const { selectedProduct } = useAppStore();
    // 优先使用传入的 product，其次使用 store 中的 selectedProduct
    const product = propProduct || selectedProduct || { id: 0, title: '', image: '' } as Product;
    const [extraHashrate, setExtraHashrate] = useState(0);
    const [quantity, setQuantity] = useState(1); // 申购数量，默认1，最大100
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userInfoLoading, setUserInfoLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    // 新版预约需要后端提供的场次/分区/资产包，若入参缺失则尝试自动补全
    const [sessionId, setSessionId] = useState<number | string | undefined>(globalThis.__preloadedReservationData?.sessionId ?? product.sessionId);
    const [zoneId, setZoneId] = useState<number | string | undefined>(globalThis.__preloadedReservationData?.zoneId ?? product.zoneId);
    const [packageId, setPackageId] = useState<number | string | undefined>(globalThis.__preloadedReservationData?.packageId ?? (product as any).packageId ?? (product as any).package_id);

    // 场次信息（用于返回导航）
    const [sessionTitle, setSessionTitle] = useState<string | undefined>();
    const [sessionStartTime, setSessionStartTime] = useState<string | undefined>();
    const [sessionEndTime, setSessionEndTime] = useState<string | undefined>();

    // 分区最高价（用于计算冻结金额）- 直接使用最准确的值
    const getInitialZoneMaxPrice = (): number => {
        // 1. 优先使用预加载数据（应该是最准确的）
        if (globalThis.__preloadedReservationData?.zoneMaxPrice) {
            return globalThis.__preloadedReservationData.zoneMaxPrice;
        }

        // 2. 优先从 priceZone 字段解析价格（如 "500元区" -> 500）
        const priceZone = (product as any).priceZone || (product as any).price_zone;
        if (priceZone) {
            const parsedPrice = extractPriceFromZone(priceZone);
            if (parsedPrice > 0) {
                return parsedPrice;
            }
        }

        // 3. 如果没有预加载数据和priceZone，使用产品价格
        return Number(product.price);
    };

    const initialZoneMaxPrice = getInitialZoneMaxPrice();
    const [zoneMaxPrice, setZoneMaxPrice] = useState<number>(initialZoneMaxPrice);
    // 如果使用了预加载数据，标记为已更新，避免后续重复更新
    const [hasUpdatedZoneMaxPrice, setHasUpdatedZoneMaxPrice] = useState<boolean>(
        globalThis.__preloadedReservationData?.zoneMaxPrice !== undefined
    );

    // 基础算力需求（所有价格分区的基础算力都是5）
    const baseHashrate = 5;

    // 当前用户持有算力（从API获取或预加载）
    const [availableHashrate, setAvailableHashrate] = useState(preloadedUserInfo?.availableHashrate ?? 0);

    // 冻结金额计算（按场次分区的最高价冻结，撮合后退还差价）- 乘以数量
    const frozenAmount = zoneMaxPrice * quantity;

    // 算力需求也需要乘以数量
    const totalRequiredHashrate = (baseHashrate + extraHashrate) * quantity;

    // 账户余额（应该从API获取或预加载）
    const [accountBalance, setAccountBalance] = useState(preloadedUserInfo?.accountBalance ?? 0);

    // 检查算力是否充足
    const isHashrateSufficient = availableHashrate >= totalRequiredHashrate;

    // 检查资金是否充足
    const isFundSufficient = accountBalance >= frozenAmount;

    // 计算额外算力可调节范围（基于每份的算力需求）
    const perUnitHashrate = baseHashrate + extraHashrate;
    const maxExtraHashrate = Math.max(0, Math.floor(availableHashrate / quantity) - baseHashrate);
    const canIncreaseHashrate = extraHashrate < maxExtraHashrate;

    // 标记是否已尝试过详情补全，避免重复请求
    const [triedFillFromDetail, setTriedFillFromDetail] = useState(false);

    const fillSessionZoneFromDetail = async () => {
        if (triedFillFromDetail) return { sessionId: sessionId ?? product.sessionId, zoneId: zoneId ?? product.zoneId, packageId: packageId ?? (product as any).packageId ?? (product as any).package_id };
        setTriedFillFromDetail(true);
        if (!product?.id) return { sessionId, zoneId, packageId };

        debugLog('ReservationPage', 'Starting auto-fill check for session/zone');

        try {
            // 1. 先获取商品详情，看看有没有直接带回 zone_id
            const res = await fetchCollectionItemDetail(Number(product.id));
            const data = extractData(res);

            if (data) {
                let detailSessionId =
                    data.session_id ??
                    data.sessionId ??
                    data.session?.id ??
                    data.session?.session_id;

                let detailZoneId =
                    data.zone_id ??
                    data.price_zone_id ??
                    data.zoneId ??
                    data.priceZoneId ??
                    data.zone?.id;

                // 获取分区最高价，用于冻结金额计算
                // 优先从 price_zone 字段解析价格（如 "500元区" -> 500）
                let detailZoneMaxPrice: number | undefined;
                if (data.price_zone) {
                    const parsedPrice = extractPriceFromZone(data.price_zone);
                    if (parsedPrice > 0) {
                        detailZoneMaxPrice = parsedPrice;
                    }
                }

                // 如果从 price_zone 解析失败，回退到其他字段
                if (!detailZoneMaxPrice) {
                    detailZoneMaxPrice =
                        data.zone_max_price ??
                        data.zoneMaxPrice ??
                        data.max_price ??
                        data.maxPrice ??
                        data.price;
                }

                // 获取资产包ID
                const detailPackageId =
                    data.package_id ??
                    data.packageId ??
                    data.package?.id;

                debugLog('ReservationPage', 'Item detail fetched', {
                    detailSessionId,
                    detailZoneId,
                    detailPackageId,
                    priceZone: data.price_zone,
                    parsedPriceFromZone: data.price_zone ? extractPriceFromZone(data.price_zone) : null,
                    detailZoneMaxPrice
                });

                // 2. 如果存在 price_zone 名称，或者没有 valid zone_id，都尝试通过 session detail 反查
                // (强制校验: 防止 item data 中 zone_id 与 price_zone 不一致)
                if (detailSessionId && (data.price_zone || !detailZoneId || Number(detailZoneId) === 0)) {
                    try {
                        debugLog('ReservationPage', 'Zone ID missing, fetching session details to map price_zone');
                        const sessionRes = await fetchCollectionSessionDetail(Number(detailSessionId));
                        const sessionData = extractData(sessionRes);

                        // 提取场次信息
                        if (sessionData) {
                            const detailSessionTitle = sessionData.title || sessionData.name;
                            const detailSessionStartTime = sessionData.start_time || sessionData.startTime;
                            const detailSessionEndTime = sessionData.end_time || sessionData.endTime;

                            if (detailSessionTitle) setSessionTitle(detailSessionTitle);
                            if (detailSessionStartTime) setSessionStartTime(detailSessionStartTime);
                            if (detailSessionEndTime) setSessionEndTime(detailSessionEndTime);
                        }

                        if (sessionData && sessionData.zones && Array.isArray(sessionData.zones)) {
                            // 尝试匹配逻辑
                            // A. 优先匹配 price_zone 名称 (e.g. "500元区")
                            let matchedZone = sessionData.zones.find((z: any) => z.name === data.price_zone);

                            // B. 如果没匹配到，尝试匹配价格 (zone.price <= item.price < zone.max_price ??? 或者直接找包含该价格的 zone)
                            // 通常 zone 有 min_price / max_price 或者 uniform_price
                            if (!matchedZone) {
                                const targetPrice = Number(data.price);
                                matchedZone = sessionData.zones.find((z: any) => {
                                    // 宽松匹配：如果 zone 名称包含价格数字
                                    if (z.name && z.name.includes(String(Math.floor(targetPrice)))) return true;
                                    return false;
                                });
                            }

                            if (matchedZone) {
                                debugLog('ReservationPage', 'Found matching zone from session', matchedZone);
                                detailZoneId = matchedZone.id;
                            } else {
                                warnLog('ReservationPage', 'Could not match any zone in session', detailSessionId);
                            }
                        }
                    } catch (err) {
                        errorLog('ReservationPage', 'Failed to fetch session details for zone mapping', err);
                    }
                }

                if (detailSessionId) setSessionId(detailSessionId);
                if (detailZoneId && Number(detailZoneId) !== 0) setZoneId(detailZoneId);
                // 只有在还没有更新过zoneMaxPrice时才更新，避免金额跳跃
                if (detailZoneMaxPrice && !hasUpdatedZoneMaxPrice) {
                    setZoneMaxPrice(Number(detailZoneMaxPrice));
                    setHasUpdatedZoneMaxPrice(true);
                }
                if (detailPackageId) setPackageId(detailPackageId);

                return {
                    sessionId: detailSessionId ?? sessionId ?? product.sessionId,
                    zoneId: (detailZoneId && Number(detailZoneId) !== 0) ? detailZoneId : (zoneId ?? product.zoneId),
                    packageId: detailPackageId ?? packageId ?? (product as any).packageId ?? (product as any).package_id
                };
            }
        } catch (error) {
            warnLog('ReservationPage', '补全场次/分区失败', error);
        }
        return { sessionId: sessionId ?? product.sessionId, zoneId: zoneId ?? product.zoneId, packageId: packageId ?? (product as any).packageId ?? (product as any).package_id };
    };

    // 如果缺少场次/分区/资产包，从详情接口补全
    useEffect(() => {
        // 如果已经从预加载数据初始化了正确的值，跳过API调用
        if (hasUpdatedZoneMaxPrice) {
            return;
        }

        if (sessionId && zoneId && packageId) return;
        if (!product?.id) return;

        fillSessionZoneFromDetail();
    }, [product?.id, sessionId, zoneId, packageId, hasUpdatedZoneMaxPrice]);

    useEffect(() => {
        // 如果有预加载的用户信息，先使用预加载数据（快速显示），然后请求最新数据
        if (preloadedUserInfo) {
            setAvailableHashrate(preloadedUserInfo.availableHashrate);
            setAccountBalance(preloadedUserInfo.accountBalance);
        }

        // 检查全局预加载数据
        if (globalThis.__preloadedReservationData?.userInfo) {
            debugLog('ReservationPage', '使用预加载的用户信息', globalThis.__preloadedReservationData.userInfo);
            setAvailableHashrate(globalThis.__preloadedReservationData.userInfo.availableHashrate);
            setAccountBalance(globalThis.__preloadedReservationData.userInfo.accountBalance);
            // 清理预加载数据中的用户信息，但保留其他数据（如分区信息）
            if (globalThis.__preloadedReservationData) {
                globalThis.__preloadedReservationData.userInfo = undefined;
            }
        }

        // 始终发送请求获取最新的用户信息（算力和余额）
        const loadUserInfo = async () => {
            setUserInfoLoading(true);
            const token = getStoredToken();
            if (!token) {
                // 用户未登录，使用默认值
                debugLog('ReservationPage', '用户未登录，使用默认算力和余额');
                setUserInfoLoading(false);
                return;
            }

            try {
                const response = await fetchProfile(token);
                if (isSuccess(response)) {
                    // 设置最新的算力和余额
                    const latestHashrate = Number(response.data.userInfo.green_power) || 0;
                    const latestBalance = Number(response.data.userInfo.balance_available) || 0;
                    setAvailableHashrate(latestHashrate);
                    setAccountBalance(latestBalance);
                    debugLog('ReservationPage', '用户信息已更新', { latestHashrate, latestBalance });
                } else {
                    warnLog('ReservationPage', '获取用户信息失败', response.msg || '未知错误');
                }
            } catch (error: any) {
                errorLog('ReservationPage', '获取用户信息失败', error);
            } finally {
                setUserInfoLoading(false);
            }
        };

        loadUserInfo();
    }, [preloadedUserInfo]);

    const handleReservation = () => {
        if (!isHashrateSufficient || !isFundSufficient) {
            return;
        }
        setShowConfirmModal(true);
    };

    const handleRecharge = () => {
        if (!isHashrateSufficient) {
            // 跳转到算力充值页面
            navigate('/hashrate-exchange');
        } else if (!isFundSufficient) {
            // 跳转到资金充值页面
            navigate('/balance-recharge');
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
            let ensuredPackageId = packageId ?? (product as any).packageId ?? (product as any).package_id;
            if (!ensuredSessionId || Number(ensuredSessionId) <= 0 || !ensuredZoneId || Number(ensuredZoneId) <= 0 || !ensuredPackageId) {
                const filled = await fillSessionZoneFromDetail();
                ensuredSessionId = filled.sessionId;
                ensuredZoneId = filled.zoneId;
                if (filled.packageId) ensuredPackageId = filled.packageId;
            }

            const response = await bidBuy({
                session_id: ensuredSessionId,
                zone_id: ensuredZoneId,
                package_id: ensuredPackageId,
                extra_hashrate: extraHashrate,
                quantity: quantity,
            });

            if (isSuccess(response)) {
                setShowConfirmModal(false);
                showToast('success', '预约成功', response.msg || '预约成功');
                // 提交成功后跳转到申购记录页面
                navigate('/reservation-record', { replace: true });
            } else {
                // 失败时完全使用后端返回的 msg
                showToast('error', '预约失败', extractError(response, '预约失败'));
            }
        } catch (error: any) {
            errorLog('ReservationPage', '操作失败', error);
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
            {/* Header - 渐变红色主题 */}
            <header className="sticky top-0 z-20 bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 flex items-center justify-between text-white shadow-lg">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-white/20 transition-all">
                    <ChevronLeft size={22} />
                </button>
                <h1 className="text-lg font-bold">预约确权</h1>
                <div className="w-10"></div>
            </header>

            <div className="p-4 space-y-4">
                {/* Product Card */}
                <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 flex gap-4 relative overflow-hidden">
                    {/* 装饰背景 */}
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-red-50 opacity-30"></div>
                    <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-xl overflow-hidden shrink-0 relative z-10 shadow-sm">
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 relative z-10">
                        <h2 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">{product.title}</h2>
                        <div className="text-xs text-gray-400 font-mono mb-3">
                            确权编号: 37-DATA-2025-{String(product.id).padStart(4, '0')}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs text-gray-500">起购价</span>
                            <span className="text-2xl font-bold text-red-600 font-mono">¥{(product as any).priceZone || product.price}</span>
                        </div>
                    </div>
                </div>

                {/* 申购配置（合并算力配置和申购数量） */}
                <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                            <Zap size={18} className="text-orange-600 fill-orange-600" />
                        </div>
                        <span>申购配置</span>
                    </h3>

                    {/* 算力配置部分 */}
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
                                onClick={() => setExtraHashrate(Math.max(0, extraHashrate - 1))}
                                disabled={extraHashrate <= 0}
                                className={`w-8 h-8 flex items-center justify-center bg-white rounded-full shadow font-bold transition-all ${extraHashrate <= 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 active:scale-95'}`}
                            >-</button>
                            <div className="flex-1 text-center font-mono font-bold text-lg text-gray-900">
                                {extraHashrate.toFixed(0)}
                            </div>
                            <button
                                onClick={() => canIncreaseHashrate && setExtraHashrate(extraHashrate + 1)}
                                disabled={!canIncreaseHashrate}
                                className={`w-8 h-8 flex items-center justify-center bg-white rounded-full shadow font-bold transition-all ${!canIncreaseHashrate ? 'text-gray-300 cursor-not-allowed' : 'text-orange-600 active:scale-95'}`}
                            >+</button>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500">当前持有绿色算力</span>
                            {userInfoLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-500">加载中...</span>
                                </div>
                            ) : (
                                <span className={`font-mono font-bold ${isHashrateSufficient ? 'text-gray-900' : 'text-red-500'}`}>
                                    {availableHashrate.toFixed(1)}
                                </span>
                            )}
                        </div>
                        {!userInfoLoading && !isHashrateSufficient && (
                            <div className="text-xs text-red-500 flex items-center justify-end gap-1">
                                <AlertCircle size={12} />
                                算力不足，请前往【我的-算力兑换】获取
                            </div>
                        )}
                    </div>

                    {/* 申购数量部分 */}
                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-700">申购数量</span>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1}
                                className={`w-10 h-10 flex items-center justify-center bg-white rounded-full shadow font-bold text-lg transition-all ${quantity <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 active:scale-95'}`}
                            >-</button>
                            <div className="flex-1 text-center">
                                <span className="font-mono font-bold text-2xl text-gray-900">{quantity}</span>
                                <span className="text-sm text-gray-500 ml-1">份</span>
                            </div>
                            <button
                                onClick={() => setQuantity(Math.min(100, quantity + 1))}
                                disabled={quantity >= 100}
                                className={`w-10 h-10 flex items-center justify-center bg-white rounded-full shadow font-bold text-lg transition-all ${quantity >= 100 ? 'text-gray-300 cursor-not-allowed' : 'text-green-600 active:scale-95'}`}
                            >+</button>
                        </div>

                        <div className="mt-3 flex justify-between text-sm">
                            <span className="text-gray-500">单份冻结金额</span>
                            <span className="font-mono text-gray-700">¥{zoneMaxPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-500">单份算力需求</span>
                            <span className="font-mono text-gray-700">{baseHashrate + extraHashrate}</span>
                        </div>
                        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
                            <span className="text-sm font-medium text-gray-700">合计冻结金额</span>
                            <span className="font-mono font-bold text-red-600">¥{frozenAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-sm font-medium text-gray-700">合计算力需求</span>
                            <span className="font-mono font-bold text-orange-600">{totalRequiredHashrate}</span>
                        </div>

                        <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-100">
                            <div className="flex items-start gap-2">
                                <Info size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-green-700 leading-relaxed">
                                    每份预约将独立参与撮合，最多可一次申购100份
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fund Check */}
                <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                            <Wallet size={18} className="text-blue-600 fill-blue-600" />
                        </div>
                        <span>资金冻结</span>
                    </h3>

                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>需冻结专项金（该场次最高价）</span>
                        <span className="font-mono font-bold">¥{frozenAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">当前专项金余额</span>
                        {userInfoLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                <span className="text-sm text-gray-500">加载中...</span>
                            </div>
                        ) : (
                            <span className={`font-mono font-bold ${isFundSufficient ? 'text-gray-900' : 'text-red-500'}`}>
                                ¥{accountBalance.toLocaleString()}
                            </span>
                        )}
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

                    {!userInfoLoading && !isFundSufficient && (
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
                    onClick={userInfoLoading ? undefined : ((!isHashrateSufficient || !isFundSufficient) ? handleRecharge : handleReservation)}
                    disabled={userInfoLoading}
                    className={`w-full py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-[0.98] ${userInfoLoading
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                        : isHashrateSufficient && isFundSufficient
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white opacity-90'
                        }`}
                >
                    {userInfoLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            加载中...
                        </>
                    ) : (
                        !isHashrateSufficient ? '前往获取算力' : !isFundSufficient ? '前往充值专项金' : '确认预约'
                    )}
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10 shadow-2xl">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                                <Shield size={32} className="text-red-600" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-center mb-6 text-gray-900">确认提交预约</h3>

                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-100">
                                <span className="text-gray-700 text-sm font-medium">消耗算力</span>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900 font-mono text-lg">{totalRequiredHashrate.toFixed(0)}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">基础 {baseHashrate} + 加注 {extraHashrate}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border border-green-100">
                                <span className="text-gray-700 text-sm font-medium">申购数量</span>
                                <div className="font-bold text-gray-900 font-mono text-lg">{quantity} 份</div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-100">
                                <span className="text-gray-700 text-sm font-medium">冻结金额</span>
                                <div className="font-bold text-red-600 font-mono text-lg">¥{frozenAmount.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 active:scale-95 transition-all"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmSubmit}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg shadow-red-200 active:scale-95 transition-all flex justify-center items-center"
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