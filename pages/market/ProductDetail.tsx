
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Share2, Copy, Shield, FileText, Lock, Fingerprint, Award, Gavel, TrendingUp, CreditCard } from 'lucide-react';
import { LoadingSpinner, LazyImage } from '../../components/common';
import { Product } from '../../types';
import {
  fetchCollectionItemDetail,
  fetchCollectionItemOriginalDetail,
  fetchShopProductDetail,
  CollectionItemDetailData,
  ShopProductDetailData,
  buyShopOrder,
  cancelBid,
} from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onNavigate }) => {
  const { showToast, showDialog } = useNotification();
  const [detailData, setDetailData] = useState<CollectionItemDetailData | ShopProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [buying, setBuying] = useState(false);
  const [isCancelled, setIsCancelled] = useState(product.reservationStatus === 'cancelled');

  const isShopProduct = product.productType === 'shop';

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (isShopProduct) {
          response = await fetchShopProductDetail(product.id);
        } else {
          try {
            response = await fetchCollectionItemDetail(product.id);
            if (response.code !== 1 || !response.data) {
              response = await fetchCollectionItemOriginalDetail(product.id);
            }
          } catch (err) {
            response = await fetchCollectionItemOriginalDetail(product.id);
          }
        }

        if (response.code === 1 && response.data) {
          setDetailData(response.data);
        } else {
          setError(response.msg || '获取证书详情失败');
        }
      } catch (err: any) {
        setError('数据同步延迟，请重试');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [product.id, isShopProduct]);

  const handleBuy = async () => {
    if (buying) return;

    showDialog({
      title: '确认购买',
      description: `确定要购买 ${product.title} 吗？`,
      confirmText: '立即支付',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          setBuying(true);
          const response = await buyShopOrder({
            items: [{ product_id: Number(product.id), quantity: 1 }],
            pay_type: 'money',
            // address_id will be handled by service (using default if not provided)
          });

          if (response.code === 1) {
            showToast('success', '购买成功', '订单已创建并支付成功');
            // Navigate to order list or success page
            onNavigate('orders');
          } else {
            showToast('error', '购买失败', response.msg || '购买失败');
          }
        } catch (err: any) {
          console.error('Purchase failed', err);
          showToast('error', '购买失败', err.message || '系统错误');
        } finally {
          setBuying(false);
        }
      }
    });
  };

  const handleCancelBid = async () => {
    if (buying || !product.reservationId) return;

    showDialog({
      title: '取消确权',
      description: '确定要取消本次确权申请吗？',
      confirmText: '确定取消',
      cancelText: '暂不取消',
      onConfirm: async () => {
        try {
          setBuying(true); // Reuse buying state for loading
          const response = await cancelBid({
            matching_pool_id: Number(product.reservationId)
          });

          // Handle cases where code might be a string "1" or "0"
          const code = Number(response.code);
          if (code === 1 || code === 0) {
            showToast('success', '取消成功', '取消成功');
            setIsCancelled(true);
            // onBack(); // Stay on page to show status change as requested
          } else {
            showToast('error', '取消失败', response.msg || '取消失败');
          }
        } catch (err: any) {
          console.error('Cancel bid failed', err);
          showToast('error', '取消失败', err?.msg || '操作失败');
        } finally {
          setBuying(false);
        }
      }
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]"><LoadingSpinner /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-gray-500">{error}</div>;

  const collectionDetail = !isShopProduct ? (detailData as CollectionItemDetailData) : null;
  const shopDetail = isShopProduct ? (detailData as ShopProductDetailData) : null;

  const mainImage = isShopProduct ? (shopDetail?.thumbnail || product.image) : (collectionDetail?.images?.[0] || collectionDetail?.image || product.image);
  const displayTitle = isShopProduct ? (shopDetail?.name || product.title) : (collectionDetail?.title || product.title);
  const displayPrice = isShopProduct ? Number(shopDetail?.price ?? product.price) : Number(collectionDetail?.price ?? product.price);

  // Specific fields for Collection
  const fingerprint = collectionDetail?.fingerprint;
  const sessionName = collectionDetail?.session_name;
  const sessionTime = collectionDetail ? `${collectionDetail.session_start_time || '--:--'} - ${collectionDetail.session_end_time || '--:--'}` : '';

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-serif pb-24 relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-sm px-4 py-4 flex justify-between items-center border-b border-amber-900/5">
        <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-800">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{isShopProduct ? '商品详情' : '数字权益证书'}</h1>
        <button className="p-2 hover:bg-black/5 rounded-full text-gray-800">
          <Share2 size={20} />
        </button>
      </header>

      {/* Certificate Container */}
      <div className="p-5">
        <div className="bg-white relative shadow-2xl shadow-gray-200/50 rounded-sm overflow-hidden border-[6px] border-double border-amber-900/10 p-6 md:p-8">

          {/* Watermark */}
          {!isShopProduct && (
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Shield size={200} />
            </div>
          )}

          {/* Top Logo Area */}
          {!isShopProduct && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-900 mb-3 border border-amber-100">
                <Award size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-wide mb-1">数字产权登记证书</h2>
              <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Digital Property Rights Certificate</div>
            </div>
          )}

          {/* Asset Image (If Shop Product, show image here since we removed it globally but might want it for shop) */}
          {isShopProduct && (
            <div className="mb-6 rounded-lg overflow-hidden shadow-sm aspect-square bg-gray-50">
              <LazyImage
                src={mainImage || ''}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Certificate Fields */}
          <div className="space-y-6 relative z-10 font-sans">
            {/* Core Info Area */}
            <div className="text-center py-6 mb-2 relative">
              {/* Complex Guilloche Pattern Background (Simulated with Radial Gradient) - Only for Collection */}
              {!isShopProduct && (
                <div
                  className="absolute inset-0 opacity-[0.15] pointer-events-none rounded-lg border border-amber-900/5"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, #C5A572 1px, transparent 1px), radial-gradient(circle, #C5A572 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px',
                  }}
                >
                </div>
              )}

              {/* Line 1: Certificate Number (Collection only) */}
              {!isShopProduct && (
                <div className="text-xs text-gray-500 font-[DINAlternate-Bold,Roboto,sans-serif] tracking-widest mb-3 relative z-10">
                  确权编号：37-DATA-2025-{product.id.toString().padStart(4, '0')}
                </div>
              )}

              {/* Line 2: Product Name */}
              <h3 className={`${displayTitle.length > 12 ? 'text-lg' : displayTitle.length > 8 ? 'text-xl' : displayTitle.length > 5 ? 'text-2xl' : 'text-3xl'} font-extrabold text-gray-900 mb-3 font-serif tracking-tight leading-tight relative z-10 drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis px-2`}>
                【{displayTitle}】
              </h3>

              {/* Line 3: Asset Type / Artist (Collection only) */}
              {!isShopProduct && (
                <div className="text-base font-bold text-[#C5A572] tracking-wide relative z-10">
                  {product.artist || '产业数据资产包'}
                </div>
              )}

              {/* Official Stamp (SVG) - Collection only */}
              {!isShopProduct && (
                <div className="absolute -right-4 -bottom-6 w-32 h-32 opacity-90 -rotate-12 mix-blend-multiply z-20 pointer-events-none">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <path id="textCircleTop" d="M 25,100 A 75,75 0 1,1 175,100" fill="none" />
                      <filter id="roughPaper">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                      </filter>
                    </defs>

                    <g filter="url(#roughPaper)" fill="#D60000" stroke="none">
                      {/* Outer Ring */}
                      <circle cx="100" cy="100" r="96" fill="none" stroke="#D60000" strokeWidth="3" />
                      {/* Inner Ring */}
                      <circle cx="100" cy="100" r="92" fill="none" stroke="#D60000" strokeWidth="1" />

                      {/* Top Text */}
                      <text fontSize="14" fontWeight="bold" fontFamily="SimSun, serif" fill="#D60000">
                        <textPath href="#textCircleTop" startOffset="50%" textAnchor="middle" spacing="auto">
                          树交所数字资产登记结算中心
                        </textPath>
                      </text>

                      {/* Star */}
                      <text x="100" y="100" fontSize="40" textAnchor="middle" dominantBaseline="middle" fill="#D60000">
                        ★
                      </text>

                      {/* Center Text */}
                      <text x="100" y="135" fontSize="18" fontWeight="bold" fontFamily="SimHei, sans-serif" textAnchor="middle" fill="#D60000">
                        确权专用章
                      </text>

                      {/* Bottom Number */}
                      <text x="100" y="155" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="bold" textAnchor="middle" fill="#D60000" letterSpacing="1">
                        37010299821
                      </text>
                    </g>
                  </svg>
                </div>
              )}
            </div>

            {/* Description */}
            {(collectionDetail?.description || shopDetail?.description) && (
              <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-100">
                <div className="text-xs font-bold text-amber-700 uppercase mb-1 tracking-wider">Description / 商品描述</div>
                <div className="text-sm text-amber-900 leading-relaxed"
                  dangerouslySetInnerHTML={isShopProduct ? { __html: shopDetail?.description || '' } : undefined}>
                  {!isShopProduct && collectionDetail?.description}
                </div>
              </div>
            )}

            {/* Collection Specific: Session Info */}
            {!isShopProduct && (sessionName || sessionTime.trim()) && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Session / 专场</label>
                  <div className="text-sm font-bold text-gray-800">{sessionName || '—'}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Trading Window / 场次时间</label>
                  <div className="text-sm font-bold text-gray-800">{sessionTime || '—'}</div>
                </div>
              </div>
            )}

            {/* Collection Specific: Anchor */}
            {!isShopProduct && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-start gap-3 mb-3">
                  <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-0.5">Asset Anchor / 资产锚定</label>
                    <div className="text-sm font-medium text-gray-800">
                      涉及农户/合作社：238户 (数据已脱敏)
                      <span className="inline-block ml-1 text-[10px] text-amber-600 border border-amber-200 px-1 rounded bg-white">隐私保护</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 leading-tight">
                      * 根据《数据安全法》及商业保密协议，底层隐私信息已做Hash脱敏处理，仅持有人可申请解密查看。
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Collection Specific: Fingerprint */}
            {!isShopProduct && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Blockchain Fingerprint / 存证指纹</label>
                {fingerprint ? (
                  <div className="bg-gray-900 text-green-500 font-mono text-[10px] p-3 rounded break-all leading-relaxed relative group cursor-pointer hover:bg-gray-800 transition-colors">
                    <Copy size={12} className="absolute right-2 top-2 text-gray-500 group-hover:text-green-400" />
                    <div className="flex items-center gap-2 mb-1 text-gray-500 font-sans font-bold">
                      <Fingerprint size={12} />
                      <span className="uppercase">On-chain Proof</span>
                    </div>
                    {fingerprint}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">暂无上链指纹信息</div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">

        {/* Market Heat Indicator - Only for Collection */}
        {!isShopProduct && (
          <div className="flex items-center justify-between bg-red-50 rounded-full px-3 py-1.5 mb-3 border border-red-100">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-bold text-red-600">当前热度：极高 | 剩余额度：28%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 font-mono">实时竞价倒计时</span>
              <span className="text-[11px] font-mono text-red-500 font-bold bg-white px-2 py-0.5 rounded-full border border-red-100">
                00:14:23
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="text-left">
            <div className="flex flex-col">
              <div className="text-xl font-bold text-gray-900 font-mono flex items-baseline leading-none">
                <span className="text-sm mr-0.5">¥</span>
                {displayPrice.toLocaleString()}
                {!isShopProduct && <span className="text-xs text-gray-400 font-bold ml-1">(起购价)</span>}
              </div>
              {/* Expected Appreciation Label - Only for Collection */}
              {!isShopProduct && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={10} className="text-red-500" />
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 py-0.5 rounded border border-red-100/50">
                    预期增值 +4%~+6%
                  </span>
                </div>
              )}
            </div>
          </div>

          {isShopProduct ? (
            <button
              onClick={handleBuy}
              disabled={buying}
              className="flex-1 bg-[#EE4D2D] text-white hover:bg-[#D73211] transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
              {buying ? <LoadingSpinner size={18} color="white" /> : <CreditCard size={18} />}
              {buying ? '处理中...' : '立即购买'}
            </button>
          ) : product.reservationId ? (
            isCancelled ? (
              <button
                disabled
                className="flex-1 bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed py-3.5 rounded-lg font-bold flex items-center justify-center gap-2">
                <Gavel size={18} />
                已取消
              </button>
            ) : (
              <button
                onClick={handleCancelBid}
                disabled={buying}
                className="flex-1 bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                {buying ? <LoadingSpinner size={18} color="#DC2626" /> : <Gavel size={18} />}
                {buying ? '处理中...' : '取消确权'}
              </button>
            )
          ) : (
            <button
              onClick={() => onNavigate('reservation')}
              className="flex-1 bg-[#8B0000] text-amber-100 hover:bg-[#A00000] transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-[0.98]">
              <Gavel size={18} />
              申请确权
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductDetail;