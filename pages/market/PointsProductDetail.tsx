import React, { useState, useEffect } from 'react';
import { LoadingSpinner, LazyImage } from '../../components/common';
import { Product } from '../../types';
import { fetchShopProductDetail, ShopProductDetailData, createOrder, buyShopOrder, fetchAddressList, AddressItem, fetchShopProductShare, ShopProductShareData } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { AUTH_TOKEN_KEY } from '../../constants/storageKeys';
import { Route } from '../../router/routes';
import { Share2, Copy, X, Check } from 'lucide-react';
import { isSuccess, extractError } from '../../utils/apiHelpers';

interface PointsProductDetailProps {
    product: Product;
    onBack: () => void;
    onNavigate: (route: Route) => void;
}

const PointsProductDetail: React.FC<PointsProductDetailProps> = ({ product, onBack, onNavigate }) => {
    const { showToast, showDialog } = useNotification();
    const [detailData, setDetailData] = useState<ShopProductDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Share State
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareData, setShareData] = useState<ShopProductShareData | null>(null);
    const [loadingShare, setLoadingShare] = useState(false);

    // Purchase & Address State
    const [submitting, setSubmitting] = useState(false);
    const [showSpecModal, setShowSpecModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [addresses, setAddresses] = useState<AddressItem[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null);
    const [showAddressPicker, setShowAddressPicker] = useState(false);

    // Purchase Config
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        loadDetail();
        loadAddresses();
    }, [product.id]);

    const loadDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchShopProductDetail(product.id);
            if (isSuccess(response) && response.data) {
                setDetailData(response.data);
            } else {
                setError(extractError(response, '获取商品详情失败'));
            }
        } catch (err) {
            setError('网络请求失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const loadAddresses = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
            if (!token) return;

            const response = await fetchAddressList(token);
            if (isSuccess(response) && response.data?.list) {
                setAddresses(response.data.list);
                const defaultAddr = response.data.list.find(a => Number(a.is_default) === 1) || response.data.list[0];
                if (defaultAddr) setSelectedAddress(defaultAddr);
            }
        } catch (e) {
            console.error('Load addresses failed', e);
        }
    };

    const handleShareClick = async () => {
        try {
            setLoadingShare(true);
            const response = await fetchShopProductShare(product.id);
            if (isSuccess(response) && response.data) {
                setShareData(response.data);
                setShowShareModal(true);
            } else {
                showToast('error', extractError(response, '获取分享信息失败'));
            }
        } catch (e) {
            showToast('error', '网络请求失败');
        } finally {
            setLoadingShare(false);
        }
    };

    const handleCopyLink = () => {
        if (shareData?.share_url) {
            navigator.clipboard.writeText(shareData.share_url).then(() => {
                showToast('success', '链接已复制');
            }).catch(() => {
                showToast('error', '复制失败');
            });
        }
    };

    const isScoreProduct = !!detailData?.score_price;
    const maxStock = detailData?.stock || 0;

    // Step 1: Open Spec Modal
    const handleExchangeClick = () => {
        setQuantity(1); // Reset quantity
        setShowSpecModal(true);
    };

    // Step 2: Confirm Spec -> Open Confirm Order Modal
    const handleSpecConfirm = () => {
        // Validation
        if (quantity > maxStock) {
            showToast('error', '库存不足');
            return;
        }

        setShowSpecModal(false);

        // Check address before showing confirm modal
        if (addresses.length === 0) {
            showDialog({
                title: '温馨提示',
                description: '您还没有设置收货地址，请先添加地址',
                confirmText: '去添加',
                cancelText: '取消',
                onConfirm: () => onNavigate({ name: 'address-list', back: { name: 'points-product-detail' } })
            });
            return;
        }

        setShowConfirmModal(true);
    };

    // Step 3: Submit Order -> Navigate to Cashier
    const handleSubmitOrder = async () => {
        if (submitting) return;
        if (!selectedAddress) {
            showToast('error', '请选择收货地址');
            return;
        }

        try {
            setSubmitting(true);
            // Call buyShopOrder instead of createOrder
            const response = await buyShopOrder({
                items: [{ product_id: Number(product.id), quantity: quantity }],
                pay_type: isScoreProduct ? 'score' : 'money',
                address_id: selectedAddress.id
            });

            if (isSuccess(response)) {
                setShowConfirmModal(false);
                showToast('success', '购买成功');
                setTimeout(() => {
                    onNavigate({ name: 'order-list', kind: 'points', status: 0, back: { name: 'points-product-detail' } });
                }, 1500);
            } else {
                showToast('error', '购买失败', extractError(response, '操作失败'));
            }
        } catch (err: any) {
            console.error('Create order failed', err);
            showToast('error', '下单失败', err.message || '系统错误');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">{error}</div>;

    const displayPrice = detailData?.score_price || detailData?.price || 0;
    const totalPrice = (Number(displayPrice) * quantity).toFixed(2);
    const totalScore = (Number(displayPrice) * quantity);

    return (
        <div className="min-h-screen bg-gray-50 pb-24 relative">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm px-4 py-3 flex justify-between items-center border-b border-gray-100">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-800">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-lg font-bold text-gray-900">消费金商品详情</h1>
                <button
                    onClick={handleShareClick}
                    disabled={loadingShare}
                    className="p-2 -mr-2 hover:bg-gray-100 rounded-full text-gray-800 transition-colors"
                >
                    {loadingShare ? (
                        <LoadingSpinner size={20} color="gray" />
                    ) : (
                        <Share2 size={20} />
                    )}
                </button>
            </header>

            {/* Product Image */}
            <div className="aspect-square w-full bg-white relative">
                <LazyImage
                    src={detailData?.thumbnail || product.image || ''}
                    alt={detailData?.name || product.title}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Product Info */}
            <div className="bg-white p-4 mb-2">
                <div className="flex items-baseline gap-1 mb-2">
                    <div className="text-2xl font-bold text-orange-600 font-mono">
                        {isScoreProduct ? '' : '¥'}{displayPrice}
                    </div>
                    <span className="text-sm text-orange-500 font-medium">
                        {isScoreProduct ? '消费金' : '元'}
                    </span>
                    {detailData?.price && isScoreProduct && (
                        <span className="text-xs text-gray-400 line-through ml-2">¥{detailData.price}</span>
                    )}
                </div>

                <h2 className="text-lg font-bold text-gray-900 leading-snug mb-2">
                    {detailData?.name || product.title}
                </h2>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>库存: {detailData?.stock ?? '-'}</span>
                    <span>销量: {detailData?.sales ?? '-'}</span>
                </div>
            </div>

            {/* Specs Row */}
            <div
                className="bg-white p-4 mb-2 flex items-center justify-between active:bg-gray-50 transition-colors"
                onClick={() => setShowSpecModal(true)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">选择规格</span>
                    <span className="text-xs text-gray-500">已选: {quantity} 件</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6" /></svg>
            </div>

            {/* Description */}
            <div className="bg-white p-4 mb-20">
                <h3 className="font-bold text-gray-900 mb-3 border-l-4 border-orange-500 pl-2">商品详情</h3>
                <div
                    className="text-sm text-gray-600 leading-relaxed rich-text space-y-2"
                    dangerouslySetInnerHTML={{ __html: detailData?.description || '<p>暂无详情</p>' }}
                />
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 flex items-center gap-3 safe-area-bottom">
                <div className="flex flex-col items-center justify-center text-gray-500 px-2 min-w-[50px]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                    <span className="text-[10px] mt-0.5">店铺</span>
                </div>

                <button
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={handleExchangeClick}
                    disabled={submitting}
                >
                    {isScoreProduct ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><path d="M9.3 12.5a3.5 3.5 0 0 0 5.4 0" /><line x1="12" x2="12" y1="16" y2="16" /></svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                    )}
                    {isScoreProduct ? '立即兑换' : '立即购买'}
                </button>
            </div>

            {/* Share Modal */}
            {showShareModal && shareData && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in" onClick={() => setShowShareModal(false)}>
                    <div className="bg-white w-full rounded-t-[32px] p-6 pb-safe animate-in slide-in-from-bottom duration-300 relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">分享商品</h3>
                            <button onClick={() => setShowShareModal(false)} className="text-gray-400 p-2 -mr-2">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex items-start gap-4">
                            <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                <img src={shareData.share_image || shareData.product.thumbnail} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{shareData.share_title}</div>
                                <div className="text-xs text-gray-500 mb-2 line-clamp-2">{shareData.share_desc}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleCopyLink}
                                className="flex flex-col items-center justify-center gap-2 p-4 bg-orange-50 rounded-2xl active:scale-[0.98] transition-transform"
                            >
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                                    <Copy size={24} />
                                </div>
                                <span className="text-sm font-medium text-gray-700">复制链接</span>
                            </button>
                            {/* More share options can be added here later */}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="text-xs text-center text-gray-400">
                                分享码: {shareData.share_code}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Spec / Quantity Modal */}
            {showSpecModal && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in" onClick={() => setShowSpecModal(false)}>
                    <div className="bg-white w-full rounded-t-[32px] p-6 pb-safe animate-in slide-in-from-bottom duration-300 relative" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-4 mb-6">
                            <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100 -mt-10 shadow-lg relative bg-white">
                                <img src={detailData?.thumbnail || product.image} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="text-xl font-bold text-orange-600 mb-1 font-mono">
                                    {isScoreProduct ? '' : '¥'}{displayPrice}
                                    <span className="text-xs font-normal ml-1">{isScoreProduct ? '消费金' : '元'}</span>
                                </div>
                                <div className="text-xs text-gray-500">库存: {maxStock} 件</div>
                                <div className="text-sm text-gray-900 mt-1 font-medium">已选: {quantity} 件</div>
                            </div>
                            <button onClick={() => setShowSpecModal(false)} className="text-gray-400 p-2 -mr-2 -mt-2">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="mb-8">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">购买数量</h4>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="w-10 h-8 flex items-center justify-center bg-gray-50 active:bg-gray-100 text-gray-600 disabled:opacity-50"
                                        disabled={quantity <= 1}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /></svg>
                                    </button>
                                    <div className="w-12 h-8 flex items-center justify-center text-sm font-bold border-x border-gray-200 bg-white">
                                        {quantity}
                                    </div>
                                    <button
                                        onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                                        className="w-10 h-8 flex items-center justify-center bg-gray-50 active:bg-gray-100 text-gray-600 disabled:opacity-50"
                                        disabled={quantity >= maxStock}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                                    </button>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {quantity >= maxStock ? '(已达最大库存)' : ''}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleSpecConfirm}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3.5 rounded-full shadow-lg shadow-orange-200 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            下一步
                        </button>
                    </div>
                </div>
            )}

            {/* Confirm Order Page (Full Screen) */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
                        <button onClick={() => setShowConfirmModal(false)} className="p-2 -ml-2 text-gray-800">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <h1 className="text-lg font-bold text-gray-900">确认订单</h1>
                        <div className="w-8"></div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 pb-32">
                        {/* Address Selection */}
                        <div
                            className="bg-white rounded-xl p-4 mb-4 flex items-center justify-between active:bg-gray-50 transition-colors border border-gray-100 shadow-sm"
                            onClick={() => setShowAddressPicker(true)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-900 truncate">{selectedAddress?.name}</span>
                                        <span className="text-gray-500 text-xs">{selectedAddress?.phone}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {selectedAddress?.province} {selectedAddress?.city} {selectedAddress?.district} {selectedAddress?.address}
                                    </div>
                                </div>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 rotate-180"><path d="m15 18-6-6 6-6" /></svg>
                        </div>

                        {/* Product Summary */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-50">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="m6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                                <span className="text-xs font-bold text-gray-700">店铺自营</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                    <img src={detailData?.thumbnail || product.image} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div className="text-sm font-bold text-gray-900 line-clamp-2">{detailData?.name || product.title}</div>
                                    <div className="text-xs text-gray-500 bg-gray-50 self-start px-2 py-0.5 rounded mt-1">默认规格</div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="font-mono font-bold text-orange-600 text-lg">
                                            {isScoreProduct ? '' : '¥'}{displayPrice}
                                            <span className="text-xs text-gray-500 font-normal ml-1">x {quantity}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-sm text-gray-600">配送方式</span>
                                <span className="text-sm text-gray-900">快递 免邮</span>
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                                <span className="text-sm text-gray-600">订单备注</span>
                                <span className="text-sm text-gray-400">无备注</span>
                            </div>
                            <div className="mt-3 flex justify-end items-center gap-2">
                                <span className="text-sm text-gray-600">共 {quantity} 件，小计：</span>
                                <span className="text-lg font-bold text-orange-600 font-mono">
                                    {isScoreProduct ? `${totalScore} 消费金` : `¥${totalPrice}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white border-t border-gray-100 p-4 safe-area-bottom flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600">合计:</span>
                            <span className="text-xl font-bold text-orange-600 font-mono">
                                {isScoreProduct ? `${totalScore} 消费金` : `¥${totalPrice}`}
                            </span>
                        </div>
                        <button
                            onClick={handleSubmitOrder}
                            disabled={submitting}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-orange-200 active:scale-[0.98] flex items-center justify-center gap-2 min-w-[140px]"
                        >
                            {submitting ? <LoadingSpinner size={20} color="white" /> : '提交订单'}
                        </button>
                    </div>
                </div>
            )}

            {/* Address Picker Modal */}
            {showAddressPicker && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in" onClick={() => setShowAddressPicker(false)}>
                    <div className="bg-white w-full rounded-t-[32px] p-6 pb-safe animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">选择收货地址</h3>
                            <button onClick={() => setShowAddressPicker(false)} className="text-gray-500">关闭</button>
                        </div>

                        <div className="overflow-y-auto space-y-4 flex-1">
                            {addresses.map(addr => (
                                <div
                                    key={addr.id}
                                    onClick={() => { setSelectedAddress(addr); setShowAddressPicker(false); }}
                                    className={`p-4 rounded-xl border flex items-center gap-3 ${selectedAddress?.id === addr.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 font-bold text-gray-900 mb-1">
                                            {addr.name}
                                            <span className="text-gray-500 font-normal text-xs">{addr.phone}</span>
                                            {Number(addr.is_default) === 1 && <span className="text-[10px] bg-red-100 text-red-500 px-1 rounded">默认</span>}
                                        </div>
                                        <div className="text-xs text-gray-500">{addr.province} {addr.city} {addr.district} {addr.address}</div>
                                    </div>
                                    {selectedAddress?.id === addr.id && <div className="w-3 h-3 bg-orange-500 rounded-full"></div>}
                                </div>
                            ))}

                            <button
                                onClick={() => { onNavigate('address-list'); setShowAddressPicker(false); }}
                                className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 text-sm flex items-center justify-center gap-2"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                                管理/添加地址
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PointsProductDetail;
