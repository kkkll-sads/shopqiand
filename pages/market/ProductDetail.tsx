
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Share2, Copy, Shield, FileText, Lock, Fingerprint, Award, Gavel, TrendingUp } from 'lucide-react';
import { LoadingSpinner, LazyImage } from '../../components/common';
import { Product } from '../../types';
import {
  fetchCollectionItemDetail,
  fetchCollectionItemOriginalDetail,
  fetchShopProductDetail,
  CollectionItemDetailData,
  ShopProductDetailData,
} from '../../services/api';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onNavigate }) => {
  const [detailData, setDetailData] = useState<CollectionItemDetailData | ShopProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]"><LoadingSpinner /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-gray-500">{error}</div>;

  const collectionDetail = !isShopProduct ? (detailData as CollectionItemDetailData) : null;
  const mainImage = collectionDetail?.images?.[0] || collectionDetail?.image || product.image;
  const displayTitle = collectionDetail?.title || product.title;
  const displayPrice = Number(collectionDetail?.price ?? product.price);
  const fingerprint = collectionDetail?.fingerprint;
  const priceZone = collectionDetail?.price_zone;
  const sessionName = collectionDetail?.session_name;
  const sessionTime = collectionDetail ? `${collectionDetail.session_start_time || '--:--'} - ${collectionDetail.session_end_time || '--:--'}` : '';
  const isTrading = collectionDetail?.is_trading_time ?? true;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-serif pb-24 relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-sm px-4 py-4 flex justify-between items-center border-b border-amber-900/5">
        <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-800">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">数字权益证书</h1>
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-900 mb-3 border border-amber-100">
              <Award size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-wide mb-1">数字产权登记证书</h2>
            <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Digital Property Rights Certificate</div>
          </div>

<<<<<<< HEAD
          {/* Asset Image Removed as requested */}

          {/* Certificate Fields */}
          <div className="space-y-6 relative z-10 font-sans">
            {/* Core Info Area */}
            <div className="text-center py-6 mb-2 relative">
              {/* Complex Guilloche Pattern Background (Simulated with Radial Gradient) */}
              <div className="absolute inset-0 opacity-[0.15] pointer-events-none rounded-lg border border-amber-900/5"
                style={{
                  backgroundImage: 'radial-gradient(circle, #C5A572 1px, transparent 1px), radial-gradient(circle, #C5A572 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px'
                }}>
=======
          {/* Asset Image (Stamp Style) */}
          <div className="relative w-full aspect-[16/9] bg-gray-50 mb-8 border border-gray-100 p-2 shadow-inner">
            <div className="w-full h-full relative overflow-hidden grayscale-[20%] hover:grayscale-0 transition-all duration-500">
              <LazyImage src={mainImage} className="w-full h-full object-cover" />
              {/* Official Stamp */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 border-[3px] border-red-800 rounded-full flex items-center justify-center opacity-80 -rotate-12 mix-blend-multiply z-10 pointer-events-none">
                <div className="w-[90%] h-[90%] border border-red-800 rounded-full flex items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-red-800 transform scale-75 leading-tight">
                    数权中心<br />已确权<br />VERIFIED
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Fields */}
          <div className="space-y-6 relative z-10 font-sans">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Asset Name / 资产名称</label>
              <div className="text-lg font-bold text-gray-900 font-serif leading-tight">
                {displayTitle}
>>>>>>> 931393f (Enhance ProductDetail and TradingZone components: Updated ProductDetail to display collection details, including title, price, and session information. Improved TradingZone by integrating visual presets with trading session data and added isActive status handling for sessions.)
              </div>

              {/* Line 1: Certificate Number */}
              <div className="text-xs text-gray-500 font-[DINAlternate-Bold,Roboto,sans-serif] tracking-widest mb-3 relative z-10">
                确权编号：37-DATA-2025-{product.id.toString().padStart(4, '0')}
              </div>
<<<<<<< HEAD

              {/* Line 2: Product Name */}
              <h3 className={`${product.title.length > 12 ? 'text-lg' : product.title.length > 8 ? 'text-xl' : product.title.length > 5 ? 'text-2xl' : 'text-3xl'} font-extrabold text-gray-900 mb-3 font-serif tracking-tight leading-tight relative z-10 drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis px-2`}>
                【{product.title}】
              </h3>

              {/* Line 3: Asset Type / Artist */}
              <div className="text-base font-bold text-[#C5A572] tracking-wide relative z-10">
                {product.artist || '产业数据资产包'}
              </div>

              {/* Official Stamp (SVG) */}
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
                    <text x="100" y="100" fontSize="40" textAnchor="middle" dominantBaseline="middle" fill="#D60000">★</text>

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
=======
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Asset Type / 类型</label>
                <div className="text-sm font-bold text-gray-800">
                  {priceZone || '产业数据资产包'}
                </div>
>>>>>>> 931393f (Enhance ProductDetail and TradingZone components: Updated ProductDetail to display collection details, including title, price, and session information. Improved TradingZone by integrating visual presets with trading session data and added isActive status handling for sessions.)
              </div>
            </div>

            {collectionDetail?.description && (
              <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-100">
                <div className="text-xs font-bold text-amber-700 uppercase mb-1 tracking-wider">Description / 藏品描述</div>
                <div className="text-sm text-amber-900 leading-relaxed">
                  {collectionDetail.description}
                </div>
              </div>
            )}

            {(sessionName || sessionTime.trim()) && (
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

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Blockchain Fingerprint / 存证指纹</label>
<<<<<<< HEAD
              <div className="bg-gray-900 text-green-500 font-mono text-[10px] p-3 rounded break-all leading-relaxed relative group cursor-pointer hover:bg-gray-800 transition-colors">
                <Copy size={12} className="absolute right-2 top-2 text-gray-500 group-hover:text-green-400" />
                <div className="flex items-center gap-2 mb-1 text-gray-500 font-sans font-bold">
                  <Fingerprint size={12} />
                  <span className="uppercase">TREE-CHAIN CONSORTIUM</span>
=======
              {fingerprint ? (
                <div className="bg-gray-900 text-green-500 font-mono text-[10px] p-3 rounded break-all leading-relaxed relative group cursor-pointer hover:bg-gray-800 transition-colors">
                  <Copy size={12} className="absolute right-2 top-2 text-gray-500 group-hover:text-green-400" />
                  <div className="flex items-center gap-2 mb-1 text-gray-500 font-sans font-bold">
                    <Fingerprint size={12} />
                    <span className="uppercase">On-chain Proof</span>
                  </div>
                  {fingerprint}
>>>>>>> 931393f (Enhance ProductDetail and TradingZone components: Updated ProductDetail to display collection details, including title, price, and session information. Improved TradingZone by integrating visual presets with trading session data and added isActive status handling for sessions.)
                </div>
              ) : (
                <div className="text-xs text-gray-400">暂无上链指纹信息</div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Action */}
<<<<<<< HEAD
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">
        {/* Market Heat Indicator */}
        <div className="flex items-center justify-between bg-red-50 rounded-full px-3 py-1.5 mb-3 border border-red-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold text-red-600">当前热度：极高 | 剩余额度：28%</span>
=======
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50 flex items-center justify-between gap-4">
        <div className="text-left">
          <div className="text-xs text-gray-400 uppercase font-bold">Starting Bid / 起拍价</div>
          <div className="text-xl font-bold text-gray-900 font-mono flex items-baseline">
            <span className="text-sm">¥</span>
            {displayPrice.toLocaleString()}
>>>>>>> 931393f (Enhance ProductDetail and TradingZone components: Updated ProductDetail to display collection details, including title, price, and session information. Improved TradingZone by integrating visual presets with trading session data and added isActive status handling for sessions.)
          </div>
          <div className="text-[10px] font-mono text-red-500 font-bold">00:14:23</div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-left">
            <div className="flex flex-col">
              <div className="text-xl font-bold text-gray-900 font-mono flex items-baseline leading-none">
                <span className="text-sm mr-0.5">¥</span>
                {product.price.toLocaleString()}
                <span className="text-xs text-gray-400 font-bold ml-1">(起购价)</span>
              </div>
              {/* Expected Appreciation Label */}
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={10} className="text-red-500" />
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 py-0.5 rounded border border-red-100/50">
                  预期增值 +4%~+6%
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('reservation')}
            className="flex-1 bg-[#8B0000] text-amber-100 hover:bg-[#A00000] transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-[0.98]">
            <Gavel size={18} />
            申请确权
          </button>
        </div>
<<<<<<< HEAD
=======
        <button
          disabled={!isTrading}
          className={`flex-1 ${isTrading ? 'bg-[#8B0000] text-amber-100 hover:bg-[#A00000] shadow-lg shadow-red-900/20' : 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'} transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98]`}
        >
          <Gavel size={18} />
          {isTrading ? '参与竞价摘牌' : '非交易时段'}
        </button>
>>>>>>> 931393f (Enhance ProductDetail and TradingZone components: Updated ProductDetail to display collection details, including title, price, and session information. Improved TradingZone by integrating visual presets with trading session data and added isActive status handling for sessions.)
      </div>

    </div>
  );
};

export default ProductDetail;