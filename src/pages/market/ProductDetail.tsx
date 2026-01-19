/**
 * ProductDetail - 商品详情页面
 * 已迁移: 使用 React Router 导航
 * 重构: 参考淘宝商品详情页风格
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Copy, Shield, Award, Gavel, TrendingUp, CreditCard, BadgeCheck,
  Store, MessageCircle, Heart, ShoppingCart, Truck, ChevronRight, Share2
} from 'lucide-react';
import { LoadingSpinner, LazyImage } from '../../../components/common';
import PopupAnnouncementModal from '../../../components/common/PopupAnnouncementModal';
import { Product } from '../../../types';
import {
  fetchCollectionItemDetail,
  fetchShopProductDetail,
  CollectionItemDetailData,
  ShopProductDetailData,
  createOrder,
  bidBuy,
  fetchAnnouncements,
  AnnouncementItem,
} from '../../../services/api';
import { getStoredToken } from '../../../services/client';
import { useNotification } from '../../../context/NotificationContext';
import { bizLog, debugLog } from '../../../utils/logger';
// ✅ 引入统一 API 处理工具
import { isSuccess, extractData, extractError } from '../../../utils/apiHelpers';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '../../../types/states';

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
 * @param priceZone - 价格分区字符串，如 "1000元区" 或 "1K区"
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

interface ProductDetailProps {
  product: Product;
  /** 是否隐藏底部操作区域（申请确权按钮等），用于证书查询页面 */
  hideActions?: boolean;
  /** 预加载的详情数据，如果提供则不再请求 API */
  initialData?: CollectionItemDetailData | ShopProductDetailData | null;
  /** 更新选中产品信息的回调，用于申请确权时传递zone_id等信息 */
  onProductUpdate?: (updatedProduct: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, hideActions = false, initialData = null, onProductUpdate }) => {
  const navigate = useNavigate();
  const { showToast, showDialog } = useNotification();

  // ✅ 使用统一错误处理Hook（加载错误 - 持久化显示）
  const {
    errorMessage,
    hasError,
    handleError,
    clearError
  } = useErrorHandler();

  // ✅ 使用统一错误处理Hook（购买错误 - Toast模式）
  const { handleError: handleBuyError } = useErrorHandler({ showToast: true, persist: false });

  const [detailData, setDetailData] = useState<CollectionItemDetailData | ShopProductDetailData | null>(initialData);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
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
  const shopBuyMachine = useStateMachine<FormState, FormEvent>({
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
  const collectionBuyMachine = useStateMachine<FormState, FormEvent>({
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
  const buying = shopBuyMachine.state === FormState.SUBMITTING;
  const collectionBuying = collectionBuyMachine.state === FormState.SUBMITTING;

  // 交易须知公告弹窗状态
  const [showTradingNotice, setShowTradingNotice] = useState(false);
  const [tradingNoticeAnnouncement, setTradingNoticeAnnouncement] = useState<AnnouncementItem | null>(null);

  const isShopProduct = product.productType === 'shop';

  useEffect(() => {
    // 如果有初始数据，不需要请求 API
    if (initialData) {
      setDetailData(initialData);
      detailMachine.send(LoadingEvent.SUCCESS);
      return;
    }

    const loadDetail = async () => {
      try {
        detailMachine.send(LoadingEvent.LOAD);
        clearError();

        let response;
        if (isShopProduct) {
          response = await fetchShopProductDetail(product.id);
        } else {
          response = await fetchCollectionItemDetail(product.id);
        }

        // ✅ 使用统一判断
        const data = extractData(response);
        if (data) {
          setDetailData(data);
          detailMachine.send(LoadingEvent.SUCCESS);
        } else {
          // ✅ 使用统一错误处理
          handleError(response, {
            persist: true,
            showToast: false,
            customMessage: '获取证书详情失败'
          });
          detailMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        // ✅ 使用统一错误处理
        handleError(err, {
          persist: true,
          showToast: false,
          customMessage: '数据同步延迟，请重试',
          context: { productId: product.id }
        });
        detailMachine.send(LoadingEvent.ERROR);
      } finally {
        // 状态机已处理成功/失败
      }
    };

    loadDetail();
  }, [product.id, isShopProduct, initialData]);
  useEffect(() => {
    shopBuyMachine.send(FormEvent.RESET);
    collectionBuyMachine.send(FormEvent.RESET);
  }, [product.id]);

  // 加载交易须知公告
  useEffect(() => {
    const loadTradingNotice = async () => {
      try {
        const response = await fetchAnnouncements({ page: 1, limit: 10, type: 'normal' });
        if (isSuccess(response) && response.data?.list) {
          // 查找标题包含"交易须知"的公告（即使后端返回的是不弹窗的，也强制弹窗）
          const notice = response.data.list.find((item: AnnouncementItem) =>
            item.title && item.title.includes('交易须知')
          );

          if (notice) {
            // 检查今天是否已经关闭过该公告
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
        console.error('加载交易须知失败:', error);
      }
    };

    loadTradingNotice();
  }, []);

  const handleBuy = async () => {
    debugLog('productDetail.buy', '发起积分商品购买', {
      id: product.id,
      title: product.title,
      productType: product.productType,
      consignmentId: product.consignmentId,
      reservationId: product.reservationId,
    });

    if (buying) return;

    showDialog({
      title: '确认购买',
      description: `确定要购买 ${product.title} 吗？`,
      confirmText: '立即支付',
      cancelText: '取消',
      onConfirm: async () => {
        debugLog('productDetail.buy', '用户确认购买');
        try {
          shopBuyMachine.send(FormEvent.SUBMIT);
          debugLog('productDetail.buy', '调用 createOrder', { productId: Number(product.id) });
          const response = await createOrder({
            items: [{ product_id: Number(product.id), quantity: 1 }],
            pay_type: 'money',
            // address_id will be handled by service (using default if not provided)
          });
          debugLog('productDetail.buy', 'createOrder 响应', response);
          bizLog('order.create.shop.ui', { success: isSuccess(response), productId: product.id });

          // ✅ 使用统一判断
          if (isSuccess(response)) {
            // 从响应中提取订单ID
            let orderId: number | string | null = null;
            if (response.data) {
              if (typeof response.data === 'object' && 'order_id' in response.data) {
                orderId = (response.data as any).order_id;
              } else if (typeof response.data === 'object' && 'id' in response.data) {
                orderId = (response.data as any).id;
              }
            }

            if (orderId) {
              // 订单创建成功，立即跳转到支付页面（不使用延迟，避免显示中间状态）
              navigate(`/cashier/${orderId}`);
            } else {
              // 如果没有订单ID，跳转到订单列表
              showToast('success', '订单创建成功');
              setTimeout(() => {
                navigate(`/orders/${isShopProduct ? 'points' : 'product'}/0`);
              }, 1500);
            }
            shopBuyMachine.send(FormEvent.SUBMIT_SUCCESS);
          } else {
            // ✅ 使用统一错误处理
            handleBuyError(response, {
              toastTitle: '订单创建失败',
              customMessage: '订单创建失败',
              context: { productId: product.id }
            });
            shopBuyMachine.send(FormEvent.SUBMIT_ERROR);
          }
        } catch (err: any) {
          // ✅ 使用统一错误处理
          handleBuyError(err, {
            toastTitle: '订单创建失败',
            customMessage: '系统错误',
            context: { productId: product.id }
          });
          shopBuyMachine.send(FormEvent.SUBMIT_ERROR);
        } finally {
          // 状态机已处理成功/失败
        }
      }
    });
  };

  const handleCollectionBuy = async () => {
    if (collectionBuying) return;

    debugLog('productDetail.collectionBuy', '发起藏品购买', product);

    showToast('info', '仅支持预约', '当前藏品仅支持在交易专区进行盲盒预约，请前往对应专场选择价格分区进行预约。');
    // 旧的寄售购买模式已下线，如需支持预约，请跳转交易专区
    // onNavigate({ name: 'trading-zone' });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]"><LoadingSpinner /></div>;
  if (hasError) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-gray-500">{errorMessage}</div>;

  const collectionDetail = !isShopProduct ? (detailData as CollectionItemDetailData) : null;
  const shopDetail = isShopProduct ? (detailData as ShopProductDetailData) : null;

  // 商品图片列表（支持多图轮播）
  const shopImages: string[] = isShopProduct ? [
    shopDetail?.thumbnail || product.image,
    // 如果有详情图，也加入轮播
    ...(shopDetail?.detail_images || []),
  ].filter(Boolean) as string[] : [];
  
  const mainImage = isShopProduct 
    ? (shopImages[currentImageIndex] || shopDetail?.thumbnail || product.image) 
    : (collectionDetail?.images?.[0] || collectionDetail?.image || product.image);
  const displayTitle = isShopProduct ? (shopDetail?.name || product.title) : (collectionDetail?.title || product.title);

  // 价格计算：优先使用价格分区，否则使用实际价格
  // 价格计算：优先使用价格分区，否则使用实际价格
  let displayPriceNum: number;
  let displayPriceStr: string;

  if (isShopProduct) {
    displayPriceNum = Number(shopDetail?.price ?? product.price);
    displayPriceStr = `¥${displayPriceNum.toLocaleString()}`;
  } else {
    const actualPrice = Number(collectionDetail?.price ?? product.price);
    const pZone = collectionDetail?.price_zone || (collectionDetail as any)?.priceZone;

    if (pZone) {
      // 从价格分区（如 "500元区"）中提取数字
      displayPriceNum = extractPriceFromZone(pZone);
      // 如果提取失败，回退到实际价格
      if (displayPriceNum <= 0) displayPriceNum = actualPrice;
      // 统一格式化为标准金额格式
      displayPriceStr = `¥${displayPriceNum.toLocaleString()}`;
    } else {
      displayPriceNum = actualPrice;
      displayPriceStr = `¥${displayPriceNum.toLocaleString()}`;
    }
  }

  // Specific fields for Collection
  const txHash = (collectionDetail as CollectionItemDetailData | undefined)?.tx_hash;
  const assetCode = (collectionDetail as CollectionItemDetailData | undefined)?.asset_code;
  const supplierName = (collectionDetail as CollectionItemDetailData | undefined)?.supplier_name;
  // 后端专场信息，尽量使用返回字段，不做前端拼接
  const sessionName =
    collectionDetail?.session_name ||
    collectionDetail?.sessionName ||
    collectionDetail?.session_title ||
    collectionDetail?.sessionTitle ||
    collectionDetail?.session?.name;
  const sessionStartTime =
    collectionDetail?.session_start_time ||
    collectionDetail?.sessionStartTime ||
    collectionDetail?.session?.start_time;
  const sessionEndTime =
    collectionDetail?.session_end_time ||
    collectionDetail?.sessionEndTime ||
    collectionDetail?.session?.end_time;
  const sessionTime =
    sessionStartTime || sessionEndTime
      ? `${sessionStartTime || ''}${sessionStartTime && sessionEndTime ? ' - ' : ''}${sessionEndTime || ''}`
      : '';

  // 资产锚定补充字段（完全依赖后端，不前端拼接）
  const coreEnterprise =
    collectionDetail?.core_enterprise ||
    collectionDetail?.coreEnterprise ||
    collectionDetail?.core_company ||
    collectionDetail?.coreCompany ||
    supplierName;
  const farmerInfo =
    collectionDetail?.farmer_info ||
    collectionDetail?.farmerInfo ||
    collectionDetail?.farmer_count_text ||
    collectionDetail?.farmerCountText ||
    collectionDetail?.farmer_text ||
    collectionDetail?.farmerText;
  const assetStatus =
    collectionDetail?.asset_status ||
    collectionDetail?.assetStatus ||
    collectionDetail?.status_text ||
    collectionDetail?.statusText ||
    collectionDetail?.status;

  // 预约场次/分区（如果从列表未带上，尝试用详情补全）
  const detailSessionId =
    collectionDetail?.session_id ||
    collectionDetail?.sessionId ||
    collectionDetail?.session?.id ||
    collectionDetail?.session?.session_id;
  const detailZoneId =
    collectionDetail?.zone_id ||
    collectionDetail?.price_zone_id ||
    collectionDetail?.zoneId ||
    collectionDetail?.priceZoneId ||
    collectionDetail?.zone?.id;

  // 将补全的场次/分区直接写回当前 product 引用，确保预约页能拿到
  if (!product.sessionId && detailSessionId) {
    product.sessionId = detailSessionId as any;
  }
  if (!product.zoneId && detailZoneId) {
    product.zoneId = detailZoneId as any;
  }

  // 调试信息
  debugLog('productDetail.render', '渲染详情', {
    product,
    isShopProduct,
    collectionDetail,
  });

  // ==================== 商城商品详情页（淘宝风格）====================
  if (isShopProduct) {
    const scorePrice = shopDetail?.score_price || product.score_price || 0;
    const originalPrice = Number(shopDetail?.original_price || shopDetail?.price || product.price) * 1.2;
    
    return (
      <div className="min-h-screen bg-gray-100 pb-[70px]">
        {/* 顶部导航栏 */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm px-3 py-2 flex items-center justify-between border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-gray-100">
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full active:bg-gray-100">
              <Share2 size={20} className="text-gray-600" />
            </button>
          </div>
        </header>

        {/* 商品主图轮播 */}
        <div className="pt-12">
          <div 
            ref={imageContainerRef}
            className="relative bg-white aspect-square overflow-hidden"
          >
            <LazyImage
              src={mainImage || ''}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
            {/* 图片指示器 */}
            {shopImages.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {currentImageIndex + 1}/{shopImages.length}
              </div>
            )}
          </div>
          
          {/* 缩略图选择器 */}
          {shopImages.length > 1 && (
            <div className="bg-white px-3 py-2 flex gap-2 overflow-x-auto">
              {shopImages.slice(0, 5).map((img, idx) => (
                <div
                  key={idx}
                  className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    currentImageIndex === idx ? 'border-red-500' : 'border-transparent'
                  }`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {shopImages.length > 5 && (
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 text-xs">
                  全部 <ChevronRight size={14} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 价格促销区 */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 mx-2 mt-2 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="bg-yellow-400 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">
              限时特惠
            </span>
            <span className="text-xs opacity-80">活动进行中</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm">兑换价</span>
            <span className="text-2xl font-bold">¥{displayPriceNum.toLocaleString()}</span>
            {scorePrice > 0 && (
              <span className="text-sm bg-white/20 px-2 py-0.5 rounded">
                +{scorePrice}消费金
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs opacity-90">
            <span className="line-through">原价 ¥{originalPrice.toFixed(0)}</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded">省 ¥{(originalPrice - displayPriceNum).toFixed(0)}</span>
          </div>
        </div>

        {/* 商品标题区 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold mt-0.5">
              树交所
            </span>
            <h1 className="text-base font-medium text-gray-800 leading-snug">
              {displayTitle}
            </h1>
          </div>
          
          {/* 标签 */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
              正品保障
            </span>
            <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
              官方直营
            </span>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              品质保证
            </span>
          </div>
          
          {/* 销量 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              已售 {((parseInt(product.id, 10) || 1) * 17 % 500) + 100}件
            </span>
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex items-center gap-1 text-xs text-gray-400"
            >
              <Heart size={14} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
              收藏
            </button>
          </div>
        </div>

        {/* 配送信息 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-4">
          <div className="flex items-center gap-3 text-sm">
            <Truck size={18} className="text-green-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-800 font-medium">官方配送</span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                预计3-5天内发货 · 全国包邮
              </div>
            </div>
          </div>
        </div>

        {/* 商品详情（图片展示） */}
        <div className="bg-white mx-2 mt-2 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">商品详情</h3>
          </div>
          <div className="p-4">
            {/* 商品描述 */}
            {shopDetail?.description && (
              <div 
                className="text-sm text-gray-600 leading-relaxed mb-4"
                dangerouslySetInnerHTML={{ __html: shopDetail.description }}
              />
            )}
            
            {/* 详情图片 */}
            <div className="space-y-0">
              {(shopDetail?.detail_images || [mainImage]).filter(Boolean).map((img, idx) => (
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
        {!hideActions && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex items-center gap-2 z-50">
            {/* 左侧图标按钮 */}
            <div className="flex items-center gap-1">
              <button className="flex flex-col items-center justify-center w-12 py-1">
                <Store size={18} className="text-gray-500" />
                <span className="text-[10px] text-gray-500 mt-0.5">店铺</span>
              </button>
              <button className="flex flex-col items-center justify-center w-12 py-1">
                <MessageCircle size={18} className="text-gray-500" />
                <span className="text-[10px] text-gray-500 mt-0.5">客服</span>
              </button>
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className="flex flex-col items-center justify-center w-12 py-1"
              >
                <Heart size={18} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
                <span className="text-[10px] text-gray-500 mt-0.5">收藏</span>
              </button>
            </div>
            
            {/* 右侧按钮 */}
            <div className="flex-1 flex gap-2">
              <button className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white py-3 rounded-full text-sm font-bold active:scale-[0.98] transition-transform">
                <ShoppingCart size={16} className="inline mr-1" />
                加入购物车
              </button>
              <button
                onClick={handleBuy}
                disabled={buying}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-full text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-70"
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
      </div>
    );
  }

  // ==================== 藏品详情页（证书风格）====================
  return (
    <div className={`min-h-screen bg-[#FDFBF7] text-gray-900 font-serif ${hideActions ? 'pb-6' : 'pb-24'} relative overflow-hidden`}>
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-sm px-4 py-4 flex justify-between items-center border-b border-amber-900/5">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-800">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">数字权益证书</h1>
        <div className="w-10" />
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

          {/* Certificate Fields */}
          <div className="space-y-6 relative z-10 font-sans">
            {/* Core Info Area */}
            <div className="text-center py-6 mb-2 relative">
              {/* Complex Guilloche Pattern Background */}
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

              {/* Line 1: Certificate Number */}
              {assetCode && (
                <div className="text-xs text-gray-500 font-[DINAlternate-Bold,Roboto,sans-serif] tracking-widest mb-3 relative z-10">
                  确权编号：{assetCode}
                </div>
              )}

              {/* Line 2: Product Name */}
              <h3 className={`${displayTitle.length > 12 ? 'text-lg' : displayTitle.length > 8 ? 'text-xl' : displayTitle.length > 5 ? 'text-2xl' : 'text-3xl'} font-extrabold text-gray-700 mb-3 font-serif tracking-tight leading-tight relative z-10 drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis px-2`}>
                【{displayTitle}】
              </h3>

              {/* Line 3: Asset Type / Artist */}
              <div className="text-base font-bold text-[#C5A572] tracking-wide relative z-10">
                {product.artist || '—'}
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
            </div>

            {/* Description */}
            {collectionDetail?.description && (
              <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-100">
                <div className="text-xs font-bold text-amber-700 uppercase mb-1 tracking-wider">Description / 商品描述</div>
                <div className="text-sm text-amber-900 leading-relaxed">
                  {collectionDetail.description}
                </div>
              </div>
            )}

            {/* Session Info & Price Zone */}
            {(sessionName || sessionTime.trim() || collectionDetail?.price_zone) && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Session / 专场</label>
                    <div className="text-sm font-bold text-gray-600">{sessionName || '—'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Trading Window / 场次时间</label>
                    <div className="text-sm font-bold text-gray-600">{sessionTime || '—'}</div>
                  </div>
                </div>
                {collectionDetail?.price_zone && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Price Zone / 价格分区</label>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                        {collectionDetail.price_zone}
                      </span>
                      <span className="text-xs text-gray-400">（申购价按分区统一定价）</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Asset Anchor */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
                <div className="flex items-start gap-3">
                  <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-0.5">Asset Anchor / 资产锚定</label>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-600 flex items-start gap-2">
                        <span className="whitespace-nowrap">核心企业：</span>
                        <span className="text-gray-700 break-words">{coreEnterprise || '—'}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-600 flex items-start gap-2">
                        <span className="whitespace-nowrap">关联农户：</span>
                        <span className="text-gray-700 break-words">{farmerInfo || '—'}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-600 flex items-start gap-2">
                        <span className="whitespace-nowrap">资产状态：</span>
                        <span className="text-gray-700 break-words">{assetStatus || '—'}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500">数据已脱敏，持有人可申请解密查看。</div>
                  </div>
                </div>
              </div>

            {/* On-chain Info */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">On-chain Proof / 上链信息</label>
                <div className="bg-gray-900 text-green-500 font-mono text-[10px] p-3 rounded break-all leading-relaxed relative group hover:bg-gray-800 transition-colors">
                  {txHash && (
                    <button
                      onClick={() => {
                        // 兼容非 HTTPS 环境
                        const copyText = (text: string) => {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            return navigator.clipboard.writeText(text);
                          }
                          // fallback: 使用传统方式
                          const textarea = document.createElement('textarea');
                          textarea.value = text;
                          textarea.style.position = 'fixed';
                          textarea.style.opacity = '0';
                          document.body.appendChild(textarea);
                          textarea.select();
                          try {
                            document.execCommand('copy');
                            return Promise.resolve();
                          } catch (e) {
                            return Promise.reject(e);
                          } finally {
                            document.body.removeChild(textarea);
                          }
                        };
                        
                        copyText(txHash).then(() => {
                          showToast('success', '复制成功', 'Tx Hash 已复制到剪贴板');
                        }).catch(() => {
                          showToast('error', '复制失败', '请手动复制');
                        });
                      }}
                      className="absolute right-2 top-2 p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
                      title="点击复制"
                    >
                      <Copy size={12} className="text-gray-500 group-hover:text-green-400" />
                    </button>
                  )}
                  <div className="flex items-center gap-2 mb-2 text-gray-500 font-sans font-bold">
                    <BadgeCheck size={12} />
                    <span className="uppercase">Tx Hash</span>
                  </div>
                  {txHash ? (
                    <div className="bg-black/30 p-2 rounded text-green-400 break-all">{txHash}</div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <div className="relative w-4 h-4 flex items-center justify-center">
                        <div className="absolute inset-0 border-2 border-transparent border-t-amber-500 rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                        <div className="absolute inset-1 border-2 border-transparent border-b-amber-300 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                      </div>
                      <span className="text-xs font-bold animate-pulse">⛓️ 链上节点正在算力撮合中...</span>
                    </div>
                  )}
                </div>
                {supplierName && (
                  <div className="bg-gray-50 border border-gray-100 rounded p-3 text-[12px] text-gray-700 flex items-center gap-2">
                    <Shield size={14} className="text-amber-600" />
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase">Supplier</div>
                      <div className="text-sm font-medium text-gray-600">{supplierName}</div>
                    </div>
                  </div>
                )}
              </div>

          </div>
        </div>
      </div>

      {/* Bottom Action - 证书查询页面隐藏 */}
      {!hideActions && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">

          {/* Frozen Amount & Hashrate Tip */}
          <div className="flex justify-end mb-2">
            <span className="text-[10px] text-gray-900 bg-white px-1 py-0.5">
              本次申购需冻结：¥{displayPriceNum.toFixed(2)} | 消耗算力：5
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <div className="flex flex-col">
                <div className="text-xl font-bold text-gray-900 font-mono flex items-baseline leading-none">
                  {displayPriceStr}
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

            {product.reservationId ? (
              <button
                disabled
                className="flex-1 bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed py-3.5 rounded-lg font-bold flex items-center justify-center gap-2">
                <Gavel size={18} />
                确权中
              </button>
            ) : (
              <button
                onClick={() => {
                  debugLog('productDetail.render', '点击申请确权', {
                    id: product.id,
                    title: product.title,
                    consignmentId: product.consignmentId,
                    reservationId: product.reservationId,
                  });

                  // 更新selectedProduct以包含从详情数据中获取的zone_id等信息
                  if (detailData && onProductUpdate) {
                    const updatedProduct: Product = {
                      ...product,
                      sessionId: (detailData as any).session_id || (detailData as any).sessionId || product.sessionId,
                      zoneId: (detailData as any).zone_id || (detailData as any).price_zone_id || product.zoneId,
                    };
                    onProductUpdate(updatedProduct);
                  }

                  // 直接设置zoneMaxPrice到全局预加载数据，避免金额跳跃
                  if (detailData) {
                    let zoneMaxPrice: number | undefined;

                    // 从detailData中提取正确的分区价格
                    if ((detailData as any).price_zone) {
                      const parsedPrice = extractPriceFromZone((detailData as any).price_zone);
                      if (parsedPrice > 0) {
                        zoneMaxPrice = parsedPrice;
                      }
                    }

                    if (!zoneMaxPrice) {
                      zoneMaxPrice =
                        (detailData as any).zone_max_price ??
                        (detailData as any).zoneMaxPrice ??
                        (detailData as any).max_price ??
                        (detailData as any).maxPrice ??
                        (detailData as any).price;
                    }

                    if (zoneMaxPrice) {
                      // 初始化全局预加载数据结构
                      if (!globalThis.__preloadedReservationData) {
                        globalThis.__preloadedReservationData = {};
                      }
                      globalThis.__preloadedReservationData.zoneMaxPrice = zoneMaxPrice;
                    }
                  }

                  navigate('/reservation');
                }}
                className="flex-1 bg-[#8B0000] text-amber-100 hover:bg-[#A00000] transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-[0.98]">
                <Gavel size={18} />
                申请确权
              </button>
            )}
          </div>
        </div>
      )}

      {/* 交易须知公告弹窗 */}
      <PopupAnnouncementModal
        visible={showTradingNotice}
        announcement={tradingNoticeAnnouncement}
        onClose={() => {
          setShowTradingNotice(false);
        }}
        onDontShowToday={() => {
          if (tradingNoticeAnnouncement) {
            const dismissedKey = `trading_notice_dismissed_${tradingNoticeAnnouncement.id}`;
            const today = new Date().toDateString();
            localStorage.setItem(dismissedKey, today);
          }
        }}
      />
    </div>
  );
};

export default ProductDetail;