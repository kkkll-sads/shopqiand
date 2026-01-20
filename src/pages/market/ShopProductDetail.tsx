/**
 * ShopProductDetail - 商城商品详情页（京东风格）
 * 
 * 专门用于消费金商城商品的详情展示
 * 参考京东APP商品详情页设计
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Store, MessageCircle,
  Truck, Shield, RotateCcw, Headphones, ThumbsUp, Gift
} from 'lucide-react';
import { LazyImage, openChatWidget } from '../../../components/common';
import PopupAnnouncementModal from '../../../components/common/PopupAnnouncementModal';
import BottomSheet from '../../../components/common/BottomSheet';
import PromotionSheet from '../../../components/business/PromotionSheet';
import AddressSheet from '../../../components/business/AddressSheet';
import ServiceSheet from '../../../components/business/ServiceSheet';
import BuySpecSheet from '../../components/shop/BuySpecSheet';
import { Product } from '../../../types';
import {
  fetchShopProductDetail,
  ShopProductDetailData,
  createOrder,
  fetchAnnouncements,
  AnnouncementItem,
  fetchReviewSummary,
  ReviewSummaryData,
} from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { isSuccess, extractData } from '../../../utils/apiHelpers';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '../../../types/states';
import { LoadingSpinner } from '../../../components/common';
import { multiply, round as roundCurrency, subtract } from '../../../utils/currency';
import { warnLog, errorLog, debugLog } from '../../../utils/logger';

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
  const { showToast, showDialog } = useNotification();

  const { handleError: handleBuyError } = useErrorHandler({ showToast: true, persist: false });
  const {
    errorMessage,
    hasError,
    handleError,
    clearError
  } = useErrorHandler();

  const [detailData, setDetailData] = useState<ShopProductDetailData | null>(initialData);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // 收藏功能已移除
  const [activeTab, setActiveTab] = useState<'product' | 'reviews' | 'detail' | 'recommend'>('product');
  const [scrollY, setScrollY] = useState(0);
  const [headerStyle, setHeaderStyle] = useState<'transparent' | 'white'>('transparent');
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 各区块 ref，用于滚动定位和自动切换 Tab
  const productSectionRef = useRef<HTMLDivElement>(null);
  const reviewsSectionRef = useRef<HTMLDivElement>(null);
  const detailSectionRef = useRef<HTMLDivElement>(null);

  // 交易须知公告
  const [showTradingNotice, setShowTradingNotice] = useState(false);
  const [tradingNoticeAnnouncement, setTradingNoticeAnnouncement] = useState<AnnouncementItem | null>(null);

  // 评价数据
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryData | null>(null);

  // 底部弹窗状态
  const [showPromotionSheet, setShowPromotionSheet] = useState(false);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showServiceSheet, setShowServiceSheet] = useState(false);

  // 规格选择弹窗状态
  const [showBuySpecSheet, setShowBuySpecSheet] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [selectedSkuId, setSelectedSkuId] = useState<number | undefined>(undefined);

  // 状态机
  const detailMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: initialData ? LoadingState.SUCCESS : LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });

  const buyMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
      [FormState.VALIDATING]: {
        [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
        [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
      },
      [FormState.SUBMITTING]: {
        [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
        [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
      },
      [FormState.SUCCESS]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });

  const loading = detailMachine.state === LoadingState.LOADING;
  const buying = buyMachine.state === FormState.SUBMITTING;

  // 加载商品详情
  useEffect(() => {
    if (initialData) {
      setDetailData(initialData);
      detailMachine.send(LoadingEvent.SUCCESS);
      return;
    }

    const loadDetail = async () => {
      try {
        detailMachine.send(LoadingEvent.LOAD);
        clearError();

        const response = await fetchShopProductDetail(product.id);
        const data = extractData(response);

        if (data) {
          setDetailData(data);
          detailMachine.send(LoadingEvent.SUCCESS);
        } else {
          handleError(response, {
            persist: true,
            showToast: false,
            customMessage: '获取商品详情失败'
          });
          detailMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        handleError(err, {
          persist: true,
          showToast: false,
          customMessage: '数据加载失败，请重试',
          context: { productId: product.id }
        });
        detailMachine.send(LoadingEvent.ERROR);
      }
    };

    loadDetail();
  }, [product.id, initialData]);

  // 加载评价摘要
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await fetchReviewSummary(product.id);
        if (isSuccess(response) && response.data) {
          setReviewSummary(response.data);
        }
      } catch (err) {
        warnLog('ShopProductDetail', '加载评价失败', err);
      }
    };
    loadReviews();
  }, [product.id]);

  // 加载交易须知
  useEffect(() => {
    const loadTradingNotice = async () => {
      try {
        const response = await fetchAnnouncements({ page: 1, limit: 10, type: 'normal' });
        if (isSuccess(response) && response.data?.list) {
          const notice = response.data.list.find((item: AnnouncementItem) =>
            item.title && item.title.includes('交易须知')
          );
          if (notice) {
            const dismissedKey = `trading_notice_dismissed_${notice.id}`;
            const dismissedDate = localStorage.getItem(dismissedKey);
            const today = new Date().toDateString();
            if (dismissedDate !== today) {
              setTradingNoticeAnnouncement(notice);
              setShowTradingNotice(true);
            }
          }
        }
      } catch (error) {
        errorLog('ShopProductDetail', '加载交易须知失败', error);
      }
    };
    loadTradingNotice();
  }, []);

  // 图片滑动处理
  const handleImageScroll = () => {
    if (imageContainerRef.current) {
      const scrollLeft = imageContainerRef.current.scrollLeft;
      const width = imageContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== currentImageIndex) {
        setCurrentImageIndex(newIndex);
      }
    }
  };

  // 页面滚动监听 - 导航栏跟随变化 + Tab 自动切换
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      // 滚动超过图片区域（约 300px）时，导航栏变为白色背景
      if (currentScrollY > 300) {
        setHeaderStyle('white');
      } else {
        setHeaderStyle('transparent');
      }

      // 根据滚动位置自动切换 Tab
      const offset = 100; // 导航栏高度补偿
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

  // 打开规格选择弹窗
  const handleOpenBuySheet = () => {
    if (buying) return;
    setShowBuySpecSheet(true);
  };

  // 确认购买（从规格选择弹窗确认后调用）
  const handleConfirmBuy = async (quantity: number, specs?: Record<string, string>, skuId?: number) => {
    if (buying) return;

    // 保存选择的数量、规格和 SKU ID
    setBuyQuantity(quantity);
    if (specs) {
      setSelectedSpecs(specs);
    }
    if (skuId) {
      setSelectedSkuId(skuId);
    }
    setShowBuySpecSheet(false);

    // 显示确认对话框
    const specText = specs && Object.keys(specs).length > 0
      ? ` (${Object.values(specs).join('、')})`
      : '';

    showDialog({
      title: '确认购买',
      description: `确定要购买 ${quantity} 件 ${product.title}${specText} 吗？`,
      confirmText: '立即支付',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          buyMachine.send(FormEvent.SUBMIT);
          // 构建订单项，如果是多规格商品需要传 sku_id
          const orderItem: { product_id: number; quantity: number; sku_id?: number } = {
            product_id: Number(product.id),
            quantity,
          };
          if (skuId) {
            orderItem.sku_id = skuId;
          }
          const response = await createOrder({
            items: [orderItem],
            pay_type: 'money',
          });

          if (isSuccess(response)) {
            let orderId: number | string | null = null;
            if (response.data) {
              if (typeof response.data === 'object' && 'order_id' in response.data) {
                orderId = (response.data as any).order_id;
              } else if (typeof response.data === 'object' && 'id' in response.data) {
                orderId = (response.data as any).id;
              }
            }

            if (orderId) {
              navigate(`/cashier/${orderId}`);
            } else {
              showToast('success', '订单创建成功');
              setTimeout(() => navigate('/orders/points/0'), 1500);
            }
            buyMachine.send(FormEvent.SUBMIT_SUCCESS);
          } else {
            handleBuyError(response, {
              toastTitle: '订单创建失败',
              customMessage: '订单创建失败',
              context: { productId: product.id }
            });
            buyMachine.send(FormEvent.SUBMIT_ERROR);
          }
        } catch (err: any) {
          handleBuyError(err, {
            toastTitle: '订单创建失败',
            customMessage: '系统错误',
            context: { productId: product.id }
          });
          buyMachine.send(FormEvent.SUBMIT_ERROR);
        }
      }
    });
  };

  // 直接购买（无规格商品）
  const handleBuy = async () => {
    if (buying) return;

    // 如果有规格，打开规格选择弹窗
    const specs = detailData?.specs || [];
    if (specs.length > 0) {
      setShowBuySpecSheet(true);
      return;
    }

    // 无规格商品，打开数量选择弹窗
    setShowBuySpecSheet(true);
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

  // 商品数据
  const displayTitle = detailData?.name || product.title;
  const hasSku = detailData?.has_sku === '1';
  const priceRange = detailData?.price_range;
  // 多规格商品显示价格区间，单规格商品显示固定价格
  const displayPrice = hasSku && priceRange 
    ? priceRange.min 
    : Number(detailData?.price ?? product.price);
  const maxPrice = hasSku && priceRange ? priceRange.max : displayPrice;
  const showPriceRange = hasSku && priceRange && priceRange.min !== priceRange.max;
  const scorePrice = detailData?.score_price || product.score_price || 0;
  
  // 使用精确的金额计算工具（避免浮点数精度问题）
  const originalPrice = roundCurrency(multiply(displayPrice, 1.15), 0).toNumber();
  const savedAmount = subtract(originalPrice, displayPrice).toNumber();
  
  // 从 API 数据获取真实的销量和评价数，如果没有则显示 0
  // 注意：如果后端没有返回 sales_count，可以使用 reviewSummary.total 作为评价数
  const salesCount = (detailData as any)?.sales_count ?? (detailData as any)?.sales ?? 0;
  const reviewCount = reviewSummary?.total ?? 0;

  // 商品图片列表 - 防御性处理确保 detail_images 是数组
  const detailImages = Array.isArray(detailData?.detail_images) ? detailData.detail_images : [];
  const shopImages: string[] = [
    detailData?.thumbnail || product.image,
    ...detailImages,
  ].filter(Boolean) as string[];

  // 确保 shopImages 有内容，避免空数组导致的问题
  const safeShopImages = shopImages.length > 0 ? shopImages : [product.image].filter(Boolean);
  const mainImage = safeShopImages[currentImageIndex] || detailData?.thumbnail || product.image;

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-[56px]" ref={scrollContainerRef}>
      {/* 顶部Tab导航栏 - 滚动跟随变化 */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerStyle === 'white'
            ? 'bg-white shadow-sm'
            : 'bg-transparent'
          }`}
      >
        <div className={`flex items-center px-2 py-2 ${headerStyle === 'white' ? 'border-b border-gray-100' : ''}`}>
          <button
            onClick={() => navigate(-1)}
            className={`p-2 -ml-1 rounded-full transition-colors ${headerStyle === 'white'
                ? 'active:bg-gray-100'
                : 'bg-black/20 active:bg-black/30'
              }`}
          >
            <ChevronLeft size={22} className={headerStyle === 'white' ? 'text-gray-700' : 'text-white'} />
          </button>

          {/* Tab导航 - 滚动后显示 */}
          <div className={`flex-1 flex items-center justify-center gap-6 transition-opacity duration-300 ${headerStyle === 'white' ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
                  // 点击 Tab 滚动到对应区域
                  tab.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`text-sm py-1 relative ${activeTab === tab.key ? 'text-gray-900 font-bold' : 'text-gray-500'}`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* 标题 - 滚动后显示 */}
          {headerStyle === 'transparent' && (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-1">
            {/* 分享按钮已移除 */}
          </div>
        </div>
      </header>

      {/* 商品主图轮播 */}
      <div className="relative" ref={productSectionRef}>
        {/* 图片轮播 */}
        <div
          ref={imageContainerRef}
          className="relative bg-white overflow-x-auto snap-x snap-mandatory flex"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={handleImageScroll}
        >
          {safeShopImages.map((img, idx) => (
            <div key={idx} className="w-full flex-shrink-0 snap-center aspect-square">
              <LazyImage
                src={img || ''}
                alt={`${displayTitle} ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* 图片指示器和功能按钮 */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <div className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
            图集 {currentImageIndex + 1}/{safeShopImages.length}
          </div>
        </div>
      </div>

      {/* 规格缩略图选择器 */}
      {safeShopImages.length > 1 && (
        <div className="bg-white px-3 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {safeShopImages.slice(0, 6).map((img, idx) => (
            <div
              key={idx}
              onClick={() => {
                setCurrentImageIndex(idx);
                if (imageContainerRef.current) {
                  imageContainerRef.current.scrollTo({
                    left: idx * imageContainerRef.current.offsetWidth,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-red-600' : 'border-gray-200'
                }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {safeShopImages.length > 6 && (
            <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-500">共{safeShopImages.length}款</span>
            </div>
          )}
        </div>
      )}

      {/* 价格促销区 */}
      <div
        className="bg-white px-3 py-2.5 active:bg-gray-50 cursor-pointer"
        onClick={() => setShowPromotionSheet(true)}
      >
        {/* 价格行 */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline flex-wrap">
            {/* 现金价格：支持价格区间显示 */}
            {displayPrice > 0 && (
              <>
                <span className="text-red-600 text-sm font-bold font-[DINAlternate-Bold]">¥</span>
                <span className="text-red-600 text-3xl font-bold font-[DINAlternate-Bold] -ml-0.5">{displayPrice}</span>
                {showPriceRange && (
                  <>
                    <span className="text-red-600 text-lg mx-1">-</span>
                    <span className="text-red-600 text-sm font-bold font-[DINAlternate-Bold]">¥</span>
                    <span className="text-red-600 text-3xl font-bold font-[DINAlternate-Bold] -ml-0.5">{maxPrice}</span>
                  </>
                )}
              </>
            )}
            {/* 消费金价格 */}
            {scorePrice > 0 && (
              <span className="text-red-600 text-sm font-bold ml-1 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                {displayPrice > 0 ? '+' : ''}{scorePrice}消费金
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-sm shadow-red-500/30">
              热销
            </span>
          </div>
        </div>

        {/* 保障标签行 */}
        <div className="flex items-center gap-2 mt-2">
          <span className="flex items-center gap-0.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
            <Shield size={10} />
            正品保障
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
            <Truck size={10} />
            极速发货
          </span>
          <span className="text-gray-500 text-xs ml-auto">已售{salesCount > 0 ? `${salesCount}+` : '0'}</span>
        </div>
      </div>

      {/* 商品标题区 */}
      <div className="bg-white px-3 py-2 border-t border-gray-50">
        <div className="flex items-start gap-1.5">
          <span className="flex-shrink-0 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-[4px] font-bold leading-none mt-1">
            自营
          </span>
          <span className="flex-shrink-0 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded-[4px] font-bold leading-none mt-1">
            树交所
          </span>
          <h1 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2">
            {displayTitle}
          </h1>
        </div>

        {/* 标签行 */}
        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-[10px] text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded flex-shrink-0">
            买贵双倍赔
          </span>
          <span className="text-[10px] text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded flex-shrink-0">
            7天价保
          </span>
          <span className="text-[10px] text-green-600 border border-green-200 px-1.5 py-0.5 rounded flex-shrink-0">
            品质保障
          </span>
        </div>
      </div>

      {/* 服务保障 - 点击弹出安心保障详情 */}
      <div
        className="bg-white mt-1.5 px-3 py-2 active:bg-gray-50 cursor-pointer flex items-center justify-between"
        onClick={() => setShowServiceSheet(true)}
      >
        <div className="flex items-center text-xs text-gray-500 gap-3">
          <span className="flex items-center gap-1">
            <Shield size={12} className="text-green-500" />
            免费上门退换
          </span>
          <span className="flex items-center gap-1">
            <RotateCcw size={12} className="text-green-500" />
            7天无理由退货
          </span>
          <span className="flex items-center gap-1">
            <Headphones size={12} className="text-green-500" />
            专属客服
          </span>
        </div>
        <ChevronRight size={14} className="text-gray-400" />
      </div>

      {/* 配送信息 - 点击弹出地址选择 */}
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

      {/* 规格选择入口 - 点击弹出规格选择 */}
      <div
        className="bg-white mt-1.5 px-3 py-3 active:bg-gray-50 cursor-pointer"
        onClick={() => setShowBuySpecSheet(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">已选</span>
            <span className="text-gray-800 text-sm font-medium">
              {Object.keys(selectedSpecs).length > 0
                ? `${Object.values(selectedSpecs).join('，')}，${buyQuantity}件`
                : hasSku 
                  ? '请选择规格'
                  : `${buyQuantity}件`}
            </span>
          </div>
          <ChevronRight size={14} className="text-gray-400" />
        </div>
      </div>

      {/* 买家评价区 - 点击跳转评价页面 */}
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

        {/* 评论列表 - 点击跳转评价页面 */}
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

      {/* 底部操作栏 - 紧凑设计 */}
      {!hideActions && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-3 py-2 flex items-center z-50">
          {/* 左侧图标按钮 */}
          <div className="flex items-center gap-1">
            <button className="flex flex-col items-center justify-center w-12 py-0.5">
              <Store size={18} className="text-gray-500" />
              <span className="text-[9px] text-gray-500">店铺</span>
            </button>
            <button
              onClick={openChatWidget}
              className="flex flex-col items-center justify-center w-12 py-0.5"
            >
              <MessageCircle size={18} className="text-gray-500" />
              <span className="text-[9px] text-gray-500">客服</span>
            </button>
          </div>

          {/* 右侧按钮 - 立即购买 */}
          <div className="flex-1 ml-3">
            <button
              onClick={handleBuy}
              disabled={buying}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3 rounded-full text-base font-bold active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-red-600/20"
            >
              {buying ? '处理中...' : '立即购买'}
            </button>
          </div>
        </div>
      )}

      {/* 交易须知公告弹窗 */}
      <PopupAnnouncementModal
        visible={showTradingNotice}
        announcement={tradingNoticeAnnouncement}
        onClose={() => setShowTradingNotice(false)}
        onDontShowToday={() => {
          if (tradingNoticeAnnouncement) {
            const dismissedKey = `trading_notice_dismissed_${tradingNoticeAnnouncement.id}`;
            localStorage.setItem(dismissedKey, new Date().toDateString());
          }
        }}
      />

      {/* 优惠详情弹窗 */}
      <BottomSheet
        visible={showPromotionSheet}
        title="优惠"
        onClose={() => setShowPromotionSheet(false)}
      >
        <PromotionSheet
          price={displayPrice}
          originalPrice={originalPrice}
          scorePrice={scorePrice}
        />
      </BottomSheet>

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
        // 旧版规格（向后兼容）
        specs={Array.isArray(detailData?.specs)
          ? detailData.specs
            .filter(spec => spec && spec.id && spec.name && Array.isArray(spec.values))
            .map(spec => ({
              id: spec.id,
              name: spec.name,
              values: spec.values || []
            }))
          : []}
        // 新版 SKU 规格
        hasSku={detailData?.has_sku === '1'}
        skuSpecs={detailData?.sku_specs || []}
        skus={detailData?.skus || []}
        priceRange={detailData?.price_range}
        onConfirm={handleConfirmBuy}
      />
    </div>
  );
};

export default ShopProductDetail;
