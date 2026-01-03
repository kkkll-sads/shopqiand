import React, { useState, useEffect } from 'react';
import { ChevronLeft, Share2, Copy, Shield, Fingerprint, Award, ExternalLink, ArrowRightLeft, Store, X, Cpu } from 'lucide-react';
import { MyCollectionItem, fetchProfile, fetchRealNameStatus, AUTH_TOKEN_KEY, fetchUserCollectionDetail, getConsignmentCheck, consignCollectionItem, getMyCollection, normalizeAssetUrl, toMining } from '../../services/api';
import { UserInfo } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { Route } from '../../router/routes';
import { LoadingSpinner } from '../../components/common';
import { isSuccess, extractData } from '../../utils/apiHelpers';
import { ConsignmentStatus } from '../../constants/statusEnums';

interface MyCollectionDetailProps {
    item: MyCollectionItem;
    onBack: () => void;
    onNavigate: (route: Route) => void;
    onSetSelectedItem: (item: MyCollectionItem) => void;
}

const MyCollectionDetail: React.FC<MyCollectionDetailProps> = ({ item: initialItem, onBack, onNavigate, onSetSelectedItem }) => {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [item, setItem] = useState<any>(initialItem);
    const [loading, setLoading] = useState<boolean>(true);
    const { showToast } = useNotification();

    // Modal state
    const [showConsignmentModal, setShowConsignmentModal] = useState(false);
    const [consignmentCheckData, setConsignmentCheckData] = useState<any>(null);
    const [consignmentTicketCount, setConsignmentTicketCount] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Fetch detail from API using correct endpoint
                const userCollectionId = initialItem.user_collection_id || initialItem.id;
                const detailRes = await fetchUserCollectionDetail(userCollectionId);
                const detailData = extractData(detailRes);
                if (detailData) {
                    setItem(detailData);
                }

                // Fetch profile
                const profileRes = await fetchProfile(token);
                const profileData = extractData(profileRes);
                let currentInfo = profileData?.userInfo || null;

                // Then fetch real name status specifically
                const realNameRes = await fetchRealNameStatus(token);
                const realNameData = extractData(realNameRes);
                if (realNameData) {
                    if (currentInfo) {
                        currentInfo = {
                            ...currentInfo,
                            real_name: realNameData.real_name || currentInfo.real_name,
                            real_name_status: realNameData.real_name_status
                        };
                    } else {
                        currentInfo = {
                            real_name: realNameData.real_name,
                            real_name_status: realNameData.real_name_status
                        } as any;
                    }
                }

                if (currentInfo) {
                    setUserInfo(currentInfo);
                }

                // Fetch consignment ticket count
                const collectionRes = await getMyCollection({ page: 1, limit: 1, token });
                const collectionData = extractData(collectionRes);
                if (collectionData) {
                    setConsignmentTicketCount((collectionData as any).consignment_coupon ?? 0);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [initialItem]);

    // Fetch consignment check when modal opens
    useEffect(() => {
        if (!showConsignmentModal) return;

        const loadCheck = async () => {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) return;

            try {
                // Try to get collection ID from item or initialItem
                const collectionId = item?.user_collection_id || item?.id || initialItem?.user_collection_id || initialItem?.id;

                if (!collectionId) {
                    console.error('Cannot load consignment check: missing collection ID', { item, initialItem });
                    setActionError('无法获取藏品ID');
                    return;
                }

                const res = await getConsignmentCheck({ user_collection_id: collectionId, token });
                setConsignmentCheckData(res?.data ?? null);
            } catch (e) {
                console.error('Failed to load consignment check:', e);
                setActionError('加载寄售检查失败');
            }
        };

        loadCheck();
    }, [showConsignmentModal, item, initialItem]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    const title = item.name || item.item_title || item.title || '未命名藏品';
    // Use market_price from API directly (禁止前端计算)
    const buyPrice = parseFloat(item.buy_price || item.price || '0');
    const marketPrice = parseFloat(item.market_price || '0');
    const currentValuation = buyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Dynamic Yield Rate
    let yieldRateStr = '0.0';
    if (buyPrice > 0) {
        yieldRateStr = ((marketPrice - buyPrice) / buyPrice * 100).toFixed(1);
    }
    const yieldRateVal = parseFloat(yieldRateStr);
    const isPositive = yieldRateVal >= 0;
    const yieldText = (isPositive ? '+' : '') + yieldRateStr + '%';

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-serif pb-24 relative overflow-hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-sm px-4 py-4 flex justify-between items-center border-b border-amber-900/5">
                <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-800">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">数字资产持有凭证</h1>
                <button className="p-2 hover:bg-black/5 rounded-full text-gray-800">
                    <Share2 size={20} />
                </button>
            </header>

            {/* Certificate Container */}
            <div className="p-5">
                <div className="bg-white relative shadow-2xl shadow-gray-200/50 rounded-sm overflow-hidden border-[6px] border-double border-amber-900/10 p-6 md:p-8">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <Shield size={200} />
                    </div>

                    {/* Top Logo Area */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-900 mb-3 border border-amber-100">
                            <Award size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-wide mb-1">数字资产持有凭证</h2>
                        <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Digital Asset Certificate</div>
                    </div>

                    {/* Certificate Fields */}
                    <div className="space-y-6 relative z-10 font-sans">
                        <div className="text-center py-6 mb-2 relative">
                            {/* Pattern Background - Guilloche Style */}
                            <div className="absolute inset-0 opacity-[0.08] pointer-events-none rounded-lg border border-amber-900/5 overflow-hidden"
                                style={{
                                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #C5A572 10px, #C5A572 11px),
                                    repeating-linear-gradient(-45deg, transparent, transparent 10px, #C5A572 10px, #C5A572 11px)`
                                }}>
                            </div>

                            {/* Line 1: Confirmation Number - 可点击复制 */}
                            <div
                                className="text-sm text-gray-600 font-[courier,monospace] font-bold tracking-widest mb-3 relative z-10 drop-shadow-sm cursor-pointer hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
                                onClick={() => {
                                    const assetCode = item.asset_code || `37-DATA-****-${String(item.id || 8821).padStart(4, '0')}`;
                                    navigator.clipboard.writeText(assetCode).then(() => {
                                        showToast('success', '确权编号已复制');
                                    }).catch(() => {
                                        showToast('error', '复制失败');
                                    });
                                }}
                            >
                                <span>确权编号：{item.asset_code || `37-DATA-****-${String(item.id || 8821).padStart(4, '0')}`}</span>
                                <Copy size={12} className="text-gray-400" />
                            </div>

                            {/* Line 2 */}
                            <h3 className="text-2xl font-extrabold text-gray-700 mb-3 font-serif tracking-tight leading-tight relative z-10 drop-shadow-sm px-2">
                                【{title}】
                            </h3>

                            {/* Stamp */}
                            <div className="absolute -right-4 -bottom-6 w-32 h-32 opacity-[0.85] -rotate-12 mix-blend-multiply z-20 pointer-events-none filter contrast-125 brightness-90">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <path id="textCircleTop" d="M 25,100 A 75,75 0 1,1 175,100" fill="none" />
                                        <filter id="roughPaper">
                                            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
                                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                                        </filter>
                                    </defs>
                                    <g filter="url(#roughPaper)" fill="#B22222" stroke="none"> {/* Darker Red #B22222 */}
                                        <circle cx="100" cy="100" r="96" fill="none" stroke="#B22222" strokeWidth="3" />
                                        <circle cx="100" cy="100" r="92" fill="none" stroke="#B22222" strokeWidth="1" />
                                        <text fontSize="14" fontWeight="bold" fontFamily="SimSun, serif" fill="#B22222">
                                            <textPath href="#textCircleTop" startOffset="50%" textAnchor="middle" spacing="auto">
                                                树交所数字资产登记结算中心
                                            </textPath>
                                        </text>
                                        <text x="100" y="100" fontSize="40" textAnchor="middle" dominantBaseline="middle" fill="#B22222">★</text>
                                        <text x="100" y="135" fontSize="18" fontWeight="bold" fontFamily="SimHei, sans-serif" textAnchor="middle" fill="#B22222">
                                            确权专用章
                                        </text>
                                        <text x="100" y="155" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="bold" textAnchor="middle" fill="#B22222" letterSpacing="1">
                                            37010299821
                                        </text>
                                    </g>
                                </svg>
                            </div>
                        </div>

                        {/* Asset Anchor Block */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                            <div className="flex items-start gap-3 mb-3">
                                <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-0.5">Asset Anchor / 资产锚定</label>
                                    <div className="text-sm font-medium text-gray-600">
                                        涉及农户/合作社：{item.farmer_info || '暂无数据'}
                                        <span className="inline-block ml-1 text-[10px] text-amber-600 border border-amber-200 px-1 rounded bg-white">隐私保护</span>
                                    </div>
                                    <div className="text-xs font-medium text-gray-600 mt-1">
                                        核心企业：{item.core_enterprise || '暂无数据'}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 leading-tight">
                                        * 根据《数据安全法》及商业保密协议，底层隐私信息已做Hash脱敏处理，仅持有人可申请解密查看。
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fingerprint Block */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Blockchain Fingerprint / 存证指纹</label>
                            <div className="bg-gray-900 text-green-500 font-mono text-[10px] p-3 rounded-t break-all leading-relaxed relative group">
                                <div className="flex items-center gap-2 mb-1 text-gray-500 font-sans font-bold">
                                    <Fingerprint size={12} />
                                    <span className="uppercase">TREE-CHAIN CONSORTIUM</span>
                                </div>
                                {item.fingerprint || item.md5 || item.tx_hash || '0x7d9a8b1c4e2f3a6b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6'}
                            </div>
                            {/* Black box buttons */}
                            <div className="bg-gray-800 rounded-b p-2 flex gap-2 border-t border-gray-700">
                                <button
                                    onClick={() => {
                                        const md5Hash = item.fingerprint || item.md5 || item.tx_hash || '0x7d9a8b1c4e2f3a6b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6';
                                        navigator.clipboard.writeText(md5Hash).then(() => {
                                            showToast('success', '已复制MD5指纹');
                                        }).catch(() => {
                                            showToast('error', '复制失败');
                                        });
                                    }}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Copy size={10} />
                                    复制Hash
                                </button>
                                <button
                                    onClick={() => {
                                        // 使用MD5指纹进行查证，不使用脱敏的确权编号，避免查询错误
                                        const md5Fingerprint = item.fingerprint || item.md5 || item.tx_hash || '';
                                        if (!md5Fingerprint) {
                                            showToast('error', '无法获取MD5指纹');
                                            return;
                                        }
                                        onNavigate({ name: 'search', code: md5Fingerprint });
                                    }}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                                >
                                    <ExternalLink size={10} />
                                    去查证
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions - 已售出的藏品不显示 */}
            {(() => {
                // 判断是否已售出：检查多个条件
                const consignmentStatus = Number(item.consignment_status);
                const statusText = item.status_text || '';
                const consignmentStatusText = item.consignment_status_text || '';
                
                // API注释说 2=已售出，枚举定义 SOLD=4，实际可能两者都有
                const isSold = consignmentStatus === 2 || 
                               consignmentStatus === ConsignmentStatus.SOLD || 
                               consignmentStatusText === '已售出' || 
                               consignmentStatusText.includes('已售出') ||
                               statusText === '已售出' ||
                               statusText.includes('已售出');
                
                return !isSold;
            })() && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-[9999] pointer-events-auto">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <span className="text-sm text-gray-500 font-medium">当前估值</span>
                        <div className="text-right">
                            <span className="text-lg font-bold text-gray-700 font-mono">¥{currentValuation}</span>
                            <span className={`text-xs font-bold ml-2 px-1.5 py-0.5 rounded-full ${isPositive ? 'text-red-500 bg-red-50' : 'text-green-500 bg-green-50'}`}>{yieldText}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => {
                                if (window.confirm('确认将此藏品转为矿机吗？转为矿机后将产生算力收益，但不可再进行寄售。')) {
                                    const token = localStorage.getItem(AUTH_TOKEN_KEY);
                                    if (!token) {
                                        showToast('warning', '请登录');
                                        return;
                                    }
                                    const collectionId = item?.user_collection_id || item?.id || initialItem?.user_collection_id || initialItem?.id;
                                    if (!collectionId) {
                                        showToast('error', '无法获取藏品ID');
                                        return;
                                    }

                                    setActionLoading(true);
                                    toMining({ user_collection_id: Number(collectionId), token })
                                        .then(res => {
                                            if (isSuccess(res)) {
                                                showToast('success', '转换成功', '藏品已成功转为矿机');
                                                setTimeout(() => onNavigate({ name: 'my-collection' }), 1000);
                                            } else {
                                                showToast('error', '转换失败', res.msg || '操作失败');
                                            }
                                        })
                                        .catch(err => {
                                            showToast('error', '转换失败', err.message || '系统错误');
                                        })
                                        .finally(() => {
                                            setActionLoading(false);
                                        });
                                }
                            }}
                            className="flex-1 bg-gray-500 text-white hover:bg-gray-600 transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-500/20 active:scale-[0.98] pointer-events-auto touch-manipulation">
                            <Cpu size={18} />
                            转为矿机(权益交割)
                        </button>
                        <button
                            onClick={() => {
                                setShowConsignmentModal(true);
                                setActionError(null);
                            }}
                            className="flex-1 bg-[#8B0000] text-amber-100 hover:bg-[#A00000] transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-[0.98] pointer-events-auto touch-manipulation">
                            <Store size={18} />
                            立即上架寄售
                        </button>
                    </div>
                </div>
            )}

            {/* Consignment Modal */}
            {showConsignmentModal && (
                <div
                    className="fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setShowConsignmentModal(false)}
                >
                    <div
                        className="bg-[#F9F9F9] rounded-xl overflow-hidden max-w-sm w-full relative shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-gray-100">
                            <div className="text-base font-bold text-gray-900">资产挂牌委托</div>
                            <button
                                type="button"
                                className="p-1 text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
                                onClick={() => setShowConsignmentModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Asset Card */}
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex gap-3 mb-3">
                                    <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                        <img
                                            src={normalizeAssetUrl(item.item_image || item.image || '')}
                                            alt={item.item_title || item.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.visibility = 'hidden';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-900 mb-1 truncate">
                                            {item.item_title || item.title}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono truncate bg-gray-50 inline-block px-1.5 py-0.5 rounded">
                                            确权编号：{item.asset_code || item.order_no || 'Pending...'}
                                        </div>
                                    </div>
                                </div>

                                {/* Price Info */}
                                {(() => {
                                    // Price Fallback Logic
                                    const rawBuyPrice = item.buy_price || item.price || '0';
                                    const safeBuyPrice = parseFloat(String(rawBuyPrice)) || 0;

                                    const rawMarketPrice = item.market_price || '0';
                                    const safeMarketPrice = parseFloat(String(rawMarketPrice)) || 0;

                                    // 优先使用API返回的expected_profit字段，否则计算得出
                                    let dynamicYieldStr = '0.0';
                                    if (item.expected_profit !== undefined && item.expected_profit !== null) {
                                        // 直接使用API返回的预期收益百分比
                                        dynamicYieldStr = String(item.expected_profit);
                                    } else if (safeBuyPrice > 0) {
                                        // Fallback: 手动计算收益百分比
                                        dynamicYieldStr = ((safeMarketPrice - safeBuyPrice) / safeBuyPrice * 100).toFixed(1);
                                    }
                                    const isPos = parseFloat(dynamicYieldStr) >= 0;

                                    return (
                                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-dashed border-gray-100">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400 mb-1">当前估值</span>
                                                <span className="text-sm font-bold text-gray-900">¥{safeBuyPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400 mb-1">预期收益</span>
                                                <span className={`text-sm font-bold ${isPos ? 'text-red-500' : 'text-green-600'}`}>
                                                    {(isPos ? '+' : '') + dynamicYieldStr + '%'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400 mb-1">预期回款</span>
                                                <span className="text-sm font-bold text-gray-900">¥{safeMarketPrice.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Unlock Status */}
                            {consignmentCheckData && (() => {
                                const isUnlocked = consignmentCheckData.can_consign === true ||
                                    consignmentCheckData.unlocked === true ||
                                    (consignmentCheckData.remaining_seconds && consignmentCheckData.remaining_seconds <= 0);

                                if (!isUnlocked) {
                                    return (
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                            <div className="text-sm text-orange-700 font-medium mb-1">⏰ T+1 解锁倒计时</div>
                                            <div className="text-xs text-orange-600">
                                                {consignmentCheckData.remaining_text || '计算中...'}
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="text-sm text-green-700 font-medium">✓ 已解锁，可申请寄售</div>
                                    </div>
                                );
                            })()}

                            {/* Cost Breakdown */}
                            {(() => {
                                const safePrice = parseFloat(String(item.market_price || item.price || '0')) || 0;
                                const serviceFee = safePrice * 0.03;

                                return (
                                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                                        <div className="text-sm font-bold text-gray-700 mb-3">挂牌成本核算</div>

                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <div className="text-sm font-medium text-gray-700">确权技术服务费 (3%)</div>
                                                <div className="text-xs text-gray-400 mt-0.5">当前余额: ¥{userInfo?.service_fee_balance || '0'}</div>
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">{serviceFee.toFixed(2)} 元</div>
                                        </div>

                                        <div className="w-full h-px bg-gray-50" />

                                        <div className="flex justify-between items-center mt-3">
                                            <div>
                                                <div className="text-sm font-medium text-gray-700">资产流转券</div>
                                                <div className="text-xs text-gray-400 mt-0.5">持有数量: {consignmentTicketCount} 张</div>
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">1 张</div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Error Message */}
                            {actionError && (
                                <div className="text-xs text-red-600 text-center bg-red-50 py-2 rounded-lg">
                                    {actionError}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={async () => {
                                    const token = localStorage.getItem(AUTH_TOKEN_KEY);
                                    if (!token) {
                                        showToast('warning', '请登录');
                                        return;
                                    }

                                    // Check unlock status
                                    const isUnlocked = consignmentCheckData?.can_consign === true ||
                                        consignmentCheckData?.unlocked === true ||
                                        (consignmentCheckData?.remaining_seconds && consignmentCheckData.remaining_seconds <= 0);

                                    if (!isUnlocked) {
                                        showToast('warning', '时间未到', '寄售需要满足购买后48小时');
                                        return;
                                    }

                                    // 移除前端寄售券验证，让后端处理并返回错误信息

                                    setActionLoading(true);
                                    setActionError(null);

                                    try {
                                        // Try to get collection ID from item or initialItem
                                        const collectionId = item?.user_collection_id || item?.id || initialItem?.user_collection_id || initialItem?.id;

                                        if (!collectionId) {
                                            setActionError('无法获取藏品ID，请返回重试');
                                            setActionLoading(false);
                                            return;
                                        }

                                        const priceValue = parseFloat(item.price || '0');

                                        const res = await consignCollectionItem({
                                            user_collection_id: collectionId,
                                            price: priceValue,
                                            token,
                                        });

                                        if (isSuccess(res)) {
                                            showToast('success', '提交成功', res.msg || '寄售申请已提交');
                                            setShowConsignmentModal(false);
                                            // Refresh or go back
                                            setTimeout(() => onNavigate({ name: 'my-collection' }), 1000);
                                        } else {
                                            const errorMsg = res.msg || res.message || '寄售申请失败';
                                            setActionError(errorMsg);
                                            showToast('error', '操作失败', errorMsg);
                                        }
                                    } catch (err: any) {
                                        const errorMsg = err?.msg || err?.message || '寄售申请失败';
                                        setActionError(errorMsg);
                                        showToast('error', '提交失败', errorMsg);
                                    } finally {
                                        setActionLoading(false);
                                    }
                                }}
                                disabled={actionLoading}
                                className={`w-full py-3.5 rounded-lg font-bold text-white transition-all ${actionLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#8B0000] to-[#A00000] hover:shadow-lg active:scale-[0.98]'
                                    }`}
                            >
                                {actionLoading ? '提交中...' : '确认挂牌'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCollectionDetail;
