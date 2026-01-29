/**
 * ShopProductDetail - 商城商品详情页（京东风格）
 * 已重构: 拆分为多个子组件和 hooks
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Headphones, Truck, ThumbsUp, Gift
} from 'lucide-react';
import BottomSheet from '@/components/common/BottomSheet';
import AddressSheet from '@/components/business/AddressSheet';
import ServiceSheet from '@/components/business/ServiceSheet';
import BuySpecSheet from '@/components/shop/BuySpecSheet';
import { LoadingSpinner } from '@/components/common';
import { Product } from '@/types';
import { ShopProductDetailData } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { debugLog } from '@/utils/logger';
import {
  ProductGallery,
  ProductInfo,
  ProductSpecs,
  ProductActions,
  SkuSwitcher,
} from './components/product';
import { Sku } from '@/services/shop';
import { useProductDetail } from './hooks/useProductDetail';
import { useProductBuy } from './hooks/useProductBuy';

interface ShopProductDetailProps {
  product: Product;
  hideActions?: boolean;
  initialData?: ShopProductDetailData | null;
}

const ShopProductDetail: React.FC<ShopProductDetailProps> = ({
  product,
  hideActions = false,
  initialData = null
}) => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'product' | 'reviews' | 'detail' | 'recommend'>('product');
  const [scrollY, setScrollY] = useState(0);
  const [headerStyle, setHeaderStyle] = useState<'transparent' | 'white'>('transparent');
  
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showServiceSheet, setShowServiceSheet] = useState(false);
  const [showBuySpecSheet, setShowBuySpecSheet] = useState(false);
  const [preSelectedValueIds, setPreSelectedValueIds] = useState<Record<number, number>>({});
  const [skuPreviewImage, setSkuPreviewImage] = useState<string | null>(null);

  // 各区块 ref，用于滚动定位和自动切换 Tab
  const productSectionRef = useRef<HTMLDivElement>(null);
  const reviewsSectionRef = useRef<HTMLDivElement>(null);
  const detailSectionRef = useRef<HTMLDivElement>(null);

  // Product Detail Hook
  const {
    detailData,
    reviewSummary,
    loading,
    hasError,
    errorMessage,
    displayTitle,
    displayPrice,
    maxPrice,
    showPriceRange,
    scorePrice,
    salesCount,
    reviewCount,
    detailImages,
    safeShopImages,
    hasSelectableSpecs,
  } = useProductDetail({ product, initialData });

  // Product Buy Hook
  const {
    selectedSpecs,
    buyQuantity,
    selectedSkuId,
    buying,
    handleConfirmBuy,
    setBuyQuantity,
    setSelectedSpecs,
    setSelectedSkuId,
  } = useProductBuy({
    productId: product.id,
    productTitle: displayTitle,
    isPhysical: detailData?.is_physical === '1',
  });

  // 页面滚动监听 - 导航栏跟随变化 + Tab 自动切换
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      if (currentScrollY > 300) {
        setHeaderStyle('white');
      } else {
        setHeaderStyle('transparent');
      }

      const offset = 100;
      const detailTop = detailSectionRef.current?.offsetTop ?? Infinity;
      const reviewsTop = reviewsSectionRef.current?.offsetTop ?? Infinity;

      if (currentScrollY + offset >= detailTop) {
        setActiveTab('detail');
      } else if (currentScrollY + offset >= reviewsTop) {
        setActiveTab('reviews');
      } else {
        setActiveTab('product');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBuy = () => {
    if (buying) return;
    setShowBuySpecSheet(true);
  };

  // 计算显示的图片列表（包含SKU预览图）
  const displayImages = useMemo(() => {
    if (skuPreviewImage && !safeShopImages.includes(skuPreviewImage)) {
      return [skuPreviewImage, ...safeShopImages];
    }
    return safeShopImages;
  }, [safeShopImages, skuPreviewImage]);

  // 当 SKU 预览图变化时，切换到第一张（预览图）
  useEffect(() => {
    if (skuPreviewImage) {
      setCurrentImageIndex(0);
    }
  }, [skuPreviewImage]);

  const mainImage = displayImages[currentImageIndex] || detailData?.thumbnail || product.image;

  // 规格处理逻辑
  const getSpecsForBuySheet = () => {
    const rawSpecs = detailData?.specs || [];
    if (!Array.isArray(rawSpecs) || rawSpecs.length === 0) {
      return [];
    }

    const firstSpec = rawSpecs[0];
    if (firstSpec && firstSpec.id && firstSpec.name && Array.isArray(firstSpec.values)) {
      return rawSpecs
        .filter(spec => spec && spec.id && spec.name && Array.isArray(spec.values))
        .map(spec => ({
          id: spec.id,
          name: spec.name,
          values: spec.values || []
        }));
    }

    const specGroups = new Map<string, Set<string>>();
    rawSpecs.forEach((spec: any) => {
      if (spec && spec.name && spec.value) {
        if (!specGroups.has(spec.name)) {
          specGroups.set(spec.name, new Set());
        }
        specGroups.get(spec.name)!.add(spec.value);
      }
    });

    return Array.from(specGroups.entries()).map(([name, values], index) => ({
      id: `spec-${index}`,
      name: name,
      values: Array.from(values)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-[56px]">
      {/* 顶部Tab导航栏 */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          headerStyle === 'white' ? 'bg-white shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className={`flex items-center px-2 py-2 ${headerStyle === 'white' ? 'border-b border-gray-100' : ''}`}>
          <button
            onClick={() => navigate(-1)}
            className={`p-2 -ml-1 rounded-full transition-colors ${
              headerStyle === 'white'
                ? 'active:bg-gray-100'
                : 'bg-black/20 active:bg-black/30'
            }`}
          >
            <ChevronLeft size={22} className={headerStyle === 'white' ? 'text-gray-700' : 'text-white'} />
          </button>

          {/* Tab导航 */}
          <div className={`flex-1 flex items-center justify-center gap-6 transition-opacity duration-300 ${
            headerStyle === 'white' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            {[
              { key: 'product', label: '商品', ref: productSectionRef },
              { key: 'reviews', label: '大家评', ref: reviewsSectionRef },
              { key: 'detail', label: '详情', ref: detailSectionRef },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  tab.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`text-sm py-1 relative ${
                  activeTab === tab.key ? 'text-gray-900 font-bold' : 'text-gray-500'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 商品主图轮播 */}
      <div className="relative" ref={productSectionRef}>
        <ProductGallery
          images={displayImages}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
        />
      </div>

      {/* SKU图片切换器 */}
      {(detailData?.has_sku === '1' || detailData?.has_sku === 1) && detailData?.sku_specs?.length && detailData?.skus?.length ? (
        <SkuSwitcher
          skuSpecs={detailData.sku_specs}
          skus={detailData.skus}
          selectedSkuId={selectedSkuId}
          onSkuSelect={(sku, specValueIds) => {
            setPreSelectedValueIds(specValueIds);
            if (sku) {
              setSelectedSkuId(sku.id);
              // 切换主图到 SKU 图片
              if (sku.image) {
                setSkuPreviewImage(sku.image);
              }
            }
          }}
        />
      ) : null}

      {/* 商品信息区 */}
      <ProductInfo
        title={displayTitle}
        price={displayPrice}
        maxPrice={maxPrice}
        showPriceRange={showPriceRange}
        scorePrice={scorePrice}
        salesCount={salesCount}
      />

      {/* 服务保障 */}
      <div
        className="bg-white mt-1.5 px-3 py-2 active:bg-gray-50 cursor-pointer flex items-center justify-between"
        onClick={() => setShowServiceSheet(true)}
      >
        <div className="flex items-center text-xs text-gray-500 gap-3">
          <span className="flex items-center gap-1">
            <Headphones size={12} className="text-green-500" />
            专属客服
          </span>
        </div>
        <ChevronRight size={14} className="text-gray-400" />
      </div>

      {/* 配送信息 */}
      <div
        className="bg-white mt-1.5 px-3 py-2 active:bg-gray-50 cursor-pointer"
        onClick={() => setShowAddressSheet(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-blue-500" />
            <span className="text-blue-500 text-xs font-medium">预计明日达</span>
            <span className="text-xs text-gray-400">付款后预计1-3天送达</span>
          </div>
          <ChevronRight size={14} className="text-gray-400" />
        </div>
        <div className="text-[11px] text-gray-400 mt-1 ml-5">官方物流 · 全国包邮</div>
      </div>

      {/* 规格选择入口 */}
      <ProductSpecs
        selectedSpecs={selectedSpecs}
        quantity={buyQuantity}
        hasSelectableSpecs={hasSelectableSpecs}
        onOpen={() => setShowBuySpecSheet(true)}
      />

      {/* 买家评价区 */}
      <div className="bg-white mt-2" ref={reviewsSectionRef}>
        <div
          className="px-4 py-3 flex items-center justify-between border-b border-gray-50 active:bg-gray-50 cursor-pointer"
          onClick={() => navigate(`/reviews/${product.id}?name=${encodeURIComponent(displayTitle)}`)}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">买家评价</span>
            <span className="text-gray-400 text-sm">{reviewSummary?.total || reviewCount}+</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <span>好评度</span>
            <span className="text-gray-900 font-bold ml-1">{reviewSummary?.good_rate || 100}%</span>
            <ChevronRight size={14} className="text-gray-400" />
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {(reviewSummary?.preview && reviewSummary.preview.length > 0) ? (
            reviewSummary.preview.map(review => (
              <div
                key={review.id}
                className="px-4 py-3 active:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/reviews/${product.id}?name=${encodeURIComponent(displayTitle)}`)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold border border-gray-200">
                    {(review.user_name || '匿名').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 font-medium">{review.user_name || '匿名用户'}</span>
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                        {'★'.repeat(review.rating)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {review.content}
                </p>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              暂无评价，快来抢先评价吧~
            </div>
          )}
        </div>
      </div>

      {/* 商品详情（图片展示） */}
      <div className="bg-white mt-2" ref={detailSectionRef}>
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="font-bold text-gray-800">商品介绍</span>
        </div>
        <div className="p-4">
          {detailData?.description && (
            <div
              className="text-sm text-gray-600 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: detailData.description }}
            />
          )}

          <div className="space-y-0">
            {(detailImages.length > 0 ? detailImages : [mainImage]).filter(Boolean).map((img, idx) => (
              <img
                key={idx}
                src={img as string}
                alt={`详情图${idx + 1}`}
                className="w-full"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <ProductActions buying={buying} onBuy={handleBuy} hideActions={hideActions} />

      {/* 地址选择弹窗 */}
      <BottomSheet
        visible={showAddressSheet}
        title="选择地址"
        onClose={() => setShowAddressSheet(false)}
      >
        <AddressSheet
          onSelectAddress={(address) => {
            debugLog('ShopProductDetail', '选择地址', address);
            setShowAddressSheet(false);
          }}
          onAddAddress={() => {
            navigate('/address-list');
            setShowAddressSheet(false);
          }}
        />
      </BottomSheet>

      {/* 安心保障弹窗 */}
      <BottomSheet
        visible={showServiceSheet}
        title="安心保障"
        onClose={() => setShowServiceSheet(false)}
      >
        <ServiceSheet productName={displayTitle} />
      </BottomSheet>

      {/* 规格选择弹窗 */}
      <BuySpecSheet
        visible={showBuySpecSheet}
        onClose={() => setShowBuySpecSheet(false)}
        productName={displayTitle}
        productImage={mainImage}
        price={displayPrice}
        scorePrice={scorePrice}
        stock={detailData?.stock ?? 999}
        maxPurchase={detailData?.max_purchase ?? 99}
        specs={getSpecsForBuySheet()}
        hasSku={detailData?.has_sku === '1' || detailData?.has_sku === 1}
        skuSpecs={detailData?.sku_specs || []}
        skus={detailData?.skus || []}
        priceRange={detailData?.price_range}
        preSelectedValueIds={preSelectedValueIds}
        onConfirm={handleConfirmBuy}
      />
    </div>
  );
};

export default ShopProductDetail;
