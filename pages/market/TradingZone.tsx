
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Globe, Database, Zap, Cpu, Activity, Lock, ArrowRight, ArrowLeft, Layers, Gem, Crown, Coins, TrendingUp, ClipboardList } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner, LazyImage } from '../../components/common';
import { Product } from '../../types';
import { Route } from '../../router/routes';
import {
    fetchCollectionSessions,
    fetchCollectionSessionDetail,
    fetchCollectionItemsBySession,
    CollectionSessionItem,
    CollectionItem,
} from '../../services/api';
import { isSuccess, extractError } from '../../utils/apiHelpers';
import { useErrorHandler } from '../../hooks/useErrorHandler';


interface TradingZoneProps {
    onBack: () => void;
    onProductSelect?: (product: Product) => void;
    onNavigate?: (route: Route) => void;
    // 用于从路由恢复状态
    initialSessionId?: string;
    initialSessionTitle?: string;
    initialSessionStartTime?: string;
    initialSessionEndTime?: string;
}

interface TradingSession {
    id: string;
    title: string;
    image: string;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    isActive?: boolean; // 接口返回的 is_active，用于优先判定状态
}

type TradingDisplayItem = CollectionItem & {
    source?: 'collection' | 'consignment' | 'mixed'; // mixed 表示包含官方+寄售
    consignment_id?: number;
    displayKey: string;
    hasStockInfo?: boolean;
    // 新 API 字段
    package_name?: string;
    official_stock?: number;      // 官方库存
    consignment_count?: number;   // 寄售数量
    total_available?: number;     // 总可用
    min_price?: number;
    max_price?: number;
    price_range?: string;
    consignment_list?: Array<{
        consignment_id: number;
        price: number;
        seller_id: number;
    }>;
};

// 视觉主题预设（结合 /api/collectionSession/index 返回的专场标题与时间）
const POOL_THEME_PRESETS: Record<string, any> = {
    morning: {
        code: 'Pool-A',
        name: '数字鲁商资产池',
        subName: '山东产业带数字化营销权益',
        roi: '+5.5%',
        quota: '100万',
        icon: Globe,
        themeColor: 'text-blue-600',
        gradient: 'from-blue-600 to-cyan-500',
        softBg: 'bg-blue-50',
        dataBg: 'bg-[#F0F7FF]',
        buttonClass: 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-200',
    },
    afternoon: {
        code: 'Pool-B',
        name: '助农供应链资产池',
        subName: '优质果蔬集群应收账款确权',
        roi: '+8.2%',
        quota: '500万',
        icon: Coins,
        themeColor: 'text-orange-600',
        gradient: 'from-orange-500 to-red-500',
        softBg: 'bg-orange-50',
        dataBg: 'bg-[#FFF7F0]',
        buttonClass: 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-200',
    },
    evening: {
        code: 'Pool-C',
        name: '林业碳汇权益池',
        subName: '林业碳汇数据资产映射',
        roi: '+12.0%',
        quota: '200万',
        icon: Gem,
        themeColor: 'text-emerald-600',
        gradient: 'from-emerald-600 to-teal-600',
        softBg: 'bg-emerald-50',
        dataBg: 'bg-[#F0FDF4]',
        buttonClass: 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-emerald-200',
    },
    default: {
        code: 'D-Asset',
        name: '新手体验试炼场',
        subName: '虚拟资产确权体验专区',
        roi: '+3.0%',
        quota: '不限',
        icon: Crown,
        themeColor: 'text-purple-600',
        gradient: 'from-purple-600 to-pink-500',
        softBg: 'bg-purple-50',
        dataBg: 'bg-[#FAF5FF]',
        buttonClass: 'bg-gradient-to-r from-purple-600 to-pink-500 shadow-purple-200',
    }
};

const getPoolType = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 9 && hour < 12) return 'morning';
    if (hour >= 13 && hour < 16) return 'afternoon';
    if (hour >= 18 && hour < 21) return 'evening';
    return 'default';
};

// 将接口数据（title、时间段）与视觉预设融合
const buildPoolConfig = (session?: TradingSession | null) => {
    const poolType = session ? getPoolType(session.startTime) : 'default';
    const preset = POOL_THEME_PRESETS[poolType] || POOL_THEME_PRESETS.default;
    return {
        ...preset,
        name: session?.title || preset.name,
        subName: session ? `${session.startTime} - ${session.endTime}` : preset.subName,
        // 使用API返回的动态数据覆盖预设值
        roi: (session as any)?.roi || preset.roi,
        quota: (session as any)?.quota || preset.quota,
        code: (session as any)?.code || preset.code,
    };
};

const TradingZone: React.FC<TradingZoneProps> = ({
    onBack,
    onProductSelect,
    onNavigate,
    initialSessionId,
    initialSessionTitle,
    initialSessionStartTime,
    initialSessionEndTime
}) => {
    // ✅ 使用统一错误处理Hook（会话加载错误）
    const {
        errorMessage: sessionErrorMessage,
        hasError: hasSessionError,
        handleError: handleSessionError,
        clearError: clearSessionError
    } = useErrorHandler();

    // ✅ 使用统一错误处理Hook（商品加载错误）
    const {
        errorMessage: itemsErrorMessage,
        hasError: hasItemsError,
        handleError: handleItemsError,
        clearError: clearItemsError
    } = useErrorHandler();

    const [now, setNow] = useState(new Date());
    const [selectedSession, setSelectedSession] = useState<TradingSession | null>(null);
    const [sessions, setSessions] = useState<TradingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'preview' | 'active' | 'closed'>('preview');
    const [tradingItems, setTradingItems] = useState<TradingDisplayItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [activePriceZone, setActivePriceZone] = useState<string>('all');
    const [navigating, setNavigating] = useState(false);

    // 使用ref追踪加载状态，防止重复调用
    const loadingSessionRef = useRef<string | null>(null);

    // 缓存会话状态，避免每次渲染重新计算
    const sessionStatusesRef = useRef<Map<string, { status: 'active' | 'waiting' | 'ended'; target: Date | null }>>(new Map());

    // 内部函数：加载场次商品（不触发导航）
    const loadSessionItems = useCallback(async (session: TradingSession) => {
        // 防止重复加载同一个session
        if (loadingSessionRef.current === session.id) {
            console.log('Session already loading, skipping:', session.id);
            return;
        }

        try {
            loadingSessionRef.current = session.id;
            setItemsLoading(true);
            clearItemsError();

            // 获取商品列表（新 API：官方+寄售按 package_name + zone_id 统一归类）
            const response = await fetchCollectionItemsBySession(session.id, { page: 1, limit: 10 });

            console.log('API Response:', response);
            console.log('Items list:', response.data?.list);

            if (isSuccess(response) && response.data?.list) {
                const allItems = response.data.list.map((item: any) => {
                    // 新 API 结构：每条记录代表一个 package_name + zone_id 的归类
                    const hasConsignment = item.consignment_count > 0 || (item.consignment_list && item.consignment_list.length > 0);
                    const hasOfficial = item.official_stock > 0 || item.stock > 0;

                    // 确定来源类型
                    let source: 'collection' | 'consignment' | 'mixed' = 'collection';
                    if (hasConsignment && hasOfficial) {
                        source = 'mixed';
                    } else if (hasConsignment) {
                        source = 'consignment';
                    }

                    // 价格计算：直接使用 API 返回的价格
                    const displayPrice = Number(item.price || item.min_price || 0);

                    // 总可用数量
                    const totalAvailable = item.total_available ?? ((item.official_stock || 0) + (item.consignment_count || 0));

                    console.log('Processing item:', item.id || item.package_name, {
                        official_stock: item.official_stock,
                        consignment_count: item.consignment_count,
                        total_available: totalAvailable,
                        price_range: item.price_range,
                        source
                    });

                    return {
                        ...item,
                        // 使用分区价格作为显示价格
                        price: displayPrice,
                        // 兼容新旧 API
                        stock: totalAvailable,
                        official_stock: item.official_stock || item.stock || 0,
                        consignment_count: item.consignment_count || 0,
                        total_available: totalAvailable,
                        package_name: item.package_name || item.title,
                        // 唯一标识
                        displayKey: `pkg-${item.zone_id || item.id}-${item.package_name || item.id}`,
                        source,
                        // 有总库存信息时显示
                        hasStockInfo: totalAvailable > 0
                    } as TradingDisplayItem;
                });

                console.log('Processed items:', allItems.map(item => ({
                    id: item.id,
                    package_name: item.package_name,
                    source: item.source,
                    official_stock: item.official_stock,
                    consignment_count: item.consignment_count
                })));

                if (allItems.length > 0) {
                    setTradingItems(allItems);
                } else {
                    handleItemsError('暂无上链资产', { persist: true, showToast: false });
                }
            } else {
                handleItemsError('暂无上链资产', { persist: true, showToast: false });
            }

            setSelectedSession(session);
        } catch (err: any) {
            // ✅ 使用统一错误处理
            handleItemsError(err, {
                persist: true,
                showToast: false,
                customMessage: '数据同步延迟，请重试',
                context: { sessionId: session.id }
            });
            setSelectedSession(session);
        } finally {
            loadingSessionRef.current = null;
            setItemsLoading(false);
        }
    }, []); // 空依赖数组，函数不依赖外部变量

    useEffect(() => {
        console.log('TradingZone mounted/updated with sessionId:', initialSessionId);
        const loadSessions = async () => {
            try {
                setLoading(true);
                clearSessionError();
                const response = await fetchCollectionSessions();
                if (isSuccess(response) && response.data?.list) {
                    const sessionList: TradingSession[] = response.data.list.map((item: CollectionSessionItem) => ({
                        id: String(item.id),
                        title: item.title,
                        image: item.image,
                        startTime: item.start_time,
                        endTime: item.end_time,
                        isActive: !!(item as any)?.is_active,
                        // 保留API返回的其他字段用于动态配置
                        ...(item as any),
                    }));
                    setSessions(sessionList);

                    // 如果有初始 sessionId，自动选中该场次
                    if (initialSessionId) {
                        const matchedSession = sessionList.find(s => s.id === initialSessionId);
                        if (matchedSession) {
                            // 自动加载该场次的商品
                            loadSessionItems(matchedSession);
                        } else if (initialSessionTitle) {
                            // 如果没找到匹配的场次但有标题信息，创建一个临时 session 对象
                            const tempSession: TradingSession = {
                                id: initialSessionId,
                                title: initialSessionTitle,
                                image: '',
                                startTime: initialSessionStartTime || '',
                                endTime: initialSessionEndTime || '',
                            };
                            loadSessionItems(tempSession);
                        }
                    }
                } else {
                    // ✅ 使用统一错误处理
                    handleSessionError(response, {
                        persist: true,
                        showToast: false,
                        customMessage: '获取数据资产池失败'
                    });
                }
            } catch (err: any) {
                // ✅ 使用统一错误处理
                handleSessionError(err, {
                    persist: true,
                    showToast: false,
                    customMessage: '网络连接异常'
                });
            } finally {
                setLoading(false);
            }
        };
        loadSessions();
    }, [initialSessionId, initialSessionTitle, initialSessionStartTime, initialSessionEndTime, loadSessionItems]);

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
            // 每秒清空会话状态缓存，确保状态及时更新
            sessionStatusesRef.current.clear();
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleBack = () => {
        if (selectedSession) {
            // 如果是从路由参数进入的，返回到 trading-zone
            if (initialSessionId) {
                onBack();
            } else {
                setSelectedSession(null);
                setTradingItems([]);
                clearItemsError();
            }
        } else {
            onBack();
        }
    };

    // 外部点击场次时的处理：直接在组件内切换到详情页，避免路由跳转导致的卡顿
    const handleSessionSelect = useCallback(async (session: TradingSession) => {
        if (navigating) return; // 防止重复点击

        setNavigating(true);
        try {
            // 直接设置选中的场次并加载商品数据，避免路由跳转
            setSelectedSession(session);
            await loadSessionItems(session);
        } finally {
            // 短暂延迟后重置导航状态，避免快速重复点击
            setTimeout(() => setNavigating(false), 500);
        }
    }, [navigating, loadSessionItems]);

    const getSessionStatus = (session: TradingSession) => {
        // 检查缓存
        const cached = sessionStatusesRef.current.get(session.id);
        if (cached) {
            return cached;
        }

        const [startH, startM] = session.startTime.split(':').map(Number);
        const [endH, endM] = session.endTime.split(':').map(Number);
        const startDate = new Date(now); startDate.setHours(startH, startM, 0, 0);
        const endDate = new Date(now); endDate.setHours(endH, endM, 0, 0);

        let status: 'active' | 'waiting' | 'ended';
        let target: Date | null = null;

        // 时间优先：超过结束时间立刻关闭入口
        if (now >= endDate) {
            status = 'ended';
        } else if (session.isActive || (now >= startDate && now < endDate)) {
            // 活跃中：后端 isActive 或者在时间窗口内
            status = 'active';
            target = endDate;
        } else if (now < startDate) {
            // 等待中
            status = 'waiting';
            target = startDate;
        } else {
            status = 'ended';
        }

        const result = { status, target };
        sessionStatusesRef.current.set(session.id, result);
        return result;
    };

    const formatDuration = (ms: number) => {
        if (ms < 0) return "00:00:00";
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // 1. 详情页渲染
    if (selectedSession) {
        const config = buildPoolConfig(selectedSession);
        const { status, target } = getSessionStatus(selectedSession);

        return (
            <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans pb-safe">
                {/* 顶部背景渐变 */}
                <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#FFE4C4] via-[#FFF0E0] to-[#F8F9FA] z-0" />

                {/* 内容区域 */}
                <div className="relative z-10 p-5">
                    {/* 顶部导航 */}
                    <div className="flex justify-between items-center mb-6">
                        <button type="button" onClick={handleBack} className="p-2 bg-white/60 backdrop-blur rounded-full shadow-sm hover:bg-white transition-all text-gray-700">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="text-xs font-bold text-gray-500/50 font-serif tracking-widest uppercase"></div>
                    </div>

                    {/* 头部大标题卡片 */}
                    <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/60 mb-8 border border-white/60 relative overflow-hidden ring-1 ring-gray-50">
                        {/* 装饰圆环 */}
                        <div className={`absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 ${config.softBg}`}></div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${config.softBg} ${config.themeColor} mb-3 inline-block shadow-sm`}>
                                    {config.code}
                                </span>
                                <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1 tracking-tight">{config.name}</h1>
                                <p className="text-sm text-gray-500 font-medium">{config.subName}</p>
                            </div>
                            <div className={`p-4 rounded-2xl ${config.softBg} ${config.themeColor} shadow-inner`}>
                                <config.icon size={28} />
                            </div>
                        </div>

                        {/* 核心指标区域 - 移除英文标签，保留纯中文提示 */}
                        <div className={`relative z-10 flex items-stretch rounded-2xl ${config.dataBg} p-4 mb-5 border border-black/[0.02]`}>
                            <div className="flex-1">
                                <div className="text-xs text-gray-500 font-bold mb-1">预期收益率</div>
                                <div className={`text-2xl font-black ${config.themeColor} tracking-tight leading-none pt-1`}>
                                    {config.roi}
                                </div>
                            </div>
                            <div className="w-px bg-black/[0.06] mx-4 self-center h-8"></div>
                            <div className="flex-1">
                                <div className="text-xs text-gray-500 font-bold mb-1">本期额度</div>
                                <div className="text-lg font-extrabold text-gray-700 leading-none pt-1">
                                    {config.quota}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 列表头部 */}
                    <div className="flex items-center justify-between mb-5 px-2">
                        <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-1 h-5 rounded-full bg-orange-500"></span>
                            <span>资产申购列表</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {onNavigate && (
                                <button
                                    type="button"
                                    onClick={() => onNavigate({ name: 'reservation-record', back: { name: 'trading-zone' } })}
                                    className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-100 active:scale-95 transition-transform"
                                >
                                    <ClipboardList size={14} />
                                    <span>申购记录</span>
                                </button>
                            )}
                            {status === 'active' && target && (
                                <div className="text-xs font-mono text-white bg-red-500 px-3 py-1.5 rounded-full shadow-md shadow-red-200 flex items-center gap-1.5 animate-pulse">
                                    <Clock size={12} />
                                    <span className="font-bold tracking-wide">{formatDuration(target.getTime() - now.getTime())}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Price Partition Filters */}
                    <div className="flex gap-2 mb-5 px-2 overflow-x-auto pb-1 scrollbar-none">
                        {(() => {
                            // Extract unique price zones from items
                            const priceZones = ['all', ...Array.from(new Set(
                                tradingItems
                                    .map(item => item.price_zone)
                                    .filter(zone => zone) // Filter out undefined/null
                            ))];

                            return priceZones.map((zone) => (
                                <button
                                    type="button"
                                    key={zone}
                                    onClick={() => setActivePriceZone(zone)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activePriceZone === zone
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                                        : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                        }`}
                                >
                                    {zone === 'all' ? '全部' : zone}
                                </button>
                            ));
                        })()}
                    </div>

                    {/* 列表内容 */}
                    {itemsLoading ? (
                        <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                    ) : hasItemsError ? (
                        <div className="py-12 text-center text-gray-400 text-sm">{itemsErrorMessage}</div>
                    ) : tradingItems.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">暂无资产</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {tradingItems
                                .filter(item => {
                                    // Filter by price zone using the backend field
                                    if (activePriceZone === 'all') return true;
                                    return item.price_zone === activePriceZone;
                                })
                                .map((item) => (
                                    <div
                                        key={item.displayKey}
                                        className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all active:scale-[0.98] group"
                                        onClick={() => {
                                            console.log('Clicking item:', {
                                                id: item.id,
                                                source: item.source,
                                                consignment_id: item.consignment_id,
                                                is_consignment: item.is_consignment
                                            });

                                            const productData = {
                                                id: String(item.id),
                                                title: item.title,
                                                price: item.price,
                                                image: item.image,
                                                artist: config.name,
                                                category: 'Data Asset',
                                                productType: 'collection',
                                                sessionId: selectedSession?.id || item.session_id,
                                                zoneId: item.zone_id || item.price_zone_id,
                                                // 为寄售商品设置consignmentId
                                                ...(item.source === 'consignment' && item.consignment_id
                                                    ? { consignmentId: item.consignment_id }
                                                    : {})
                                            };

                                            console.log('Product data to pass:', productData);

                                            // 如果当前在详情页（有 selectedSession），传递自定义返回路由回到该详情页
                                            const customBackRoute = selectedSession ? {
                                              name: 'trading-zone-items' as const,
                                              sessionId: selectedSession.id,
                                              sessionTitle: selectedSession.title,
                                              sessionStartTime: selectedSession.startTime,
                                              sessionEndTime: selectedSession.endTime,
                                            } : undefined;

                                            onProductSelect && onProductSelect(productData as Product, 'trading-zone', customBackRoute);
                                        }}
                                    >
                                        <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                            <LazyImage src={item.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm border border-white/20">
                                                ID.{item.id}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-gray-900 text-sm font-bold line-clamp-1 mb-1">{item.title}</h3>
                                            <div className="text-[10px] text-gray-400 font-mono mb-2">
                                                {item.price_zone && (
                                                    <span className="inline-block px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded">{item.price_zone}</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-red-500 font-extrabold text-base flex items-baseline gap-0.5">
                                                    <span>{item.price_zone}</span>
                                                </div>
                                                <button type="button" className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md shadow-orange-200 active:scale-95 transition-transform">
                                                    申购
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 2. 列表页渲染 (主界面)
    return (
        <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans pb-safe">
            {/* 顶部背景渐变 */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#FFE4C4] via-[#FFF0E0] to-[#F8F9FA] z-0" />

            {/* 顶部导航区 */}
            <div className="relative z-10 px-5 pt-4 pb-2 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={handleBack} className="p-2 -ml-2 text-gray-700 active:bg-black/5 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="font-bold text-xl text-gray-900 tracking-tight">资产交易</h1>
                </div>
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-white/60">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-100"></div>
                    <span className="text-xs font-bold text-gray-700 font-sans tracking-wide">LIVE</span>
                </div>
            </div>

            {/* 滚动列表 */}
            <div className="relative z-10 p-5 space-y-6"> {/* 增加间距 space-y-6 */}
                {loading ? (
                    <div className="mt-20"><LoadingSpinner /></div>
                ) : hasSessionError ? (
                    <div className="mt-20 text-center text-red-500 text-sm">{sessionErrorMessage}</div>
                ) : sessions.map(session => {
                    const config = buildPoolConfig(session);
                    const { status, target } = getSessionStatus(session);

                    return (
                        <div
                            key={session.id}
                            className="bg-white rounded-[28px] p-6 shadow-[0_12px_24px_rgb(0,0,0,0.06)] border border-white relative overflow-hidden transition-all duration-300 active:scale-[0.99]"
                        >
                            {/* 水印图标 - 仅装饰，放在最底层 */}
                            <div className={`absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none`}>
                                <config.icon size={180} />
                            </div>

                            {/* 1. 头部区域：标签 + 标题 + 状态 */}
                            <div className="relative z-10 flex justify-between items-start mb-6">
                                <div>
                                    {/* 胶囊标签 */}
                                    <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.softBg} ${config.themeColor} mb-2.5 border border-transparent`}>
                                        {config.code}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 leading-none mb-2">{config.name}</h2>
                                    <p className="text-xs text-gray-400 font-medium">{config.subName}</p>
                                </div>

                                {/* 状态胶囊 */}
                                {/* 状态显示优化：抢购中状态增强视觉冲击力 */}
                                {status === 'active' ? (
                                    <div className="flex flex-col items-end">
                                        {/* 抢购中状态 - 红色高亮脉冲效果 */}
                                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 mb-2 shadow-lg shadow-red-200 animate-[pulse_2s_infinite]">
                                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                            <span className="animate-bounce">🔥</span> 正在抢购
                                        </span>
                                        {/* 倒计时 - 放大字号，增加紧迫感 */}
                                        {target && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-red-500 font-bold mb-0.5">距结束仅剩</span>
                                                <span className="font-mono text-2xl font-black text-red-600 tracking-tighter tabular-nums drop-shadow-sm">
                                                    {formatDuration(target.getTime() - now.getTime())}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border ${status === 'waiting' ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                        {status === 'waiting' ? '即将开始' : '已结束'}
                                    </span>
                                )}
                            </div>

                            {/* 2. 数据展示区 - 移除英文标签 */}
                            <div className={`relative z-10 flex items-stretch rounded-2xl ${config.dataBg} p-4 mb-5 border border-black/[0.02]`}>
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 font-bold mb-1">预期收益率</div>
                                    <div className={`text-2xl font-black ${config.themeColor} tracking-tight leading-none pt-1`}>
                                        {config.roi}
                                    </div>
                                </div>
                                <div className="w-px bg-black/[0.06] mx-4 self-center h-8"></div>
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 font-bold mb-1">本期额度</div>
                                    <div className="text-lg font-extrabold text-gray-700 leading-none pt-1">
                                        {config.quota}
                                    </div>
                                </div>
                            </div>

                            {/* 3. 底部区域：全宽强按钮 */}
                            <div className="relative z-10">
                                <button
                                    type="button"
                                    onClick={() => status === 'active' && handleSessionSelect(session)}
                                    disabled={status !== 'active' || navigating}
                                    className={`w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]
                           ${status === 'active' && !navigating
                                            ? `${config.buttonClass} text-white`
                                            : 'bg-gray-100 text-gray-400 border border-gray-200 shadow-none cursor-not-allowed'
                                        }`}
                                >
                                    {navigating
                                        ? '跳转中...'
                                        : status === 'active'
                                            ? '立即抢购 · ACCESS'
                                            : status === 'waiting'
                                                ? '即将开始 · COMING SOON'
                                                : '本场结束 · CLOSED'
                                    }
                                    {status === 'active' && !navigating && <ArrowRight size={16} />}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TradingZone;
